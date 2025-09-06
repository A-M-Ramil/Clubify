import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { EmailTemplate } from "@/components/emailtemplate";
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ clubId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const clubId = resolvedParams.clubId;

    const { userId: authUserId } = await auth();
    const { to, subject, body } = await request.json();

    if (!authUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!to || to.length === 0 || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the internal user record from the Clerk auth ID
    const internalUser = await prisma.user.findUnique({
      where: { authUserId },
      select: { id: true },
    });

    if (!internalUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Authorization Check - using same logic as your members route
    const userMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId: internalUser.id,
          clubId: clubId,
        },
      },
      select: { role: true },
    });

    // Only allow PRESIDENT and HR to send emails (matching your members route permissions)
    if (
      !userMembership ||
      (userMembership.role !== "PRESIDENT" && userMembership.role !== "HR")
    ) {
      return NextResponse.json(
        { error: "Only presidents and HR members can send emails" },
        { status: 403 }
      );
    }

    // Get club details for email branding
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { name: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: `${club.name} <onboarding@resend.dev>`, // Replace with your verified Resend domain
      to: [...to], // Required by Resend for testing
      // Actual recipients
      subject: subject,
      react: EmailTemplate({ Clubname: club.name }),
    });

    console.log("Email sent successfully:", result);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${to.length} recipients`,
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("[SEND_EMAIL_POST]", error);
    return NextResponse.json(
      {
        error:
          "Failed to send email: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}
