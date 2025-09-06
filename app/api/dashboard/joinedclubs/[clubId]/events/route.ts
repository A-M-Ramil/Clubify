import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { eventQueries } from "@/lib/db-queries";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const { userId: authUserId } = await auth(); // Renaming for clarity
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the internal user ID from the authUserId
    const user = await prisma.user.findUnique({
      where: { authUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const resolvedParams = await context.params;
    const clubId = resolvedParams.clubId;
    const body = await req.json();

    const { title, description, location, startDate, endDate, imageUrl } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "Title and start date are required" },
        { status: 400 }
      );
    }

    // Check user's role in the club using the internal user ID
    const membership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: user.id, // Use the internal user ID
          clubId: clubId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    if (membership.role === "MEMBER") {
      return NextResponse.json(
        { error: "You do not have permission to create events" },
        { status: 403 }
      );
    }

    const event = await eventQueries.createEvent({
      clubId,
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      imageUrl,
    });

    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
