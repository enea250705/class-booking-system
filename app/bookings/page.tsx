"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock, User, ArrowRight, X, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Define types
interface BookedClass {
  id: string;
  classId: string;
  className: string;
  day: string;
  date: string;
  time: string;
  duration?: string;
  coach?: string;
  level?: string;
}

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading your CrossFit bookings...</h3>
    </div>
  </div>
);

// EmptyState component
const EmptyState = () => (
  <div className="text-center py-12 bg-black/30 backdrop-blur-md rounded-lg border border-white/10">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <CalendarDays className="h-8 w-8 text-white/40" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">No CrossFit bookings found</h3>
      <p className="text-white/70 max-w-md mx-auto mb-6">
        You haven't booked any CrossFit classes yet. Browse available classes to get started.
      </p>
      <Link href="/classes">
        <Button className="bg-white/20 hover:bg-white/30 text-white">
          Browse CrossFit Classes
        </Button>
      </Link>
    </div>
  </div>
);

// DashboardSidebar component
function DashboardSidebar({ user }: { user: any }) {
  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-lg border-r border-white/10 z-50 hidden lg:flex flex-col">
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl tracking-tight text-white">
            <span className="text-primary">CrossFit</span>Booker
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 py-8 px-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-3 text-white/50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>Dashboard</span>
          </Link>
          
          <Link href="/classes" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>CrossFit Classes</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center mb-4 pb-4 border-b border-white/10">
          <Avatar className="border-2 border-white/20 h-10 w-10">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
            <p className="text-xs text-white/60">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
      </div>
    </aside>
  );
}

// MobileHeader component
function MobileHeader({ user, setIsMobileMenuOpen }: { user: any, setIsMobileMenuOpen: (open: boolean) => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md lg:hidden">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl text-white">
            <span className="text-primary">CrossFit</span>Booker
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="border-2 border-white/20 h-9 w-9">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="rounded-md p-2 text-white hover:bg-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

// MobileMenu component
function MobileMenu({ isOpen, onClose, user }: { isOpen: boolean, onClose: () => void, user: any }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-black border-l border-white/10 p-6 shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-8">
          <span className="font-montserrat font-bold text-lg text-white">
            <span className="text-primary">CrossFit</span>Booker
          </span>
          <button onClick={onClose} className="rounded-full p-1 text-white hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center">
            <Avatar className="border-2 border-white/20 h-12 w-12">
              <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-sm text-white/60">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-6">
          <Link href="/dashboard" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 mr-3 text-white/50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>Dashboard</span>
          </Link>
          
          <Link href="/classes" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>CrossFit Classes</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-8 left-0 w-full px-6">
          <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// BookedClassCard component
function BookedClassCard({ booking, onCancel, isLoading }: { 
  booking: BookedClass, 
  onCancel: (id: string) => void,
  isLoading: boolean
}) {
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-green-500/20 to-transparent opacity-30 rounded-bl-full"></div>
      
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-xl group-hover:text-white/90 transition-colors">{booking.className}</h3>
          <Badge variant="outline" className="bg-green-500/20 text-white border-green-500/30">
            Booked
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mt-1 mb-3">
          <div className="flex items-center">
            <CalendarDays className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{new Date(booking.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{booking.time}</span>
          </div>
          {booking.coach && (
            <div className="flex items-center">
              <User className="mr-1.5 h-4 w-4 text-primary/80" />
              <span>{booking.coach}</span>
            </div>
          )}
        </div>
        
        {booking.level && (
          <Badge variant="outline" className="bg-primary/10 text-white/80 border-primary/20">
            {booking.level}
          </Badge>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 pb-6 flex flex-col gap-3">
        <Link href="/membership/cancel" className="w-full">
          <Button
            variant="outline"
            className="w-full bg-transparent border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-white transition-colors"
            size="sm"
          >
            <span className="flex items-center justify-center gap-2">
              <X className="h-3.5 w-3.5" />
              Cancel Booking
            </span>
          </Button>
        </Link>
        
        <Link href={`/classes/${booking.classId}`} className="w-full">
          <Button 
            variant="ghost" 
            className="w-full text-white/70 hover:text-white hover:bg-white/10"
            size="sm"
          >
            View CrossFit Class Details
            <ArrowRight className="h-3.5 w-3.5 ml-1.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState<BookedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        // Fetch bookings from mock API
        const response = await fetch('/api/bookings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const bookingsData = await response.json();
        
        // Fetch classes to combine with bookings
        const classesResponse = await fetch('/api/classes');
        
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        
        const classesData = await classesResponse.json();
        
        // Combine booking data with class details
        const bookingsWithClasses = bookingsData.map((booking: any) => {
          const classDetails = classesData.find((c: any) => c.id === booking.classId);
          return {
            ...booking,
            class: classDetails || null
          };
        });
        
        setBookings(bookingsWithClasses);
        setError("");
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load your CrossFit class bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    setCancelingId(bookingId);
    
    try {
      // Get the booking details first to know the class ID
      const bookingDetails = bookings.find(b => b.id === bookingId);
      
      if (!bookingDetails) {
        throw new Error("Booking details not found");
      }
      
      // Use the class-based cancellation endpoint for consistency
      const response = await fetch(`/api/bookings/cancel-by-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId: bookingDetails.classId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to cancel booking';
        console.error("Cancellation error:", errorMessage);
        
        // Show a more specific error message
        let userMessage = errorMessage;
        if (errorMessage.includes("Booking not found for this class")) {
          userMessage = "No active booking found for this class.";
        } else if (errorMessage.includes("allowed at least 8 hours")) {
          userMessage = "Cancellations must be made at least 8 hours before the class starts.";
        }
        
        throw new Error(userMessage);
      }
      
      // Remove the canceled booking from state
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      
      // Show success message
      toast({
        title: "Booking Cancelled",
        description: "Your CrossFit class booking has been successfully cancelled.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Error canceling booking:", err);
      
      toast({
        title: "Error",
        description: err.message || "Failed to cancel your CrossFit class booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/dark-yoga-bg.jpg"
          alt="CrossFit background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90"></div>
      </div>
      
      {/* Desktop sidebar */}
      <DashboardSidebar user={user} />
      
      {/* Mobile header */}
      <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
      
      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">My CrossFit Bookings</h1>
            <p className="mt-1 text-muted-foreground text-white/60">
              Manage your scheduled CrossFit classes
            </p>
          </div>

          <div className="space-y-6">
            {loading ? (
              <LoadingIndicator />
            ) : bookings.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-white">Upcoming CrossFit Classes</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings.map((booking) => (
                    <BookedClassCard 
                      key={booking.id} 
                      booking={booking} 
                      onCancel={handleCancelBooking}
                      isLoading={cancelingId === booking.id}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
            
            {/* Info card */}
            <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-white">CrossFit Cancellation Policy</h3>
                  <p className="text-sm text-white/70 mt-1">
                    CrossFit classes can be cancelled up to 8 hours before the start time without penalty.
                    Late cancellations or no-shows will still deduct a class from your package.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default BookingsPage 