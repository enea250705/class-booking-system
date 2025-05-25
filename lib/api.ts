// API client for making requests to the backend
import type { Class, Booking, User, Subscription } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// Helper function to get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "API request failed")
  }

  return data
}

// Classes API
export const classesApi = {
  getAll: () => fetchAPI<Class[]>("/classes"),
  getById: (id: string) => fetchAPI<Class>(`/classes/${id}`),
  create: (classData: Partial<Class>) =>
    fetchAPI<Class>("/classes", {
      method: "POST",
      body: JSON.stringify(classData),
    }),
  update: (id: string, classData: Partial<Class>) =>
    fetchAPI<Class>(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(classData),
    }),
  toggleAvailability: (id: string, enabled: boolean) =>
    fetchAPI<Class>(`/classes/${id}/toggle`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    }),
  delete: (id: string) =>
    fetchAPI<void>(`/classes/${id}`, {
      method: "DELETE",
    }),
}

// Bookings API
export const bookingsApi = {
  getAll: () => fetchAPI<Booking[]>("/bookings"),
  getByUser: (userId: string) => fetchAPI<Booking[]>(`/bookings/user/${userId}`),
  getByClass: (classId: string) => fetchAPI<Booking[]>(`/bookings/class/${classId}`),
  create: (bookingData: { classId: string }) =>
    fetchAPI<Booking>("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),
  cancel: (id: string) =>
    fetchAPI<Booking>(`/bookings/${id}/cancel`, {
      method: "PUT",
    }),
}

// Users API
export const usersApi = {
  getAll: () => fetchAPI<User[]>("/users"),
  getById: (id: string) => fetchAPI<User>(`/users/${id}`),
  update: (id: string, userData: Partial<User>) =>
    fetchAPI<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
  getCurrentUser: () => fetchAPI<User>("/users/me"),
}

// Subscriptions API
export const subscriptionsApi = {
  getByUser: (userId: string) => fetchAPI<Subscription>(`/subscriptions/user/${userId}`),
  renew: (userId: string, packageId: string) =>
    fetchAPI<Subscription>(`/subscriptions/renew`, {
      method: "POST",
      body: JSON.stringify({ userId, packageId }),
    }),
  reset: (userId: string) =>
    fetchAPI<Subscription>(`/subscriptions/reset`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
}

// Notifications API
export const notificationsApi = {
  getByUser: () => fetchAPI<Notification[]>("/notifications"),
  markAsRead: (id: string) =>
    fetchAPI<void>(`/notifications/${id}/read`, {
      method: "PUT",
    }),
  sendRenewalReminder: (userId: string) =>
    fetchAPI<void>(`/notifications/renewal-reminder`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
}
