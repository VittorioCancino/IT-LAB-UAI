import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminInfo, User } from "../../api/UsersApi";
import { useSidebar } from "../../context/SidebarContext";

// Import components
import Sidebar from "../page_components/AdministratorPanel/Sidebar";
import Header from "../page_components/AdministratorPanel/Header";
import DashboardContent from "../page_components/AdministratorPanel/Dashboard/DashboardContent";
import UsersManagement from "../page_components/AdministratorPanel/Users/UsersManagement";
import RolesManagement from "../page_components/AdministratorPanel/Roles/RolesManagement";
import ReasonsManagement from "../page_components/AdministratorPanel/Reasons/ReasonsManagement";
import AdminsManagement from "../page_components/AdministratorPanel/Admins/AdminsManagement";
import VerificationButtons from "../page_components/Verification/VerificationButtons";

export default function AdministratorPanel() {
  const { isAuthenticated, adminId, userId } = useAuth();
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Fetch user information
    const fetchUserInfo = async () => {
      try {
        if (userId) {
          const userData = await getAdminInfo(userId);
          setUserInfo(userData);
        }
      } catch (err) {
        setError("Failed to load user information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [isAuthenticated, userId, navigate]);

  // Display loading state while fetching user info
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Display error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            onClick={() => navigate("/login")}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const fullName = userInfo
    ? `${userInfo.Name} ${userInfo.LastName}`
    : "Administrator";
  const email = userInfo ? userInfo.Email : "";

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with user info passed in */}
      <Sidebar userName={fullName} userEmail={email} />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ${collapsed ? "ml-24" : "ml-64"} transition-all duration-300`}
      >
        {/* Admin Header */}
        <Header />

        {/* Page Content - Now uses Routes */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardContent />} />
              <Route path="/admins" element={<AdminsManagement />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/roles" element={<RolesManagement />} />
              <Route path="/reasons" element={<ReasonsManagement />} />
              <Route
                path="/verification"
                element={
                  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <VerificationButtons />
                  </div>
                }
              />
              <Route path="*" element={<DashboardContent />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
