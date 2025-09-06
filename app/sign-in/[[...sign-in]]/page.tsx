"use client";

import React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { cn } from "@/lib/utils";
import { IconBrandApple, IconBrandGoogle } from "@tabler/icons-react";

export default function Signin() {
  const { isLoaded, signIn, setActive } = useSignIn() as any;
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [forgotPassword, setForgotPassword] = React.useState(false);
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [isSendingReset, setIsSendingReset] = React.useState(false);

  React.useEffect(() => {
    if (error) setError(null);
    if (info) setInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailAddress, password, resetCode, newPassword]);

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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        if (typeof setActive === "function") {
          await setActive({ session: result.createdSessionId });
        }

        setInfo("Sign in successful! Redirecting...");
        router.push("/dashboard");
      } else {
        setError(
          "Sign in failed. Please check your credentials and try again."
        );
      }
    } catch (err: any) {
      setError(safeErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSendingReset(true);

    try {
      await signIn.create({
        identifier: emailAddress,
      });

      const firstFactor = signIn.supportedFirstFactors.find(
        (factor: any) => factor.strategy === "reset_password_email_code"
      );

      if (firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: firstFactor.emailAddressId,
        });
        setInfo("Password reset code sent to your email.");
      } else {
        setError("Password reset is not available for this account.");
      }
    } catch (err: any) {
      setError(safeErrorMessage(err));
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsResettingPassword(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        if (typeof setActive === "function") {
          await setActive({ session: result.createdSessionId });
        }

        setInfo("Password reset successful! Redirecting...");
        router.push("/dashboard");
      } else {
        setError(
          "Password reset failed. Please check your code and try again."
        );
      }
    } catch (err: any) {
      setError(safeErrorMessage(err));
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function handleResendResetCode(e?: React.MouseEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);

    try {
      const firstFactor = signIn.supportedFirstFactors.find(
        (factor: any) => factor.strategy === "reset_password_email_code"
      );

      if (firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: firstFactor.emailAddressId,
        });
        setInfo("Reset code resent — check your email.");
      }
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  }

  function handleCancelReset() {
    setForgotPassword(false);
    setResetCode("");
    setNewPassword("");
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
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      setError(safeErrorMessage(err));
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary p-4">
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome back to Clubify!
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          {forgotPassword
            ? "Reset your password to continue accessing your account."
            : "Sign in to your account to continue where you left off."}
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

        {!forgotPassword ? (
          <form className="my-8" onSubmit={handleSignIn}>
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

            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setForgotPassword(true)}
                className="text-sm text-sky-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
              type="submit"
              aria-busy={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in →"}
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
              Don&apos;t have an account?{" "}
              <Link className="text-sky-600 hover:underline" href="/sign-up">
                Sign up
              </Link>
            </p>
          </form>
        ) : (
          <div className="my-8">
            {!resetCode ? (
              <form onSubmit={handleForgotPassword}>
                <LabelInputContainer className="mb-4">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    placeholder="Enter your email address"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                  />
                </LabelInputContainer>

                <button
                  className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                  type="submit"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? "Sending..." : "Send Reset Code"}
                  <BottomGradient />
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleCancelReset}
                    className="text-sm text-neutral-500 hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Enter the code sent to{" "}
                    <span className="font-medium">{emailAddress}</span>
                  </p>
                </div>

                <LabelInputContainer className="mb-4">
                  <Label htmlFor="reset-code">Reset Code</Label>
                  <Input
                    id="reset-code"
                    placeholder="Enter code from email"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                  />
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-password">New Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="new-password"
                    placeholder="Enter new password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </LabelInputContainer>

                <div className="flex items-center space-x-2">
                  <button
                    className="group/btn relative inline-flex h-10 flex-1 items-center justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white"
                    type="submit"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Resetting..." : "Reset Password"}
                    <BottomGradient />
                  </button>

                  <button
                    type="button"
                    onClick={handleResendResetCode}
                    className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm"
                  >
                    Resend
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleCancelReset}
                    className="text-sm text-neutral-500 hover:underline"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
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
