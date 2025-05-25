"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock, Filter, Search, User, ArrowRight, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"

// Define types
interface ClassListing {
  id: string;
  name: string;
  description?: string;
  day: string;
  date: string;
  time: string;
  capacity: number;
  currentBookings: number;
  coach?: string;
  level?: string;
}

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading CrossFit classes...</h3>
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
            <span className="text-primary">Class</span>Booker
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
          
          <Link href="/bookings" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
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
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
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
            <span className="text-primary">Gym</span>Xam
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
          
          <Link href="/bookings" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
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
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
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

// ClassCard component
function ClassCard({ cls }: { cls: ClassListing }) {
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl group-hover:text-white/90 transition-colors">{cls.name}</CardTitle>
          <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
            {cls.level || "All Levels"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-white/60">Date</p>
            <div className="flex items-center text-white/90">
              <CalendarDays className="h-4 w-4 mr-2 text-primary/80" />
              <span>{new Date(cls.date).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-white/60">Time</p>
            <div className="flex items-center text-white/90">
              <Clock className="h-4 w-4 mr-2 text-primary/80" />
              <span>{cls.time}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Availability:</span>
            <span className="text-white/90">{cls.capacity - cls.currentBookings} spots left</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/80 rounded-full"
              style={{ width: `${(cls.currentBookings / cls.capacity) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {cls.coach && (
          <div className="flex items-center text-sm text-white/80">
            <User className="h-4 w-4 mr-2 text-primary/80" />
            <span>Coach {cls.coach}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link href={`/classes/${cls.id}`} className="w-full">
          <Button className="w-full bg-white/20 hover:bg-white/30 text-white group-hover:bg-white/30 transition-colors">
            <span>View Details</span>
            <ArrowRight className="h-4 w-4 ml-2 opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ClassesPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassListing[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dayFilter, setDayFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    if (!authLoading && user) {
      fetchClasses()
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])
  
  const fetchClasses = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/classes')
      
      if (!response.ok) {
        throw new Error("Failed to load classes")
      }
      
      const data = await response.json()
      
      // Sort by date
      const sortedClasses = data.sort((a: ClassListing, b: ClassListing) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })
      
      setClasses(sortedClasses)
      setFilteredClasses(sortedClasses)
    } catch (error: any) {
      console.error("Error fetching classes:", error)
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load classes"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter classes based on search and filters
  useEffect(() => {
    let result = [...classes]
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase()
      result = result.filter(cls => 
        cls.name.toLowerCase().includes(lowercasedSearch) || 
        (cls.coach && cls.coach.toLowerCase().includes(lowercasedSearch))
      )
    }
    
    // Apply day filter
    if (dayFilter && dayFilter !== "all") {
      result = result.filter(cls => cls.day.toLowerCase() === dayFilter.toLowerCase())
    }
    
    // Apply level filter
    if (levelFilter && levelFilter !== "all") {
      result = result.filter(cls => 
        cls.level ? cls.level.toLowerCase() === levelFilter.toLowerCase() : false
      )
    }
    
    setFilteredClasses(result)
  }, [classes, searchTerm, dayFilter, levelFilter])
  
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
      
      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Class Schedule</h1>
            <p className="mt-1 text-muted-foreground text-white/60">
              Browse and book available fitness classes
            </p>
          </div>

          <div className="space-y-6">
            {/* Search and filters */}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search classes or instructors..."
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="w-full lg:w-40">
                    <Select value={dayFilter} onValueChange={setDayFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Days</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full lg:w-40">
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
                    </div>
            
            {/* Classes grid */}
            {isLoading ? (
              <LoadingIndicator />
            ) : filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} />
                ))}
                    </div>
            ) : (
              <div className="text-center py-12 bg-black/30 backdrop-blur-md rounded-lg border border-white/10">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Filter className="h-8 w-8 text-white/40" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No classes found</h3>
                  <p className="text-white/70 max-w-md mx-auto mb-6">
                    We couldn't find any classes matching your current filters.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("")
                      setDayFilter("all")
                      setLevelFilter("all")
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            {/* Info card */}
            <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Class Booking Policy</h3>
                  <p className="text-sm text-white/70 mt-1">
                    Classes can be cancelled up to 8 hours before the start time without penalty.
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
