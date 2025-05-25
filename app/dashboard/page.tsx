"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, Users, LayoutDashboard, Settings, AlertTriangle, BookOpen, MenuIcon, X, Dumbbell, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading fitness data...</h3>
    </div>
  </div>
);

// Add type definitions to fix TypeScript errors
interface ClassPreview {
  id: string;
  classId?: string;
  name: string;
  day: string;
  time: string;
  date: string;
  available?: boolean;
  capacity?: number;
  currentBookings?: number;
  price?: string;
  coach?: string;
  isBooked?: boolean;
}

interface PackageInfo {
  id: string;
  name: string;
  totalClasses: number;
  classesRemaining: number;
  startDate: string | Date;
  endDate: string | Date;
  daysRemaining: number;
  active: boolean;
}

// Define ClassCard component for better reusability
function ClassCard({ 
  cls, 
  isBooking, 
  isUpcoming, 
  onBook, 
  onCancel, 
  userCanBook 
}: { 
  cls: ClassPreview;
  isBooking: boolean;
  isUpcoming: boolean;
  onBook?: (id: string) => void;
  onCancel?: (id: string) => void;
  userCanBook: boolean;
}) {
  return (
    <Card 
      className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/30 to-transparent opacity-30 rounded-bl-full"></div>
      
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-xl group-hover:text-white/90 transition-colors">{cls.name}</h3>
          {!isUpcoming && cls.capacity && cls.currentBookings && (
            <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
              {cls.capacity - cls.currentBookings} spots left
            </Badge>
          )}
          {isUpcoming && (
            <Badge variant="outline" className="bg-green-500/20 text-white border-green-500/30">
              Booked
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mt-1 mb-3">
          <div className="flex items-center">
            <CalendarDays className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{cls.date}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{cls.time}</span>
          </div>
          {cls.coach && (
            <div className="flex items-center">
              <User className="mr-1.5 h-4 w-4 text-primary/80" />
              <span>Coach {cls.coach}</span>
            </div>
          )}
        </div>
        
        {!isUpcoming && (
          <div className="bg-white/5 rounded-md p-2 mt-2 text-xs text-white/60">
            <div className="flex justify-between items-center">
              <span>Class Capacity:</span>
              <span>{cls.currentBookings}/{cls.capacity}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-primary/80 rounded-full"
                style={{ width: `${(cls.currentBookings! / cls.capacity!) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 pb-6">
        {isUpcoming ? (
          <Button
            variant="outline"
            onClick={() => onCancel && onCancel(cls.id)}
            className="w-full bg-transparent border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-white transition-colors"
            size="sm"
            disabled={isBooking}
          >
            {isBooking ? (
              <span className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                <span>Cancelling...</span>
              </span>
            ) : (
              "Cancel Booking"
            )}
          </Button>
        ) : (
          <Button
            onClick={() => onBook && onBook(cls.id)}
            disabled={!userCanBook || isBooking}
            className="w-full bg-white hover:bg-white/90 text-black hover:text-black/90 disabled:bg-white/10 disabled:text-white/30 disabled:border disabled:border-white/10 transition-colors"
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                Booking...
              </span>
            ) : (
              'Book Class'
            )}
          </Button>
        )}
        <div className="text-xs text-white/60 mt-3 text-center w-full">
          * Classes deducted from your membership package
        </div>
      </CardFooter>
    </Card>
  );
}

// DashboardSidebar component
function DashboardSidebar({ user }: { user: any }) {
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
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center rounded-lg px-3 py-2 text-white bg-white/10 transition-colors">
            <LayoutDashboard className="h-5 w-5 mr-3 text-primary" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/classes" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>Classes</span>
          </Link>
          
          <Link href="/bookings" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <BookOpen className="h-5 w-5 mr-3 text-white/50" />
            <span>My Bookings</span>
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
            <MenuIcon className="h-5 w-5" />
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
            <span className="text-primary">Gym</span>Xam
          </span>
          <button onClick={onClose} className="rounded-full p-1 text-white hover:bg-white/10">
            <X className="h-5 w-5" />
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
          <Link href="/dashboard" className="flex items-center py-2 text-white" onClick={onClose}>
            <LayoutDashboard className="h-5 w-5 mr-3 text-primary" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/classes" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>Classes</span>
          </Link>
          
          <Link href="/bookings" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <BookOpen className="h-5 w-5 mr-3 text-white/50" />
            <span>My Bookings</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-8 left-0 w-full px-6">
          <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

const DashboardPage = () => {
  const [classes, setClasses] = useState<ClassPreview[]>([]);
  const [userPackage, setUserPackage] = useState({
    type: 'Monthly Unlimited',
    classesRemaining: 8,
    status: 'active',
    startDate: '2023-10-01',
    endDate: '2023-11-01'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingStatus, setBookingStatus] = useState<{
    classId: string | null;
    status: "idle" | "loading" | "success" | "error";
  }>({ classId: null, status: "idle" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch classes from the mock API
        const classesResponse = await fetch('/api/classes');
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch fitness classes');
        }
        
        const classesData = await classesResponse.json();
        
        // Fetch user's bookings to mark booked classes
        const bookingsResponse = await fetch('/api/bookings');
        if (!bookingsResponse.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const bookingsData = await bookingsResponse.json();
        const bookedClassIds = bookingsData.map((booking: any) => booking.classId);
        
        // Mark classes as booked if the user has booked them
        const classesWithBookingStatus = classesData.map((classItem: any) => ({
          ...classItem,
          isBooked: bookedClassIds.includes(classItem.id)
        }));
        
        // Sort classes by date (ascending)
        classesWithBookingStatus.sort((a: any, b: any) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        
        setClasses(classesWithBookingStatus);
        setError("");
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load fitness classes. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleBookClass = async (classId: string) => {
    setBookingStatus({ classId, status: "loading" });
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book fitness class');
      }
      
      // Update the booked class in the state
      setClasses(classes.map(c => 
        c.id === classId 
          ? { ...c, isBooked: true, currentBookings: c.currentBookings + 1 } 
          : c
      ));
      
      setBookingStatus({ classId, status: "success" });
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setBookingStatus({ classId: null, status: "idle" });
      }, 2000);
    } catch (err: any) {
      console.error("Error booking class:", err);
      setBookingStatus({ classId, status: "error" });
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setBookingStatus({ classId: null, status: "idle" });
      }, 2000);
    }
  };

  // Update the condition to render main content when user is confirmed
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        {/* Optimized background image with next/image */}
        <div className="fixed inset-0 -z-10">
          <Image 
            src="/images/gymxam3.webp"
            alt="Dashboard background"
            fill
            priority
            sizes="100vw"
            quality={80}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
          </div>
        
        {/* Desktop sidebar */}
        <DashboardSidebar user={user} />
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Page header */}
          <div className="text-center mb-12 animate-in">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">Your fitness Dashboard</h1>
            <p className="text-white/70 max-w-xl mx-auto">Book fitness classes, manage your schedule, and track your membership</p>
            </div>

          {loading ? (
            <LoadingIndicator />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] md:grid-cols-1">
              {/* Left column - Classes */}
              <div className="space-y-8">
                <Tabs defaultValue="upcoming" className="space-y-6">
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="bg-black/50 p-1 rounded-lg border border-white/10 mx-auto flex justify-center w-full max-w-md">
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1">
                        My Bookings
                      </TabsTrigger>
                      <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1">
                        Available fitness
                      </TabsTrigger>
              </TabsList>
                  </div>
                  
                  <TabsContent value="upcoming" className="space-y-6 animate-in">
                    <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Your Upcoming fitness Classes</h2>
                    {classes.length === 0 ? (
                      <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <CalendarDays className="h-8 w-8 text-white/60" />
                          </div>
                          <h3 className="font-medium text-white text-lg">No upcoming classes</h3>
                          <p className="text-white/70 mt-2 max-w-xs">You don't have any booked fitness classes. Explore available classes to get started.</p>
                          <Button 
                            onClick={() => {
                              const element = document.querySelector('[data-state="inactive"][value="available"]') as HTMLElement;
                              if (element) element.click();
                            }} 
                            className="mt-6 bg-white/20 text-white hover:bg-white/30 border border-white/10"
                          >
                            Browse fitness Classes
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 xs:grid-cols-1">
                        {classes.map((cls) => (
                          <ClassCard
                            key={cls.id}
                            cls={cls}
                            isBooking={bookingStatus.classId === cls.id && bookingStatus.status === "loading"}
                            isUpcoming={true}
                            onCancel={() => {}}
                            userCanBook={userPackage?.active || false}
                          />
                    ))}
                  </div>
                )}
              </TabsContent>
                  
                  <TabsContent value="available" className="space-y-6 animate-in">
                    <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Available fitness Classes</h2>
                    <div className="grid gap-4 sm:grid-cols-2 xs:grid-cols-1">
                  {classes.map((cls) => (
                        <ClassCard
                          key={cls.id}
                          cls={cls}
                          isBooking={bookingStatus.classId === cls.id && bookingStatus.status === "loading"}
                          isUpcoming={false}
                          onBook={() => handleBookClass(cls.id)}
                          userCanBook={!!(userPackage && userPackage.active && userPackage.classesRemaining > 0)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Right column - Membership */}
              <div className="space-y-6">
                <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-all animate-in">
                  {userPackage ? (
                    <>
                      <CardHeader className="bg-black/30 border-b border-white/10 pb-4 text-center">
                        <CardTitle className="text-white text-2xl font-bold">Your fitness Membership</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 p-6">
                        <div className="rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 p-6 border border-white/10 text-center">
                          <div className="text-3xl font-bold text-white mb-1">{userPackage.name}</div>
                          <div className="text-white/70 text-sm">
                            Valid until {new Date(userPackage.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">Classes Remaining</span>
                              <span className="text-sm font-medium text-white">{userPackage.classesRemaining} / {userPackage.totalClasses}</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(userPackage.classesRemaining / userPackage.totalClasses) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                        <div className="flex items-center justify-between">
                              <span className="text-sm text-white/80">Time Remaining</span>
                              <span className="text-sm font-medium text-white">{userPackage.daysRemaining} days</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${(userPackage.daysRemaining / 30) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-white/60 text-xs text-center italic pt-2">
                          * All classes require payment in cash at the studio.
                        </div>
                      </CardContent>
                      <CardFooter className="bg-black/20 border-t border-white/10 p-6">
                        <Button 
                          className="w-full bg-white text-black hover:bg-white/90 font-medium" 
                          onClick={() => handlePurchasePackage('standard')}
                        >
                          Renew Membership
                        </Button>
                      </CardFooter>
                    </>
                  ) : (
                    <>
                      <CardHeader className="bg-black/30 border-b border-white/10 pb-4 text-center">
                        <CardTitle className="text-white text-2xl font-bold">Get Started</CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="bg-white/10 rounded-full p-4 mb-6">
                            <CalendarDays className="h-12 w-12 text-white/80" />
                          </div>
                          <h3 className="text-white text-xl font-medium mb-2">No Active Membership</h3>
                          <p className="text-white/70 max-w-xs mb-6">
                            Purchase a membership plan to start booking fitness classes
                          </p>
                          <Button
                            className="bg-white text-black hover:bg-white/90 font-medium px-6" 
                            onClick={() => handlePurchasePackage('standard')}
                          >
                            Purchase Plan
                          </Button>
                        </div>
                      </CardContent>
                    </>
                  )}
            </Card>

                {error && (
                  <Alert className="bg-red-900/70 backdrop-blur-md border border-red-500/30 text-white animate-in">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {userPackage && userPackage.daysRemaining <= 7 && (
                  <Alert className="bg-amber-900/70 backdrop-blur-md border border-amber-500/30 text-white animate-in">
                <CalendarDays className="h-4 w-4" />
                    <AlertTitle>Membership Expiring Soon</AlertTitle>
                    <AlertDescription className="text-white/90">
                      Your current plan expires in {userPackage.daysRemaining} days. Renew now to continue booking.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
          )}
      </main>
    </div>
    </>
  );
}

export default DashboardPage;
