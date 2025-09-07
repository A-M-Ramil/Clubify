"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  MapPin,
  Calendar,
  Users,
  Mail,
  ExternalLink,
  Building,
  Shield,
} from "lucide-react";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import Header from "@/components/clubs_header";
// Types based on your schema
interface Club {
  id: string;
  name: string;
  university: string;
  description?: string;
  coverImage?: string;
  contactEmail?: string;
  website?: string;
  approved: boolean;
  createdAt: string;
  members: any[];
  departments: any[];
  events: any[];
  admins: any[];
}

interface UserMembership {
  role: string;
  joinedAt: string;
  department?: {
    id: string;
    name: string;
  };
}

interface ClubDetailsData {
  club: Club;
  userMembership: UserMembership;
  canEdit: boolean;
}

const ClubDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [data, setData] = useState<ClubDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    university: "",
    description: "",
    contactEmail: "",
    website: "",
    coverImage: "",
  });

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const response = await fetch(`/api/dashboard/joinedclubs/${clubId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch club details");
        }

        setData(result.data);
        // Initialize edit form with current data
        setEditForm({
          name: result.data.club.name,
          university: result.data.club.university,
          description: result.data.club.description || "",
          contactEmail: result.data.club.contactEmail || "",
          website: result.data.club.website || "",
          coverImage: result.data.club.coverImage || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [clubId]);

  const handleSave = async () => {
    if (!data) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dashboard/joinedclubs/${clubId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update club");
      }

      // Update local state with new data
      setData((prev) =>
        prev
          ? {
              ...prev,
              club: { ...prev.club, ...editForm },
            }
          : null
      );

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!data) return;

    // Reset form to original values
    setEditForm({
      name: data.club.name,
      university: data.club.university,
      description: data.club.description || "",
      contactEmail: data.club.contactEmail || "",
      website: data.club.website || "",
      coverImage: data.club.coverImage || "",
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen  bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}

        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to My Clubs
          </button>

          {data.canEdit && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-2 outline outline-red-950 bg-red-500/10 hover:bg-red-500 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-2 outline outline-green-950 bg-green-500/10 hover:bg-green-800 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-2 outline outline-purple-950 bg-purple-500/10 hover:bg-purple-700 text-white rounded-md transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Club
                </button>
              )}
            </div>
          )}
        </div>
        <Header clubId={clubId} />
        {/* Cover Image */}
        {(data.club.coverImage || isEditing) && (
          <div className="mb-8">
            {isEditing ? (
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-300">
                  Cover Image URL
                </Label>
                <Input
                  type="url"
                  value={editForm.coverImage}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      coverImage: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 !bg-primary border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            ) : data.club.coverImage ? (
              <img
                src={data.club.coverImage}
                alt={data.club.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : null}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Club Name */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-300">
                    Club Name
                  </Label>
                  <Input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 !bg-primary  border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              ) : (
                <h1 className="text-4xl font-bold text-white">
                  {data.club.name}
                </h1>
              )}
            </div>

            {/* University */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-300">
                    University
                  </Label>
                  <Input
                    type="text"
                    value={editForm.university}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        university: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 !bg-primary border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              ) : (
                <div className="flex items-center text-gray-300">
                  <Building className="h-5 w-5 mr-2" />
                  {data.club.university}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-2">
                  <Label className="block text-sm font-medium text-gray-300">
                    Description
                  </Label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 !bg-primary border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Club description..."
                  />
                </div>
              ) : data.club.description ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {data.club.description}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No description available
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>

              {/* Email */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-300">
                      Contact Email
                    </Label>
                    <Input
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 !bg-primary border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="club@university.edu"
                    />
                  </div>
                ) : data.club.contactEmail ? (
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-4 w-4 mr-2" />
                    <a
                      href={`mailto:${data.club.contactEmail}`}
                      className="hover:text-purple-400 transition-colors"
                    >
                      {data.club.contactEmail}
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Website */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium text-gray-300">
                      Website
                    </Label>
                    <Input
                      type="url"
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 !bg-primary border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://clubwebsite.com"
                    />
                  </div>
                ) : data.club.website ? (
                  <div className="flex items-center text-gray-300">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <a
                      href={data.club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors"
                    >
                      {data.club.website}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Your Role */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Your Role
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Position:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      data.userMembership.role === "PRESIDENT"
                        ? "bg-purple-500/20 text-purple-300"
                        : data.userMembership.role === "TREASURER"
                          ? "bg-green-500/20 text-green-300"
                          : data.userMembership.role === "HR"
                            ? "bg-blue-500/20 text-blue-300"
                            : data.userMembership.role === "MARKETING"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {data.userMembership.role}
                  </span>
                </div>

                {data.userMembership.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Department:</span>
                    <span className="text-white">
                      {data.userMembership.department.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Joined:</span>
                  <span className="text-white">
                    {formatDate(data.userMembership.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Club Stats */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold mb-4">Club Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </div>
                  <span className="text-white font-semibold">
                    {data.club.members.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </div>
                  <span className="text-white font-semibold">
                    {data.club.events.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">
                    <Building className="h-4 w-4 mr-2" />
                    Departments
                  </div>
                  <span className="text-white font-semibold">
                    {data.club.departments.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Club Status */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Approval:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      data.club.approved
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    }`}
                  >
                    {data.club.approved ? "Approved" : "Pending"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white text-sm">
                    {formatDate(data.club.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetailsPage;
