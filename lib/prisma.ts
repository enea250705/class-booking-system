import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Simplified client initialization for better performance
export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [{ emit: 'stdout', level: 'error' }] as Prisma.LogDefinition[]
      : []
  });

// Only log in development and only log errors
if (process.env.NODE_ENV === 'development') {
  console.log('Prisma Client initialized in development mode');
}

// Save the instance to avoid multiple connections
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test database connection with simplified error handling
(async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err: any) {
    console.error('❌ Database connection error:', err.message);
  }
})();

// Close connections properly when app exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma; 