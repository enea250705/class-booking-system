"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  LayoutDashboard, 
  Users,
  ArrowLeft,
  CalendarDays,
  Clock,
  User
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/lib/auth";
import { format } from 'date-fns';

// Define interfaces for our data types
interface BookingClass {
  id: string;
  name: string;
  date: string;
  time: string;
  day: string;
  capacity: number;
  currentBookings: number;
}

interface Booking {
  id: string;
  classId: string;
  status: string;
  createdAt: string;
  class: BookingClass;
}

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

// Define LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading bookings...</h3>
    </div>
  </div>
);

// AdminSidebar component
function AdminSidebar({ user }: { user: any }) {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-lg border-r border-white/10 z-50 hidden lg:flex flex-col">
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl tracking-tight text-white">
            <span className="text-primary">Gym</span>Xam
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 py-8 px-4">
        <div className="space-y-4">
          <Link href="/admin" className="flex items-center rounded-lg px-3 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <LayoutDashboard className="h-5 w-5 mr-3 text-white/50" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/admin/classes" className="flex items-center rounded-lg px-3 py-3 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>Classes</span>
          </Link>
          
          <Link href="/admin/clients" className="flex items-center rounded-lg px-3 py-3 text-white bg-white/10 transition-colors">
            <Users className="h-5 w-5 mr-3 text-primary" />
            <span>Clients</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center mb-4 pb-4 border-b border-white/10">
          <Avatar className="border-2 border-white/20 h-10 w-10">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-white/60">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
        <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
      </div>
    </aside>
  );
}

// Main page component - now a client component
export default function ClientBookingsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Background image for better visual appeal
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
      setError(null);
  
  try {
    // Fetch client details
        const clientId = Array.isArray(params.id) ? params.id[0] : params.id as string;
        console.log(`Client ID from params: ${clientId}`);
        
        // Fetch client details
        const clientResponse = await fetch(`/api/admin/clients/${encodeURIComponent(clientId)}`);
        
        if (!clientResponse.ok) {
          throw new Error(`Failed to fetch client details: ${clientResponse.statusText}`);
        }
        
        const clientData = await clientResponse.json();
        console.log('Client data received:', clientData);
        
        if (clientData.client) {
          setClient(clientData.client);
        } else if (clientData.error) {
          throw new Error(clientData.error);
        } else {
          setClient(clientData);
        }
    
    // Fetch client bookings
        const bookingsResponse = await fetch(`/api/admin/clients/${encodeURIComponent(clientId)}/bookings`);
    
    if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings: ${bookingsResponse.statusText}`);
    }
    
    const bookingsData = await bookingsResponse.json();
        console.log('Bookings data received:', bookingsData);
        
        if (bookingsData.bookings) {
          setBookings(bookingsData.bookings);
          console.log(`Found ${bookingsData.bookings.length} bookings for client`);
        } else {
          console.log('No bookings found in response data');
          setBookings([]);
        }
      } catch (error: any) {
    console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, user]);
  
  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  // If not authenticated yet
  if (!user) {
    return <LoadingIndicator />;
  }
  
  // If not an admin
  if (user.role !== "admin") {
    return (
      <div className="text-center p-10">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="mb-4">You don't have permission to view this page</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="relative min-h-screen flex flex-col">
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
        
        {/* Desktop sidebar */}
        <AdminSidebar user={user} />
        
        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Back button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              asChild
            >
              <Link href="/admin/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <>
          {/* Client info card */}
          {client && (
            <div className="mb-8">
              <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white/20">
                      <AvatarFallback className="text-xl bg-primary/30 text-white">
                        {client.name?.charAt(0) || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white text-2xl">{client.name}</CardTitle>
                      <CardDescription className="text-white/70">{client.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {client.package ? (
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                          {client.package.name}
                        </Badge>
                          <Badge className="bg-green-500/20 text-white border-green-500/30">
                            Active
                          </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">Classes Remaining</span>
                          <span className="font-medium text-white">{client.package.classesRemaining} / {client.package.totalClasses}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${(client.package.classesRemaining / client.package.totalClasses) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-white/70">Valid Until</span>
                              <span className="font-medium text-white">{new Date(client.package.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20 text-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-white">No active package</p>
                      <p className="text-white/70 text-sm mt-1">This client doesn't have an active membership package</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Client Bookings</h1>
            <p className="text-white/70">
              View all bookings for {client?.name || 'this client'}
            </p>
          </div>

              {/* Error message */}
              {error && (
                <Card className="bg-red-900/30 border-red-500/30 text-white mb-6">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Error Loading Data</p>
                        <p className="text-white/80 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

          {/* Bookings list */}
          {bookings.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all"
                    >
                      <div className="border-b border-white/10 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">{booking.class.name}</h3>
                          <span className="text-xs bg-primary/20 px-2 py-1 rounded text-white border border-primary/30">
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-white/70">
                          <div className="flex items-center">
                            <CalendarDays className="h-4 w-4 mr-1.5 text-white/50" />
                            <span>{formatDate(booking.class.date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1.5 text-white/50" />
                            <span>{booking.class.time} ({booking.class.day})</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-white/70 mb-2">
                          Booked on: {new Date(booking.createdAt).toLocaleString()}
                        </div>
                        <div className="flex justify-between items-center text-xs text-white/70">
                          <span>Class Capacity</span>
                          <span>{booking.class.currentBookings} / {booking.class.capacity}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              booking.class.currentBookings >= booking.class.capacity 
                                ? 'bg-red-500/80' 
                                : booking.class.currentBookings / booking.class.capacity > 0.7 
                                  ? 'bg-yellow-500/80' 
                                  : 'bg-primary/80'
                            }`}
                            style={{ width: `${Math.min(100, (booking.class.currentBookings / booking.class.capacity) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
              ))}
            </div>
          ) : (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CalendarDays className="h-8 w-8 text-white/60" />
                </div>
                <h3 className="font-medium text-white text-lg">No Bookings Found</h3>
                <p className="text-white/70 mt-2 max-w-xs">
                  This client hasn't booked any fitness classes yet.
                </p>
              </CardContent>
            </Card>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
} 