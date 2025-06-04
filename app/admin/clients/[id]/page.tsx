"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, Mail, CalendarDays, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface ClientPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  endDate: string;
}

interface ClientDetails {
  id: string;
  name: string;
  email: string;
  package: ClientPackage | null;
}

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-white/70">Loading client details...</h3>
    </div>
  </div>
);

export default function ClientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Background image
  const bgImage = "/images/gymxam4.webp";
  
  // Check authentication
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);
  
  // Fetch data
  useEffect(() => {
    if (!user || !params.id) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Get client ID from params
        const clientId = Array.isArray(params.id) ? params.id[0] : params.id as string;
        console.log(`Client ID from params: ${clientId}`);
        
        // Get client details
        const apiUrl = `/api/admin/clients/${encodeURIComponent(clientId)}`;
        console.log(`Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`API error (${response.status}):`, errorData);
          throw new Error(`Failed to fetch client details: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.client) {
          setClientDetails(data.client);
        } else {
          setClientDetails(data);
        }
        
        console.log(`Found client: ${data.client?.name || data.name}`);
      } catch (error: any) {
        console.error('Error fetching client details:', error);
        setErrorMessage(error.message || 'Failed to fetch client details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, user]);
  
  // If not authenticated yet
  if (!user) {
    return <LoadingIndicator />;
  }
  
  // If not an admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/80 p-6 rounded-lg border border-white/10">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-xl font-bold text-white text-center mb-2">Access Denied</h1>
          <p className="text-white/70 text-center mb-6">
            You don't have permission to view this page
          </p>
          <Button 
            onClick={() => router.push("/dashboard")}
            className="block w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-center rounded-md"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }
  
  if (!clientDetails) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-black/80 p-6 rounded-lg border border-white/10">
          <h1 className="text-xl font-bold text-white text-center mb-2">Client Not Found</h1>
          <p className="text-white/70 text-center mb-6">
            {errorMessage || "The client you're looking for doesn't exist or couldn't be loaded"}
          </p>
          <Link 
            href="/admin/clients"
            className="block w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-center rounded-md"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image 
          src={bgImage}
          alt="Admin background"
          fill
          priority
          sizes="100vw"
          quality={80}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
      </div>
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Link 
          href="/admin/clients"
          className="inline-flex items-center text-white/70 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-4">Client Profile</h1>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-white text-2xl border border-primary/30">
                {clientDetails.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 text-white mb-1">
                  <User className="h-4 w-4 text-white/70" />
                  <span className="font-medium">{clientDetails.name}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Mail className="h-4 w-4 text-white/50" />
                  <span>{clientDetails.email}</span>
                </div>
              </div>
            </div>
            
            {clientDetails.package && (
              <div className="mt-6 bg-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-white font-medium">Active Package</span>
                  </div>
                  <span className="text-xs bg-primary/30 px-2 py-1 rounded text-white border border-primary/30">
                    {clientDetails.package.name}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/70">
                    <span>Classes Remaining</span>
                    <span className="text-white">{clientDetails.package.classesRemaining} / {clientDetails.package.totalClasses}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${(clientDetails.package.classesRemaining / clientDetails.package.totalClasses) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-white/70">
                    <span>Valid Until</span>
                    <span className="text-white">{new Date(clientDetails.package.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Bookings button */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/admin/clients/${encodeURIComponent(clientDetails.id)}/bookings`}
                className="inline-flex items-center px-4 py-2 bg-primary/20 hover:bg-primary/30 text-white rounded-md border border-primary/30 transition-colors"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                View All Bookings
              </Link>
              {/* Other action buttons can be added here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 