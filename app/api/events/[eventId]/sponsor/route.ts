// app/api/events/[eventId]/sponsor/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  context: { params: { eventId: string } }
) {
  try {
    const resolvedParams = await context.params;
    const eventId = await resolvedParams.eventId;
    console.log("[sponsor.POST] eventId:", eventId);

    // Clerk auth
    const { userId } = await auth();
    console.log("[sponsor.POST] clerk userId:", userId);
    if (!userId)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );

    // find user + sponsor profile
    const user = await prisma.user.findUnique({
      where: { authUserId: userId },
      include: { sponsorProfile: true },
    });

    console.log(
      "[sponsor.POST] prisma user:",
      !!user,
      "sponsorProfile:",
      !!user?.sponsorProfile
    );
    if (!user)
      return NextResponse.json(
        { error: "User not found in DB" },
        { status: 404 }
      );
    if (user.globalRole !== "SPONSOR")
      return NextResponse.json(
        { error: "Only sponsors can create sponsorships" },
        { status: 403 }
      );
    if (!user.sponsorProfile)
      return NextResponse.json(
        { error: "Sponsor profile missing" },
        { status: 403 }
      );

    // parse and validate body
    const body = await request.json().catch(() => ({}));
    const rawAmount = body.amount;
    const amountNum =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
    const tier = typeof body.tier === "string" ? body.tier : undefined;
    const sandbox = !!body.sandbox;
    const autoComplete = !!body.autoComplete; // request asks server to simulate successful payment

    if (typeof amountNum !== "number" || isNaN(amountNum) || amountNum < 100) {
      return NextResponse.json(
        { error: "Minimum sponsorship amount is $100" },
        { status: 400 }
      );
    }

    // ensure event exists
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Create sponsorship record (PENDING)
    const sponsorship = await prisma.sponsorship.create({
      data: {
        eventId,
        sponsorId: user.sponsorProfile.id,
        userId: user.id,
        amount: amountNum,
        status: "PENDING",
      },
      include: {
        event: { select: { id: true, title: true, startDate: true } },
        sponsor: true,
      },
    });

    console.log(
      "[sponsor.POST] created sponsorship:",
      sponsorship.id,
      "tier:",
      tier ?? "n/a",
      "sandbox:",
      sandbox,
      "autoComplete:",
      autoComplete
    );

    // SANDBOX AUTO-COMPLETE (DEVELOPMENT ONLY OR WHEN EXPLICITLY ALLOWED)
    // This lets you simulate a successful Paddle payment without calling the real checkout/webhook.
    const allowSandboxAuto =
      process.env.ALLOW_SANDBOX_AUTOCOMPLETE === "true" ||
      process.env.NODE_ENV !== "production";

    if (sandbox && autoComplete) {
      if (!allowSandboxAuto) {
        return NextResponse.json(
          { error: "Sandbox auto-complete disabled on this environment" },
          { status: 403 }
        );
      }

      // create a payment record and mark sponsorship completed
      const payment = await prisma.payment.create({
        data: {
          sponsorshipId: sponsorship.id,
          method: "PADDLE", // uses enum PaymentMethod.PADDLE
          amount: amountNum,
        },
      });

      const updated = await prisma.sponsorship.update({
        where: { id: sponsorship.id },
        data: {
          status: "COMPLETED",
          // createdAt remains original; if you need an updated timestamp field, add it to the model
        },
        include: {
          event: { select: { id: true, title: true, startDate: true } },
          sponsor: true,
          payments: true,
        },
      });

      console.log("[sponsor.POST] sandbox auto-complete done:", updated.id);
      return NextResponse.json({
        success: true,
        sandbox: true,
        data: updated,
        message: "Sponsorship created and marked COMPLETED (sandbox)",
      });
    }

    // Normal flow: return sponsorship record and let frontend open Paddle checkout
    return NextResponse.json({
      success: true,
      sandbox: false,
      data: sponsorship,
      message: "Sponsorship created (PENDING)",
    });
  } catch (err: any) {
    console.error("[sponsor.POST] unexpected error:", err);
    return NextResponse.json(
      {
        error: "Failed to create sponsorship",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
