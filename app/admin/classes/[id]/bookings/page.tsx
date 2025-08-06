"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle,
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
  Check,
  Users
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"

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

interface User {
  id: string;
  name: string;
  email: string;
}

const LoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
  </div>
);

function ClassBookingsContent({ classId }: { classId: string }) {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleAddUserRedirect = () => {
    router.push(`/admin/classes/${classId}/add-users`);
  };

  const fetchClassData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/classes/${classId}/bookings`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch class bookings: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      setClassDetails(data.class);
      setBookings(data.bookings || []);
    } catch (error: any) {
      console.error('Error fetching class bookings:', error);
      setErrorMessage(error.message || 'Failed to fetch class bookings');
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
        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
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
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg border border-gray-800">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold mb-2 text-center">Error Loading Class</h2>
          <p className="text-white/70 mb-6 text-center">{errorMessage}</p>
          <Button asChild className="w-full">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  if (!classDetails) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg border border-gray-800">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl text-white font-semibold mb-2 text-center">Class Not Found</h2>
          <p className="text-white/70 mb-6 text-center">The class you're looking for doesn't exist or couldn't be loaded</p>
          <Button asChild className="w-full">
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

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
                  <h3 className="font-medium text-white text-lg mb-2">No bookings yet</h3>
                  <p className="text-white/60 mb-6">
                    This class doesn't have any bookings at the moment.
                  </p>
                  <Button onClick={handleAddUserRedirect} className="bg-primary hover:bg-primary/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {classDetails.enabled ? "Add First User" : "Pre-add First User"}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${booking.user.name}`} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {booking.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-white">{booking.user.name}</h3>
                            <p className="text-sm text-white/60 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {booking.user.email}
                            </p>
                          </div>
                        </div>
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
                      </div>
                      
                      <div className="text-sm text-white/60 mb-4 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Booked on: {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                      
                      {booking.user.package && (
                        <div className="bg-primary/10 p-3 rounded border border-primary/20 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <PackageOpen className="h-4 w-4 text-primary" />
                            <span className="text-white text-sm font-medium">Active Package</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-white/80">
                              <span>Classes Remaining</span>
                              <span>{booking.user.package.classesRemaining} / {booking.user.package.totalClasses}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all" 
                                style={{ width: `${(booking.user.package.classesRemaining / booking.user.package.totalClasses) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-white/60">
                              <span>Valid Until</span>
                              <span>{new Date(booking.user.package.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          <Link href={`/admin/clients/${booking.userId}`}>
                            <User className="h-4 w-4 mr-1" />
                            View Profile
                          </Link>
                        </Button>
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
        </div>
      </div>


    </>
  );
}

export default function ClassBookingsPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-black">
      <ClassBookingsContent classId={params.id} />
    </div>
  );
} 
 
 
 