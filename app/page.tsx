"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Settings, ArrowRight, ChevronRight, Star } from "lucide-react"
import { useEffect, useState } from "react"

// Define interface for class preview
interface ClassPreview {
  id: string;
  name: string;
  day: string;
  time: string;
  date: string | Date;
  spotsAvailable: number;
}

export default function Home() {
  const [upcomingClasses, setUpcomingClasses] = useState<ClassPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch upcoming classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
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
          
          setUpcomingClasses(crossfitClasses.slice(0, 3))
        } else {
          console.error('Error fetching classes: API returned status', response.status)
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClasses()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Optimized with better responsive design */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-montserrat font-bold text-xl tracking-tight">
                <span className="text-primary">Gym</span>Xam
              </span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-6">
              <Link href="/classes" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Classes
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Plans
              </Link>
              <Link href="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                About
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/login?tab=register">
              <Button size="sm" className="text-sm font-medium shadow-sm hover-scale">
                Get Started
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section - Optimized with proper image loading */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <Image 
              src="/images/gymxam6.webp" 
              alt="CrossFit class background" 
              fill 
              priority
              sizes="100vw"
              quality={85}
              className="object-cover object-center" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-[1px]"></div>
          </div>
          
          {/* Hero Content */}
          <div className="container max-w-7xl mx-auto px-4 pt-12 md:pt-16">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="space-y-6 md:space-y-8 animate-in">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Star className="mr-1 h-4 w-4" />
                  <span>Membership plans available</span>
                </div>
                
                <h1 className="font-montserrat text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                  Book Your Fitness <br className="hidden md:inline" />
                  <span className="text-primary">Classes With Ease</span>
                </h1>
                
                <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl">
                  Your fitness journey made simple. Book classes, manage your schedule, and track your progress all in one place.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/login?tab=register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto font-medium shadow-md hover-scale">
                      Start Your Journey
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">5+</div>
                    <div className="text-xs sm:text-sm text-white/70">Workout Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">20+</div>
                    <div className="text-xs sm:text-sm text-white/70">Weekly Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">500+</div>
                    <div className="text-xs sm:text-sm text-white/70">Active Members</div>
                  </div>
                </div>
              </div>
              
              <div className="relative lg:pl-12 mt-8 lg:mt-0">
                <div className="relative bg-black/30 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/10 shadow-2xl animate-in glass-effect">
                  <h3 className="font-semibold text-white text-lg mb-4">Upcoming Classes</h3>
                  
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-56 py-10">
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin mb-4"></div>
                      <p className="text-white/80">Loading CrossFit classes...</p>
                          </div>
                  ) : upcomingClasses.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingClasses.map((cls) => (
                        <div key={cls.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer hover-scale">
                          <div className="flex justify-between items-start">
                          <div>
                              <h4 className="font-medium text-white group-hover:text-primary transition-colors">
                                {cls.name}
                              </h4>
                              <p className="text-sm text-white/60 flex items-center mt-1">
                                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                                {cls.day}, {cls.time}
                              </p>
                          </div>
                            <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                              {cls.spotsAvailable} spots left
                      </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-white/80">No upcoming CrossFit classes found. Check back soon!</p>
                    </div>
                  )}
                  
                  <div className="mt-5 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <h4 className="font-medium text-white">Join Our CrossFit Box</h4>
                    <p className="text-sm mt-1 text-white/70">
                      Register today to book your CrossFit classes
                    </p>
                    <Link href="/login?tab=register" className="inline-block mt-3">
                      <Button size="sm" variant="outline" className="text-xs bg-primary/20 border-primary/30 text-white hover:bg-primary/30">
                        Sign Up Now
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-background to-background/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-montserrat text-3xl md:text-4xl font-bold">
                Book CrossFit Classes in <span className="text-primary">Three Simple Steps</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our booking system is designed to make your CrossFit journey seamless and stress-free
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="h-8 w-8" />, 
                  title: "1. Create Your Account", 
                  desc: "Sign up and choose your CrossFit membership plan with cash payment at the box"
                },
                {
                  icon: <CalendarDays className="h-8 w-8" />, 
                  title: "2. Book Your WODs", 
                  desc: "Browse available CrossFit classes and book with one click, anytime and anywhere"
                },
                {
                  icon: <Settings className="h-8 w-8" />, 
                  title: "3. Track Your Progress", 
                  desc: "View upcoming CrossFit WODs and manage bookings with flexible cancellation"
                }
              ].map((step, idx) => (
                <div key={idx} className="relative rounded-xl p-6 border bg-card hover:shadow-md transition-all hover-scale">
                  <div className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-md">
                    {step.icon}
                </div>
                  <div className="pt-6">
                    <h3 className="font-montserrat text-xl font-semibold mt-2">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.desc}</p>
              </div>
                </div>
              ))}
              </div>
            
            <div className="mt-16 text-center">
              <Link href="/login?tab=register">
                <Button size="lg" className="shadow-md hover-scale">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-muted bg-background/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="text-center">
              <Link href="/" className="inline-flex items-center justify-center">
                <span className="font-montserrat font-bold text-xl">
                  <span className="text-primary">Gym</span>Xam
                </span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs mx-auto">
                Making CrossFit class booking simple and accessible for every athlete.
              </p>
              <p className="mt-6 text-sm text-muted-foreground">
                © {new Date().getFullYear()} GymXam. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
