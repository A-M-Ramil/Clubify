import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { departmentQueries } from "@/lib/db-queries";

// PUT - Update department name
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ clubId: string; deptId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { clubId, deptId } = resolvedParams;

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

    // Update department
    const updatedDepartment = await departmentQueries.updateDepartment(deptId, {
      name: name.trim(),
    });

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
      message: "Department updated successfully",
    });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE - Delete department
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ clubId: string; deptId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const { clubId, deptId } = resolvedParams;

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

    // Before deleting, set all members in this department to have no department
    await prisma.membership.updateMany({
      where: { departmentId: deptId },
      data: { departmentId: null },
    });

    // Delete department
    await departmentQueries.deleteDepartment(deptId);

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
