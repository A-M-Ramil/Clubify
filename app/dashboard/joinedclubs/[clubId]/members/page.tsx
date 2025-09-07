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
  Building2,
  UserPlus,
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

interface Department {
  id: string;
  name: string;
}

interface MembersData {
  members: Member[];
  departments: Department[];
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [showAddToDept, setShowAddToDept] = useState<string | null>(null);

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
          body: JSON.stringify({
            targetUserId,
            newRole,
            action: "updateRole",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role");
      }

      await fetchMembers();
      setEditingMember(null);
      setSelectedRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleDepartmentUpdate = async (
    targetUserId: string,
    departmentId: string
  ) => {
    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/members`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId,
            departmentId,
            action: "updateDepartment",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update department");
      }

      await fetchMembers();
      setShowAddToDept(null);
      setSelectedDepartment("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update department"
      );
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

      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "PRESIDENT":
        return <Crown className="h-4 w-4 text-amber-400" />;
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
      PRESIDENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      TREASURER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      HR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      MARKETING: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      MEMBER: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      ALUMNI: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[role as keyof typeof colors] || colors.MEMBER;
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-medium text-white">Members</h1>
              <p className="text-white/40 text-sm">
                {data.members.length} total members
              </p>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.05] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05]">
            <h2 className="text-lg font-medium">All Members</h2>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {data.members.map((member) => (
              <div
                key={member.id}
                className="px-6 py-5 hover:bg-white/[0.01] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getRoleIcon(member.role)}
                    </div>

                    <div>
                      <h3 className="text-base font-medium text-white">
                        {member.user.name}
                      </h3>
                      <p className="text-white/40 text-sm">
                        {member.user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {member.department ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-blue-400" />
                            <span className="text-blue-400 text-xs">
                              {member.department.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs">
                            No department
                          </span>
                        )}
                        <span className="text-white/20">•</span>
                        <span className="text-white/40 text-xs">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Role Display/Edit */}
                    <div className="text-right">
                      {editingMember === member.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                          >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                              <option
                                key={role}
                                value={role}
                                style={{ backgroundColor: "#18181b" }}
                              >
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              handleRoleUpdate(member.user.id, selectedRole)
                            }
                            disabled={!selectedRole}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:bg-white/5 disabled:text-white/20 text-emerald-400 rounded-lg transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(null);
                              setSelectedRole("");
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleBadgeColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      )}
                    </div>

                    {/* Department Management */}
                    {data.canManage && showAddToDept === member.id && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedDepartment}
                          onChange={(e) =>
                            setSelectedDepartment(e.target.value)
                          }
                          className="px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                        >
                          <option value="">Select Department</option>
                          {data.departments?.map((dept) => (
                            <option
                              key={dept.id}
                              value={dept.id}
                              style={{ backgroundColor: "#18181b" }}
                            >
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            handleDepartmentUpdate(
                              member.user.id,
                              selectedDepartment
                            )
                          }
                          disabled={!selectedDepartment}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-white/5 disabled:text-white/20 text-blue-400 rounded-lg transition-colors"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddToDept(null);
                            setSelectedDepartment("");
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {data.canManage &&
                      editingMember !== member.id &&
                      showAddToDept !== member.id && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingMember(member.id);
                              setSelectedRole(member.role);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 rounded-lg transition-colors"
                            title="Edit role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setShowAddToDept(member.id);
                              setSelectedDepartment(
                                member.department?.id || ""
                              );
                            }}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                            title="Manage department"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>

                          {member.role !== "PRESIDENT" && (
                            <button
                              onClick={() => handleRemoveMember(member.user.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
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
              <Users className="mx-auto h-12 w-12 text-white/20 mb-4" />
              <p className="text-white/40">No members found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
