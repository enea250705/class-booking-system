"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import Link from "next/link"

export default function DebugPage() {
  const { user, isLoading, error } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [apiUser, setApiUser] = useState<any>(null)
  const [apiStatus, setApiStatus] = useState<string>("Not checked")

  useEffect(() => {
    // Get token from cookie
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    
    setToken(authToken || null)
  }, [])

  const checkSession = async () => {
    setApiStatus("Checking...")
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      })
      const data = await response.json()
      setApiUser(data.user)
      setApiStatus(response.ok ? "Success" : "Error")
    } catch (error) {
      console.error(error)
      setApiStatus("Failed")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Client Auth Status</h2>
          <p><strong>Loading:</strong> {isLoading ? "Yes" : "No"}</p>
          <p><strong>Error:</strong> {error || "None"}</p>
          <p><strong>User:</strong> {user ? "Authenticated" : "Not authenticated"}</p>
          {user && (
            <div>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
          <div className="mt-2">
            <strong>Auth Token:</strong>
            <div className="bg-gray-100 p-2 rounded overflow-x-auto">
              {token ? <code className="text-xs break-all">{token}</code> : "No token found"}
            </div>
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">API Session Check</h2>
          <button 
            onClick={checkSession}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            Check Server Session
          </button>
          <p><strong>API Status:</strong> {apiStatus}</p>
          <p><strong>User from API:</strong> {apiUser ? "Authenticated" : "Not authenticated"}</p>
          {apiUser && (
            <div>
              <p><strong>Name:</strong> {apiUser.name}</p>
              <p><strong>Email:</strong> {apiUser.email}</p>
              <p><strong>Role:</strong> {apiUser.role}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex space-x-4">
        <Link href="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Home
        </Link>
        <Link href="/login" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Login Page
        </Link>
        <Link href="/dashboard" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Dashboard
        </Link>
      </div>
    </div>
  )
} 