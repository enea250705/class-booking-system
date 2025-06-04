import { NextResponse } from "next/server";

export async function GET() {
  console.log("Server-side logout called");
  
  const response = NextResponse.json({ 
    success: true, 
    message: "Logged out successfully" 
  });
  
  // Clear the auth token cookie
  response.cookies.set({
    name: "auth_token",
    value: "",
    expires: new Date(0),
    path: "/",
  });
  
  // Clear the backup session cookie
  response.cookies.set({
    name: "auth_session",
    value: "",
    expires: new Date(0),
    path: "/",
  });
  
  return response;
}

export async function POST() {
  // Support both GET and POST for logout
  return GET();
} 