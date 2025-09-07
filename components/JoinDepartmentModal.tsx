"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface JoinDepartmentModalProps {
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onJoin: (departmentId: string) => void;
}

const JoinDepartmentModal: React.FC<JoinDepartmentModalProps> = ({
  departments,
  isOpen,
  onClose,
  onJoin,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("");

  if (!isOpen) return null;

  const handleJoin = () => {
    if (selectedDept) {
      onJoin(selectedDept);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Join a Department</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Select a department to join
            </label>
            <select
              id="department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" disabled>
                Select a department
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={!selectedDept}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinDepartmentModal;
