"use client"

import Link from "next/link";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  User,
  UserPlus,
  UserMinus,
  Search,
  Check
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { format } from "date-fns";
import { AdminSidebar } from "@/app/admin/components/AdminLayout";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

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

// Add User interface for selection
interface User {
  id: string;
  name: string;
  email: string;
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
  
  const { toast } = useToast();
  const router = useRouter();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  // Redirect to add users page
  const handleAddUserRedirect = () => {
    router.push(`/admin/classes/${classId}/add-users`);
  };

  // Handle toggling class enabled status
  const handleToggleClassEnabled = async () => {
    if (!classDetails) return;

    try {
      const response = await fetch(`/api/admin/classes/${classDetails.id}/toggle-enabled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !classDetails.enabled
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Refresh the class data to get updated status
        await fetchClassData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || 'Failed to update class status',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling class enabled status:', error);
      toast({
        title: "Error",
        description: 'Failed to update class status',
        variant: "destructive"
      });
    }
  };
  
  // Fetch class data
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
  

  
  // Handle removing user from class
  const handleRemoveUserFromClass = async (bookingId: string) => {
    if (!classDetails) return;

    if (!confirm('Are you sure you want to remove this user from the class?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/classes/${classDetails.id}/remove-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: 'User removed from class successfully',
        });
        
        // Refresh data
        await fetchClassData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || 'Failed to remove user from class',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing user from class:', error);
      toast({
        title: "Error",
        description: 'Failed to remove user from class',
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
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
          <Link href={`/admin`}>Back to Dashboard</Link>
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
          <Link href={`/admin`}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <>
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
              <div className="flex items-center gap-3">
                <Badge variant={classDetails.enabled ? "outline" : "secondary"} className={classDetails.enabled ? "bg-primary/20 text-white border-primary/30" : "bg-muted/20 text-white/70 border-white/10"}>
                  {classDetails.enabled ? "Bookable" : "Not Bookable"}
                </Badge>
                <Button
                  onClick={handleToggleClassEnabled}
                  variant={classDetails.enabled ? "destructive" : "default"}
                  className={classDetails.enabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {classDetails.enabled ? "Disable Class" : "Enable Class"}
                </Button>
                <Button
                  onClick={handleAddUserRedirect}
                  disabled={classDetails.currentBookings >= classDetails.capacity}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {classDetails.enabled ? "Add User" : "Pre-add User"}
                </Button>
              </div>
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
                {bookings.length > 0 && (
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-green-400">
                      {bookings.filter(b => b.status === 'confirmed').length} confirmed
                    </span>
                    {bookings.filter(b => b.status === 'pre_added').length > 0 && (
                      <span className="text-yellow-400">
                        {bookings.filter(b => b.status === 'pre_added').length} pre-added
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings list with remove functionality */}
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
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarFallback className="bg-primary/20 text-white">
                          {booking.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-white">{booking.user.name}</h4>
                        <p className="text-sm text-white/70">{booking.user.email}</p>
                        <p className="text-xs text-white/50">
                          Booked: {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={
                            booking.status === 'pre_added' 
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs mb-1"
                              : "bg-green-500/20 text-green-300 border-green-500/30 text-xs mb-1"
                          }
                        >
                          {booking.status === 'pre_added' ? 'Pre-added' : 'Confirmed'}
                        </Badge>
                        {booking.user.package && (
                          <>
                            <Badge variant="outline" className="bg-primary/10 text-white/80 border-primary/20 text-xs">
                              {booking.user.package.name}
                            </Badge>
                            <p className="text-xs text-white/60 mt-1">
                              {booking.user.package.classesRemaining}/{booking.user.package.totalClasses} classes left
                            </p>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveUserFromClass(booking.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Emails Card - Keep existing functionality */}
        <Card className="border-white/10 bg-primary/10 backdrop-blur-md text-white overflow-hidden">
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
                {bookings.length > 0 && (
                  <div className="p-4 bg-black/30 rounded-lg border border-white/10">
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

        {/* Waitlist - Keep existing */}
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


    </>
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
            <Link href="/admin" className="flex items-center text-white/70 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Dashboard</span>
            </Link>
            
            <ClassDetailsContent classId={params.id} />
          </div>
        </main>
      </div>
    </>
  );
} 