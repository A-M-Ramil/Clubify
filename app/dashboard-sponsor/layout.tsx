// app/dashboard-sponsor/layout.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalRole } from "@prisma/client";

export default function SponsorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<GlobalRole | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      if (!isLoaded) return;

      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const response = await fetch("/api/user-role", {
          credentials: "include",
        });

        if (response.ok) {
          const { globalRole } = await response.json();
          console.log("User role from API:", globalRole);

          setUserRole(globalRole);

          // If user is NOT a SPONSOR, redirect them to regular dashboard
          if (globalRole !== "SPONSOR") {
            console.log(
              "Non-sponsor detected, redirecting to regular dashboard"
            );
            router.push("/dashboard");
            return;
          }
        } else {
          console.error("Failed to fetch user role");
          router.push("/sign-in");
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/sign-in");
        return;
      } finally {
        setIsCheckingRole(false);
      }
    }

    checkUserRole();
  }, [user, isLoaded, router]);

  // Show loading state
  if (!isLoaded || isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sponsor dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting non-sponsors
  if (!userRole || userRole !== "SPONSOR") {
    return null;
  }

  // Render children if user is SPONSOR
  return <>{children}</>;
}
