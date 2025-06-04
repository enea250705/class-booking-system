// This is now a server component
// No more "use client" directive

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface ClassDetails {
  id: string;
  name: string;
  date: string;
  time: string;
  day: string;
  capacity: number;
  currentBookings: number;
  enabled: boolean;
}

interface BookingUser {
  id: string;
  name: string;
  email: string;
  package: {
    id: string;
    name: string;
    classesRemaining: number;
    totalClasses: number;
    endDate: string;
  } | null;
}

interface Booking {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: BookingUser;
}

export default async function ClassBookingsPage({ params }: { params: { id: string } }) {
  // Simple authentication check
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('auth_token');
  
  if (!tokenCookie) {
    redirect("/login");
  }
  
  let user = null;
  try {
    // Verify the token
    const token = tokenCookie.value;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    user = decoded;
    
    if (user.role !== "admin") {
      redirect("/dashboard");
    }
  } catch (error) {
    // Invalid token
    redirect("/login");
  }
  
  // Fetch class bookings
  const classId = params.id;
  let classDetails: ClassDetails | null = null;
  let bookings: Booking[] = [];
  let errorMessage = '';
  
  try {
    console.log(`Admin fetching bookings for class ID: ${classId}`);
    
    // Get class bookings from API - use the raw ID directly
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/classes/${classId}/bookings`;
    
    console.log(`Fetching from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error (${response.status}):`, errorData);
      throw new Error(`Failed to fetch class bookings: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response data:', data);
    
    classDetails = data.class;
    bookings = data.bookings || [];
    
    console.log(`Found class: ${classDetails?.name}, with ${bookings.length} bookings`);
  } catch (error: any) {
    console.error('Error fetching class bookings:', error);
    errorMessage = error.message || 'Failed to fetch class bookings';
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  if (!classDetails) {
    return (
      <div className="min-h-screen bg-black p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h1 className="text-xl font-bold text-white mb-2">Class Not Found</h1>
          <p className="text-gray-400 mb-6">
            {errorMessage || "The class you're looking for doesn't exist or couldn't be loaded"}
          </p>
          <Link href="/admin/classes" className="inline-block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md">
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/classes" className="inline-block mb-6 text-blue-500 hover:underline">
          Back to Classes
        </Link>
        
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{classDetails.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <p>Date: {formatDate(classDetails.date)}</p>
            <p>Time: {classDetails.time}</p>
            <p>Bookings: {classDetails.currentBookings} / {classDetails.capacity}</p>
            <p>Status: {classDetails.enabled ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-4">Client Bookings</h2>
        
        {bookings.length === 0 ? (
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 text-center">
            <h3 className="font-medium text-white text-lg">No bookings yet</h3>
            <p className="text-gray-400 mt-2">
              This class doesn't have any bookings at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-white">{booking.user.name}</h3>
                    <p className="text-sm text-gray-400">{booking.user.email}</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded">
                    {booking.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mb-4">
                  <p>Booked on: {new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                
                {booking.user.package && (
                  <div className="bg-blue-900/30 p-3 rounded border border-blue-800 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-white text-xs">Active Package</span>
                      <span className="text-xs bg-blue-700 px-2 py-0.5 rounded text-white">
                        {booking.user.package.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Classes Remaining</span>
                        <span>{booking.user.package.classesRemaining} / {booking.user.package.totalClasses}</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(booking.user.package.classesRemaining / booking.user.package.totalClasses) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-300 mt-1">
                        <span>Valid Until</span>
                        <span>{new Date(booking.user.package.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <Link 
                  href={`/admin/clients/${booking.userId}`}
                  className="block w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white text-center rounded"
                >
                  View Client Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
 
 
 