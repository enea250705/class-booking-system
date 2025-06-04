import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert"
import { 
  AlertCircle, 
  Check, 
  SendHorizontal,
  MailCheck
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AlternateEmailTester() {
  const [recipient, setRecipient] = useState("")
  const [configType, setConfigType] = useState("primary")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ config: string; messageId: string } | null>(null)
  const [error, setError] = useState<{ config: string; message: string } | null>(null)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    if (!recipient) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setSuccess(null)
    setError(null)
    
    try {
      const response = await fetch('/api/test-alternate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          configType,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }
      
      setSuccess({
        config: data.configuration,
        messageId: data.messageId
      })
      
      toast({
        title: "Email Sent",
        description: `Test email sent successfully using ${data.configuration} configuration`,
        variant: "default"
      })
      
      console.log('Email sent:', data)
    } catch (err: any) {
      console.error('Error sending email:', err)
      
      setError({
        config: configType,
        message: err.message
      })
      
      toast({
        title: "Failed to Send",
        description: err.message || 'An unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SendHorizontal className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Test Alternate Configurations</CardTitle>
        </div>
        <CardDescription>
          Try different SMTP configurations to troubleshoot email issues
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="config">Configuration Type</Label>
            <Select value={configType} onValueChange={setConfigType}>
              <SelectTrigger id="config">
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Configuration</SelectItem>
                <SelectItem value="tls587">TLS with Port 587</SelectItem>
                <SelectItem value="noSecure">Disable Secure Option</SelectItem>
                <SelectItem value="rejectUnauthorized">TLS with RejectUnauthorized: false</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle>Email Sent Successfully</AlertTitle>
              <AlertDescription className="text-green-700">
                Test email was sent using <strong>{success.config}</strong> configuration.
                <div className="mt-1 text-xs">
                  Message ID: {success.messageId}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to Send Email</AlertTitle>
              <AlertDescription>
                <div className="text-sm">Configuration: <strong>{error.config}</strong></div>
                <div className="text-sm mt-1 break-all">{error.message}</div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="rounded-md border p-3 bg-primary/5">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
              <MailCheck className="h-4 w-4 text-primary" />
              Configuration Details
            </h3>
            <div className="space-y-1 text-sm">
              {configType === "primary" && (
                <p>Standard configuration using your environment variables.</p>
              )}
              {configType === "tls587" && (
                <p>Uses port 587 with TLS (common for most email providers).</p>
              )}
              {configType === "noSecure" && (
                <p>Uses your configured port but with secure option disabled.</p>
              )}
              {configType === "rejectUnauthorized" && (
                <p>Adds TLS option to ignore certificate validation issues.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSendEmail} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <SendHorizontal className="h-4 w-4 animate-pulse" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </CardFooter>
    </Card>
  )
} 