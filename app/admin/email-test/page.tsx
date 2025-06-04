"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { TestEmailCard } from '../components/TestEmailCard';
import { EmailDiagnosticsCard } from '../components/EmailDiagnosticsCard';
import { AlternateEmailTester } from '../components/AlternateEmailTester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MailQuestion } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminEmailTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email System Test</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Test your SMTP configuration and email delivery
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Test</TabsTrigger>
          <TabsTrigger value="alternate">Alternate Configs</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <TestEmailCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailQuestion className="h-5 w-5" />
                  Email Configuration Help
                </CardTitle>
                <CardDescription>
                  Troubleshooting tips for email delivery issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Current Configuration</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Your system is configured to use SMTP server: <code className="text-primary">{process.env.SMTP_HOST}</code>
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Common Issues</h3>
                    <ul className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-2 list-disc pl-5">
                      <li>Incorrect SMTP credentials in your .env file</li>
                      <li>Firewall or network blocking SMTP ports (usually 25, 465, or 587)</li>
                      <li>Email being classified as spam by recipient servers</li>
                      <li>SMTP server limitations on sending volume</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">Check Console Logs</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Check your server console logs for detailed error messages from the email service.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="alternate">
          <AlternateEmailTester />
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <EmailDiagnosticsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
} 