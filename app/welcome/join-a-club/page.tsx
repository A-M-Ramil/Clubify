"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Building2,
  Mail,
  Globe,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";

interface Club {
  id: string;
  name: string;
  university: string;
  description: string;
  contactEmail: string;
  website: string;
  coverImage: string;
  memberCount: number;
  departmentCount: number;
  eventCount: number;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    clubs: Club[];
    userUniversity: string;
    totalAvailable: number;
  };
  error?: string;
}

export default function JoinClubPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userUniversity, setUserUniversity] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchAvailableClubs();
  }, []);

  useEffect(() => {
    const filtered = clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClubs(filtered);
  }, [searchTerm, clubs]);

  const fetchAvailableClubs = async () => {
    try {
      const response = await fetch("/api/welcome/join-a-club");
      const data: ApiResponse = await response.json();

      if (data.success) {
        setClubs(data.data.clubs);
        setFilteredClubs(data.data.clubs);
        setUserUniversity(data.data.userUniversity);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to fetch clubs",
        });
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
      setMessage({ type: "error", text: "Failed to fetch available clubs" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId: string, clubName: string) => {
    setJoining(clubId);
    setMessage(null);

    try {
      const response = await fetch("/api/welcome/join-a-club", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Successfully joined ${clubName}!`,
        });
        // Remove the joined club from the list
        setClubs((prev) => prev.filter((club) => club.id !== clubId));
        setFilteredClubs((prev) => prev.filter((club) => club.id !== clubId));
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to join club",
        });
      }
    } catch (error) {
      console.error("Error joining club:", error);
      setMessage({
        type: "error",
        text: "Failed to join club. Please try again.",
      });
    } finally {
      setJoining(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading available clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header Section */}
      <div className="bg-primary backdrop-blur-sm border-b border-secondary sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">
              Join a Club at{" "}
              <span className="text-indigo-600">{userUniversity}</span>
            </h1>
            <p className="text-xl text-light max-w-2xl mx-auto">
              Discover amazing clubs, build connections, and enhance your
              university experience
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
            <input
              type="text"
              placeholder="Search clubs by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-light rounded-xl focus:ring-2 text-white focus:ring-indigo-500 focus:border-transparent text-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div
            className={`p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8 text-center">
          <p className="text-lg text-light">
            <span className="font-semibold text-indigo-600">
              {filteredClubs.length}
            </span>{" "}
            clubs available to join
            {searchTerm && ` (filtered from ${clubs.length} total)`}
          </p>
        </div>

        {/* Clubs Grid */}
        {filteredClubs.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? "No clubs found" : "No clubs available"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms to find clubs"
                : "There are no clubs available to join at your university yet. Check back later!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                className="bg-primary rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-secondary"
              >
                {/* Club Cover Image */}
                <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
                  {club.coverImage ? (
                    <img
                      src={club.coverImage}
                      alt={club.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
                      {club.name}
                    </h3>
                  </div>
                </div>

                {/* Club Content */}
                <div className="p-6">
                  {/* Description */}
                  <p className="text-[#b4b4b4] mb-4 line-clamp-3 leading-relaxed">
                    {club.description || "No description available"}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2 mx-auto">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-light">Members</p>
                      <p className="font-semibold text-white">
                        {club.memberCount}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2 mx-auto">
                        <Building2 className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm text-light">Departments</p>
                      <p className="font-semibold text-white">
                        {club.departmentCount}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2 mx-auto">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-sm text-light">Events</p>
                      <p className="font-semibold text-white">
                        {club.eventCount}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-6">
                    {club.contactEmail && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{club.contactEmail}</span>
                      </div>
                    )}
                    {club.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-4 h-4 mr-2 text-gray-400" />
                        <a
                          href={club.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinClub(club.id, club.name)}
                    disabled={joining === club.id}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center group"
                  >
                    {joining === club.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                        Join Club
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-primary backdrop-blur-sm border-t border-gray-200/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-light">
            Can't find the club you're looking for?
            <a
              href="/dashboard/create-club"
              className="text-indigo-600 hover:text-indigo-800 font-medium ml-1"
            >
              Create a new club
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
