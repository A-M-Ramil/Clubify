// app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { userQueries } from "@/lib/db-queries";
import { GlobalRole } from "@prisma/client";

// You'll need to add this to your environment variables
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET as string;

if (!CLERK_WEBHOOK_SECRET) {
  throw new Error(
    "Please add CLERK_WEBHOOK_SECRET to your environment variables"
  );
}

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    // Get the headers
    const headerPayload = {
      "svix-id": req.headers.get("svix-id") as string,
      "svix-timestamp": req.headers.get("svix-timestamp") as string,
      "svix-signature": req.headers.get("svix-signature") as string,
    };

    // Get the body
    const payload = await req.text();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    let evt: ClerkWebhookEvent;

    // Verify the webhook
    try {
      evt = wh.verify(payload, headerPayload) as ClerkWebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Handle the webhook
    const { type, data } = evt;

    if (type === "user.created") {
      try {
        // Check if user already exists
        const existingUser = await userQueries.getUserByAuthId(data.id);

        if (existingUser) {
          console.log("User already exists in database:", existingUser.id);
          return NextResponse.json(
            { message: "User already exists" },
            { status: 200 }
          );
        }

        // Get the primary email
        const primaryEmail = data.email_addresses[0]?.email_address;

        if (!primaryEmail) {
          console.error("No email address found for user:", data.id);
          return NextResponse.json(
            { error: "No email address found" },
            { status: 400 }
          );
        }

        // Create user name from available data
        const name =
          data.first_name && data.last_name
            ? `${data.first_name} ${data.last_name}`.trim()
            : data.first_name ||
              data.last_name ||
              data.username ||
              primaryEmail.split("@")[0];

        // Create the user in your database
        const newUser = await userQueries.createUser({
          authUserId: data.id,
          email: primaryEmail,
          name: name,
          globalRole: GlobalRole.MEMBER,
        });

        console.log("User created successfully via webhook:", newUser.id);

        return NextResponse.json(
          { message: "User created successfully", userId: newUser.id },
          { status: 201 }
        );
      } catch (error: any) {
        console.error("Error creating user via webhook:", error);

        // Handle duplicate user error gracefully
        if (error.code === "P2002") {
          return NextResponse.json(
            { message: "User already exists" },
            { status: 200 }
          );
        }

        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }
    }

    // Handle user updates
    if (type === "user.updated") {
      try {
        const existingUser = await userQueries.getUserByAuthId(data.id);

        if (!existingUser) {
          console.log("User not found for update:", data.id);
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
          );
        }

        const primaryEmail = data.email_addresses[0]?.email_address;
        const name =
          data.first_name && data.last_name
            ? `${data.first_name} ${data.last_name}`.trim()
            : data.first_name ||
              data.last_name ||
              data.username ||
              existingUser.name;

        await userQueries.updateUser(existingUser.id, {
          email: primaryEmail || existingUser.email,
          name: name,
        });

        console.log("User updated successfully via webhook:", existingUser.id);

        return NextResponse.json(
          { message: "User updated successfully" },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error updating user via webhook:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
