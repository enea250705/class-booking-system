import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'
import { Loader2, Mail, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function TestEmailCard() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const handleSendTestEmail = async () => {
    try {
      setIsLoading(true)
      setErrorDetails(null)
      
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() || undefined }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Test email sent to ${data.recipient}`, {
          description: "Check your inbox to confirm receipt",
        })
      } else {
        console.error("Email sending failed:", data)
        setErrorDetails(
          `Server error: ${data.message}\n${data.error || ''}`
        )
        toast.error("Failed to send test email", {
          description: data.message || "An unknown error occurred",
        })
      }
    } catch (error: unknown) {
      console.error("Test email error:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setErrorDetails(`Client error: ${errorMessage}`)
      toast.error("Error sending test email", {
        description: "Check the console for more details",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email System
        </CardTitle>
        <CardDescription>
          Send a test email to verify your SMTP configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Recipient Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address (or leave empty to use your account email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          {errorDetails && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Error</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="text-xs whitespace-pre-wrap bg-destructive/20 p-2 rounded max-h-40 overflow-auto">
                  {errorDetails}
                </div>
                <p className="mt-2 text-xs">
                  Check server logs for more details. This could be related to SMTP configuration or network issues.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendTestEmail} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Test Email...
            </>
          ) : (
            "Send Test Email"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
} 