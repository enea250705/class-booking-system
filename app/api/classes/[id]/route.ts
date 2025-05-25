import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-middleware"

// GET a single class
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const classId = params.id
    
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    })
    
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(classData)
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    )
  }
}

// PATCH update a class (admin only)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const classId = params.id
    const data = await request.json()
    
    // Find the class to update
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    })
    
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }
    
    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data,
    })
    
    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error("Error updating class:", error)
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    )
  }
}

// DELETE a class (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const classId = params.id
    
    // Check if the class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    })
    
    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }
    
    // Check if there are any bookings for this class
    const bookings = await prisma.booking.findMany({
      where: { classId },
    })
    
    if (bookings.length > 0) {
      // If there are bookings, just disable the class instead of deleting it
      const updatedClass = await prisma.class.update({
        where: { id: classId },
        data: { enabled: false },
      })
      
      return NextResponse.json({
        message: "Class has bookings and was disabled instead of deleted",
        class: updatedClass,
      })
    }
    
    // If no bookings, delete the class
    await prisma.class.delete({
      where: { id: classId },
    })
    
    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    )
  }
}
