import React, { useState, useEffect } from "react";
import {
  getVerificationUser,
  checkInUserPublic,
  checkOutUserPublic,
  listReasonsPublic,
  Reason,
} from "../../../api/VerificationApi";
import { listUsers, User } from "../../../api/UsersApi";

const APP_PREFIX = import.meta.env.VITE_APP_PREFIX || "";

export default function VerificationButtons() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [testEnv, setTestEnv] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "arrival" | "departure" | null
  >(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  useEffect(() => {
    loadReasons();
  }, []);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadReasons = async () => {
    try {
      const reasonsList = await listReasonsPublic();
      setReasons(reasonsList);
      if (reasonsList.length > 0) {
        setSelectedReason(reasonsList[0].Name);
      }
    } catch (error) {
      console.error("Error loading reasons:", error);
      // Set default reason if API fails
      setSelectedReason("General");
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await listUsers();
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
      setMessage("Error loading users. Please try again.");
    }
  };

  const handleUserSelection = async (email: string) => {
    setShowUserModal(false);
    setConfirmationEmail(email);
    setShowConfirmationModal(true);
  };

  const handleConfirmUser = async (confirmed: boolean) => {
    setShowConfirmationModal(false);

    if (!confirmed) {
      setConfirmationEmail("");
      setPendingAction(null);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (pendingAction === "arrival") {
        await checkInUserPublic({
          email: confirmationEmail,
          checkIn: new Date(),
          Reason: selectedReason || "General",
        });
        setMessage(`Arrival recorded successfully for ${confirmationEmail}!`);
      } else if (pendingAction === "departure") {
        await checkOutUserPublic({
          email: confirmationEmail,
          checkOut: new Date(),
        });
        setMessage(`Departure recorded successfully for ${confirmationEmail}!`);
      }
    } catch (error: any) {
      console.error(`Error recording ${pendingAction}:`, error);
      const errorMessage =
        error?.response?.data?.message ||
        `Error recording ${pendingAction}. Please try again.`;
      setMessage(errorMessage);
    } finally {
      setLoading(false);
      setPendingAction(null);
      setSelectedUserEmail("");
      setConfirmationEmail("");
    }
  };

  const handleArrival = async () => {
    if (testEnv) {
      await loadUsers();
      setPendingAction("arrival");
      setShowUserModal(true);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const verificationResponse = await getVerificationUser();
      const userEmail = verificationResponse.email;

      if (!userEmail) {
        setMessage(
          "No user detected. Please ensure you are properly authenticated.",
        );
        return;
      }

      // Show confirmation modal for normal verification too
      setLoading(false);
      setConfirmationEmail(userEmail);
      setPendingAction("arrival");
      setShowConfirmationModal(true);
    } catch (error: any) {
      console.error("Error recording arrival:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Error recording arrival. Please try again.";
      setMessage(errorMessage);
      setLoading(false);
    }
  };

  const handleDeparture = async () => {
    if (testEnv) {
      await loadUsers();
      setPendingAction("departure");
      setShowUserModal(true);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const verificationResponse = await getVerificationUser();
      const userEmail = verificationResponse.email;

      if (!userEmail) {
        setMessage(
          "No user detected. Please ensure you are properly authenticated.",
        );
        return;
      }

      // Show confirmation modal for normal verification too
      setLoading(false);
      setConfirmationEmail(userEmail);
      setPendingAction("departure");
      setShowConfirmationModal(true);
    } catch (error: any) {
      console.error("Error recording departure:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Error recording departure. Please try again.";
      setMessage(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-md mx-4 flex flex-col items-center">
      <img
        src={`/lab/CA_logo_trans.png`}
        alt="LAB-Control Logo"
        className="h-24 sm:h-48 w-auto mb-4 sm:mb-6"
      />

      {/* Test Environment Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Manual:</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={testEnv}
            onChange={(e) => setTestEnv(e.target.checked)}
            title="Toggle test mode"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
        </label>
        <span
          className={`text-xs font-medium ${testEnv ? "text-blue-600" : "text-gray-500"}`}
        >
          {testEnv ? "ON" : "OFF"}
        </span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900">
        Lab Access Control
      </h1>

      {message && (
        <div
          className={`mb-4 sm:mb-6 p-3 rounded-md text-sm text-center w-full ${
            message.includes("Error") ||
            message.includes("error") ||
            message.includes("No user")
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Reason Selection for Arrival */}
      {reasons.length > 0 && (
        <div className="w-full mb-4 sm:mb-6">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for Visit
          </label>
          <select
            id="reason"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            {reasons.map((reason) => (
              <option key={reason.Id} value={reason.Name}>
                {reason.Name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 w-full">
        <button
          onClick={handleArrival}
          disabled={loading}
          className="w-full bg-purple-700 hover:bg-purple-900 disabled:bg-green-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-md touch-manipulation"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Record Arrival
            </div>
          )}
        </button>

        <button
          onClick={handleDeparture}
          disabled={loading}
          className="w-full bg-gray-500 hover:bg-gray-700 disabled:bg-red-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:scale-100 shadow-md touch-manipulation"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Record Departure
            </div>
          )}
        </button>
      </div>

      {/* User Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Confirm Identity
            </h3>

            <p className="text-center mb-6 text-gray-700">
              ¿Tú eres{" "}
              <span className="font-semibold text-blue-600">
                {confirmationEmail}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleConfirmUser(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => handleConfirmUser(false)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-120 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">
              Select User for{" "}
              {pendingAction === "arrival" ? "Arrival" : "Departure"}
            </h3>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto mb-4">
              {users
                .filter(
                  (user) =>
                    user.Email.toLowerCase().includes(
                      selectedUserEmail.toLowerCase(),
                    ) ||
                    user.Name.toLowerCase().includes(
                      selectedUserEmail.toLowerCase(),
                    ) ||
                    user.LastName.toLowerCase().includes(
                      selectedUserEmail.toLowerCase(),
                    ),
                )
                .map((user) => (
                  <button
                    key={user.Id}
                    onClick={() => handleUserSelection(user.Email)}
                    className="w-full text-left p-3 hover:bg-gray-100 border-b border-gray-200 transition-colors"
                  >
                    <div className="font-medium">
                      {user.Name} {user.LastName}
                    </div>
                    <div className="text-sm text-gray-600">{user.Email}</div>
                  </button>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setPendingAction(null);
                  setSelectedUserEmail("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
