"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { cn } from "@/lib/utils";
import { IconUpload, IconPlus, IconTrash } from "@tabler/icons-react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function CreateClubPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // form
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add department
  const addDept = () => {
    const v = newDept.trim();
    if (!v) return;
    if (!departments.includes(v)) {
      setDepartments((s) => [...s, v]);
      setNewDept("");
    }
  };

  const removeDept = (d: string) =>
    setDepartments((s) => s.filter((x) => x !== d));

  // Cover image handling (preview only)
  const onCoverChange = (f: File | null) => {
    setCoverFile(f);
    if (!f) {
      setCoverPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  // Basic client-side validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Club name is required";
    if (!university.trim()) e.university = "University is required";
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail))
      e.contactEmail = "Invalid email";
    if (website && !/^(https?:\/\/)/i.test(website))
      e.website = "Website should start with http(s)://";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setUniversity("");
    setDescription("");
    setContactEmail("");
    setWebsite("");
    setDepartments([]);
    setNewDept("");
    setCoverFile(null);
    setCoverPreview(null);
    setErrors({});
    setSuccessMessage(null);
  };

  // Submit handler: posts JSON to /api/clubs
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSuccessMessage(null);

    if (!isLoaded) return;

    if (!isSignedIn) {
      setErrors({ form: "You must be signed in to create a club." });
      return;
    }

    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Build payload
      const payload = {
        name: name.trim(),
        university: university.trim(),
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
        departments,
        createdBy: user.id,
        hasCover: Boolean(coverFile),
      };

      const res = await fetch("/api/welcome/create-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create club");
      }

      setSuccessMessage(`Club "${data.club.name}" created successfully!`);

      // Optional: Redirect to the club page after a delay
      setTimeout(() => {
        router.push(`/clubs/${data.club.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Club creation error:", err);

      // Handle specific error types
      if (err.message.includes("already exists")) {
        setErrors({
          name: "A club with this name already exists at this university",
        });
      } else if (err.message.includes("Validation failed")) {
        setErrors({
          form: "Please check your input and try again",
        });
      } else {
        setErrors({
          form: err.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on department input
  const handleDeptKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDept();
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-xl bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Create a Club
              </h1>
              <p className="mt-1 text-sm text-neutral-300">
                Register a new student club — members only. After creation you
                can add events, departments and members.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isLoaded && isSignedIn ? (
                <div className="text-sm text-neutral-300">
                  Signed in as{" "}
                  <span className="font-medium text-white">
                    {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <SignInButton mode="modal">
                    <button className="rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="rounded-md border border-white/10 px-3 py-2 text-sm text-white">
                      Sign up
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {/* Left column: main fields */}
            <div className="md:col-span-2 space-y-4">
              {errors.form && (
                <div className="rounded-md border border-red-600 bg-red-700/10 p-3 text-sm text-red-100">
                  {errors.form}
                </div>
              )}

              <div>
                <Label htmlFor="club-name">Club name</Label>
                <Input
                  id="club-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Innovators Club"
                  disabled={loading}
                />
                {errors.name && (
                  <div className="mt-1 text-sm text-red-400">{errors.name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Example University"
                  disabled={loading}
                />
                {errors.university && (
                  <div className="mt-1 text-sm text-red-400">
                    {errors.university}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Short description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50"
                  placeholder="Describe your club in 1-2 sentences"
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact email (optional)</Label>
                <Input
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="organizer@example.edu"
                  type="email"
                  disabled={loading}
                />
                {errors.contactEmail && (
                  <div className="mt-1 text-sm text-red-400">
                    {errors.contactEmail}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  disabled={loading}
                />
                {errors.website && (
                  <div className="mt-1 text-sm text-red-400">
                    {errors.website}
                  </div>
                )}
              </div>

              {/* Departments dynamic */}
              <div>
                <Label>Departments (optional)</Label>
                <div className="flex gap-2">
                  <input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={handleDeptKeyDown}
                    placeholder="e.g. Tech Team"
                    className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-neutral-100 placeholder:text-neutral-500 disabled:opacity-50"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={addDept}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                  >
                    <IconPlus className="h-4 w-4" /> Add
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {departments.map((d) => (
                    <span
                      key={d}
                      className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-1 text-sm text-neutral-200"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDept(d)}
                        disabled={loading}
                        className="rounded p-1 hover:bg-white/5 disabled:opacity-50"
                      >
                        <IconTrash className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: cover & submit */}
            <div className="md:col-span-1 space-y-4">
              <div>
                <Label>Club cover (optional)</Label>
                <div className="mt-1 flex flex-col gap-2">
                  <label
                    className={cn(
                      "relative cursor-pointer rounded border border-dashed border-neutral-700 px-4 py-6 text-center",
                      loading && "pointer-events-none opacity-50"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 h-full w-full opacity-0"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0] ?? null;
                        onCoverChange(f);
                      }}
                      disabled={loading}
                    />
                    <div className="mx-auto flex w-full max-w-[200px] flex-col items-center justify-center gap-2">
                      <IconUpload className="h-6 w-6 text-neutral-400" />
                      <div className="text-sm text-neutral-300">
                        Click to upload cover image
                      </div>
                    </div>
                  </label>

                  {coverPreview && (
                    <div className="relative mt-2">
                      <img
                        src={coverPreview}
                        alt="cover preview"
                        className="max-h-48 w-full rounded object-cover"
                      />
                      <div className="mt-2 flex justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCoverFile(null);
                            setCoverPreview(null);
                          }}
                          disabled={loading}
                          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                          Remove
                        </button>
                        <div className="text-sm text-neutral-400">
                          Preview only
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Creator</Label>
                <div className="mt-1 rounded border bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
                  {isLoaded && isSignedIn ? (
                    <div>
                      {user?.fullName ??
                        user?.primaryEmailAddress?.emailAddress}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-neutral-400">
                        You must sign in to create a club
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !isSignedIn || !isLoaded}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all",
                    loading || !isSignedIn || !isLoaded
                      ? "cursor-not-allowed bg-neutral-800 text-neutral-400"
                      : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-lg"
                  )}
                >
                  {loading ? "Creating..." : "Create Club"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="w-full rounded border border-neutral-700 px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
                >
                  Reset
                </button>

                {successMessage && (
                  <div className="mt-2 rounded bg-emerald-700/10 border border-emerald-600/20 p-3 text-sm text-emerald-200">
                    {successMessage}
                    <div className="mt-1 text-xs text-emerald-300/80">
                      Redirecting to club page...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* small footer */}
          <div className="mt-6 text-center text-sm text-neutral-500">
            By creating a club you agree to your university policies. You can
            manage club members and events after creation.
          </div>
        </div>
      </div>
    </div>
  );
}
