"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  CalendarDays, 
  Clock, 
  AlertTriangle,
  LayoutDashboard, 
  Settings, 
  Users,
  Search,
  Check,
  X,
  Filter,
  ArrowUpDown,
  MenuIcon,
  Mail,
  Tag,
  Calendar,
  User
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Mock data for demonstration
const mockClients = [
  {
    id: 1,
    name: "Jane Smith",
    email: "jane@example.com",
    package: {
      name: "Plan A: 8 Classes / Month",
    classesRemaining: 5,
      totalClasses: 8,
      daysRemaining: 18
    },
    joinDate: "January 15, 2023",
    nextClass: "Yoga Flow - Tomorrow, 8:00 AM",
    status: "active",
    totalBookings: 27
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@example.com",
    package: {
      name: "Plan B: 12 Classes / Month",
    classesRemaining: 8,
      totalClasses: 12,
      daysRemaining: 22
    },
    joinDate: "February 3, 2023",
    nextClass: "HIIT Training - Today, 6:00 PM",
    status: "active",
    totalBookings: 42
  },
  {
    id: 3,
    name: "Alice Johnson",
    email: "alice@example.com",
    package: {
      name: "Plan A: 8 Classes / Month",
    classesRemaining: 2,
      totalClasses: 8,
      daysRemaining: 5
    },
    joinDate: "December 10, 2022",
    nextClass: "Morning Yoga - In 2 days, 7:00 AM",
    status: "warning",
    totalBookings: 63
  },
  {
    id: 4,
    name: "Bob Williams",
    email: "bob@example.com",
    package: {
      name: "Plan B: 12 Classes / Month",
    classesRemaining: 10,
      totalClasses: 12,
      daysRemaining: 25
    },
    joinDate: "March 5, 2023",
    nextClass: null,
    status: "active",
    totalBookings: 18
  },
  {
    id: 5,
    name: "Carol Brown",
    email: "carol@example.com",
    package: null,
    joinDate: "November 20, 2022",
    nextClass: null,
    status: "expired",
    totalBookings: 24
  },
  {
    id: 6,
    name: "Dave Miller",
    email: "dave@example.com",
    package: {
      name: "Plan C: Unlimited / Month",
      classesRemaining: null,
      totalClasses: null,
      daysRemaining: 14
    },
    joinDate: "April 15, 2023",
    nextClass: "Boxing - In 3 days, 6:00 PM",
    status: "active",
    totalBookings: 34
  },
]

// Define LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading data...</h3>
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
          <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
            Admin
          </Badge>
          <Avatar className="border-2 border-white/20 h-9 w-9">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
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
              <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-sm text-white/60">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-6">
          <Link href="/admin" className="flex items-center py-3 text-white/80 hover:text-white" onClick={onClose}>
            <LayoutDashboard className="h-5 w-5 mr-3 text-white/50" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/admin/classes" className="flex items-center py-3 text-white/80 hover:text-white" onClick={onClose}>
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>Classes</span>
          </Link>
          
          <Link href="/admin/clients" className="flex items-center py-3 text-white" onClick={onClose}>
            <Users className="h-5 w-5 mr-3 text-primary" />
            <span>Clients</span>
          </Link>
        </nav>
        
        <div className="absolute bottom-8 left-0 w-full px-6">
          <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [clientForReminder, setClientForReminder] = useState(null)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState("cards")
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Background image selection for better visual appeal
  const bgImage = "/images/gymxam4.webp" // Use a high-quality background

  // Handle auth redirects with useEffect
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/dashboard");
    } else if (user && user.role === "admin") {
      // Load data
      fetchClients();
    }
  }, [user, router])
  
  // Mock data fetch function, would be an API call in a real app
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from the API
      setClients(mockClients);
      setFilteredClients(mockClients);
      
      toast({
        title: "Clients loaded",
        description: `Loaded ${mockClients.length} clients successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      setErrorMessage('Failed to load clients. Please try again.');
      
      toast({
        title: "Error loading clients",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let results = [...clients];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter === "active") {
      results = results.filter(client => client.status === "active");
    } else if (selectedFilter === "warning") {
      results = results.filter(client => client.status === "warning");
    } else if (selectedFilter === "expired") {
      results = results.filter(client => client.status === "expired");
    } else if (selectedFilter === "nopackage") {
      results = results.filter(client => !client.package);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortKey === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortKey === "joinDate") {
        return sortOrder === "asc" 
          ? new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
          : new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      } else if (sortKey === "bookings") {
        return sortOrder === "asc" 
          ? a.totalBookings - b.totalBookings
          : b.totalBookings - a.totalBookings;
      }
      return 0;
    });
    
    setFilteredClients(results);
  }, [clients, searchTerm, selectedFilter, sortKey, sortOrder]);

  const handleSendReminder = async (clientId) => {
    try {
      setIsSendingReminder(true);
      
      // In a real app, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 800)); // simulate API call
      
      toast({
        title: "Reminder Sent",
        description: "The client has been notified about their membership",
        variant: "success"
      });
      
      setIsReminderDialogOpen(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      
      toast({
        title: "Error sending reminder",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <LoadingIndicator />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">You don't have permission to access the admin area</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        {/* Optimized background image with next/image */}
        <div className="fixed inset-0 -z-10">
          <Image 
            src={bgImage}
            alt="Admin dashboard background"
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
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Page header */}
          <div className="text-center mb-12 animate-in">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">Client Management</h1>
            <p className="text-white/70 max-w-xl mx-auto">View and manage client information, memberships and activity</p>
          </div>

          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
              {/* Search and filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative sm:col-span-2">
              <Input
                    type="text"
                    placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/30 border-white/10 text-white pl-10 h-11"
              />
                  <Search className="absolute left-3 top-3 h-5 w-5 text-white/50" />
            </div>
                
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="active">Active Members</SelectItem>
                    <SelectItem value="warning">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired Memberships</SelectItem>
                    <SelectItem value="nopackage">No Active Package</SelectItem>
                  </SelectContent>
                </Select>
          </div>

              {/* View mode toggle */}
              <div className="flex justify-end">
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                  <TabsList className="bg-black/50 border border-white/10 grid w-[200px] grid-cols-2">
                    <TabsTrigger value="cards" className="data-[state=active]:bg-white data-[state=active]:text-black">
                      Card View
                    </TabsTrigger>
                    <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:text-black">
                      Table View
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Clients list with view modes */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/10 bg-black/30">
                  <CardTitle className="text-xl text-white">Client List</CardTitle>
                  <CardDescription className="text-white/70">
                    {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} {searchTerm ? "matching search" : "total"}
                  </CardDescription>
                </CardHeader>
                
                {viewMode === "cards" ? (
                  <div className="p-6">
            {filteredClients.length === 0 ? (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-white/60" />
                        </div>
                        <h3 className="font-medium text-white text-lg">No clients found</h3>
                        <p className="text-white/70 mt-2 max-w-xs mx-auto">
                          {searchTerm ? 
                            `No clients match "${searchTerm}". Try a different search term.` : 
                            'No clients match the selected filters.'}
                        </p>
                        {searchTerm && (
                          <Button 
                            variant="outline" 
                            onClick={() => setSearchTerm("")} 
                            className="mt-4 bg-transparent border border-white/20 text-white hover:bg-white/10"
                          >
                            Clear Search
                          </Button>
                        )}
              </div>
            ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredClients.map((client) => (
                          <Card key={client.id} className="bg-black/30 border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                            <CardContent className="p-6 relative">
                              <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-12 w-12">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                                      <h3 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{client.name}</h3>
                                      <div className="flex items-center text-white/70">
                                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                                        <span className="text-sm">{client.email}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-white/70">
                                    <div className="flex items-center">
                                      <Calendar className="mr-1.5 h-4 w-4" />
                                      <span>Joined {client.joinDate}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Tag className="mr-1.5 h-4 w-4" />
                                      <span>{client.totalBookings} bookings</span>
                                    </div>
                                  </div>
                                  
                                  {client.nextClass && (
                                    <div className="flex items-start gap-1.5 text-sm">
                                      <Clock className="h-4 w-4 mt-0.5 text-white/70" />
                                      <div>
                                        <span className="text-white/70">Next class: </span>
                                        <span className="text-white">{client.nextClass}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {client.package ? (
                                    <div className="mt-3 bg-primary/10 rounded-lg p-3 border border-primary/20">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            client.status === "warning" 
                                              ? "bg-yellow-500/20 text-white border-yellow-500/30"
                                              : client.status === "expired"
                                                ? "bg-red-500/20 text-white border-red-500/30"
                                                : "bg-primary/20 text-white border-primary/30"
                                          }
                                        >
                                          {client.package.name}
                                        </Badge>
                                        <span className="text-sm text-white/70">
                                          {client.package.daysRemaining > 0
                                            ? `${client.package.daysRemaining} days left`
                                            : "Expired"
                                          }
                                        </span>
                                      </div>
                                      
                                      {client.package.totalClasses && (
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/70">Classes Remaining</span>
                                            <span className="font-medium text-white">
                                              {client.package.classesRemaining} / {client.package.totalClasses}
                                            </span>
                                          </div>
                                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                                client.status === "warning" 
                                                  ? "bg-yellow-500/80"
                                                  : client.status === "expired"
                                                    ? "bg-red-500/50"
                                                    : "bg-primary/80"
                                              }`}
                                              style={{ 
                                                width: `${client.package.classesRemaining / client.package.totalClasses * 100}%`
                                              }}
                                            ></div>
                          </div>
                        </div>
                                      )}
                                      
                                      {!client.package.totalClasses && (
                                        <div>
                                          <span className="text-xs text-white/70">Unlimited classes until expiration</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-3 bg-amber-900/30 backdrop-blur-md rounded-lg p-3 border border-amber-500/30">
                                      <Badge variant="outline" className="bg-amber-500/20 text-white border-amber-500/30">
                                        No Active Package
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end gap-3">
                                  {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setClientForReminder(client);
                                              setIsReminderDialogOpen(true);
                                            }}
                                            className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 flex items-center gap-2"
                                          >
                                            <Bell className="h-4 w-4" />
                                            Remind
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Send reminder about expiring membership</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="bg-transparent text-white hover:bg-white/10"
                                  >
                                    View Details
                                  </Button>
                                </div>
                        </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    {filteredClients.length === 0 ? (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-white/60" />
                        </div>
                        <h3 className="font-medium text-white text-lg">No clients found</h3>
                        <p className="text-white/70 mt-2 max-w-xs mx-auto">
                          {searchTerm ? 
                            `No clients match "${searchTerm}". Try a different search term.` : 
                            'No clients match the selected filters.'}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")} 
                            className="mt-4 bg-transparent border border-white/20 text-white hover:bg-white/10"
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-white">
                          <thead className="bg-black/40 border-b border-white/10">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">
                                <button 
                                  onClick={() => handleSort("name")}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Client Name
                                  <ArrowUpDown className="h-3 w-3" />
                                </button>
                              </th>
                              <th className="text-left py-3 px-4 font-medium">Email</th>
                              <th className="text-left py-3 px-4 font-medium">Membership</th>
                              <th className="text-left py-3 px-4 font-medium">
                                <button 
                                  onClick={() => handleSort("joinDate")}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Join Date
                                  <ArrowUpDown className="h-3 w-3" />
                                </button>
                              </th>
                              <th className="text-left py-3 px-4 font-medium">
                                <button 
                                  onClick={() => handleSort("bookings")}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Bookings
                                  <ArrowUpDown className="h-3 w-3" />
                                </button>
                              </th>
                              <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map((client) => (
                              <tr key={client.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-8 w-8">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{client.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-white/80">{client.email}</td>
                                <td className="py-3 px-4">
                                  {client.package ? (
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        client.status === "warning" 
                                          ? "bg-yellow-500/20 text-white border-yellow-500/30"
                                          : client.status === "expired"
                                            ? "bg-red-500/20 text-white border-red-500/30"
                                            : "bg-primary/20 text-white border-primary/30"
                                      }
                                    >
                                      {client.package.name.split(":")[0]}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-500/20 text-white border-amber-500/30">
                                      No Package
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-white/80">{client.joinDate}</td>
                                <td className="py-3 px-4 text-white/80">{client.totalBookings}</td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setClientForReminder(client);
                                                setIsReminderDialogOpen(true);
                                              }}
                                              className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 h-8 px-2"
                                            >
                                              <Bell className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Send reminder about expiring membership</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="bg-transparent text-white hover:bg-white/10 h-8"
                                    >
                                      View
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
      
      {/* Reminder dialog for client reminders */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Send Membership Reminder</DialogTitle>
            <DialogDescription className="text-white/70">
              Send a reminder email about the client's membership expiration
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {clientForReminder && (
              <div className="p-4 border border-white/10 rounded-md bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="border-2 border-white/20 h-10 w-10">
                    <AvatarFallback className="bg-primary/30 text-white">{clientForReminder.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-white">{clientForReminder.name}</h4>
                    <p className="text-sm text-white/70">{clientForReminder.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Membership:</span>
                    <span className="text-white">{clientForReminder.package.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Expires in:</span>
                    <span className="text-white">{clientForReminder.package.daysRemaining} days</span>
                  </div>
                  {clientForReminder.package.totalClasses && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Classes Remaining:</span>
                      <span className="text-white">
                        {clientForReminder.package.classesRemaining} / {clientForReminder.package.totalClasses}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsReminderDialogOpen(false)}
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => clientForReminder && handleSendReminder(clientForReminder.id)}
              disabled={isSendingReminder}
              className="bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50"
            >
              {isSendingReminder ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-r-transparent animate-spin"></div>
                  Sending...
                </span>
              ) : (
                "Send Reminder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
