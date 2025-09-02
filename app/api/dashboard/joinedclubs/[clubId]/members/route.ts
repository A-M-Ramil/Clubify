import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clubQueries, membershipQueries } from "@/lib/db-queries";

// GET - Fetch all club members
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const clubId = resolvedParams.clubId;

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
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
      select: { role: true },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    // Get all club members
    const members = await clubQueries.getClubMembers(clubId);

    return NextResponse.json({
      success: true,
      data: {
        members,
        canManage:
          userMembership.role === "PRESIDENT" || userMembership.role === "HR",
      },
    });
  } catch (error) {
    console.error("Error fetching club members:", error);
    return NextResponse.json(
      { error: "Failed to fetch club members" },
      { status: 500 }
    );
  }
}

// PUT - Update member role (only for presidents/HR)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const clubId = resolvedParams.clubId;

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

    // Verify user can manage members
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
      select: { role: true },
    });

    if (
      !userMembership ||
      (userMembership.role !== "PRESIDENT" && userMembership.role !== "HR")
    ) {
      return NextResponse.json(
        { error: "Only presidents and HR can manage members" },
        { status: 403 }
      );
    }

    const { targetUserId, newRole } = await request.json();

    // Update member role
    const updatedMembership = await membershipQueries.updateMemberRole(
      targetUserId,
      clubId,
      newRole
    );

    return NextResponse.json({
      success: true,
      data: updatedMembership,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from club (only for presidents)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const clubId = resolvedParams.clubId;

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

    // Verify user is president
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId: clubId,
        },
      },
      select: { role: true },
    });

    if (!userMembership || userMembership.role !== "PRESIDENT") {
      return NextResponse.json(
        { error: "Only presidents can remove members" },
        { status: 403 }
      );
    }

    const { targetUserId } = await request.json();

    // Prevent president from removing themselves
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the club" },
        { status: 400 }
      );
    }

    // Remove member
    await membershipQueries.removeMemberFromClub(targetUserId, clubId);

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
