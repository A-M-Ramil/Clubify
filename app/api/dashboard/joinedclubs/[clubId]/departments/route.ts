import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { clubQueries, departmentQueries } from "@/lib/db-queries";

// GET - Fetch all club departments
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

    // Get all club departments
    const departments = await clubQueries.getClubDepartments(clubId);

    return NextResponse.json({
      success: true,
      data: {
        departments,
        canManage:
          userMembership.role === "PRESIDENT" || userMembership.role === "HR",
      },
    });
  } catch (error) {
    console.error("Error fetching club departments:", error);
    return NextResponse.json(
      { error: "Failed to fetch club departments" },
      { status: 500 }
    );
  }
}

// POST - Create new department (only for presidents/HR)
export async function POST(
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

    // Verify user can manage departments
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
        { error: "Only presidents and HR can manage departments" },
        { status: 403 }
      );
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    // Create department
    const department = await departmentQueries.createDepartment({
      name: name.trim(),
      clubId: clubId,
    });

    return NextResponse.json({
      success: true,
      data: department,
      message: "Department created successfully",
    });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    );
  }
}
