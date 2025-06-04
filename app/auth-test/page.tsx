"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function AuthTestPage() {
  const { user, isLoading, refreshSession } = useAuth()
  const [cookies, setCookies] = useState<string[]>([])
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({})
  const [manualToken, setManualToken] = useState("")
  
  // Function to update displayed cookies and localStorage
  const updateStorageInfo = () => {
    // Get all cookies
    setCookies(document.cookie.split('; '))
    
    // Get relevant localStorage items
    const items: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('auth') || key.includes('user'))) {
        items[key] = localStorage.getItem(key) || ''
      }
    }
    setLocalStorageItems(items)
  }
  
  // Update storage info on mount and when auth state changes
  useEffect(() => {
    updateStorageInfo()
  }, [user, isLoading])
  
  // Function to manually set a token
  const setToken = () => {
    if (!manualToken) return
    
    document.cookie = `auth_token=${manualToken}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    alert("Token set! Please refresh the page.")
  }
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Authentication Test Page</h1>
      
      <div className="p-4 bg-slate-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Auth State</h2>
        <p><strong>Loading:</strong> {isLoading ? "Yes" : "No"}</p>
        <p><strong>Authenticated:</strong> {user ? "Yes" : "No"}</p>
        {user && (
          <div>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        {cookies.length > 0 ? (
          <ul className="list-disc list-inside">
            {cookies.map((cookie, i) => (
              <li key={i} className="break-all">{cookie}</li>
            ))}
          </ul>
        ) : (
          <p>No cookies found</p>
        )}
      </div>
      
      <div className="p-4 bg-slate-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Local Storage</h2>
        {Object.keys(localStorageItems).length > 0 ? (
          <ul className="list-disc list-inside">
            {Object.entries(localStorageItems).map(([key, value]) => (
              <li key={key} className="break-all">
                <strong>{key}:</strong> {value.substring(0, 100)}{value.length > 100 ? '...' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>No relevant localStorage items found</p>
        )}
      </div>
      
      <div className="p-4 bg-slate-100 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold mb-2">Actions</h2>
        <div>
          <Button 
            onClick={() => {
              refreshSession()
              updateStorageInfo()
            }}
            className="mr-4"
          >
            Refresh Session
          </Button>
          
          <Button 
            onClick={updateStorageInfo}
          >
            Update Storage Info
          </Button>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-2">Manually Set Token</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={manualToken} 
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste your JWT token here"
              className="border p-2 rounded flex-1"
            />
            <Button onClick={setToken}>Set Token</Button>
          </div>
          <p className="text-sm mt-2">
            Use this to manually set the auth_token cookie with your token:
            <br />
            <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">
              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE3NDg4NzY0NzIsImV4cCI6MTc0ODg4MDA3Mn0.XqQX-rV4fxQrcU9vixR6kFD3EKPxsOKdXuIjA1TAEs0
            </code>
          </p>
        </div>
      </div>
    </div>
  )
} 