import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingPage() {
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
              <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground">
                Plans
              </Link>
              <Link href="/about" className="transition-colors hover:text-foreground/80">
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
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Choose Your CrossFit Plan</h1>
            <p className="text-muted-foreground max-w-[700px] mx-auto">
              Select the plan that fits your schedule. All plans are valid for 30 days and require payment in cash at the studio.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-[900px] mx-auto pt-8">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">8 CrossFit Classes / Month</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xl font-bold mb-6">Cash payment at studio</div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>8 CrossFit classes per month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Book up to 30 days in advance</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Cancel up to 8 hours before class</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Personal training from our expert coach</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Automatic renewal notifications</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/register" className="w-full">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col border-primary">
              <CardHeader>
                <CardTitle className="text-2xl">12 CrossFit Classes / Month</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xl font-bold mb-6">Cash payment at studio</div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>12 CrossFit classes per month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Book up to 30 days in advance</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Cancel up to 10 hours before class</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Personal training from our expert coach</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Automatic renewal notifications</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-primary" />
                    <span>Priority booking for popular sessions</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/register" className="w-full">
                  <Button className="w-full" variant="default">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>
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
