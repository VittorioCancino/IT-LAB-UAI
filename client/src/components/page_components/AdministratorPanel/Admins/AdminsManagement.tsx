import React, { useEffect, useState } from "react";
import {
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  AdminListResponse,
} from "../../../../api/AdminsApi";
import { assignRoleToUser } from "../../../../api/UsersApi";
import AdminModal from "./AdminModal";

// Nombres completos de administradores a ocultar
const HIDDEN_ADMIN_NAMES = ["Default Administrator", "Super Administrator"];

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<AdminListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAdmins = async () => {
    try {
      setError(null);
      const adminsData = await getAllAdmins();
      // Filtrar administradores ocultos
      const filteredAdmins = adminsData.filter((admin) => {
        const fullName = `${admin.User.Name} ${admin.User.LastName}`;
        return !HIDDEN_ADMIN_NAMES.includes(fullName);
      });
      setAdmins(filteredAdmins);
    } catch (err: any) {
      setError("Failed to load administrators");
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (adminData: any) => {
    try {
      await createAdmin(adminData);
      await assignRoleToUser(adminData.Email, "Administrator");
      await fetchAdmins();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error creating admin:", err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (
      !window.confirm("Are you sure you want to delete this administrator?")
    ) {
      return;
    }

    setDeletingId(adminId);
    try {
      await deleteAdmin(adminId);
      await fetchAdmins();
    } catch (err: any) {
      setError("Failed to delete administrator");
      console.error("Error deleting admin:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-2 text-gray-600">Loading administrators...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administrators Management
          </h1>
          <p className="text-gray-600">Manage system administrators</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Administrator
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Administrators Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Administrators ({admins.length})
          </h3>
        </div>

        {admins.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No administrators found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Administrator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {admin.User.Name.charAt(0)}
                              {admin.User.LastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.User.Name} {admin.User.LastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Admin ID: {admin.Id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.User.Rut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.User.Email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.User.Status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.User.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteAdmin(admin.Id)}
                        disabled={deletingId === admin.Id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === admin.Id ? (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAdmin}
      />
    </div>
  );
}
