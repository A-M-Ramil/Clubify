import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clubQueries } from "@/lib/db-queries";

// GET - Fetch all clubs by user's university that user can join
export async function GET(request: NextRequest) {
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
      select: {
        id: true,
        university: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.university) {
      return NextResponse.json(
        {
          error:
            "Please complete your profile with university information first",
        },
        { status: 400 }
      );
    }

    // Get all clubs from user's university
    const allClubs = await clubQueries.getClubsByUniversity(user.university);

    // Get user's current memberships to filter out joined clubs
    const userMemberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: { clubId: true },
    });

    const joinedClubIds = new Set(userMemberships.map((m) => m.clubId));

    // Filter out clubs the user is already a member of
    const availableClubs = allClubs.filter(
      (club) => !joinedClubIds.has(club.id)
    );

    // Format the response to include useful information for the frontend
    const formattedClubs = availableClubs.map((club) => ({
      id: club.id,
      name: club.name,
      university: club.university,
      description: club.description,
      contactEmail: club.contactEmail,
      website: club.website,
      coverImage: club.coverImage,
      memberCount: club.members.length,
      departmentCount: club.departments.length,
      eventCount: club.events.length,
      createdAt: club.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        clubs: formattedClubs,
        userUniversity: user.university,
        totalAvailable: formattedClubs.length,
      },
    });
  } catch (error) {
    console.error("Error fetching available clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch available clubs" },
      { status: 500 }
    );
  }
}

// POST - Join a club
export async function POST(request: NextRequest) {
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
      select: { id: true, university: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { clubId } = await request.json();

    if (!clubId) {
      return NextResponse.json(
        { error: "Club ID is required" },
        { status: 400 }
      );
    }

    // Verify the club exists and is from the same university
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        id: true,
        name: true,
        university: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if club is from the same university as the user
    if (club.university !== user.university) {
      return NextResponse.json(
        { error: "You can only join clubs from your university" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this club" },
        { status: 409 }
      );
    }

    // Create membership with default MEMBER role
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        clubId: clubId,
        role: "MEMBER", // Default role for new joiners
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            university: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: membership,
      message: `Successfully joined ${club.name}!`,
    });
  } catch (error) {
    console.error("Error joining club:", error);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}
