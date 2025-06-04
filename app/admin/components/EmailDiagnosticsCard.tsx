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
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert"
import { 
  AlertCircle, 
  Check, 
  X, 
  RefreshCw,
  MailQuestion 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function EmailDiagnosticsCard() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/email-diagnostics')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to run diagnostics')
      }
      
      const data = await response.json()
      setDiagnostics(data)
      console.log('Email diagnostics:', data)
    } catch (err: any) {
      console.error('Error running email diagnostics:', err)
      setError(err.message || 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MailQuestion className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Email System Diagnostics</CardTitle>
        </div>
        <CardDescription>
          Check email configuration and connection status
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!diagnostics ? (
          <div className="text-center py-8">
            <MailQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Run diagnostics to check your email configuration
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {/* Environment Variables */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(diagnostics.environment.variables).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between rounded-md border p-2">
                      <span className="font-mono text-sm">{key}</span>
                      {value ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Check className="h-3 w-3 mr-1" /> Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <X className="h-3 w-3 mr-1" /> Missing
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Nodemailer Status */}
              <div>
                <h3 className="text-lg font-medium mb-2">Nodemailer</h3>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span>Installation Status</span>
                    {diagnostics.nodemailer.installed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Installed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Not Installed
                      </Badge>
                    )}
                  </div>
                  {diagnostics.nodemailer.version && (
                    <div className="flex items-center justify-between">
                      <span>Version</span>
                      <Badge variant="outline">{diagnostics.nodemailer.version}</Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Connection Test */}
              <div>
                <h3 className="text-lg font-medium mb-2">SMTP Connection</h3>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span>Connection Status</span>
                    {diagnostics.connection.verified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    )}
                  </div>
                  
                  {diagnostics.connection.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription className="break-all">{diagnostics.connection.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              
              {/* Alternative Configurations */}
              {diagnostics.alternativeTests && diagnostics.alternativeTests.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Alternative Configurations</h3>
                  <div className="space-y-2">
                    {diagnostics.alternativeTests.map((test: any, index: number) => (
                      <div key={index} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <span>{test.name}</span>
                          {test.verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" /> Works
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <X className="h-3 w-3 mr-1" /> Failed
                            </Badge>
                          )}
                        </div>
                        
                        {test.error && (
                          <p className="text-sm text-red-600 mt-1 break-all">{test.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recommendations */}
              {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                  <Alert>
                    <AlertTitle>Troubleshooting Steps</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {diagnostics.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">SMTP Configuration</h3>
                <pre className="p-3 bg-slate-100 rounded-md text-xs overflow-auto">
                  {JSON.stringify(diagnostics.environment.values, null, 2)}
                </pre>
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={runDiagnostics} 
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
      </CardFooter>
    </Card>
  )
} 