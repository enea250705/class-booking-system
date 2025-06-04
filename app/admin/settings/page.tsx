"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Save, 
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
  MenuIcon,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock4,
  RefreshCw
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import { AdminSidebar, MobileHeader, MobileMenu } from "../components/AdminLayout"

// Define LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading data...</h3>
    </div>
  </div>
);

export default function AdminSettingsPage() {
  const router = useRouter()
  const { isLoading, user } = useAuth()
  const { toast } = useToast()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  
  const [generalSettings, setGeneralSettings] = useState({
    studioName: "GymXam",
    email: "info@gymxam.com",
    phone: "+1 (555) 123-4567",
    address: "123 Fitness Ave, New York, NY 10001",
    cancelHours: "8",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    sendBookingConfirmations: true,
    sendCancellationNotifications: true,
    sendRenewalReminders: true,
    reminderDays: "7",
    allowClientEmails: false,
  })

  const [packageSettings, setPackageSettings] = useState({
    package8Price: "120",
    package12Price: "160",
    packageDuration: "30",
    allowAutoRenewal: false,
  })

  // Load settings from API on component mount
  useEffect(() => {
    if (user && user.role === "admin") {
      loadSettings()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const response = await fetch('/api/admin/settings')
      
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setGeneralSettings(prev => ({ ...prev, ...data.settings.general }))
          setNotificationSettings(prev => ({ ...prev, ...data.settings.notifications }))
          setPackageSettings(prev => ({ ...prev, ...data.settings.packages }))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'general',
          settings: generalSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Your general settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save general settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateAllClassCapacities = async () => {
    try {
      const response = await fetch('/api/admin/update-class-capacities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Classes Updated",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Failed to update class capacities');
      }
    } catch (error) {
      console.error('Error updating class capacities:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'notifications',
          settings: notificationSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Your notification settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePackageSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'packages',
          settings: packageSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Package settings updated",
          description: "Package prices and settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save package settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingIndicator />
  }

  if (!user) {
    router.push("/login")
    return <LoadingIndicator />
  }

  if (user.role !== "admin") {
    router.push("/dashboard")
    return <LoadingIndicator />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background image with overlay */}
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
      <AdminSidebar user={user} />
      
      {/* Mobile header */}
      <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="mt-1 text-muted-foreground text-white/60">
              Manage your studio settings and preferences.
            </p>
          </div>

          {isLoadingSettings ? (
            <LoadingIndicator />
          ) : (
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="bg-black/40 backdrop-blur-sm border border-white/10 p-1">
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="general"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="notifications"
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="packages"
                >
                  Packages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Studio Information</CardTitle>
                    <CardDescription className="text-white/60">
                      Update your studio details and business information
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveGeneralSettings}>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="studioName" className="text-white/80">Studio Name</Label>
                        <Input
                          id="studioName"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          value={generalSettings.studioName}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, studioName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email" className="text-white/80">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary/80" />
                              Email
                            </div>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            value={generalSettings.email}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="text-white/80">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary/80" />
                              Phone
                            </div>
                          </Label>
                          <Input
                            id="phone"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            value={generalSettings.phone}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 mt-2">
                        <Label htmlFor="address" className="text-white/80">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary/80" />
                            Address
                          </div>
                        </Label>
                        <Input
                          id="address"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          value={generalSettings.address}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="cancelHours" className="text-white/80">
                          <div className="flex items-center gap-2">
                            <Clock4 className="h-4 w-4 text-primary/80" />
                            Cancellation Policy (Hours before class)
                          </div>
                        </Label>
                        <Select
                          value={generalSettings.cancelHours}
                          onValueChange={(value) =>
                            setGeneralSettings({ ...generalSettings, cancelHours: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select hours" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                            <SelectItem value="12">12 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Notification Preferences</CardTitle>
                    <CardDescription className="text-white/60">
                      Configure how and when to send notifications to clients
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveNotificationSettings}>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <Check className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="bookingConfirmations" className="text-white flex text-base font-medium">
                                Booking confirmations
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send emails when clients book classes</p>
                            </div>
                          </div>
                          <Switch
                            id="bookingConfirmations"
                            checked={notificationSettings.sendBookingConfirmations}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendBookingConfirmations: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <X className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="cancellationNotifications" className="text-white flex text-base font-medium">
                                Cancellation notifications
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send emails when clients cancel their bookings</p>
                            </div>
                          </div>
                          <Switch
                            id="cancellationNotifications"
                            checked={notificationSettings.sendCancellationNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendCancellationNotifications: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <AlertTriangle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="renewalReminders" className="text-white flex text-base font-medium">
                                Package renewal reminders
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send reminders when packages are about to expire</p>
                            </div>
                          </div>
                          <Switch
                            id="renewalReminders"
                            checked={notificationSettings.sendRenewalReminders}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendRenewalReminders: checked })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 pt-2 border-t border-white/10">
                        <Label htmlFor="reminderDays" className="text-white/80">Days before expiration to send reminder</Label>
                        <Select
                          value={notificationSettings.reminderDays}
                          onValueChange={(value) =>
                            setNotificationSettings({ ...notificationSettings, reminderDays: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="10">10 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <Label htmlFor="clientEmails" className="text-white flex text-base font-medium">
                            Marketing emails
                          </Label>
                          <p className="text-sm text-white/60 mt-0.5">Allow clients to receive marketing and promotional emails</p>
                        </div>
                        <Switch
                          id="clientEmails"
                          checked={notificationSettings.allowClientEmails}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, allowClientEmails: checked })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="packages">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Package Settings</CardTitle>
                    <CardDescription className="text-white/60">
                      Configure class packages and payment options
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSavePackageSettings}>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <div className="font-medium mb-2 text-white flex items-center">
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 mr-2">Plan A</Badge>
                            8 Classes Package
                          </div>
                          <div className="grid gap-2 mt-3">
                            <Label htmlFor="package8Price" className="text-white/80">Cash Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">€</span>
                              <Input
                                id="package8Price"
                                type="number"
                                min="1"
                                className="bg-white/5 border-white/10 text-white pl-7"
                                value={packageSettings.package8Price}
                                onChange={(e) => setPackageSettings({ ...packageSettings, package8Price: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <div className="font-medium mb-2 text-white flex items-center">
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 mr-2">Plan B</Badge>
                            12 Classes Package
                          </div>
                          <div className="grid gap-2 mt-3">
                            <Label htmlFor="package12Price" className="text-white/80">Cash Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">€</span>
                              <Input
                                id="package12Price"
                                type="number"
                                min="1"
                                className="bg-white/5 border-white/10 text-white pl-7"
                                value={packageSettings.package12Price}
                                onChange={(e) => setPackageSettings({ ...packageSettings, package12Price: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 p-4 rounded-lg border border-white/10 bg-white/5 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <Label htmlFor="packageDuration" className="text-white/90 text-base font-medium">Package Duration</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            id="packageDuration"
                            type="number"
                            min="1"
                            max="90"
                            className="bg-white/5 border-white/10 text-white max-w-[120px]"
                            value={packageSettings.packageDuration}
                            onChange={(e) => setPackageSettings({ ...packageSettings, packageDuration: e.target.value })}
                          />
                          <span className="text-white/80">days</span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">All packages expire after this number of days</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <Label htmlFor="autoRenewal" className="text-white flex text-base font-medium">
                            Automatic package renewal
                          </Label>
                          <p className="text-sm text-white/60 mt-0.5">Allow clients to automatically renew their packages</p>
                        </div>
                        <Switch
                          id="autoRenewal"
                          checked={packageSettings.allowAutoRenewal}
                          onCheckedChange={(checked) =>
                            setPackageSettings({ ...packageSettings, allowAutoRenewal: checked })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Package Settings
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  )
}
