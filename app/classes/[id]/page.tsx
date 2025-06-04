"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Clock, User, Users, ArrowLeft, Check, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from "@/components/logout-button"
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
interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  date: string;
  day: string;
  time: string;
  duration?: string;
  capacity: number;
  currentBookings: number;
  coach?: string;
  level?: string;
  isBooked: boolean;
}

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading CrossFit class details...</h3>
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
          
          <Link href="/classes" className="flex items-center rounded-lg px-3 py-2 text-white bg-white/10 transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-primary" />
            <span>Classes</span>
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
          
          <Link href="/classes" className="flex items-center py-2 text-white" onClick={onClose}>
            <CalendarDays className="h-5 w-5 mr-3 text-primary" />
            <span>Classes</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-8 left-0 w-full px-6">
          <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// MobileHeader component
function MobileHeader({ user, setIsMobileMenuOpen }: { user: any, setIsMobileMenuOpen: (open: boolean) => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md lg:hidden">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl text-white">
            <span className="text-primary">Gym</span>Xam
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

const ClassDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [bookingStatus, setBookingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [bookingError, setBookingError] = useState("")
  const [cancelStatus, setCancelStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [cancelError, setCancelError] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const fetchClassDetails = async () => {
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use mock data from the bookings API
        const response = await fetch('/api/classes')
        if (!response.ok) {
          throw new Error('Failed to fetch class details')
        }
        
        const data = await response.json()
        const classData = data.find((c: any) => c.id === params.id)
        
        if (!classData) {
          throw new Error('CrossFit class not found')
        }
        
        setClassDetails(classData)
        setError("")
      } catch (err) {
        console.error("Error fetching class details:", err)
        setError("Failed to load CrossFit class details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchClassDetails()
  }, [params.id])
  
  const handleBookClass = async () => {
    if (!classDetails) return
    
    setBookingStatus("loading")
    setBookingError("")
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: params.id,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book class')
      }
      
      // Update the class details to show it's now booked
      setClassDetails({
        ...classDetails,
        isBooked: true,
        currentBookings: classDetails.currentBookings + 1,
      })
      
      setBookingStatus("success")
    } catch (err: any) {
      console.error("Error booking class:", err)
      setBookingError(err.message || "Failed to book CrossFit class. Please try again.")
      setBookingStatus("error")
    }
  }
  
  const handleCancelBooking = async () => {
    if (!classDetails) return
    
    setCancelStatus("loading")
    setCancelError("")
    
    try {
      // First check if there is a booking for this class
      const response = await fetch('/api/bookings/cancel-by-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId: params.id }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error("Cancel booking error:", data)
        throw new Error(data.error || 'Failed to cancel booking')
      }
      
      // Update the class details to show it's no longer booked
      setClassDetails({
        ...classDetails,
        isBooked: false,
        currentBookings: Math.max(0, classDetails.currentBookings - 1),
      })
      
      toast({
        title: "Booking Cancelled",
        description: "Your class booking has been successfully cancelled.",
        variant: "success"
      })
      
      setCancelStatus("success")
    } catch (err: any) {
      console.error("Error cancelling booking:", err)
      
      // Show a more user-friendly error message
      let errorMessage = err.message || "Failed to cancel CrossFit class booking. Please try again."
      if (errorMessage.includes("Booking not found for this class")) {
        errorMessage = "No active booking found for this class."
      } else if (errorMessage.includes("allowed at least 8 hours")) {
        errorMessage = "Cancellations must be made at least 8 hours before the class starts."
      }
      
      setCancelError(errorMessage)
      setCancelStatus("error")
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 -z-10">
          <Image
            src="/images/dark-yoga-bg.jpg"
            alt="Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90"></div>
        </div>
        <div className="container mx-auto px-4 py-16">
          <LoadingIndicator />
        </div>
      </div>
    )
  }
  
  if (error || !classDetails) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="fixed inset-0 -z-10">
          <Image
            src="/images/dark-yoga-bg.jpg"
            alt="Background"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90"></div>
        </div>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-red-500/20 rounded-full p-6 mb-6">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Class</h2>
          <p className="text-white/70 mb-6">{error || "Could not load class details"}</p>
          <Button onClick={() => router.push("/classes")} className="bg-white text-black">
            Back to Classes
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/dark-yoga-bg.jpg"
          alt="Background"
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
      
      <main className="lg:pl-64">
        <div className="container mx-auto px-4 py-8 md:py-16 max-w-5xl">
          <Button 
            onClick={() => router.back()} 
            variant="ghost" 
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main class details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{classDetails.name}</h1>
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
                    {classDetails.level || "All Levels"}
                  </Badge>
                  {classDetails.isBooked && (
                    <Badge variant="outline" className="ml-2 bg-green-500/20 border-green-500/30 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Booked
                    </Badge>
                  )}
                </div>
              </div>
              
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Class Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">
                    {classDetails.description || 
                     `Join us for an engaging ${classDetails.name} class designed for ${classDetails.level || "all"} levels. 
                     This class focuses on building strength, flexibility and mindfulness in a supportive environment.`}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1">
                      <p className="text-xs text-white/60">Date</p>
                      <div className="flex items-center text-white/90">
                        <CalendarDays className="h-4 w-4 mr-2 text-primary/80" />
                        <span>{new Date(classDetails.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-white/60">Time</p>
                      <div className="flex items-center text-white/90">
                        <Clock className="h-4 w-4 mr-2 text-primary/80" />
                        <span>{classDetails.time}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-white/60">Duration</p>
                      <div className="flex items-center text-white/90">
                        <Clock className="h-4 w-4 mr-2 text-primary/80" />
                        <span>{classDetails.duration || "60 minutes"}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-white/60">Instructor</p>
                      <div className="flex items-center text-white/90">
                        <User className="h-4 w-4 mr-2 text-primary/80" />
                        <span>{classDetails.coach || ""}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">What to Bring</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
                      <span>Comfortable workout clothes</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
                      <span>Water bottle</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
                      <span>Small towel</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-1 text-primary" />
                      <span>Personal yoga mat (if preferred)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {/* Booking sidebar */}
            <div>
              <Card className="bg-black/40 backdrop-blur-md border-white/10 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Class Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-white/60">Availability</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Spots remaining:</span>
                      <span className="font-medium text-white">{classDetails.capacity - classDetails.currentBookings} / {classDetails.capacity}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${(classDetails.currentBookings / classDetails.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-white/60 mb-2">Payment</p>
                    <div className="bg-white/5 p-3 rounded-md">
                      <p className="text-white/80 text-sm">Cash payment at studio</p>
                    </div>
                  </div>
                  
                  {!classDetails.isBooked && (
                    <Button 
                      onClick={handleBookClass}
                      className="w-full bg-white hover:bg-white/90 text-black hover:text-black/90 disabled:bg-white/10 disabled:text-white/30 disabled:border disabled:border-white/10 transition-colors"
                      disabled={
                        classDetails.currentBookings >= classDetails.capacity ||
                        bookingStatus === "loading"
                      }
                    >
                      {bookingStatus === "loading" ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                          Booking...
                        </span>
                      ) : (
                        'Book Class'
                      )}
                    </Button>
                  )}
                  
                  {classDetails.isBooked && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          className="w-full bg-transparent border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-white transition-colors"
                          disabled={cancelStatus === "loading"}
                        >
                          {cancelStatus === "loading" ? (
                            <span className="flex items-center gap-1.5">
                              <div className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                              <span>Cancelling...</span>
                            </span>
                          ) : (
                            "Cancel Booking"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-black/95 border-white/30 text-white max-w-[95%] w-[340px] sm:max-w-md rounded-lg shadow-xl p-5 sm:p-6 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0">
                        <AlertDialogHeader className="pb-3">
                          <AlertDialogTitle className="text-xl text-center text-white">Cancel Class Booking</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/80 text-center mt-2">
                            Are you sure you want to cancel your booking for:
                            <div className="mt-4 mb-4 p-4 bg-white/10 rounded-lg border border-white/20">
                              <h3 className="font-medium text-white text-base sm:text-lg">{classDetails.name}</h3>
                              <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-white/70 text-sm">
                                <div className="flex items-center">
                                  <CalendarDays className="mr-1.5 h-4 w-4 text-primary/80" />
                                  <span>{new Date(classDetails.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-1.5 h-4 w-4 text-primary/80" />
                                  <span>{classDetails.time}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 p-3 sm:p-4 bg-amber-900/40 border border-amber-500/40 rounded-md text-amber-200 text-xs sm:text-sm">
                              A class credit will be returned to your account.
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 mt-5">
                          <AlertDialogCancel className="bg-transparent border-white/30 text-white/90 hover:bg-white/10 hover:text-white sm:mr-2 order-2 sm:order-1 w-full sm:w-auto h-11">Keep Booking</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleCancelBooking}
                            className="bg-red-500/80 hover:bg-red-500 text-white border-none order-1 sm:order-2 w-full sm:w-auto h-11"
                          >
                            Confirm Cancellation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                      View Dashboard
                    </Button>
                  </Link>
                  
                  <p className="text-xs text-white/60 text-center pt-3">
                    * Cancellations must be made at least 8 hours before class start time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ClassDetailsPage 