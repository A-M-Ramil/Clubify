import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true, globalRole: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.globalRole !== "SPONSOR") {
      return NextResponse.json(
        { error: "Access denied. Only sponsors can update sponsor profiles." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, website, logo } = body;

    // Validate URL fields if provided
    if (website && !isValidUrl(website)) {
      return NextResponse.json(
        { error: "Invalid website URL" },
        { status: 400 }
      );
    }

    if (logo && !isValidUrl(logo)) {
      return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
    }

    const sponsorProfile = await prisma.sponsorProfile.upsert({
      where: { userId: user.id },
      update: {
        name: name || null,
        description: description || null,
        website: website || null,
        logo: logo || null,
      },
      create: {
        userId: user.id,
        name: name || null,
        description: description || null,
        website: website || null,
        logo: logo || null,
      },
    });

    return NextResponse.json(sponsorProfile);
  } catch (error) {
    console.error("Error updating sponsor profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      select: { id: true, globalRole: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.globalRole !== "SPONSOR") {
      return NextResponse.json(
        { error: "Access denied. Only sponsors can view sponsor profiles." },
        { status: 403 }
      );
    }

    const sponsorProfile = await prisma.sponsorProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json(sponsorProfile);
  } catch (error) {
    console.error("Error fetching sponsor profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Utility function to validate URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
