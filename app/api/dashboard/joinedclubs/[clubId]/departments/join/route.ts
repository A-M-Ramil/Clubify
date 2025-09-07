import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { clubId: string } }
) {
  try {
    const { userId: authUserId } = await auth();
    if (!authUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { authUserId },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { clubId } = params;
    const { departmentId } = await req.json();

    if (!departmentId) {
      return new NextResponse("Department ID is required", { status: 400 });
    }

    // Find the user's membership in the club
    const membership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId,
        },
      },
    });

    if (!membership) {
      return new NextResponse("You are not a member of this club", {
        status: 403,
      });
    }

    // Update the membership with the department ID
    await prisma.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        departmentId,
      },
    });

    return NextResponse.json({ message: "Successfully joined department" });
  } catch (error) {
    console.error("[DEPARTMENTS_JOIN_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
