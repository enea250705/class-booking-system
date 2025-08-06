import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { headers } from "next/headers"

export async function GET(request: Request) {
  try {
    const headersList = await headers()
    const authorization = headersList.get("authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]

    try {
      // Verify token
      jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
      return NextResponse.json({ valid: true })
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
