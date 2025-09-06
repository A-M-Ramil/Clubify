import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: threeMonthsAgo,
        },
        club: {
          approved: true, // Only show events from approved clubs
        }
      },
      include: {
        club: {
          select: {
            name: true,
            university: true,
            coverImage: true,
          }
        },
        images: {
          select: {
            url: true,
          }
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
