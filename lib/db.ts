// This is a placeholder for the database connection
// In a real app, this would connect to PostgreSQL using Prisma or another ORM

import { PrismaClient } from "@prisma/client"

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

export const db = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") global.prisma = db
