"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle,
  LayoutDashboard, 
  Settings, 
  Users,
  Plus,
  Search,
  Check,
  X,
  Filter,
  ArrowUpDown,
  MenuIcon,
  Trash2
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
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
import { AdminSidebar, MobileHeader, MobileMenu } from "../components/AdminLayout"

// Remove the mock data and add a proper interface
interface ClassItem {
  id: string;
  name: string;
  day: string;
  date: string;
  time: string;
  enabled: boolean;
  capacity: number;
  currentBookings: number;
}

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading data...</h3>
    </div>
  </div>
);

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState("date")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingClass, setIsDeletingClass] = useState(false)
  const [classToDelete, setClassToDelete] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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
      fetchClasses();
    }
  }, [user, router])
  
  // Fetch real data from API
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      
      // Fetch classes from the API
      const response = await fetch('/api/classes');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(data);
      setFilteredClasses(data);
      
      toast({
        title: "Classes loaded",
        description: `Loaded ${data.length} classes successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes. Please try again.');
      
      toast({
        title: "Error loading classes",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let results = [...classes];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.day.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter === "active") {
      results = results.filter(cls => cls.enabled);
    } else if (selectedFilter === "inactive") {
      results = results.filter(cls => !cls.enabled);
    } else if (selectedFilter === "full") {
      results = results.filter(cls => cls.currentBookings >= cls.capacity);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortKey === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortKey === "date") {
        return sortOrder === "asc" 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortKey === "capacity") {
        return sortOrder === "asc" 
          ? a.capacity - b.capacity
          : b.capacity - a.capacity;
      } else if (sortKey === "bookings") {
        return sortOrder === "asc" 
          ? a.currentBookings - b.currentBookings
          : b.currentBookings - a.currentBookings;
      }
      return 0;
    });
    
    setFilteredClasses(results);
  }, [classes, searchTerm, selectedFilter, sortKey, sortOrder]);

  const handleToggleClass = async (classId: string) => {
    try {
      // Find the class to toggle
      const classToToggle = classes.find(c => c.id === classId);
      if (!classToToggle) return;
      
      // Toggle the enabled status
      const updatedEnabled = !classToToggle.enabled;
      
      // Call API to update class
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: updatedEnabled }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update local state after successful API call
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, enabled: updatedEnabled } : cls
      ));
      
      toast({
        title: `Class ${updatedEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Class has been ${updatedEnabled ? 'enabled' : 'disabled'} successfully`,
        variant: "success"
      });
    } catch (error: unknown) {
      console.error('Error toggling class:', error);
      setErrorMessage('Failed to update class. Please try again.');
      
      toast({
        title: "Error updating class",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      setIsDeletingClass(true);
      
      // Call API to delete class
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update local state after successful API call
      setClasses(classes.filter(cls => cls.id !== classId));
      
      toast({
        title: "Class Deleted",
        description: "The class has been deleted successfully",
        variant: "success"
      });
      
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (error: unknown) {
      console.error('Error deleting class:', error);
      
      toast({
        title: "Error deleting class",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
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
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">Class Management</h1>
            <p className="text-white/70 max-w-xl mx-auto">Create, manage, and track fitness classes for your clients</p>
          </div>

          {/* Add this near the top of the page content, after the page header */}
          <div className="flex justify-center gap-3 mb-6">
            <Button
              onClick={fetchClasses}
              variant="outline"
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Refresh Classes
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/classes?t=' + new Date().getTime(), {
                    headers: {
                      'Cache-Control': 'no-cache'
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch debug data');
                  }
                  
                  const data = await response.json();
                  console.log('Class debug data:', data);
                  
                  toast({
                    title: "Debug Class Data",
                    description: `Found ${data.length} classes in database`,
                    variant: "default"
                  });
                  
                  // Refresh classes
                  fetchClasses();
                } catch (error) {
                  console.error('Error fetching class debug data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to fetch class debug data",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Debug Classes
            </Button>
          </div>

          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
              {/* Search and filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                      <Input
                    type="text"
                    placeholder="Search by class name or day..."
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
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                    <SelectItem value="full">Fully Booked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
              
              {/* Classes list with tabs */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/10 bg-black/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xl text-white">Class Schedule</CardTitle>
                  </div>
                </CardHeader>
                <Tabs defaultValue="grid" className="w-full">
                  <div className="px-6 pt-4 border-b border-white/10">
                    <TabsList className="bg-black/50 border border-white/10 grid w-52 grid-cols-2">
                      <TabsTrigger value="grid" className="data-[state=active]:bg-white data-[state=active]:text-black">
                        Grid View
                      </TabsTrigger>
                      <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:text-black">
                        Table View
                      </TabsTrigger>
                    </TabsList>
          </div>

                  <TabsContent value="grid" className="mt-0">
                    <div className="p-6">
                      {filteredClasses.length === 0 ? (
                        <div className="text-center p-10">
                          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                            <CalendarDays className="h-8 w-8 text-white/60" />
                          </div>
                          <h3 className="font-medium text-white text-lg">No classes found</h3>
                          <p className="text-white/70 mt-2 max-w-xs mx-auto">
                            {searchTerm ? 
                              `No classes match "${searchTerm}". Try a different search term.` : 
                              'No classes match the selected filters.'}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredClasses.map((cls) => (
                            <Card key={cls.id} className="bg-black/30 border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                              <Link href={`/admin/classes/${cls.id}`}>
                              <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <h3 className="font-semibold text-white text-xl group-hover:text-primary transition-colors">{cls.name}</h3>
                                      <Badge className={`ml-3 ${cls.enabled ? 'bg-primary/30 text-white' : 'bg-neutral-800 text-white/70'}`}>
                                        {cls.enabled ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-white/70">
                                      <div className="flex items-center">
                                        <CalendarDays className="mr-1.5 h-4 w-4" />
                                        <span>{new Date(cls.date).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="mr-1.5 h-4 w-4" />
                        <span>{cls.time}</span>
                      </div>
                                    </div>
                                    <div className="flex items-center text-sm text-white/60">
                                      <span>Bookings: {cls.currentBookings} / {cls.capacity}</span>
                                      <span className="ml-4">Cash payment</span>
                                    </div>
                                    <div className="mt-2">
                                      <div className="text-xs text-white/60 mb-1">Capacity</div>
                                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                                            cls.currentBookings >= cls.capacity 
                                              ? 'bg-red-500/80' 
                                              : cls.currentBookings / cls.capacity > 0.7 
                                                ? 'bg-yellow-500/80' 
                                                : 'bg-primary/80'
                                          }`}
                                          style={{ width: `${Math.min(100, (cls.currentBookings / cls.capacity) * 100)}%` }}
                                        ></div>
                                      </div>
                      </div>
                    </div>
                                  </div>
                                </CardContent>
                              </Link>
                              <div className="p-4 pt-0 flex justify-end space-x-2 border-t border-white/10 mt-2">
                                      <Switch 
                                        checked={cls.enabled} 
                                        onCheckedChange={() => handleToggleClass(cls.id)} 
                                        className="data-[state=checked]:bg-primary"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setClassToDelete(cls);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                        className="text-white/50 hover:text-white hover:bg-red-500/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
              </Card>
            ))}
          </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="table" className="mt-0">
                    <div className="p-6">
                      {filteredClasses.length === 0 ? (
                        <div className="text-center p-10">
                          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                            <CalendarDays className="h-8 w-8 text-white/60" />
                          </div>
                          <h3 className="font-medium text-white text-lg">No classes found</h3>
                          <p className="text-white/70 mt-2 max-w-xs mx-auto">
                            {searchTerm ? 
                              `No classes match "${searchTerm}". Try a different search term.` : 
                              'No classes match the selected filters.'}
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
                                    Class Name
                                    <ArrowUpDown className="h-3 w-3" />
                                  </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                  <button 
                                    onClick={() => handleSort("date")}
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                  >
                                    Date
                                    <ArrowUpDown className="h-3 w-3" />
                                  </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium">Time</th>
                                <th className="text-left py-3 px-4 font-medium">
                                  <button 
                                    onClick={() => handleSort("bookings")}
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                  >
                                    Bookings
                                    <ArrowUpDown className="h-3 w-3" />
                                  </button>
                                </th>
                                <th className="text-left py-3 px-4 font-medium">Status</th>
                                <th className="text-right py-3 px-4 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredClasses.map((cls) => (
                                <tr key={cls.id} className="border-b border-white/5 hover:bg-white/5">
                                  <td className="py-3 px-4">{cls.name}</td>
                                  <td className="py-3 px-4">{new Date(cls.date).toLocaleDateString()}</td>
                                  <td className="py-3 px-4">{cls.time}</td>
                                  <td className="py-3 px-4">
                                    <span 
                                      className={`inline-flex items-center ${
                                        cls.currentBookings >= cls.capacity 
                                        ? 'text-red-400' 
                                        : cls.currentBookings / cls.capacity > 0.7 
                                        ? 'text-yellow-400' 
                                        : 'text-green-400'
                                      }`}
                                    >
                                      {cls.currentBookings} / {cls.capacity}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge className={cls.enabled ? 'bg-primary/30' : 'bg-neutral-800 text-white/70'}>
                                      {cls.enabled ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Switch 
                                        checked={cls.enabled} 
                                        onCheckedChange={() => handleToggleClass(cls.id)} 
                                        className="data-[state=checked]:bg-primary"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setClassToDelete(cls);
                                          setIsDeleteDialogOpen(true);
                                        }}
                                        className="text-white/50 hover:text-white hover:bg-red-500/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                  </TabsContent>
                </Tabs>
              </Card>
        </div>
          )}
      </main>
    </div>
      
      {/* Confirmation dialog for deleting class */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Class</DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {classToDelete && (
              <div className="p-4 border border-white/10 rounded-md bg-white/5">
                <h4 className="font-medium text-white">{classToDelete.name}</h4>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2 text-sm text-white/70">
                  <div className="flex items-center">
                    <CalendarDays className="mr-1.5 h-4 w-4" />
                    <span>{new Date(classToDelete.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1.5 h-4 w-4" />
                    <span>{classToDelete.time}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => classToDelete && handleDeleteClass(classToDelete.id)}
              disabled={isDeletingClass}
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50"
            >
              {isDeletingClass ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-r-transparent animate-spin"></div>
                  Deleting...
                </span>
              ) : (
                "Delete Class"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
