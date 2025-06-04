"use client"

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, packageType: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add a simple cache with expiration to prevent excessive auth checks
const AUTH_CACHE_KEY = 'auth_user_cache';
const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 365 days to match cookie expiration

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const authCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Function to extract user info from token
  const extractUserFromToken = useCallback(async (token: string): Promise<User | null> => {
    try {
      console.log('[DEBUG] Extracting user info from token');
      const decoded = jwtDecode<any>(token);
      
      console.log('[DEBUG] Token payload:', {
        ...decoded,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null
      });
      
      // Ensure the token has the expected fields
      if (!decoded.userId) {
        console.error('[DEBUG] Token is missing userId field');
        return null;
      }
      
      try {
        // Get user details from the database using the userId
        console.log('[DEBUG] Fetching user details for userId:', decoded.userId);
        const response = await fetch(`/api/users/${decoded.userId}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('[DEBUG] User API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user details: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log('[DEBUG] User data received:', userData);
        
        if (!userData || !userData.user) {
          throw new Error('Invalid user data returned');
        }
        
        // Return user info from the database
        return userData.user;
      } catch (error) {
        console.error('[DEBUG] Error getting user details:', error);
        // If we can't get details, construct minimal user object from token
        return {
          id: decoded.userId,
          name: 'User',
          email: 'user@example.com',
          role: 'user'
        };
      }
    } catch (error) {
      console.error('[DEBUG] Token decode error:', error);
      return null;
    }
  }, []);

  // Background verification - doesn't affect the UI state unless successful
  const verifySessionInBackground = useCallback(async () => {
    try {
      console.log('[DEBUG] Running background session verification');
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(err => {
        console.error('[DEBUG] Background session verification failed:', err);
        return null;
      });
      
      if (!sessionResponse) {
        console.log('[DEBUG] No response from session API');
        return;
      }
      
      console.log('[DEBUG] Background session response status:', sessionResponse.status);
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        
        console.log('[DEBUG] Session data received:', sessionData);
        
        if (sessionData.user) {
          console.log('[DEBUG] Background verification successful');
          // Update cache silently
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(sessionData.user));
          localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
          
          // Update user state if needed
          setUser(prev => {
            if (!prev || prev.id !== sessionData.user.id) {
              return sessionData.user;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('[DEBUG] Background verification error:', error);
      // Don't affect UI state on background check errors
    }
  }, []);
  
  // Primary verification
  const verifySession = useCallback(async () => {
    try {
      console.log('[DEBUG] Starting primary session verification');
      
      // First check for existing auth_token cookie
      const cookies = document.cookie.split('; ');
      const tokenCookie = cookies.find(row => row.startsWith('auth_token='));
      const token = tokenCookie?.split('=')[1];
      
      // If we have a token, try to use it directly first to avoid an API call
      if (token) {
        console.log('[DEBUG] Found auth_token cookie, extracting user info');
        try {
          const userInfo = await extractUserFromToken(token);
          
          if (userInfo) {
            console.log('[DEBUG] Successfully extracted user info from token');
            // Update cache with fresh data
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userInfo));
            localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
            
            // Save token to localStorage as an additional fallback
            localStorage.setItem('auth_token_backup', token);
            
            // Create a session backup cookie
            document.cookie = `auth_session=${userInfo.id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
            
            setUser(userInfo);
            setIsLoading(false);
            return;
          }
        } catch (tokenError) {
          console.error('[DEBUG] Token decode error:', tokenError);
          // Continue to server verification if local verification fails
        }
      }
      
      // Try to verify session with the server
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store', // Prevent caching of session requests
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }).catch(err => {
        console.error('[DEBUG] Session API fetch failed:', err);
        return null;
      });
      
      if (!sessionResponse) {
        console.log('[DEBUG] No response from session API');
        // Try fallbacks before giving up
        await tryFallbackAuthentication();
        return;
      }
      
      console.log('[DEBUG] Session API response status:', sessionResponse.status);
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        
        console.log('[DEBUG] Session data received:', sessionData);
        
        if (sessionData.user) {
          // Update cache
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(sessionData.user));
          localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
          
          // If we got a new token from the server, save it as backup
          if (sessionData.token) {
            localStorage.setItem('auth_token_backup', sessionData.token);
            
            // Update the cookie with the fresh token
            document.cookie = `auth_token=${sessionData.token}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
          }
          
          // Create a session backup cookie
          document.cookie = `auth_session=${sessionData.user.id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
          
          setUser(sessionData.user);
          setIsLoading(false);
          return;
        } else {
          console.log('[DEBUG] Session API returned no user data');
        }
      } else {
        console.log('[DEBUG] Session API returned error:', sessionResponse.status);
      }
      
      // If we got here, try fallback authentication methods
      await tryFallbackAuthentication();
    } catch (error) {
      console.error('[DEBUG] Error in verifySession:', error);
      // Try fallbacks before giving up
      await tryFallbackAuthentication();
    } finally {
      setIsLoading(false);
    }
  }, [extractUserFromToken]);
  
  // Helper function to try various fallback authentication methods
  const tryFallbackAuthentication = async () => {
    console.log('[DEBUG] Trying fallback authentication methods');
    
    // 1. Try to use backup token from localStorage
    const backupToken = localStorage.getItem('auth_token_backup');
    if (backupToken) {
      console.log('[DEBUG] Found backup token, trying to restore session');
        try {
        // Restore token to cookie
        document.cookie = `auth_token=${backupToken}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        
        // Extract user info from token
        const userInfo = await extractUserFromToken(backupToken);
          if (userInfo) {
          console.log('[DEBUG] Successfully restored session from backup token');
          
          // Create session backup cookie
          document.cookie = `auth_session=${userInfo.id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
            
            setUser(userInfo);
          return;
          }
        } catch (tokenError) {
        console.error('[DEBUG] Failed to restore session from backup token:', tokenError);
                }
              }
    
    // 2. Try to restore from cached user + session cookie
    const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('auth_session='));
        const sessionId = sessionCookie?.split('=')[1];
            
        if (sessionId) {
          console.log('[DEBUG] Found auth_session cookie:', sessionId);
          const cachedUser = localStorage.getItem(AUTH_CACHE_KEY);
      
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              if (parsedUser.id === sessionId) {
                console.log('[DEBUG] Restored user from cache using session ID match');
                setUser(parsedUser);
            return;
          } else {
            console.log('[DEBUG] Cached user ID does not match session ID');
              }
            } catch (parseError) {
              console.error('[DEBUG] Failed to parse cached user:', parseError);
            }
          }
      
      // 3. If we have a session ID but no matching cached user, try to fetch user info
      try {
        console.log('[DEBUG] Trying to fetch user info using session ID');
        const userResponse = await fetch(`/api/users/${sessionId}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData && userData.user) {
            console.log('[DEBUG] Successfully fetched user info using session ID');
            setUser(userData.user);
            
            // Update cache
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userData.user));
            localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
            return;
          }
            }
      } catch (fetchError) {
        console.error('[DEBUG] Failed to fetch user info using session ID:', fetchError);
          }
        }
    
    console.log('[DEBUG] All fallback authentication methods failed');
    setUser(null);
  };

  // Check if user is logged in on mount - but only after component is mounted client-side
  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      try {
        // Only run on client-side
        if (typeof window === 'undefined') return;
        
        console.log('[DEBUG] Starting auth check...');
        
        // Check local cache first - this prevents unnecessary API calls on refresh
        const cachedUser = localStorage.getItem(AUTH_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(AUTH_CACHE_EXPIRY);
        
        console.log('[DEBUG] Cache check:', { 
          hasCachedUser: !!cachedUser, 
          hasCacheExpiry: !!cacheExpiry,
          cacheExpiry: cacheExpiry ? new Date(parseInt(cacheExpiry)).toISOString() : null,
          isExpired: cacheExpiry ? parseInt(cacheExpiry) <= Date.now() : true
        });
        
        if (cachedUser && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
          console.log('[DEBUG] Using cached user data');
          setUser(JSON.parse(cachedUser));
          setIsLoading(false);
          
          // Verify in background but don't block UI
          setTimeout(() => verifySessionInBackground(), 500);
          return;
        }
        
        // Check cookie presence
        const hasAuthCookie = document.cookie.includes('auth_token=');
        const hasSessionCookie = document.cookie.includes('auth_session=');
        console.log('[DEBUG] Cookie check:', { hasAuthCookie, hasSessionCookie });
        
        await verifySession();
      } catch (err) {
        console.error('[DEBUG] Auth check error:', err);
        // Don't clear user state on error - keep previous state
        setIsLoading(false);
      }
    };
    
    // Add wrapper function to ensure errors are caught and logged
    const safeCheckAuth = () => {
      checkAuth().catch(err => {
        console.error('[DEBUG] Unhandled error in auth check:', err);
        setIsLoading(false);
      });
    };
    
    // Debounce auth check to avoid multiple simultaneous checks
    if (authCheckTimer.current) {
      clearTimeout(authCheckTimer.current);
    }
    
    authCheckTimer.current = setTimeout(safeCheckAuth, 100);
    
    return () => {
      if (authCheckTimer.current) {
        clearTimeout(authCheckTimer.current);
      }
    };
  }, [verifySession, verifySessionInBackground]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[DEBUG] Attempting to login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }).catch(err => {
        console.error('[DEBUG] Login fetch failed:', err);
        throw new Error(`Network error: ${err.message}`);
      });

      console.log('[DEBUG] Login response received:', response.status);
      let data;
      try {
        data = await response.json();
        console.log('[DEBUG] Login response data:', data);
      } catch (jsonError) {
        console.error('[DEBUG] Failed to parse JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status} ${response.statusText}`);
      }

      // After successful login, the cookie should be set by the server
      console.log('[DEBUG] Login successful, token received');
      
      // Check all cookies after login
      console.log('[DEBUG] Cookies after login:', document.cookie);
      
      // Extract user info either from token or from the response data
      let userInfo;
      
      if (data.user) {
        console.log('[DEBUG] Using user data from response');
        userInfo = data.user;
      } else if (data.token) {
        console.log('[DEBUG] Extracting user info from token');
        try {
          // Decode the token to get user info
          const decoded = jwtDecode<any>(data.token);
          console.log('[DEBUG] Decoded token payload:', decoded);
          
          // For the new token structure, we might need to fetch user details
          if (decoded.userId) {
            console.log('[DEBUG] New token structure detected with userId:', decoded.userId);
            
            // Try to get user details from API
            try {
              const userResponse = await fetch(`/api/users/${decoded.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                if (userData && userData.user) {
                  userInfo = userData.user;
                }
              }
            } catch (err) {
              console.error('[DEBUG] Failed to fetch user details:', err);
            }
            
            // If we couldn't get user details, construct minimal user object
            if (!userInfo) {
              userInfo = {
                id: decoded.userId,
                name: 'User',
                email: email,
                role: decoded.role || 'user'
              };
            }
          } else {
            // Old token structure with embedded user info
            userInfo = decoded;
          }
        } catch (decodeError) {
          console.error('[DEBUG] Failed to decode token:', decodeError);
        }
      }
      
      if (!userInfo) {
        console.error('[DEBUG] Could not extract user info from response or token');
        throw new Error('Failed to extract user information');
      }
      
      // Save user info to state and localStorage
      setUser(userInfo);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userInfo));
      localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
      
      // Save token to localStorage as a backup
      if (data.token) {
        localStorage.setItem('auth_token_backup', data.token);
      }
      
      // Check if user is admin and redirect accordingly
      console.log('[DEBUG] User role:', userInfo.role);
      
      if (userInfo.role === 'admin') {
        console.log('[DEBUG] Admin user detected, redirecting to /admin');
        router.push('/admin');
      } else {
        console.log('[DEBUG] Regular user detected, redirecting to /dashboard');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('[DEBUG] Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, packageType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, packageType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // After successful registration, log the user in
      await login(email, password);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      // Call server-side logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear all localStorage items related to authentication
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(AUTH_CACHE_EXPIRY);
      localStorage.removeItem('auth_token_backup');
      
      // Clear the cookies on the client side - use consistent settings with how they were set
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      document.cookie = 'auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      
      // Clear user state
      setUser(null);
      
      // Redirect to login page instead of forcing reload
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the server-side logout fails, clear local state
      localStorage.removeItem(AUTH_CACHE_KEY);
      localStorage.removeItem(AUTH_CACHE_EXPIRY);
      localStorage.removeItem('auth_token_backup');
      
      // Clear cookies even if the server logout failed
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      document.cookie = 'auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;';
      
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Add a function to manually refresh the session
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[Auth] Manually refreshing session');
      
      // Check if we have a token in cookie that's about to expire
      let tokenNeedsRefresh = false;
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        if (token) {
          // Decode the token to check its expiration
          const decoded = jwtDecode<any>(token);
          
          // If token expires in less than 1 day or is already expired, refresh it
          const now = Math.floor(Date.now() / 1000);
          const oneDay = 24 * 60 * 60; // One day in seconds
          
          if (decoded.exp && (decoded.exp - now < oneDay)) {
            console.log('[Auth] Token is expiring soon, will request a fresh one');
            tokenNeedsRefresh = true;
          }
        }
      } catch (err) {
        console.error('[Auth] Error checking token expiration:', err);
        tokenNeedsRefresh = true; // When in doubt, refresh
      }
      
      // Add a refresh=true parameter if we need to refresh the token
      const url = tokenNeedsRefresh 
        ? '/api/auth/session?refresh=true' 
        : '/api/auth/session';
      
      const sessionResponse = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        
        if (sessionData.user) {
          console.log('[Auth] Session refresh successful');
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(sessionData.user));
          localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
          setUser(sessionData.user);
        } else {
          console.log('[Auth] Session refresh returned no user');
          // Don't clear user on a refresh failure - this prevents unnecessary logouts
        }
      } else {
        console.log('[Auth] Session refresh failed with status:', sessionResponse.status);
      }
    } catch (error) {
      console.error('[Auth] Session refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 