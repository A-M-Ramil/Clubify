// app/api/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { userQueries } from "@/lib/db-queries";
import { GlobalRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    // Get the current authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Unauthorized - No authenticated user found" },
        { status: 401 }
      );
    }

    const authUserId = clerkUser.id;
    console.log("Creating user for authUserId:", authUserId);

    // Check if user already exists in our database
    try {
      const existingUser = await userQueries.getUserByAuthId(authUserId);

      if (existingUser) {
        return NextResponse.json(
          {
            message: "User already exists",
            user: existingUser,
          },
          { status: 200 }
        );
      }
    } catch (dbError) {
      // If getUserByAuthId fails, it might be because user doesn't exist yet
      console.log("User does not exist yet, proceeding with creation");
    }

    // Extract email from Clerk user
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "No email address found for user" },
        { status: 400 }
      );
    }

    // Create user name from available Clerk data
    let name = "";
    if (clerkUser.firstName && clerkUser.lastName) {
      name = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
    } else if (clerkUser.firstName) {
      name = clerkUser.firstName;
    } else if (clerkUser.lastName) {
      name = clerkUser.lastName;
    } else if (clerkUser.username) {
      name = clerkUser.username;
    } else {
      // Fallback to email prefix
      name = email.split("@")[0];
    }

    console.log("Creating user with data:", { authUserId, email, name });

    // Create the user in your Prisma database
    const newUser = await userQueries.createUser({
      authUserId: authUserId,
      email: email,
      name: name,
      globalRole: GlobalRole.MEMBER,
    });

    console.log("User created successfully:", newUser.id);

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          globalRole: newUser.globalRole,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Handle other Prisma errors
    if (error.code?.startsWith("P")) {
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
