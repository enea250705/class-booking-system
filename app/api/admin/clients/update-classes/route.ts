import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

// POST update remaining classes for a client's package
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await auth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { clientId, packageId, classesRemaining } = await request.json();

    // Validate input
    if (!clientId || !packageId || classesRemaining === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: clientId, packageId, and classesRemaining' 
      }, { status: 400 });
    }

    if (classesRemaining < 0) {
      return NextResponse.json({ 
        error: 'Classes remaining cannot be negative' 
      }, { status: 400 });
    }

    // Verify the package belongs to the client
    const packageExists = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: clientId,
        active: true
      }
    });

    if (!packageExists) {
      return NextResponse.json({ 
        error: 'Package not found or does not belong to this client' 
      }, { status: 404 });
    }

    // Update the package
    const updatedPackage = await prisma.package.update({
      where: { id: packageId },
      data: { classesRemaining: classesRemaining },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Admin ${user.email} updated client ${updatedPackage.user.name} (${updatedPackage.user.email}) package classes to ${classesRemaining}`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated remaining classes to ${classesRemaining}`,
      package: {
        id: updatedPackage.id,
        name: updatedPackage.name,
        classesRemaining: updatedPackage.classesRemaining,
        totalClasses: updatedPackage.totalClasses,
        endDate: updatedPackage.endDate
      },
      client: updatedPackage.user
    });

  } catch (error) {
    console.error('Error updating client classes:', error);
    return NextResponse.json({ 
      error: 'Failed to update client classes' 
    }, { status: 500 });
  }
} 