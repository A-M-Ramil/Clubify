import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { userQueries } from "@/lib/db-queries";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  university: z.string().min(1, "University is required").max(255),
});

// GET - Fetch user profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await userQueries.getUserByAuthId(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { authUserId: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          authUserId: { not: userId }, // Exclude current user
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already taken by another user" },
          { status: 409 }
        );
      }
    }

    // Update user profile including university
    const updatedUser = await prisma.user.update({
      where: { authUserId: userId },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        university: validatedData.university,
        updatedAt: new Date(),
      },
      include: {
        memberships: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                university: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            university: true,
            approved: true,
            createdAt: true,
            description: true,
          },
        },
        rsvps: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
              },
            },
          },

          take: 10, // Limit to recent RSVPs
        },
        sponsorships: true,
        sponsorProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// GET - Get list of universities for dropdown (optional helper endpoint)
export async function OPTIONS() {
  try {
    // Get unique universities from existing clubs
    const universities = await prisma.club.findMany({
      select: {
        university: true,
      },
      distinct: ["university"],
      orderBy: {
        university: "asc",
      },
    });

    const universityList = universities
      .map((u) => u.university)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      universities: universityList,
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 }
    );
  }
}
