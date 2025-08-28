"use client";

import React, { useState } from "react";
import { Label } from "@/components/UI/label";
import { Input } from "@/components/UI/input";
import { cn } from "@/lib/utils";
import { IconUpload, IconPlus, IconTrash } from "@tabler/icons-react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";

/**
 * Full-page Club Registration form
 *
 * - Background: #0a0a0a
 * - Uses your Input & Label components
 * - Only signed-in users can submit (SignIn / SignUp CTAs shown otherwise)
 * - Submits to /api/clubs as JSON; replace or wire to your API as needed
 */

export default function CreateClubPage() {
  const { isLoaded, isSignedIn, user } = useUser();

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

  // Submit handler: posts JSON to /api/clubs (adjust endpoint later)
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
      const payload: any = {
        name: name.trim(),
        university: university.trim(),
        description: description.trim() || null,
        contactEmail: contactEmail.trim() || null,
        website: website.trim() || null,
        departments,
        createdBy: user?.id, // clerk user id (store as authUserId in DB)
      };

      // If you want to actually upload the cover, implement multipart upload / S3 logic in your API.
      // For now we send a flag whether a cover was provided and skip binary upload.
      payload.hasCover = Boolean(coverFile);

      // send to your API (implement server side with Prisma)
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create club");
      }

      const json = await res.json();

      setSuccessMessage("Club created successfully.");
      // Optionally redirect to the created club page:
      // router.push(`/clubs/${json.id}`);
      // For now reset form:
      setName("");
      setUniversity("");
      setDescription("");
      setContactEmail("");
      setWebsite("");
      setDepartments([]);
      setCoverFile(null);
      setCoverPreview(null);
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err?.message ?? String(err) });
    } finally {
      setLoading(false);
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
                />
                {errors.university && (
                  <div className="mt-1 text-sm text-red-400">
                    {errors.university}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Short description</Label>
                {/* Input component is for simple inputs; use a textarea styled similarly */}
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-neutral-100 placeholder:text-neutral-500"
                  placeholder="Describe your club in 1-2 sentences"
                  rows={4}
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
                    placeholder="e.g. Tech Team"
                    className="mt-1 w-full rounded border bg-transparent px-3 py-2 text-neutral-100 placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={addDept}
                    className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:opacity-90"
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
                        className="rounded p-1 hover:bg-white/5"
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
                  <label className="relative cursor-pointer rounded border border-dashed border-neutral-700 px-4 py-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 h-full w-full opacity-0"
                      onChange={(ev) => {
                        const f = ev.target.files?.[0] ?? null;
                        onCoverChange(f);
                      }}
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
                          className="rounded border px-3 py-1 text-sm"
                        >
                          Remove
                        </button>
                        <div className="text-sm text-neutral-400">
                          Preview only (upload in API)
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
                  onClick={handleSubmit}
                  disabled={loading || !isSignedIn}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium",
                    loading
                      ? "opacity-60"
                      : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:scale-[1.01]"
                  )}
                >
                  {loading ? "Creating..." : "Create Club"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // reset
                    setName("");
                    setUniversity("");
                    setDescription("");
                    setContactEmail("");
                    setWebsite("");
                    setDepartments([]);
                    setCoverFile(null);
                    setCoverPreview(null);
                    setErrors({});
                    setSuccessMessage(null);
                  }}
                  className="w-full rounded border px-4 py-2 text-sm text-white/80"
                >
                  Reset
                </button>

                {successMessage && (
                  <div className="mt-2 rounded bg-emerald-700/10 p-2 text-sm text-emerald-200">
                    {successMessage}
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
