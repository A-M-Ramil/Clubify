"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Crown,
  Shield,
  UserX,
  Edit,
  Save,
  X,
} from "lucide-react";

// Types
interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
  };
}

interface MembersData {
  members: Member[];
  canManage: boolean;
}

const MembersPage = () => {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [data, setData] = useState<MembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const roles = [
    "PRESIDENT",
    "TREASURER",
    "HR",
    "MARKETING",
    "MEMBER",
    "ALUMNI",
  ];

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/members`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch members");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (targetUserId: string, newRole: string) => {
    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/members`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetUserId, newRole }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role");
      }

      // Refresh members list
      await fetchMembers();
      setEditingMember(null);
      setSelectedRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/members`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetUserId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove member");
      }

      // Refresh members list
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "PRESIDENT":
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case "TREASURER":
      case "HR":
      case "MARKETING":
        return <Shield className="h-4 w-4 text-blue-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      PRESIDENT: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      TREASURER: "bg-green-500/20 text-green-300 border-green-500/30",
      HR: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      MARKETING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      MEMBER: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      ALUMNI: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };
    return colors[role] || colors.MEMBER;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Club Details
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Club Members</h1>
              <p className="text-gray-400">
                {data.members.length} total members
              </p>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-xl font-semibold">All Members</h2>
          </div>

          <div className="divide-y divide-neutral-800">
            {data.members.map((member) => (
              <div
                key={member.id}
                className="px-6 py-4 hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRoleIcon(member.role)}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {member.user.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {member.user.email}
                      </p>
                      {member.department && (
                        <p className="text-blue-400 text-xs">
                          Dept: {member.department.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {editingMember === member.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm"
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              handleRoleUpdate(member.user.id, selectedRole)
                            }
                            disabled={!selectedRole}
                            className="p-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(null);
                              setSelectedRole("");
                            }}
                            className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </span>
                          <p className="text-gray-500 text-xs mt-1">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </>
                      )}
                    </div>

                    {data.canManage && editingMember !== member.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingMember(member.id);
                            setSelectedRole(member.role);
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                          title="Edit role"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {member.role !== "PRESIDENT" && (
                          <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                            title="Remove member"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.members.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">No members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
