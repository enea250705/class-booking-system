"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth"
import ErrorBoundary from "@/components/error-boundary"
import { useToast } from "@/components/ui/use-toast"

// Define interface for class preview
interface ClassPreview {
  id: string;
  name: string;
  day: string;
  time: string;
  date: string | Date;
  spotsAvailable: number;
  paymentMethod: string;
}

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [packageType, setPackageType] = useState("8classes")
  const [upcomingClasses, setUpcomingClasses] = useState<ClassPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingClasses, setIsFetchingClasses] = useState(true)
  const [activeTab, setActiveTab] = useState("login")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, error } = useAuth()
  const { toast } = useToast()
  
  // Select dynamic background image
  const bgImage = "/images/gymxam6.webp"

  // Check for tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'register') {
      setActiveTab('register')
    }
  }, [searchParams])

  // Fetch upcoming classes for the preview section
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsFetchingClasses(true)
        const response = await fetch('/api/classes/preview')
        
        if (response.ok) {
          const data = await response.json()
          // Filter to only include CrossFit classes
          const crossfitClasses = data.filter((cls: ClassPreview) => 
            cls.name.toLowerCase().includes('crossfit') || 
            cls.name.toLowerCase().includes('wod') ||
            cls.name.toLowerCase().includes('amrap') ||
            cls.name.toLowerCase().includes('emom')
          )
          
          setUpcomingClasses(crossfitClasses.slice(0, 4))
        } else {
          console.error('Error fetching classes: API returned status', response.status)
          setUpcomingClasses([])
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
        setUpcomingClasses([])
      } finally {
        setIsFetchingClasses(false)
      }
    }
    
    fetchClasses()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await login(loginEmail, loginPassword)
      toast({
        variant: "success",
        title: "Login successful",
        description: "Welcome back to GymXam!"
      })
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await register(registerName, registerEmail, registerPassword, packageType)
      toast({
        variant: "success",
        title: "Registration successful",
        description: "Your account has been created. Welcome to GymXam!"
      })
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen flex flex-col">
        {/* Optimized background image with proper priority and lazy loading */}
        <div className="fixed inset-0 -z-10">
          <Image
            src={bgImage}
            alt="Fitness studio background"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        </div>

        {/* Header with logo */}
        <header className="container max-w-7xl mx-auto py-6 px-4 relative z-10">
          <Link href="/" className="inline-flex items-center">
            <span className="font-montserrat text-2xl font-bold text-white">
              <span className="text-primary">Gym</span>Xam
            </span>
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 container max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 px-4 py-6 lg:py-16 relative z-10">
          {/* Left side: Marketing content */}
          <div className="w-full lg:w-1/2 max-w-2xl space-y-6 lg:space-y-8 animate-in">
            <div className="space-y-3 lg:space-y-4 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md font-montserrat">
                Unlock Your Fitness Journey
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl mx-auto lg:mx-0">
                Join our community and book your classes with ease. Your fitness journey begins here.
              </p>
            </div>

            {/* Upcoming classes preview in a grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {isFetchingClasses ? (
                <div className="col-span-full flex items-center justify-center h-48 sm:h-56 rounded-xl bg-black/30 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
                    <p className="text-white/80">Loading classes...</p>
                  </div>
                </div>
              ) : (
                upcomingClasses.map((cls) => (
                  <Card key={cls.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all border-0 backdrop-blur-sm bg-black/30 text-white hover:bg-black/40 hover-scale">
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-base sm:text-lg">{cls.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-white border border-primary/30">
                            {cls.spotsAvailable} spots
                          </span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-white/80">
                          <CalendarDays className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{new Date(cls.date).toLocaleDateString()}</span>
                          <Clock className="ml-2 mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{cls.time}</span>
                        </div>
                        <div className="flex items-center mt-1 sm:mt-2 justify-between">
                          <span className="text-xs py-1 text-white/80">
                            Cash payment
                          </span>
                          <Button variant="ghost" size="sm" className="text-xs opacity-60 text-white hover:text-white hover:bg-white/20 h-8 px-2 sm:px-3" disabled>
                            Sign in to book
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right side: Authentication forms */}
          <div className="w-full lg:w-1/2 max-w-md animate-in mt-6 lg:mt-0">
            <div className="backdrop-blur-md glass-effect rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 text-white">
              <Tabs defaultValue="login" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-black/40">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white">Sign In</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white/20 text-white">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div className="space-y-1 sm:space-y-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back</h2>
                      <p className="text-sm text-white/80">Enter your credentials to continue</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm text-white">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="h-11 bg-white/90 border-white/20 text-black placeholder:text-gray-500 focus:ring-white/30"
                    required
                  />
                </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="h-11 bg-white/90 border-white/20 text-black placeholder:text-gray-500 focus:ring-white/30"
                    required
                  />
                </div>
              </div>
                    
                    {error && (
                      <Alert variant="destructive" className="text-sm bg-red-500/10 border-red-500/20 text-white">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button type="submit" className="w-full h-12 bg-white text-black hover:bg-white/90" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-black/20 border-r-transparent animate-spin"></div>
                          Signing in...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Sign in 
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
              </Button>
                    
                    <div className="text-center text-sm text-white/80">
                      <span>Don't have an account? </span>
                      <button 
                        type="button" 
                        className="text-white hover:underline font-medium"
                        onClick={() => setActiveTab('register')}
                      >
                        Sign up
                      </button>
                    </div>
          </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
                      <p className="text-white/80">Enter your information to get started</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm text-white">Full name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="h-11 bg-white/90 border-white/20 text-black placeholder:text-gray-500 focus:ring-white/30"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-sm text-white">Email address</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="name@example.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="h-11 bg-white/90 border-white/20 text-black placeholder:text-gray-500 focus:ring-white/30"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password" className="text-sm text-white">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="h-11 bg-white/90 border-white/20 text-black placeholder:text-gray-500 focus:ring-white/30"
                          required
                        />
        </div>

                      <div className="space-y-2">
                        <Label className="text-sm text-white">CrossFit Class Package</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input 
                              type="radio" 
                              id="package-8" 
                              name="packageType" 
                              value="8classes" 
                              className="peer hidden" 
                              checked={packageType === "8classes"}
                              onChange={() => setPackageType("8classes")}
                            />
                            <label 
                              htmlFor="package-8" 
                              className="flex flex-col items-center justify-center p-4 border border-white/20 rounded-lg cursor-pointer bg-black/30 hover:bg-black/40 peer-checked:border-primary peer-checked:bg-primary/20 transition-colors"
                            >
                              <span className="text-lg font-bold">8 Classes</span>
                              <span className="text-sm text-white/70">Monthly package</span>
                            </label>
                          </div>
                          <div>
                            <input 
                              type="radio" 
                              id="package-12" 
                              name="packageType" 
                              value="12classes" 
                              className="peer hidden" 
                              checked={packageType === "12classes"}
                              onChange={() => setPackageType("12classes")}
                            />
                            <label 
                              htmlFor="package-12" 
                              className="flex flex-col items-center justify-center p-4 border border-white/20 rounded-lg cursor-pointer bg-black/30 hover:bg-black/40 peer-checked:border-primary peer-checked:bg-primary/20 transition-colors"
                            >
                              <span className="text-lg font-bold">12 Classes</span>
                              <span className="text-sm text-white/70">Monthly package</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="text-sm bg-red-500/10 border-red-500/20 text-white">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button type="submit" className="w-full h-12 bg-white text-black hover:bg-white/90" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-black/20 border-r-transparent animate-spin"></div>
                          Creating account...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Create account
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                    
                    <div className="text-center text-sm text-white/80">
                      <span>Already have an account? </span>
                      <button 
                        type="button" 
                        className="text-white hover:underline font-medium"
                        onClick={() => setActiveTab('login')}
                      >
                        Sign in
                      </button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/40 backdrop-blur-sm py-6 relative z-10">
          <div className="container max-w-7xl mx-auto px-4 flex justify-center">
            <p className="text-sm text-white/70">&copy; {new Date().getFullYear()} GymXam. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
