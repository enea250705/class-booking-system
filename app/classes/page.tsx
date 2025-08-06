"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock, ChevronLeft, ChevronRight, User, ArrowRight, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
  enabled: boolean;
}

interface TimeSlot {
  id: string;
  time: string;
  name: string;
  capacity: number;
  currentBookings: number;
  available: boolean;
  enabled: boolean;
}

// Calendar component
function Calendar({ 
  selectedDate, 
  onDateSelect, 
  classData 
}: { 
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  classData: { [key: string]: ClassListing[] };
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const formatDateKey = (date: Date) => {
    // Use local date components to avoid timezone shifting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const hasClasses = (date: Date) => {
    const dateKey = formatDateKey(date);
    return classData[dateKey] && classData[dateKey].length > 0;
  };
  
  const hasEnabledClasses = (date: Date) => {
    const dateKey = formatDateKey(date);
    return classData[dateKey] && classData[dateKey].some(cls => cls.enabled);
  };
  
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const days = getDaysInMonth(currentMonth);
  
  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-white/60">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2 h-12"></div>;
          }
          
          const hasDayClasses = hasClasses(date);
          const hasEnabledDayClasses = hasEnabledClasses(date);
          const isDatePast = isPast(date);
          const isDateToday = isToday(date);
          const isDateSelected = isSelected(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => hasDayClasses && !isDatePast && onDateSelect(date)}
              disabled={!hasDayClasses || isDatePast}
              className={`
                relative p-2 h-12 text-sm font-medium rounded-lg transition-all duration-200
                ${isDateSelected 
                  ? 'bg-primary text-white shadow-lg' 
                  : isDateToday
                  ? 'bg-white/20 text-white border border-primary/50'
                  : hasDayClasses && !isDatePast
                  ? hasEnabledDayClasses
                    ? 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
                    : 'bg-red-500/10 text-red-400 cursor-not-allowed'
                  : isDatePast
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white/60 hover:bg-white/5'
                }
              `}
            >
              <span className="relative z-10">{date.getDate()}</span>
              
              {/* Show indicator based on class availability */}
              {hasDayClasses && !isDatePast && (
                <>
                  {hasEnabledDayClasses ? (
                    // Green dot for available classes
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-400"></div>
                  ) : (
                    // Large "-" symbol for disabled classes
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-400 text-xl font-bold">
                      -
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-4 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Available classes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-400 font-bold text-base">-</span>
            <span>Disabled classes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Time slots component
function TimeSlots({ 
  selectedDate, 
  timeSlots, 
  onBookClass, 
  isBooking, 
  bookingClassId 
}: {
  selectedDate: Date;
  timeSlots: TimeSlot[];
  onBookClass: (classData: ClassListing) => void;
  isBooking: boolean;
  bookingClassId: string | null;
}) {
  if (!selectedDate || timeSlots.length === 0) return null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const totalClasses = timeSlots.length;
  const availableClasses = timeSlots.filter(slot => slot.enabled && slot.capacity > slot.currentBookings).length;
  const fullClasses = timeSlots.filter(slot => slot.enabled && slot.capacity <= slot.currentBookings).length;
  const closedClasses = timeSlots.filter(slot => !slot.enabled).length;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Available Times for {formatDate(selectedDate)}
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-white/70">{availableClasses} Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-white/70">{fullClasses} Full</span>
          </div>
          {closedClasses > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-red-400 font-bold text-lg">-</span>
              <span className="text-white/70">{closedClasses} Disabled</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeSlots.map((slot) => {
          const spotsLeft = slot.capacity - slot.currentBookings;
          const isFull = spotsLeft <= 0;
          const isCurrentlyBooking = isBooking && bookingClassId === slot.id;
          const isAlmostFull = spotsLeft <= 2 && spotsLeft > 0;
          
          return (
            <Card key={slot.id} className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 ${
              slot.enabled && !isFull ? 'hover:scale-[1.02] hover:shadow-lg' : ''
            }`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/20">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-white text-lg">{slot.time}</span>
                  </div>
                  <div className="flex gap-1">
                    {!slot.enabled && (
                      <Badge variant="destructive" className="text-xs">
                        Closed
                      </Badge>
                    )}
                    {slot.enabled && isFull && (
                      <Badge variant="destructive" className="text-xs">
                        Full
                      </Badge>
                    )}
                    {slot.enabled && !isFull && isAlmostFull && (
                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
                        Almost Full
                      </Badge>
                    )}
                  </div>
                </div>
                
                <h4 className="font-medium text-white mb-3 text-base">{slot.name}</h4>
                
                {/* Capacity visualization */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-white/60">
                      {isFull ? 'Fully booked' : `${spotsLeft} of ${slot.capacity} spots available`}
                    </span>
                    <span className="text-xs text-white/40">
                      {slot.currentBookings} booked
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[100px]">
                    {Array.from({ length: slot.capacity }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          i < slot.currentBookings
                            ? 'bg-red-400'
                            : 'bg-green-400/60'
                        }`}
                        title={i < slot.currentBookings ? 'Booked' : 'Available'}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      slot.currentBookings === 0 ? 'bg-green-400' :
                      isFull ? 'bg-red-400' :
                      isAlmostFull ? 'bg-yellow-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${(slot.currentBookings / slot.capacity) * 100}%` }}
                  />
                </div>
                
                <Button
                  onClick={() => onBookClass({
                    id: slot.id,
                    name: slot.name,
                    time: slot.time,
                    date: selectedDate.toISOString().split('T')[0],
                    day: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }),
                    capacity: slot.capacity,
                    currentBookings: slot.currentBookings,
                    enabled: slot.enabled
                  } as ClassListing)}
                  disabled={!slot.enabled || isFull || isBooking}
                  className={`w-full transition-all duration-200 ${
                    !slot.enabled
                      ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed'
                      : isFull
                      ? 'bg-red-600 hover:bg-red-600 cursor-not-allowed'
                      : isAlmostFull
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-primary hover:bg-primary/90 hover:scale-[1.02]'
                  }`}
                  size="lg"
                >
                  {isCurrentlyBooking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Booking...
                    </div>
                  ) : !slot.enabled ? (
                    'Class Closed'
                  ) : isFull ? (
                    '❌ Fully Booked'
                  ) : isAlmostFull ? (
                    '⚡ Book Now - Almost Full!'
                  ) : (
                    '✅ Book This Class'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading classes...</h3>
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
            <span className="text-primary">Class</span>Booker
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
            <span className="text-primary">Class</span>Booker
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

export default function ClassesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [classData, setClassData] = useState<{ [key: string]: ClassListing[] }>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classes', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      
      // Group classes by date
      const groupedByDate: { [key: string]: ClassListing[] } = {};
      
      data.forEach((cls: ClassListing) => {
        // Use the date string directly to avoid timezone parsing issues
        const dateKey = typeof cls.date === 'string' ? cls.date.split('T')[0] : new Date(cls.date).toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(cls);
      });
      
      setClassData(groupedByDate);
      
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const classes = classData[dateKey] || [];
  
    // Convert classes to time slots format
    const slots: TimeSlot[] = classes.map(cls => ({
      id: cls.id,
      time: cls.time,
      name: cls.name,
      capacity: cls.capacity,
      currentBookings: cls.currentBookings,
      available: cls.capacity > cls.currentBookings,
      enabled: cls.enabled
    }));
    
    // Sort by time
    slots.sort((a, b) => {
      const timeA = new Date(`1970-01-01 ${a.time}`).getTime();
      const timeB = new Date(`1970-01-01 ${b.time}`).getTime();
      return timeA - timeB;
    });
    
    setTimeSlots(slots);
  };

  const handleBookClass = async (classData: ClassListing) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book classes",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }
    
    try {
      setIsBooking(true);
      setBookingClassId(classData.id);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId: classData.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book class');
      }
      
      toast({
        title: "Class Booked Successfully!",
        description: `You have booked ${classData.name} at ${classData.time}`,
        variant: "default"
      });
      
      // Refresh classes data
      await fetchClasses();
      
      // Refresh time slots for selected date
      if (selectedDate) {
        handleDateSelect(selectedDate);
      }
      
    } catch (error: any) {
      console.error('Error booking class:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book class. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
      setBookingClassId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  if (!user) {
    return <LoadingIndicator />;
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
      
      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Class Calendar</h1>
            <p className="mt-1 text-muted-foreground text-white/60">
              Select a date to view and book available classes
            </p>
          </div>

            {isLoading ? (
              <LoadingIndicator />
          ) : (
            <div className="space-y-6">
              {/* Calendar Component */}
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                classData={classData}
              />
              
              {/* Time Slots Component */}
              {selectedDate && (
                <TimeSlots
                  selectedDate={selectedDate}
                  timeSlots={timeSlots}
                  onBookClass={handleBookClass}
                    isBooking={isBooking}
                    bookingClassId={bookingClassId}
                  />
              )}
              
              {/* Instructions */}
              {!selectedDate && (
              <div className="text-center py-12 bg-black/30 backdrop-blur-md rounded-lg border border-white/10">
                <div className="flex flex-col items-center">
                    <CalendarDays className="h-16 w-16 text-white/40 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Select a Date</h3>
                    <p className="text-white/70 max-w-md mx-auto">
                      Choose a date from the calendar above to view available class times for that day.
                    </p>
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
                    <h3 className="font-medium text-white">Booking Information</h3>
                  <p className="text-sm text-white/70 mt-1">
                    Classes can be cancelled up to 8 hours before the start time without penalty.
                      Green dots indicate available classes, red dots show unavailable classes, and a "-" mark means the class is closed for booking.
                  </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
