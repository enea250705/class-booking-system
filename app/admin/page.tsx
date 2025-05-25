"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CalendarDays, 
  Clock, 
  Bell, 
  LayoutDashboard, 
  Settings, 
  Users,
  BookOpen,
  Plus,
  AlertTriangle,
  MenuIcon,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading CrossFit data...</h3>
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
            <span className="text-primary">Class</span>Booker
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 py-8 px-4">
        <div className="space-y-1">
          <Link href="/admin" className="flex items-center rounded-lg px-3 py-2 text-white bg-white/10 transition-colors">
            <LayoutDashboard className="h-5 w-5 mr-3 text-primary" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/admin/classes" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>CrossFit Classes</span>
          </Link>
          
          <Link href="/admin/clients" className="flex items-center rounded-lg px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <Users className="h-5 w-5 mr-3 text-white/50" />
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
            <span className="text-primary">Class</span>Booker
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
            <span className="text-primary">Class</span>Booker
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
          <Link href="/admin" className="flex items-center py-2 text-white" onClick={onClose}>
            <LayoutDashboard className="h-5 w-5 mr-3 text-primary" />
            <span>Dashboard</span>
          </Link>
          
          <Link href="/admin/classes" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <CalendarDays className="h-5 w-5 mr-3 text-white/50" />
            <span>CrossFit Classes</span>
          </Link>
          
          <Link href="/admin/clients" className="flex items-center py-2 text-white/80 hover:text-white" onClick={onClose}>
            <Users className="h-5 w-5 mr-3 text-white/50" />
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

export default function AdminDashboardPage() {
  const [classes, setClasses] = useState([])
  const [clients, setClients] = useState([])
  const [newClass, setNewClass] = useState({
    name: "",
    day: "",
    time: "",
    date: "",
    capacity: 15,
    timeHour: "7",
    timeMinute: "00",
    timePeriod: "AM"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
      fetchClients();
    }
  }, [user, router])

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      setClasses(data);

      toast({
        title: "Classes loaded",
        description: `Loaded ${data.length} classes successfully`,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes. Please try again.');
      
      toast({
        title: "Error loading classes",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clients with their packages
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      
      toast({
        title: "Error loading clients",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleToggleClass = async (classId: string) => {
    try {
      // Find the class to toggle
      const classToToggle = classes.find(c => c.id === classId);
      if (!classToToggle) return;
      
      // Toggle the enabled status
      const updatedEnabled = !classToToggle.enabled;
      
      // Update the class in the database
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: updatedEnabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update class');
      }
      
      // Update local state
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, enabled: updatedEnabled } : cls
      ));
      
      toast({
        title: `Class ${updatedEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Class has been ${updatedEnabled ? 'enabled' : 'disabled'} successfully`,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error toggling class:', error);
      setErrorMessage('Failed to update class. Please try again.');
      
      toast({
        title: "Error updating class",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/remind`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      
      toast({
        title: "Reminder Sent",
        description: "The reminder has been sent successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      
      toast({
        title: "Error sending reminder",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreatingClass(true);
      setErrorMessage("");
      
      // Format the day of week from the date
      const dateObj = new Date(newClass.date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[dateObj.getDay()];
      
      // Format time properly
      const formattedTime = `${newClass.timeHour}:${newClass.timeMinute} ${newClass.timePeriod}`;
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClass.name,
          day: day,
          time: formattedTime,
          date: newClass.date,
          capacity: parseInt(newClass.capacity) || 15
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create class');
      }
      
      toast({
        title: "Class Created",
        description: "The new class has been created successfully",
        variant: "success"
      });
      
      // Refresh classes list
      fetchClasses();

    // Reset form
    setNewClass({
      name: "",
      day: "",
      time: "",
      date: "",
        capacity: 15,
        timeHour: "7",
        timeMinute: "00",
        timePeriod: "AM"
      });
    } catch (error: any) {
      console.error('Error creating class:', error);
      setErrorMessage(error.message);
      
      toast({
        title: "Error creating class",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Handle purchasing/renewing packages
  const handlePurchasePackage = async (packageType: string) => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase package');
      }
      
      toast({
        title: "Package Updated",
        description: "The membership package has been updated successfully", 
        variant: "success"
      });
      
      // Refresh data after purchase
      fetchClients();
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      setErrorMessage(error.message || 'An error occurred');
      
      toast({
        title: "Error updating package",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">CrossFit Admin Dashboard</h1>
            <p className="text-white/70 max-w-xl mx-auto">Manage CrossFit classes, clients, and system settings</p>
          </div>

          {isLoading && classes.length === 0 && clients.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
              <Tabs defaultValue="classes" className="space-y-6">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="bg-black/50 p-1 rounded-lg border border-white/10 mx-auto flex justify-center w-full max-w-md">
                    <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[100px]">
                      CrossFit Classes
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[100px]">
                      Manage Clients
                    </TabsTrigger>
                    <TabsTrigger value="add" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[100px]">
                      Add CrossFit Class
                    </TabsTrigger>
            </TabsList>
                </div>

                <TabsContent value="classes" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">CrossFit Class Schedule</h2>
                  {isLoading ? (
                    <LoadingIndicator />
                  ) : (
              <div className="grid gap-4">
                      {classes.length === 0 ? (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                              <CalendarDays className="h-8 w-8 text-white/60" />
                            </div>
                            <h3 className="font-medium text-white text-lg">No CrossFit classes found</h3>
                            <p className="text-white/70 mt-2 max-w-xs">You haven't created any CrossFit classes yet. Use the Add New Class tab to get started.</p>
                            <Button 
                              onClick={() => {
                                const element = document.querySelector('[data-state="inactive"][value="add"]') as HTMLElement;
                                if (element) element.click();
                              }}
                              className="mt-6 bg-white/20 text-white hover:bg-white/30 border border-white/10"
                            >
                              Create New CrossFit Class
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        classes.map((cls) => (
                          <Card key={cls.id} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                            <CardContent className="p-6 relative">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <h3 className="font-semibold text-white text-xl">{cls.name}</h3>
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
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                                    <span>Bookings: {cls.currentBookings} / {cls.capacity}</span>
                                    <span>Payment: Cash only</span>
                                  </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                                  <Badge variant={cls.enabled ? "outline" : "secondary"} className={cls.enabled ? "bg-primary/20 text-white border-primary/30" : "bg-muted/20 text-white/70 border-white/10"}>
                            {cls.enabled ? "Bookable" : "Not Bookable"}
                                  </Badge>
                                  <Switch 
                                    checked={cls.enabled} 
                                    onCheckedChange={() => handleToggleClass(cls.id)} 
                                    className="data-[state=checked]:bg-primary"
                                  />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                        ))
                      )}
              </div>
                  )}
            </TabsContent>

                <TabsContent value="clients" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">CrossFit Client Management</h2>
                  {isLoading ? (
                    <LoadingIndicator />
                  ) : (
              <div className="grid gap-4">
                      {clients.length === 0 ? (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                              <Users className="h-8 w-8 text-white/60" />
                            </div>
                            <h3 className="font-medium text-white text-lg">No CrossFit clients found</h3>
                            <p className="text-white/70 mt-2 max-w-xs">You don't have any registered CrossFit clients yet.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        clients.map((client) => (
                          <Card key={client.id} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                            <CardContent className="p-6 relative">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-10 w-10">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name?.charAt(0) || 'C'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                                      <p className="text-sm text-white/70">{client.email}</p>
                                    </div>
                                  </div>
                                  
                                  {client.package ? (
                                    <div className="mt-3 bg-primary/10 rounded-lg p-3 border border-primary/20">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                                          {client.package.name}
                                        </Badge>
                                        <span className="text-sm text-white/70">
                                          {client.package.daysRemaining} days left
                                        </span>
                                      </div>
                        <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-white/70">Classes Remaining</span>
                                          <span className="font-medium text-white">{client.package.classesRemaining} / {client.package.totalClasses}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                                            style={{ width: `${(client.package.classesRemaining / client.package.totalClasses) * 100}%` }}
                                          ></div>
                                        </div>
                          </div>
                        </div>
                                  ) : (
                                    <div className="mt-3 bg-amber-900/30 backdrop-blur-md rounded-lg p-3 border border-amber-500/30">
                                      <Badge variant="outline" className="bg-amber-500/20 text-white border-amber-500/30">
                                        No Active Package
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end mt-4 sm:mt-0">
                                  {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => handleSendReminder(client.id)}
                                      className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 flex items-center gap-2 whitespace-nowrap"
                          >
                            <Bell className="h-4 w-4" />
                            Send Reminder
                          </Button>
                        )}
                                </div>
                      </div>
                    </CardContent>
                  </Card>
                        ))
                      )}
              </div>
                  )}
            </TabsContent>

                <TabsContent value="add" className="animate-in">
                  <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-white/10 bg-black/30">
                      <CardTitle className="text-xl text-white">Add New CrossFit Class</CardTitle>
                      <CardDescription className="text-white/70">Create a new CrossFit class that clients can book</CardDescription>
                </CardHeader>
                <form onSubmit={handleAddClass}>
                      <CardContent className="space-y-6 p-6">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm text-white">Class Name</Label>
                      <Input
                        id="name"
                              placeholder="e.g. Morning CrossFit"
                        value={newClass.name}
                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="date" className="text-sm text-white">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newClass.date}
                        onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
                                className="h-10 bg-white/10 border-white/20 text-white"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="time" className="text-sm text-white">Time</Label>
                              <div className="flex space-x-2">
                                <select 
                                  id="time-hour"
                                  className="h-10 w-1/3 rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
                                  value={newClass.timeHour || "7"}
                                  onChange={(e) => {
                                    const hour = e.target.value;
                                    setNewClass({
                                      ...newClass,
                                      timeHour: hour,
                                      time: `${hour}:${newClass.timeMinute} ${newClass.timePeriod}`
                                    });
                                  }}
                                >
                                  {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                                    <option key={hour} value={hour}>{hour}</option>
                                  ))}
                                </select>
                                <span className="flex items-center text-white">:</span>
                                <select 
                                  id="time-minute"
                                  className="h-10 w-1/3 rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
                                  value={newClass.timeMinute || "00"}
                                  onChange={(e) => {
                                    const minute = e.target.value;
                                    setNewClass({
                                      ...newClass,
                                      timeMinute: minute,
                                      time: `${newClass.timeHour}:${minute} ${newClass.timePeriod}`
                                    });
                                  }}
                                >
                                  {["00", "15", "30", "45"].map(minute => (
                                    <option key={minute} value={minute}>{minute}</option>
                                  ))}
                                </select>
                                <select 
                                  id="time-period"
                                  className="h-10 w-1/3 rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
                                  value={newClass.timePeriod || "AM"}
                                  onChange={(e) => {
                                    const period = e.target.value;
                                    setNewClass({
                                      ...newClass,
                                      timePeriod: period,
                                      time: `${newClass.timeHour}:${newClass.timeMinute} ${period}`
                                    });
                                  }}
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="capacity" className="text-sm text-white">Capacity</Label>
                            <Input
                              id="capacity"
                              type="number"
                              min="1"
                              value={newClass.capacity}
                              onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                              className="h-10 bg-white/10 border-white/20 text-white"
                        required
                      />
                    </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm text-white">Payment Method</Label>
                            <div className="p-3 bg-white/10 rounded-md text-sm text-white/70 border border-white/10">
                              All CrossFit classes require cash payment at the studio.
                            </div>
                          </div>
                        </div>
                        
                        {errorMessage && (
                          <Alert className="bg-red-900/70 backdrop-blur-md border border-red-500/30 text-white animate-in">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                          </Alert>
                        )}
                  </CardContent>
                      <CardFooter className="bg-black/20 border-t border-white/10 p-6">
                        <Button 
                          type="submit" 
                          disabled={isCreatingClass}
                          className="w-full bg-white text-black hover:bg-white/90 disabled:bg-white/50"
                        >
                          {isCreatingClass ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full border-2 border-black/20 border-r-transparent animate-spin"></div>
                              Creating CrossFit Class...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                      Add CrossFit Class
                            </span>
                          )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
          )}
      </main>
    </div>
    </>
  );
}
