// app/api/clubs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clubQueries } from "@/lib/db-queries";
import { prisma } from "@/lib/prisma"; // Add this import
import { z } from "zod";

// Validation schema
const createClubSchema = z.object({
  name: z.string().min(1, "Club name is required").max(100, "Name too long"),
  university: z
    .string()
    .min(1, "University is required")
    .max(100, "University name too long"),
  description: z.string().optional(),
  contactEmail: z
    .string()
    .email({ message: "Invalid email" })
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url({ message: "Invalid website URL" })
    .optional()
    .or(z.literal("")),
  departments: z.array(z.string()).default([]),
  hasCover: z.boolean().default(false),
  createdBy: z.string().min(1, "Creator ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();

    // Ensure the createdBy matches the authenticated user
    if (body.createdBy !== userId) {
      return NextResponse.json(
        { error: "Creator ID mismatch" },
        { status: 403 }
      );
    }

    const validatedData = createClubSchema.parse(body);

    // Prepare data for database insertion
    const clubData = {
      name: validatedData.name.trim(),
      university: validatedData.university.trim(),
      description: validatedData.description?.trim() || undefined,
      contactEmail: validatedData.contactEmail?.trim() || undefined,
      website: validatedData.website?.trim() || undefined,
      coverImage: undefined, // TODO: Implement file upload logic
      creatorId: userId,
    };

    // Remove empty strings and convert to undefined for optional fields
    if (clubData.contactEmail === "") clubData.contactEmail = undefined;
    if (clubData.website === "") clubData.website = undefined;
    if (clubData.description === "") clubData.description = undefined;

    // Get the user from your database using authUserId (Clerk ID)
    const dbUser = await prisma.user.findUnique({
      where: { authUserId: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          error:
            "User not found. Please ensure your account is properly set up.",
        },
        { status: 404 }
      );
    }

    // Update club data to use database user ID
    const clubDataWithDbUser = {
      ...clubData,
      creatorId: dbUser.id, // Use database user ID instead of Clerk ID
    };

    // Create the club using your query function
    const newClub = await clubQueries.createClub(clubDataWithDbUser);

    // TODO: Handle departments if you have a separate departments table
    // You might need to create department records and associate them with the club
    if (validatedData.departments.length > 0) {
      // Example implementation if you have a departments table:
      // await Promise.all(
      //   validatedData.departments.map(deptName =>
      //     prisma.clubDepartment.create({
      //       data: {
      //         name: deptName,
      //         clubId: newClub.id,
      //       }
      //     })
      //   )
      // );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      club: {
        id: newClub.id,
        name: newClub.name,
        university: newClub.university,
        description: newClub.description,
        createdAt: newClub.createdAt,
      },
      message: "Club created successfully",
    });
  } catch (error) {
    console.error("Error creating club:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map(
            (e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`
          ),
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A club with this name already exists at this university" },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: "Failed to create club. Please try again." },
      { status: 500 }
    );
  }
}
