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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add a simple cache with expiration to prevent excessive auth checks
const AUTH_CACHE_KEY = 'auth_user_cache';
const AUTH_CACHE_EXPIRY = 'auth_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const authCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Check if user is logged in on mount - but only after component is mounted client-side
  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      try {
        // Only run on client-side
        if (typeof window === 'undefined') return;
        
        console.log('[Auth] Starting auth check process');
        const startTime = performance.now();
        
        // Check local cache first
        const cachedUser = localStorage.getItem(AUTH_CACHE_KEY);
        const cacheExpiry = localStorage.getItem(AUTH_CACHE_EXPIRY);
        
        if (cachedUser && cacheExpiry && parseInt(cacheExpiry) > Date.now()) {
          console.log('[Auth] Using cached user data', { timeElapsed: `${performance.now() - startTime}ms` });
          setUser(JSON.parse(cachedUser));
          setIsLoading(false);
          return;
        }
        
        // Try to verify session with the server
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        }).catch(err => {
          console.error('[Auth] Session API fetch failed:', err);
          return null;
        });
        
        if (sessionResponse?.ok) {
          const sessionData = await sessionResponse.json();
          console.log('[Auth] Session check response:', sessionData);
          
          if (sessionData.user) {
            console.log('[Auth] Got user from session API', { 
              timeElapsed: `${performance.now() - startTime}ms`,
              user: sessionData.user.email
            });
            
            // Update cache
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(sessionData.user));
            localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
            
            setUser(sessionData.user);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to checking auth token in cookie if session check fails
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth_token='))
          ?.split('=')[1];

        if (token) {
          console.log('[Auth] Found auth token in cookies, decoding');
          try {
            const decoded = jwtDecode<User>(token);
            console.log('[Auth] Decoded user from token:', decoded);
            
            // Update cache
            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(decoded));
            localStorage.setItem(AUTH_CACHE_EXPIRY, (Date.now() + CACHE_DURATION).toString());
            
            setUser(decoded);
          } catch (tokenError) {
            console.error('[Auth] Token decode error:', tokenError);
            // Clear invalid cache
            localStorage.removeItem(AUTH_CACHE_KEY);
            localStorage.removeItem(AUTH_CACHE_EXPIRY);
            setUser(null);
          }
        } else {
          console.log('[Auth] No auth token found in cookies');
          // Clear cache
          localStorage.removeItem(AUTH_CACHE_KEY);
          localStorage.removeItem(AUTH_CACHE_EXPIRY);
          setUser(null);
        }
        
        console.log('[Auth] Auth check completed', { timeElapsed: `${performance.now() - startTime}ms` });
      } catch (err) {
        console.error('[Auth] Auth check error:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce auth check to avoid multiple simultaneous checks
    if (authCheckTimer.current) {
      clearTimeout(authCheckTimer.current);
    }
    
    authCheckTimer.current = setTimeout(() => {
      checkAuth();
    }, 100);
    
    return () => {
      if (authCheckTimer.current) {
        clearTimeout(authCheckTimer.current);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }).catch(err => {
        console.error('Fetch failed:', err);
        throw new Error(`Network error: ${err.message}`);
      });

      console.log('Response received:', response.status);
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status} ${response.statusText}`);
      }

      // After successful login, the cookie should be set by the server
      // Decode the token to get user info
      const decoded = jwtDecode<User>(data.token);
      setUser(decoded);

      // Redirect based on role
      if (decoded.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
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
      
      console.log('Server-side logout completed');
      
      // Also clear the cookie on the client side
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict;';
      document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Strict;';
      
      console.log('Logging out, cookies cleared');
      
      // Clear user state
      setUser(null);
      
      // Force a page reload to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the server-side logout fails, try to clear everything locally
      setUser(null);
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
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