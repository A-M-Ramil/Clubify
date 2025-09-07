import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sponsorshipId: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const sponsorshipId = resolvedParams.sponsorshipId;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { status, paymentData } = await request.json();

    // Update sponsorship status
    const updatedSponsorship = await prisma.sponsorship.update({
      where: { id: sponsorshipId },
      data: {
        status: status.toUpperCase(),
      },
    });

    // Create payment record if payment was successful
    if (status === "COMPLETED" && paymentData) {
      await prisma.payment.create({
        data: {
          sponsorshipId,
          method: "PADDLE", // You might want to add this to your PaymentMethod enum
          amount: updatedSponsorship.amount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedSponsorship,
      message: "Sponsorship status updated successfully",
    });
  } catch (error) {
    console.error("Error updating sponsorship status:", error);
    return NextResponse.json(
      { error: "Failed to update sponsorship status" },
      { status: 500 }
    );
  }
}

// Environment variables you'll need to add to your .env.local:
/*
NEXT_PUBLIC_PADDLE_VENDOR_ID=your_sandbox_vendor_id
NEXT_PUBLIC_PADDLE_PRODUCT_ID=your_sandbox_product_id
PADDLE_WEBHOOK_SECRET=your_webhook_secret
*/
