// User types
export interface User {
  id: string
  name: string
  email: string
  role: string
  packageId?: string
  startDate?: Date
  endDate?: Date
  classesRemaining?: number
}

// Package types
export interface Package {
  id: string
  name: string
  classesPerMonth: number
  durationDays: number
  price: number
  createdAt: Date
  updatedAt: Date
}

// Class types
export interface Class {
  id: string
  name: string
  day: string
  time: string
  date: Date
  description?: string
  enabled: boolean
  capacity: number
  currentBookings: number
  createdAt: Date
  updatedAt: Date
}

// Booking types
export interface Booking {
  id: string
  userId: string
  classId: string
  bookingDate: Date
  status: string
  createdAt: Date
  updatedAt: Date
  user?: User
  class?: Class
}

// Subscription types
export interface Subscription {
  id: string
  userId: string
  packageId: string
  startDate: Date
  endDate: Date
  classesRemaining: number
  classesTotal: number
  status: string
  createdAt: Date
  updatedAt: Date
  user?: User
  package?: Package
}

// Notification types
export interface Notification {
  id: string
  userId: string
  type: string
  message: string
  read: boolean
  createdAt: Date
  updatedAt: Date
  user?: User
}
