import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// POST update expiration date for a client's package
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await auth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { clientId, packageId, newExpirationDate } = await request.json();

    // Validate input
    if (!clientId || !packageId || !newExpirationDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: clientId, packageId, and newExpirationDate' 
      }, { status: 400 });
    }

    // Validate date format
    const expirationDate = new Date(newExpirationDate);
    if (isNaN(expirationDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 });
    }

    // Check if the package belongs to the client
    const packageRecord = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: clientId
      }
    });

    if (!packageRecord) {
      return NextResponse.json({ 
        error: 'Package not found or does not belong to this client' 
      }, { status: 404 });
    }

    // Update the package expiration date
    const updatedPackage = await prisma.package.update({
      where: {
        id: packageId
      },
      data: {
        endDate: expirationDate
      }
    });

    return NextResponse.json({ 
      message: 'Expiration date updated successfully',
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error updating package expiration date:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 