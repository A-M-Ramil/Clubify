"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Star,
  CreditCard,
  Check,
  Heart,
  Zap,
  Crown,
  AlertCircle,
} from "lucide-react";

// --- Declare Paddle on window ---
declare global {
  interface Window {
    Paddle?: any;
  }
}

// Types
interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  club?: {
    id: string;
    name: string;
  };
  images?: string[];
}

interface SponsorshipTier {
  id: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  benefits: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

interface UserProfile {
  globalRole: string;
  sponsorProfile?: {
    id: string;
    companyName: string;
    industry?: string;
    location?: string;
  };
}

const EventSponsorshipPage = () => {
  const params = useParams() as { eventId?: string; eventid?: string };
  const router = useRouter();

  // Handle both param key styles - this fixes the toLowerCase error
  const eventId = (params.eventId ?? params.eventid) as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paddleReady, setPaddleReady] = useState(false);

  const sponsorshipTiers: SponsorshipTier[] = [
    {
      id: "bronze",
      name: "Bronze Sponsor",
      minAmount: 100,
      maxAmount: 499,
      benefits: [
        "Logo on event materials",
        "Social media mention",
        "Thank you email to attendees",
      ],
      icon: <Heart className="h-6 w-6" />,
      color: "border-orange-500/30 bg-orange-500/5 text-orange-400",
    },
    {
      id: "silver",
      name: "Silver Sponsor",
      minAmount: 500,
      maxAmount: 999,
      benefits: [
        "All Bronze benefits",
        "Logo on promotional banners",
        "Booth space at event",
        "Direct contact with organizers",
      ],
      icon: <Zap className="h-6 w-6" />,
      color: "border-gray-400/30 bg-gray-400/5 text-gray-300",
      popular: true,
    },
    {
      id: "gold",
      name: "Gold Sponsor",
      minAmount: 1000,
      maxAmount: 2499,
      benefits: [
        "All Silver benefits",
        "Speaking opportunity (5 mins)",
        "Premium booth location",
        "Company brochures distribution",
        "Post-event attendee contact list",
      ],
      icon: <Star className="h-6 w-6" />,
      color: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
    },
    {
      id: "platinum",
      name: "Platinum Sponsor",
      minAmount: 2500,
      benefits: [
        "All Gold benefits",
        "Keynote speaking slot (15 mins)",
        "Co-branding on all materials",
        "Dedicated networking session",
        "Full attendee analytics report",
        "Priority for future events",
      ],
      icon: <Crown className="h-6 w-6" />,
      color: "border-purple-500/30 bg-purple-500/5 text-purple-400",
    },
  ];

  // Load Paddle script and initialize
  const loadPaddleScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.Paddle) {
        setPaddleReady(true);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/paddle.js";
      script.async = true;

      script.onload = () => {
        if (window.Paddle) {
          const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;

          if (!vendorId) {
            console.error(
              "❌ NEXT_PUBLIC_PADDLE_VENDOR_ID not found in environment"
            );
            reject(new Error("Paddle vendor ID not configured"));
            return;
          }

          const vendorIdNumber = parseInt(vendorId);
          if (isNaN(vendorIdNumber)) {
            console.error(
              "❌ Paddle vendor ID is not a valid number:",
              vendorId
            );
            reject(new Error("Invalid Paddle vendor ID"));
            return;
          }

          try {
            // Force sandbox environment
            window.Paddle.Environment.set("sandbox");
            window.Paddle.Setup({
              vendor: vendorIdNumber,
              eventCallback: (data: any) => {
                console.log("🏗️ Paddle Event:", data.event, data);
              },
            });

            console.log(
              "✅ Paddle Sandbox initialized with vendor ID:",
              vendorIdNumber
            );
            setPaddleReady(true);
            resolve();
          } catch (err) {
            console.error("❌ Paddle setup failed:", err);
            reject(err);
          }
        } else {
          reject(new Error("Paddle failed to load"));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load Paddle script"));
      };

      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    if (!eventId) {
      setError("Event ID is missing");
      setLoading(false);
      return;
    }

    const initializePage = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load Paddle first
        await loadPaddleScript();

        // Then fetch data
        const [evRes, profileRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/user/glb_profile`),
        ]);

        const evJson = await evRes.json();
        const profileJson = await profileRes.json();

        if (!evRes.ok) {
          throw new Error(
            evJson.error || `Failed to fetch event: ${evRes.status}`
          );
        }

        if (!profileRes.ok) {
          throw new Error(
            profileJson.error || `Failed to fetch profile: ${profileRes.status}`
          );
        }

        // Handle different response structures
        const eventData = evJson.data || evJson;
        const profileData = profileJson.data || profileJson;

        console.log("📊 Event data:", eventData);
        console.log("👤 Profile data:", profileData);

        setEvent(eventData);
        setUserProfile(profileData);
      } catch (err) {
        console.error("❌ Initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [eventId]);

  // API helpers
  const createSponsorship = async (amount: number) => {
    const res = await fetch(`/api/events/${eventId}/sponsor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        tier: selectedTier,
        sandbox: true, // Mark as sandbox
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || `API Error: ${res.status}`);
    }

    return json.data || json;
  };

  const updateSponsorshipStatus = async (
    sponsorshipId: string,
    status: string,
    paymentData: any
  ) => {
    try {
      const res = await fetch(`/api/sponsorships/${sponsorshipId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paymentData }),
      });

      if (!res.ok) {
        const json = await res.json();
        console.error("Failed to update sponsorship:", json);
      }
    } catch (err) {
      console.error("Failed to update sponsorship status:", err);
    }
  };

  // Paddle checkout
  const initiatePaddlePayment = async (amount: number) => {
    if (!paddleReady || !window.Paddle) {
      setError("Paddle is not ready. Please refresh the page.");
      return;
    }

    const productId = process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID;
    if (!productId) {
      setError(
        "Payment system is not configured. Check NEXT_PUBLIC_PADDLE_PRODUCT_ID."
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log("💳 Creating sponsorship for amount:", amount);
      const sponsorship = await createSponsorship(amount);
      console.log("✅ Sponsorship created:", sponsorship);

      const customerEmail = userProfile?.sponsorProfile?.companyName
        ? `${userProfile.sponsorProfile.companyName.replace(/\s+/g, "").toLowerCase()}@company.com`
        : "test@company.com";

      console.log("🏗️ Opening Paddle checkout...");

      window.Paddle.Checkout.open({
        product: productId,
        passthrough: JSON.stringify({
          eventId,
          sponsorshipId: sponsorship.id,
          amount,
          tier: selectedTier,
          sandbox: true,
        }),
        prices: [`USD:${amount.toFixed(2)}`],
        customerEmail: customerEmail,
        allowQuantity: false,
        quantity: 1,

        successCallback: async (data: any) => {
          console.log("🎉 Payment successful:", data);

          try {
            await updateSponsorshipStatus(sponsorship.id, "COMPLETED", {
              paddlePaymentId: data.checkout?.id || data.checkout,
              amount,
              currency: "USD",
              sandbox: true,
              checkoutData: data,
            });

            // Redirect to success page
            router.push(
              `/events/${eventId}/sponsor/success?sponsorship=${sponsorship.id}&sandbox=true`
            );
          } catch (err) {
            console.error("Error updating sponsorship:", err);
            setError(
              "Payment succeeded but failed to update records. Please contact support."
            );
          }

          setIsProcessing(false);
        },

        closeCallback: () => {
          console.log("🚪 Paddle checkout closed");
          setIsProcessing(false);
        },

        // Add error callback
        errorCallback: (error: any) => {
          console.error("❌ Paddle checkout error:", error);
          setError("Payment failed. Please try again.");
          setIsProcessing(false);
        },
      });
    } catch (err) {
      console.error("❌ Payment initiation error:", err);
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setIsProcessing(false);
    }
  };

  const handleSponsorshipSubmit = () => {
    const amount = customAmount ? parseFloat(customAmount) : getTierMinAmount();

    if (!amount || amount < 100) {
      setError("Minimum sponsorship amount is $100");
      return;
    }

    if (selectedTier) {
      const tier = sponsorshipTiers.find((t) => t.id === selectedTier);
      if (tier?.maxAmount && amount > tier.maxAmount) {
        setError(
          `Amount exceeds maximum for ${tier.name} ($${tier.maxAmount})`
        );
        return;
      }
      if (tier && amount < tier.minAmount) {
        setError(`Amount below minimum for ${tier.name} ($${tier.minAmount})`);
        return;
      }
    }

    setError(null);
    initiatePaddlePayment(amount);
  };

  const getTierMinAmount = () => {
    if (!selectedTier) return 100;
    const tier = sponsorshipTiers.find((t) => t.id === selectedTier);
    return tier?.minAmount ?? 100;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20 mx-auto mb-4"></div>
          <div className="text-white/60 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <div className="text-red-400 text-sm mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check for required data
  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <div className="text-white/60 text-lg mb-2">Event not found</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <div className="text-white/60 text-lg mb-2">Profile not found</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check user role
  if (userProfile.globalRole !== "SPONSOR") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <div className="text-white/60 text-lg mb-4">Access Denied</div>
          <div className="text-white/40 text-sm mb-4">
            Only sponsors can access this page
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white/80 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-medium text-white">Sponsor Event</h1>
            <p className="text-white/40 text-sm">
              Support {event.club?.name ?? "this event"} and gain valuable
              exposure
            </p>
          </div>
        </div>

        {/* Paddle Status */}
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {paddleReady ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400">Paddle Sandbox Ready</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400">Loading Paddle...</span>
              </>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-6 mb-8">
          <h2 className="text-xl font-medium text-white mb-2">{event.title}</h2>
          <p className="text-white/60 text-sm mb-4">{event.description}</p>

          <div className="flex items-center gap-4 text-sm text-white/40">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(event.startDate)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.location}
            </div>
            {event.club && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event.club.name}
              </div>
            )}
          </div>
        </div>

        {/* Company Info */}
        {userProfile.sponsorProfile && (
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-6 mb-8">
            <h3 className="text-lg font-medium text-white mb-4">
              Sponsoring Company
            </h3>
            <div className="text-sm">
              <p className="text-white/40">Company Name</p>
              <p className="text-white">
                {userProfile.sponsorProfile.companyName}
              </p>
            </div>
          </div>
        )}

        {/* Sponsorship Tiers */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-white mb-6">
            Choose Sponsorship Level
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sponsorshipTiers.map((tier) => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative p-6 rounded-xl border cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? tier.color + " ring-1 ring-current"
                    : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-2 left-4 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                    Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  {tier.icon}
                  <div>
                    <h4 className="font-medium text-white">{tier.name}</h4>
                    <p className="text-sm text-white/40">
                      ${tier.minAmount}
                      {tier.maxAmount ? ` - $${tier.maxAmount}` : "+"}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-white/60"
                    >
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        {selectedTier && (
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-6 mb-8">
            <h3 className="text-lg font-medium text-white mb-4">
              Sponsorship Amount
            </h3>
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-2">
                Amount (USD) - Minimum ${getTierMinAmount()}
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={getTierMinAmount().toString()}
                min={getTierMinAmount()}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>
        )}

        {/* Payment Button */}
        {selectedTier && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleSponsorshipSubmit}
              disabled={isProcessing || !paddleReady}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg"
            >
              <CreditCard className="h-5 w-5" />
              {isProcessing
                ? "Processing..."
                : !paddleReady
                  ? "Loading Payment System..."
                  : "Proceed to Payment (Sandbox)"}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSponsorshipPage;
