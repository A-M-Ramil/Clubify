import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // First, find our internal user record by the external auth user id
    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all memberships for this user with detailed club information
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        club: {
          select: {
            id: true,
            name: true,
            university: true,
            description: true,
            coverImage: true,
            contactEmail: true,
            website: true,
            approved: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc", // Most recently joined first
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        memberships,
        totalClubs: memberships.length,
      },
    });
  } catch (error) {
    console.error("Error fetching joined clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch joined clubs" },
      { status: 500 }
    );
  }
}
