"use client";
import React, { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Users, ExternalLink, Mail } from "lucide-react";
import SpotlightCard from "@/components/UI/spotlightcard";

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
}

interface Department {
  id: string;
  name: string;
}

interface Membership {
  id: string;
  role: string;
  joinedAt: string;
  club: Club;
  department?: Department;
}

interface JoinedClubsData {
  memberships: Membership[];
  totalClubs: number;
}

const JoinedClubs = () => {
  const [data, setData] = useState<JoinedClubsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinedClubs = async () => {
      try {
        const response = await fetch("/api/dashboard/joinedclubs");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch joined clubs");
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedClubs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      PRESIDENT: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      TREASURER: "bg-green-500/20 text-green-300 border-green-500/30",
      HR: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      MARKETING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      MEMBER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      ALUMNI: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    };
    return colors[role] || colors.MEMBER;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error loading clubs</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || data.memberships.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <div className="text-xl text-gray-300 mb-2">No clubs joined yet</div>
          <div className="text-gray-500">
            Start exploring and join some clubs!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Clubs</h1>
        <div className="text-sm text-gray-400">
          {data.totalClubs} club{data.totalClubs !== 1 ? "s" : ""} joined
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.memberships.map((membership) => (
          <SpotlightCard
            key={membership.id}
            className="transition-transform duration-200 hover:scale-105"
            spotlightColor="rgba(139, 92, 246, 0.15)"
          >
            <div className="space-y-4">
              {/* Club Header */}
              <div className="space-y-2">
                {membership.club.coverImage && (
                  <img
                    src={membership.club.coverImage}
                    alt={membership.club.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}

                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold text-white line-clamp-2">
                    {membership.club.name}
                  </h3>
                  {!membership.club.approved && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {membership.club.university}
                </div>
              </div>

              {/* Role & Department */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded border ${getRoleBadgeColor(
                      membership.role
                    )}`}
                  >
                    {membership.role}
                  </span>
                  {membership.department && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                      {membership.department.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {membership.club.description && (
                <p className="text-gray-300 text-sm line-clamp-3">
                  {membership.club.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-700">
                <div className="flex items-center text-gray-400 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Joined {formatDate(membership.joinedAt)}
                </div>

                <div className="flex items-center space-x-2">
                  {membership.club.contactEmail && (
                    <a
                      href={`mailto:${membership.club.contactEmail}`}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Contact club"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {membership.club.website && (
                    <a
                      href={membership.club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Visit website"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {/* Add this button */}

                  <a
                    href={`/dashboard/joinedclubs/${membership.club.id}`}
                    className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors duration-200 flex items-center gap-1"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
};

export default JoinedClubs;
