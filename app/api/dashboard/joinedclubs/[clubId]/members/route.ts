import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clubQueries, membershipQueries } from "@/lib/db-queries";

// GET - Fetch all club members and departments
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

    // Get all departments for this club
    const departments = await prisma.department.findMany({
      where: { clubId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        members,
        departments,
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

// PUT - Update member role or department (only for presidents/HR)
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

    const body = await request.json();
    const { targetUserId, newRole, departmentId, action } = body;

    // Verify the target user is actually a member of this club
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: targetUserId,
          clubId: clubId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not a member of this club" },
        { status: 404 }
      );
    }

    let updatedMembership;

    if (action === "updateRole" && newRole) {
      // Update member role
      updatedMembership = await membershipQueries.updateMemberRole(
        targetUserId,
        clubId,
        newRole
      );

      return NextResponse.json({
        success: true,
        data: updatedMembership,
        message: "Member role updated successfully",
      });
    } else if (action === "updateDepartment") {
      // Update member department
      updatedMembership = await prisma.membership.update({
        where: {
          userId_clubId: {
            userId: targetUserId,
            clubId: clubId,
          },
        },
        data: {
          departmentId: departmentId === "" ? null : departmentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedMembership,
        message: "Member department updated successfully",
      });
    } else {
      // Legacy support - if no action is specified, assume role update
      if (newRole) {
        updatedMembership = await membershipQueries.updateMemberRole(
          targetUserId,
          clubId,
          newRole
        );

        return NextResponse.json({
          success: true,
          data: updatedMembership,
          message: "Member role updated successfully",
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid action or missing required fields" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
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

    // Verify user is president or HR (allowing HR to remove members too)
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
        { error: "Only presidents and HR can remove members" },
        { status: 403 }
      );
    }

    const { targetUserId } = await request.json();

    // Prevent user from removing themselves
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the club" },
        { status: 400 }
      );
    }

    // Prevent removing the president (only president can remove themselves by transferring role first)
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: targetUserId,
          clubId: clubId,
        },
      },
      select: { role: true },
    });

    if (
      targetMembership?.role === "PRESIDENT" &&
      userMembership.role !== "PRESIDENT"
    ) {
      return NextResponse.json(
        { error: "Only the president can remove another president" },
        { status: 403 }
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
