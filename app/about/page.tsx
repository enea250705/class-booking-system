import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">GymXam</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/classes" className="transition-colors hover:text-foreground/80">
                Classes
              </Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground/80">
                Pricing
              </Link>
              <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground">
                About
              </Link>
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-12">
        <div className="space-y-12 max-w-[800px] mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">About GymXam</h1>
            <p className="text-xl text-muted-foreground">
              We're on a mission to make fitness class booking simple and stress-free.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Story</h2>
            <p className="text-muted-foreground">
              GymXam was founded in 2023 with a simple goal: to eliminate the hassle of booking fitness classes.
              After experiencing the frustration of complicated booking systems and last-minute cancellations, our
              founder decided to create a platform that puts both clients and fitness studios first.
            </p>
            <p className="text-muted-foreground">
              Today, GymXam is used by fitness enthusiasts across the country to book their favorite classes with
              ease, while helping studio owners manage their schedules efficiently.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Our Approach</h2>
            <p className="text-muted-foreground">
              We believe that booking a fitness class should be as simple as a few clicks. Our platform is designed with
              user experience in mind, making it easy for clients to find and book classes, and for studios to manage
              their schedules.
            </p>
            <p className="text-muted-foreground">
              We also understand the importance of flexibility. Life happens, and sometimes plans change. That's why
              we've built a system that allows for easy cancellations and rescheduling, while still respecting the needs
              of studio owners.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Join Us</h2>
            <p className="text-muted-foreground">
              Whether you're a fitness enthusiast looking for an easier way to book classes, or a studio owner wanting
              to streamline your booking process, we'd love to have you join the GymXam community.
            </p>
            <div className="pt-4">
              <Link href="/register">
                <Button size="lg">Get Started Today</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © 2025 GymXam. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
