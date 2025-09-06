// app/api/user-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { userQueries } from "@/lib/db-queries";

export async function GET(req: NextRequest) {
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

    // Get user from database to check their role
    try {
      const user = await userQueries.getUserByAuthId(authUserId);

      if (!user) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          globalRole: user.globalRole,
          userId: user.id,
          email: user.email,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Alternative approach for middleware calls with user ID header
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "No user ID provided" },
        { status: 400 }
      );
    }

    // Get user from database using the provided user ID
    try {
      const user = await userQueries.getUserByAuthId(userId);

      if (!user) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          globalRole: user.globalRole,
          userId: user.id,
          email: user.email,
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
