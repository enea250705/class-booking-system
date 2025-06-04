"use client"

import { useState } from "react"
import Link from "next/link"

export default function DebugPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const verifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/auth/verify-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error verifying credentials:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Login Credential Debug Tool</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-700 text-sm">
          This page is for debugging purposes only. Enter your credentials to verify if they exist in the system
          without going through the full login process.
        </p>
      </div>

      <form onSubmit={verifyCredentials} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Checking..." : "Verify Credentials"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Verification Result</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">User exists:</span>{" "}
              <span className={result.userExists ? "text-green-600" : "text-red-600"}>
                {result.userExists ? "Yes" : "No"}
              </span>
            </p>
            
            {result.userExists && (
              <>
                <p>
                  <span className="font-medium">Password match:</span>{" "}
                  <span className={result.passwordMatch ? "text-green-600" : "text-red-600"}>
                    {result.passwordMatch ? "Yes" : "No"}
                  </span>
                </p>
                
                <p>
                  <span className="font-medium">User approved:</span>{" "}
                  <span className={result.user?.approved ? "text-green-600" : "text-red-600"}>
                    {result.user?.approved ? "Yes" : "No"}
                  </span>
                </p>
                
                <p>
                  <span className="font-medium">Role:</span> {result.user?.role}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  )
} 
   