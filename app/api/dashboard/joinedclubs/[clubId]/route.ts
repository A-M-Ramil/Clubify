import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clubQueries } from "@/lib/db-queries"; // Adjust path as needed

// GET - Fetch club details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await context.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find our internal user record
    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a member of this club
    const membership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
      select: {
        role: true,
        joinedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    // Get full club details
    const club = await clubQueries.getClubById(clubId);

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        club,
        userMembership: membership,
        canEdit: membership.role === "PRESIDENT",
      },
    });
  } catch (error) {
    console.error("Error fetching club details:", error);
    return NextResponse.json(
      { error: "Failed to fetch club details" },
      { status: 500 }
    );
  }
}

// PUT - Update club details (only for presidents)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await context.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find our internal user record
    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user is a president of this club
    const membership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership || membership.role !== "PRESIDENT") {
      return NextResponse.json(
        { error: "Only club presidents can update club details" },
        { status: 403 }
      );
    }

    // Parse the update data
    const updateData = await request.json();

    // Validate and sanitize the data
    const allowedFields = [
      "name",
      "university",
      "description",
      "contactEmail",
      "website",
      "coverImage",
    ];

    const filteredData = Object.keys(updateData)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    // Update the club
    const updatedClub = await clubQueries.updateClub(clubId, filteredData);

    return NextResponse.json({
      success: true,
      data: updatedClub,
      message: "Club updated successfully",
    });
  } catch (error) {
    console.error("Error updating club:", error);
    return NextResponse.json(
      { error: "Failed to update club" },
      { status: 500 }
    );
  }
}
