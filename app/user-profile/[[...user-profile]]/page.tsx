"use client";
import React, { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Camera,
  Mail,
  Globe,
  Users,
  Calendar,
  Award,
  Settings,
  Edit3,
  Save,
  X,
} from "lucide-react";

export default function UserProfilePage() {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  // Fetch user profile data from your database
  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
    }
  }, [isLoaded, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setEditForm({
          name: data.user.name || "",
          email: data.user.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-primary  flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Please sign in to view your profile
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className=" backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-light flex items-center justify-center overflow-hidden">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {(userProfile?.name ||
                        user.fullName ||
                        "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Basic Info */}
              <div className="flex flex-col space-y-2">
                {isEditing ? (
                  <div className="flex flex-col space-y-3">
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-xl font-semibold w-64"
                      placeholder="Your name"
                    />
                    <input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-300 w-64"
                      placeholder="Your email"
                      type="email"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-white">
                      {userProfile?.name || user.fullName || "Anonymous User"}
                    </h1>
                    <p className="text-gray-300 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {userProfile?.email ||
                        user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      userProfile?.globalRole === "ADMIN"
                        ? "bg-red-500/20 text-red-300"
                        : userProfile?.globalRole === "SPONSOR"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {userProfile?.globalRole || "MEMBER"}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Joined{" "}
                    {userProfile?.createdAt
                      ? new Date(userProfile.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save"}</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </>
              )}

              <SignOutButton>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className=" backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-gray-400 text-sm">Clubs Joined</p>
                <p className="text-2xl font-bold text-white">
                  {userProfile?.memberships?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-gray-400 text-sm">Clubs Admin</p>
                <p className="text-2xl font-bold text-white">
                  {userProfile?.clubs?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-gray-400 text-sm">Events RSVP'd</p>
                <p className="text-2xl font-bold text-white">
                  {userProfile?.rsvps?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-gray-400 text-sm">Sponsorships</p>
                <p className="text-2xl font-bold text-white">
                  {userProfile?.sponsorships?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clubs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Clubs */}
          <div className="backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              My Clubs
            </h2>
            <div className="space-y-3">
              {userProfile?.memberships?.length > 0 ? (
                userProfile.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="bg-secondary/50 rounded-lg p-4 hover:bg-secondary transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">
                          {membership.club.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {membership.club.university}
                        </p>
                        {membership.department && (
                          <p className="text-blue-400 text-xs mt-1">
                            {membership.department.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          membership.role === "PRESIDENT"
                            ? "bg-purple-500/20 text-purple-300"
                            : membership.role === "TREASURER"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        {membership.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No clubs joined yet
                </p>
              )}
            </div>
          </div>

          {/* Clubs I Admin */}
          <div className="backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-400" />
              Clubs I Admin
            </h2>
            <div className="space-y-3">
              {userProfile?.clubs?.length > 0 ? (
                userProfile.clubs.map((club) => (
                  <div
                    key={club.id}
                    className="bg-secondary/50  rounded-lg p-4 hover:bg-secondary transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{club.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {club.university}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Created{" "}
                          {new Date(club.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          club.approved
                            ? "bg-green-500/20 text-green-300"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {club.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    {club.description && (
                      <p className="text-gray-300 text-sm mt-2">
                        {club.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No clubs administered</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Create Club
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-400" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {userProfile?.rsvps?.length > 0 ? (
              userProfile.rsvps.slice(0, 5).map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between bg-secondary/50  rounded-lg p-3"
                >
                  <div>
                    <p className="text-white font-medium">{rsvp.event.title}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(rsvp.event.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rsvp.status === "CONFIRMED"
                        ? "bg-green-500/20 text-green-300"
                        : rsvp.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {rsvp.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>

        {/* Sponsor Profile Section (if applicable) */}
        {userProfile?.globalRole === "SPONSOR" && (
          <div className="mt-8 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-yellow-400" />
              Sponsor Profile
            </h2>
            {userProfile.sponsorProfile ? (
              <div className="bg-secondary/50  rounded-lg p-4">
                <h3 className="text-lg font-medium text-white">
                  {userProfile.sponsorProfile.companyName}
                </h3>
                <p className="text-gray-400">
                  {userProfile.sponsorProfile.industry}
                </p>
                <p className="text-gray-500 text-sm">
                  {userProfile.sponsorProfile.location}
                </p>
                <div className="mt-3">
                  <p className="text-sm text-gray-300">
                    Active Sponsorships: {userProfile.sponsorships?.length || 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 mb-4">
                  Complete your sponsor profile
                </p>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Setup Sponsor Profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* Account Settings */}
        <div className="mt-8 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-400" />
            Account Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">Account ID</p>
              <p className="text-gray-500 text-sm font-mono">{user.id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">Email Verified</p>
              <p className="text-gray-500 text-sm">
                {user.primaryEmailAddress?.verification?.status === "verified"
                  ? "✅ Verified"
                  : "❌ Not Verified"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">Two-Factor Auth</p>
              <p className="text-gray-500 text-sm">
                {user.twoFactorEnabled ? "✅ Enabled" : "❌ Disabled"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300 font-medium">Last Sign In</p>
              <p className="text-gray-500 text-sm">
                {user.lastSignInAt
                  ? new Date(user.lastSignInAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
