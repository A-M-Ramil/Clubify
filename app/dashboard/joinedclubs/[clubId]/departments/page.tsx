"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  Plus,
  Edit,
  Trash2,
  Users,
  Save,
  X,
} from "lucide-react";

// Types
interface Department {
  id: string;
  name: string;
  createdAt: string;
  members: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }[];
  events: any[];
}

interface DepartmentsData {
  departments: Department[];
  canManage: boolean;
}

const DepartmentsPage = () => {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId as string;

  const [data, setData] = useState<DepartmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [editDeptName, setEditDeptName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, [clubId]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/departments`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch departments");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;

    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/departments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newDeptName.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create department");
      }

      await fetchDepartments();
      setIsCreating(false);
      setNewDeptName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create department"
      );
    }
  };

  const handleUpdateDepartment = async (deptId: string) => {
    if (!editDeptName.trim()) return;

    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/departments/${deptId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: editDeptName.trim() }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update department");
      }

      await fetchDepartments();
      setEditingDept(null);
      setEditDeptName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update department"
      );
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this department? All members will be moved to no department."
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/departments/${deptId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete department");
      }

      await fetchDepartments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete department"
      );
    }
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
              <h1 className="text-3xl font-bold text-white">Departments</h1>
              <p className="text-gray-400">
                {data.departments.length} departments
              </p>
            </div>
          </div>

          {data.canManage && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
        </div>

        {/* Create Department Form */}
        {isCreating && (
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Create New Department
            </h3>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Department name"
                className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleCreateDepartment()
                }
              />
              <button
                onClick={handleCreateDepartment}
                disabled={!newDeptName.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewDeptName("");
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.departments.map((department) => (
            <div
              key={department.id}
              className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 hover:border-neutral-700 transition-colors"
            >
              {/* Department Header */}
              <div className="flex items-center justify-between mb-4">
                {editingDept === department.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={editDeptName}
                      onChange={(e) => setEditDeptName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        handleUpdateDepartment(department.id)
                      }
                    />
                    <button
                      onClick={() => handleUpdateDepartment(department.id)}
                      disabled={!editDeptName.trim()}
                      className="p-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingDept(null);
                        setEditDeptName("");
                      }}
                      className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {department.name}
                      </h3>
                    </div>

                    {data.canManage && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingDept(department.id);
                            setEditDeptName(department.name);
                          }}
                          className="p-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                          title="Edit department"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="p-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                          title="Delete department"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Department Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    Members
                  </div>
                  <span className="text-white font-semibold">
                    {department.members.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Events</span>
                  <span className="text-white font-semibold">
                    {department.events.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white text-xs">
                    {formatDate(department.createdAt)}
                  </span>
                </div>
              </div>

              {/* Recent Members */}
              {department.members.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-sm text-gray-400 mb-2">Recent Members</p>
                  <div className="space-y-1">
                    {department.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-white text-sm truncate">
                          {member.user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {member.role}
                        </span>
                      </div>
                    ))}
                    {department.members.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{department.members.length - 3} more members
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {data.departments.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <Building className="mx-auto h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-xl text-gray-300 mb-2">No departments yet</h3>
            <p className="text-gray-500 mb-6">
              Create departments to organize your club members
            </p>
            {data.canManage && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                Create First Department
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;
