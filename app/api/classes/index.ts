import { NextResponse } from 'next/server'

// Mock classes data
const crossfitClasses = [
  {
    id: "1",
    name: "CrossFit Foundations",
    description: "Perfect for beginners. Learn the fundamental movements and techniques of CrossFit in a supportive environment.",
    date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    day: "Monday",
    time: "06:00 AM",
    duration: 60,
    capacity: 15,
    currentBookings: 8,
    coach: "Alex Johnson",
    level: "Beginner",
    isBooked: false
  },
  {
    id: "2",
    name: "CrossFit WOD",
    description: "Our standard Workout of the Day. A mix of strength training and high-intensity functional movements.",
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // day after tomorrow
    day: "Tuesday",
    time: "07:30 AM",
    duration: 60,
    capacity: 20,
    currentBookings: 15,
    coach: "Sarah Miller",
    level: "Intermediate",
    isBooked: false
  },
  {
    id: "3",
    name: "CrossFit Strength",
    description: "Focus on building strength with compound movements like squats, deadlifts, and presses.",
    date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    day: "Wednesday",
    time: "05:30 PM",
    duration: 75,
    capacity: 15,
    currentBookings: 10,
    coach: "Mike Davidson",
    level: "Intermediate",
    isBooked: false
  },
  {
    id: "4",
    name: "CrossFit HIIT",
    description: "High-intensity interval training CrossFit style. Maximize calorie burn and improve conditioning.",
    date: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
    day: "Thursday",
    time: "06:30 PM",
    duration: 45,
    capacity: 25,
    currentBookings: 12,
    coach: "Lisa Wang",
    level: "All Levels",
    isBooked: false
  },
  {
    id: "5",
    name: "CrossFit Competition Prep",
    description: "Advanced training for those preparing for CrossFit competitions. Complex movements and challenging workouts.",
    date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    day: "Friday",
    time: "04:30 PM",
    duration: 90,
    capacity: 10,
    currentBookings: 7,
    coach: "James Peterson",
    level: "Advanced",
    isBooked: false
  },
  {
    id: "6",
    name: "CrossFit Open Gym",
    description: "Work on your own CrossFit programming or skills with coach supervision available.",
    date: new Date(Date.now() + 86400000 * 6).toISOString(), // 6 days from now
    day: "Saturday",
    time: "09:00 AM",
    duration: 120,
    capacity: 30,
    currentBookings: 18,
    coach: "Various Coaches",
    level: "All Levels",
    isBooked: false
  }
]

export async function GET() {
  try {
    // Simulate a delay for loading states
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json(crossfitClasses)
  } catch (error) {
    console.error('Error fetching CrossFit classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CrossFit classes' },
      { status: 500 }
    )
  }
} 