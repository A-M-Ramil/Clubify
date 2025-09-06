// app/sign-in/sso-callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function SSOCallback() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const handleOAuthCallback = async () => {
      if (user) {
        try {
          // Get the role from sessionStorage if it was stored before OAuth (for sign-up)
          const pendingRole = sessionStorage.getItem("pendingUserRole");

          // Clear the stored role
          if (pendingRole) {
            sessionStorage.removeItem("pendingUserRole");
          }

          // Try to create user (this will handle both new users and existing users)
          const response = await fetch("/api/create-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              globalRole: pendingRole || "MEMBER", // Use stored role or default to MEMBER
            }),
            credentials: "include",
          });

          if (response.ok) {
            const result = await response.json();
            console.log("OAuth user handled:", result.user);

            // Redirect to appropriate dashboard based on role
            if (result.user.globalRole === "SPONSOR") {
              router.push("/events");
            } else {
              router.push("/dashboard");
            }
          } else if (response.status === 409) {
            // User already exists, just redirect to dashboard
            console.log("User already exists, redirecting to dashboard");
            router.push("/");
          } else {
            console.error("Failed to handle user after OAuth");
            router.push("/"); // Fallback redirect
          }
        } catch (error) {
          console.error("Error in OAuth callback:", error);
          router.push("/"); // Fallback redirect
        }
      } else {
        // If no user, redirect to sign-in
        router.push("/sign-in");
      }
    };

    handleOAuthCallback();
  }, [user, isLoaded, router]);

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-300">
          {sessionStorage.getItem("pendingUserRole")
            ? "Setting up your account..."
            : "Signing you in..."}
        </p>
      </div>
    </div>
  );
}
