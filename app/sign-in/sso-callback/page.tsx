// app/sign-in/sso-callback/page.tsx
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (!isLoaded || !user) return;

      try {
        // Create user record in database after OAuth signup
        const response = await fetch("/api/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          console.log("User record created/verified:", result);
        } else {
          console.warn("Failed to create user record:", await response.text());
        }
      } catch (error) {
        console.error("Error creating user record:", error);
      } finally {
        // Redirect to dashboard regardless
        router.push("/dashboard");
      }
    };

    createUserIfNeeded();
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Finalizing your registration...</p>
      </div>
    </div>
  );
}
