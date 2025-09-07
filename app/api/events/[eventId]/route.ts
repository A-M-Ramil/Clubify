// app/api/events/[eventId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust if your prisma client is in another path

// ==============================
// GET an event by ID (with relations)
// ==============================
export async function GET(
  req: Request,
  context: { params: { eventId: string } }
) {
  try {
    const resolvedParams = await context.params;
    const eventId = await resolvedParams.eventId;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: true,
        department: true,
        images: true,
        rsvps: {
          include: { user: true },
        },
        sponsorships: {
          include: {
            sponsor: true,
            user: true,
            payments: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err: any) {
    console.error("GET /events/[eventId] error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ==============================
// UPDATE an event
// ==============================
export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await req.json();

    const updated = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        latitude: body.latitude,
        longitude: body.longitude,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        departmentId: body.departmentId ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /events/[eventId] error:", err);
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ==============================
// DELETE an event
// ==============================
export async function DELETE(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    await prisma.event.delete({
      where: { id: params.eventId },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /events/[eventId] error:", err);
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
