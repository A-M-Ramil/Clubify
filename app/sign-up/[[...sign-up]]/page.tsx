"use client";

import React from "react";
import { useSignUp, useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { cn } from "@/lib/utils";
import {
  IconBrandApple,
  IconBrandGoogle,
  IconBuilding,
  IconUsers,
} from "@tabler/icons-react";

export default function Signup() {
  const { isLoaded, signUp, setActive } = useSignUp() as any;
  const { signIn } = useSignIn() as any;
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState<"MEMBER" | "SPONSOR">(
    "MEMBER"
  );
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);

  React.useEffect(() => {
    if (error) setError(null);
    if (info) setInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailAddress, password, verificationCode, selectedRole]);

  if (!isLoaded) return null;

  const safeErrorMessage = (err: any) => {
    try {
      if (!err) return "An unknown error occurred.";
      if (err.errors && Array.isArray(err.errors) && err.errors[0]?.message)
        return String(err.errors[0].message);
      if (err.message) return String(err.message);
      return String(err);
    } catch (e) {
      return "An unknown error occurred.";
    }
  };

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setInfo("A verification code has been sent to your email.");
    } catch (err: any) {
      setError(safeErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createUserInDatabase() {
    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          globalRole: selectedRole,
        }),
        credentials: "include", // Important for Clerk session cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user record");
      }

      const result = await response.json();
      console.log("User created in database:", result.user);
      return result.user;
    } catch (error) {
      console.error("Failed to create user in database:", error);
      throw error;
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsVerifying(true);

    try {
      const completeSignup = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignup?.status === "complete") {
        // Set the active session first
        if (
          typeof setActive === "function" &&
          completeSignup.createdSessionId
        ) {
          await setActive({ session: completeSignup.createdSessionId });
        }

        // Now create the user record in your Prisma database
        try {
          setInfo("Creating your profile...");
          await createUserInDatabase();
          if (selectedRole === "SPONSOR") {
            router.push("/events");
          } else {
            router.push("/dashboard");
          }
          // Redirect to dashboard on success

          return;
        } catch (dbError: any) {
          // If database creation fails, still redirect but show warning
          console.error("Database user creation failed:", dbError);
          setError(
            "Account created successfully, but there was an issue setting up your profile. Please contact support if you experience any issues."
          );

          // Still redirect after a short delay to let user see the message
          setTimeout(() => {
            if (selectedRole === "SPONSOR") {
              router.push("/events");
            } else {
              router.push("/dashboard");
            }
          }, 3000);
          return;
        }
      } else {
        setError("Verification failed. Please check your code and try again.");
      }
    } catch (err: any) {
      setError(safeErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend(e?: React.MouseEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setInfo("Verification code resent — check your email.");
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  }

  function handleCancelVerification() {
    setPendingVerification(false);
    setVerificationCode("");
    setInfo(null);
    setError(null);
  }

  // OAuth sign in function
  async function signInWithOAuth(strategy: string) {
    setError(null);
    setInfo(null);

    if (!signIn) {
      setError("Auth is not ready.");
      return;
    }

    try {
      // Store the selected role in sessionStorage before OAuth redirect
      sessionStorage.setItem("pendingUserRole", selectedRole);

      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  }

  const RoleCard = ({
    role,
    title,
    description,
    icon: Icon,
    isSelected,
    onClick,
  }: {
    role: "MEMBER" | "SPONSOR";
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <div
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md",
        isSelected
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isSelected
              ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              "font-medium",
              isSelected
                ? "text-blue-900 dark:text-blue-100"
                : "text-gray-900 dark:text-gray-100"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "mt-1 text-sm",
              isSelected
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {description}
          </p>
        </div>
        <div
          className={cn(
            "h-4 w-4 rounded-full border-2 flex items-center justify-center",
            isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-gray-300 dark:border-gray-600"
          )}
        >
          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary p-4">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to Clubify!
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Create an account to get started. Don&apos;t worry — we&apos;ll ask
          you to verify your email.
        </p>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {info && (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            {info}
          </div>
        )}

        {!pendingVerification ? (
          <form className="my-8" onSubmit={handleSignUp}>
            {/* Role Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                I want to sign up as:
              </Label>
              <div className="mt-3 space-y-3">
                <RoleCard
                  role="MEMBER"
                  title="Club Member"
                  description="Join clubs, attend events, and connect with other students"
                  icon={IconUsers}
                  isSelected={selectedRole === "MEMBER"}
                  onClick={() => setSelectedRole("MEMBER")}
                />
                <RoleCard
                  role="SPONSOR"
                  title="Sponsor/Business"
                  description="Sponsor events, connect with clubs, and promote your business"
                  icon={IconBuilding}
                  isSelected={selectedRole === "SPONSOR"}
                  onClick={() => setSelectedRole("SPONSOR")}
                />
              </div>
            </div>

            <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="projectmayhem@fc.com"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                required
              />
            </LabelInputContainer>

            <LabelInputContainer className="mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </LabelInputContainer>

            <button
              className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
              type="submit"
              aria-busy={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating account..."
                : `Sign up as ${selectedRole === "MEMBER" ? "Club Member" : "Sponsor"} →`}
              <BottomGradient />
            </button>

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

            <div className="flex flex-col space-y-4">
              <button
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                type="button"
                onClick={() => signInWithOAuth("oauth_apple")}
              >
                <IconBrandApple className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with Apple
                </span>
                <BottomGradient />
              </button>

              <button
                className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                type="button"
                onClick={() => signInWithOAuth("oauth_google")}
              >
                <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with Google
                </span>
                <BottomGradient />
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{" "}
              <Link className="text-sky-600 hover:underline" href="/sign-in">
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form className="my-8" onSubmit={handleVerify}>
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Creating account as:{" "}
                <span className="font-medium">
                  {selectedRole === "MEMBER" ? "Club Member" : "Sponsor"}
                </span>
              </p>
            </div>

            <LabelInputContainer className="mb-4">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="Enter code from email"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </LabelInputContainer>

            <div className="flex items-center space-x-2">
              <button
                className="group/btn relative inline-flex h-10 flex-1 items-center justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white"
                type="submit"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify & Continue"}
                <BottomGradient />
              </button>

              <button
                type="button"
                onClick={handleResend}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm"
              >
                Resend
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
              <button
                type="button"
                onClick={handleCancelVerification}
                className="underline"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingVerification(false);
                  router.push("/");
                }}
                className="text-neutral-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
