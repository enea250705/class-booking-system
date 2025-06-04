"use client"

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle,
  LayoutDashboard, 
  Users,
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  PackageOpen,
  Calendar,
  X,
  User
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { format } from "date-fns";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { AdminSidebar } from "@/app/admin/components/AdminLayout";
import { useState, useEffect } from "react";

// Define interfaces for type safety
interface ClassDetails {
  id: string;
  name: string;
  date: string;
  time: string;
  day: string;
  capacity: number;
  currentBookings: number;
  enabled: boolean;
}

interface UserPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  endDate: string;
}

interface BookingUser {
  id: string;
  name: string;
  email: string;
  package: UserPackage | null;
}

interface Booking {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: BookingUser;
}

// Add waitlist interface
interface WaitlistEntry {
  id: string;
  userId: string;
  position: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading class details...</h3>
    </div>
  </div>
);

// Client component to fetch and display class details
function ClassDetailsContent({ classId }: { classId: string }) {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoading(true);
        
        // Use the direct-bookings endpoint with query parameter
        const response = await fetch(`/api/admin/classes/direct-bookings?classId=${classId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
          }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
        setClassDetails(data.class);
        setBookings(data.bookings || []);
    
    // Also fetch waitlist for this class
        const waitlistResponse = await fetch(`/api/classes/waitlist?classId=${classId}`, {
      headers: {
        'Cache-Control': 'no-cache'
          }
    });
    
    if (waitlistResponse.ok) {
      const waitlistData = await waitlistResponse.json();
          setWaitlist(waitlistData.waitlistEntries || []);
    }
  } catch (error: any) {
    console.error('Error fetching class details:', error);
        setErrorMessage(error.message || 'Failed to load class details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClassData();
  }, [classId]);
  
  if (isLoading) {
    return <LoadingIndicator />;
  }
  
  if (errorMessage) {
  return (
              <div className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl text-white font-semibold mb-2">Error Loading Class</h2>
                <p className="text-white/70 mb-6">{errorMessage}</p>
                <Button asChild>
          <Link href={`/admin/classes`}>Back to Classes</Link>
        </Button>
      </div>
    );
  }
  
  if (!classDetails) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl text-white font-semibold mb-2">Class Not Found</h2>
        <p className="text-white/70 mb-6">The class you're looking for doesn't exist or couldn't be loaded</p>
        <Button asChild>
          <Link href={`/admin/classes`}>Back to Classes</Link>
                </Button>
              </div>
    );
  }
  
  return (
              <div className="space-y-6">
                {/* Class details card */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white overflow-hidden">
                  <CardHeader className="border-b border-white/10 bg-black/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl">{classDetails.name}</CardTitle>
                        <CardDescription className="text-white/70">
                          {classDetails.day} - {formatDate(classDetails.date)} at {classDetails.time}
                        </CardDescription>
                      </div>
                      <Badge variant={classDetails.enabled ? "outline" : "secondary"} className={classDetails.enabled ? "bg-primary/20 text-white border-primary/30" : "bg-muted/20 text-white/70 border-white/10"}>
                        {classDetails.enabled ? "Bookable" : "Not Bookable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="font-medium">Time</h3>
                        </div>
                        <p className="text-white/70">{classDetails.time}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center mb-2">
                          <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="font-medium">Date</h3>
                        </div>
                        <p className="text-white/70">{formatDate(classDetails.date)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center mb-2">
                          <Users className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="font-medium">Capacity</h3>
                        </div>
                        <p className="text-white/70">{classDetails.currentBookings} / {classDetails.capacity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

      {/* Client Emails Card - Dedicated section for quick access to emails */}
      <Card className="border-white/10 bg-primary/10 backdrop-blur-md text-white overflow-hidden mt-6">
        <CardHeader className="border-b border-white/10 bg-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <span>Client Emails</span>
              </CardTitle>
              <CardDescription className="text-white/70">
                Emails of users who have booked this class
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {bookings.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="font-medium text-white text-lg">No Emails Available</h3>
              <p className="text-white/60 mt-2">No clients have booked this class yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <div key={`quick-email-${booking.id}`} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarFallback className="bg-primary/20 text-white text-xs">
                          {booking.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{booking.user.email}</span>
                    </div>
                    <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                      {booking.user.name}
                    </Badge>
                  </div>
                ))}
              </div>
              
              {bookings.length > 0 && (
                <div className="mt-4 p-4 bg-black/30 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">All Emails (Copy & Paste)</h3>
                  </div>
                  <div className="bg-black/40 p-3 rounded border border-white/10 text-sm text-white/90 break-all">
                    {bookings.map(booking => booking.user.email).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

                {/* Bookings list - simplified */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader className="border-b border-white/10 bg-black/20">
                    <CardTitle className="flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-primary" />
                      <span>Class Bookings</span>
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {bookings.length} {bookings.length === 1 ? 'client has' : 'clients have'} booked this class
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {bookings.length === 0 ? (
                      <div className="p-8 text-center">
                        <UserX className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <h3 className="font-medium text-white text-lg">No Bookings</h3>
                        <p className="text-white/60 mt-2">No clients have booked this class yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
              <div className="bg-black/30 p-4 rounded-lg border border-white/10">
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  User Emails
                </h3>
                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <div key={`email-${booking.id}`} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-white/50" />
                        <span className="text-white">{booking.user.email}</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-white/80 border-primary/20 text-xs">
                        {booking.user.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg border border-white/10 mt-4">
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 text-primary" />
                  Booking Details
                </h3>
                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <div key={`detail-${booking.id}`} className="p-3 bg-black/20 rounded border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-white">{booking.user.name}</h4>
                          <p className="text-xs text-white/70">{booking.user.email}</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-white/80 border-primary/20">
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-white/60">
                        <p>Booked on: {new Date(booking.createdAt).toLocaleString()}</p>
                      </div>
                      
                      {booking.user.package && (
                        <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/10 text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/80">Package: {booking.user.package.name}</span>
                            <span className="text-white/80">
                              {booking.user.package.classesRemaining}/{booking.user.package.totalClasses} classes left
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Waitlist - simplified */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader className="border-b border-white/10 bg-black/20">
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <span>Waitlist</span>
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {waitlist.length} {waitlist.length === 1 ? 'person is' : 'people are'} on the waitlist
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {waitlist.length === 0 ? (
                      <div className="p-8 text-center">
                        <UserX className="h-12 w-12 text-white/30 mx-auto mb-4" />
                        <h3 className="font-medium text-white text-lg">No Waitlist</h3>
                        <p className="text-white/60 mt-2">No one is currently on the waitlist for this class.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Waitlist entries */}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
  );
}

export default function ClassDetailsPage({ params }: { params: { id: string } }) {
  // Background image selection for better visual appeal
  const bgImage = "/images/gymxam4.webp";
  
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
        
        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 px-4 relative z-10">
          <div className="mb-6">
            <Link href="/admin/classes" className="flex items-center text-white/70 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Classes</span>
            </Link>
            
            <ClassDetailsContent classId={params.id} />
          </div>
        </main>
      </div>
    </>
  );
} 