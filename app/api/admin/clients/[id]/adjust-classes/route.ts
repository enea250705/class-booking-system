import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { packageId, newClassesRemaining, reason } = await request.json();
    const clientId = params.id;

    // Validate input
    if (!packageId || newClassesRemaining < 0) {
      return NextResponse.json({ 
        error: 'Invalid input. Package ID and valid classes remaining are required.' 
      }, { status: 400 });
    }

    // Get the current package
    const currentPackage = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: clientId,
        active: true
      }
    });

    if (!currentPackage) {
      return NextResponse.json({ 
        error: 'Active package not found for this client' 
      }, { status: 404 });
    }

    const oldClassesRemaining = currentPackage.classesRemaining;

    // Update the package
    const updatedPackage = await prisma.package.update({
      where: {
        id: packageId
      },
      data: {
        classesRemaining: newClassesRemaining
      }
    });

    // Get client info for response
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, email: true }
    });

    return NextResponse.json({
      success: true,
      message: `Classes adjusted successfully for ${client?.name}`,
      oldValue: oldClassesRemaining,
      newValue: newClassesRemaining,
      package: updatedPackage
    });

  } catch (error) {
    console.error('Error adjusting classes:', error);
    return NextResponse.json({ 
      error: 'Failed to adjust classes' 
    }, { status: 500 });
  }
} 