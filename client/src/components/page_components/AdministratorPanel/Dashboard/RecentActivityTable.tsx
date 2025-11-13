import React, { useState, useEffect } from "react";
import {
  getRecentActivity,
  getAllActivity,
  ActivityEvent,
} from "../../../../api/AttendanceApi";
import * as XLSX from "xlsx";

interface RecentActivityTableProps {
  refreshTrigger?: number;
}

export default function RecentActivityTable({
  refreshTrigger,
}: RecentActivityTableProps) {
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentActivity();

    // Refresh every minute
    const interval = setInterval(fetchRecentActivity, 60000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchRecentActivity();
    }
  }, [refreshTrigger]);

  const fetchRecentActivity = async () => {
    try {
      const activity = await getRecentActivity(10);
      setRecentActivity(activity);
      setError(null);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setError("Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Fetch all activity records
      const allActivity = await getAllActivity();

      // Prepare data for Excel
      const excelData = allActivity.map((activity) => ({
        "ID Asistencia": activity.AttendanceId,
        RUT: activity.Rut,
        Nombre: activity.Name,
        Apellido: activity.LastName,
        Email: activity.Email,
        "Tipo de Evento":
          activity.EventType === "CheckIn" ? "Entrada" : "Salida",
        "Fecha y Hora": new Date(activity.EventTime).toLocaleString("es-CL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        Razón: activity.Reason,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Registro de Actividad",
      );

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(excelData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...excelData.map(
            (row) => String(row[key as keyof typeof row]).length,
          ),
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet["!cols"] = colWidths;

      // Generate filename with current date
      const fileName = `Registro_Actividad_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      alert("Error al exportar los datos. Por favor intenta nuevamente.");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityIcon = (activity: ActivityEvent) => {
    if (activity.EventType === "CheckOut") {
      // User has checked out
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>
      );
    } else {
      // User has checked in (still active)
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </div>
      );
    }
  };

  const getActivityText = (activity: ActivityEvent) => {
    const userName = `${activity.Name} ${activity.LastName}`;

    if (activity.EventType === "CheckOut") {
      return (
        <>
          <span className="font-medium text-gray-900">{userName}</span>
          <span className="text-gray-600"> left the lab</span>
          <span className="text-gray-500"> • {activity.Reason}</span>
        </>
      );
    } else {
      return (
        <>
          <span className="font-medium text-gray-900">{userName}</span>
          <span className="text-gray-600"> entered the lab</span>
          <span className="text-gray-500"> • {activity.Reason}</span>
        </>
      );
    }
  };

  const getActivityTime = (activity: ActivityEvent) => {
    return getTimeAgo(activity.EventTime);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="pb-3 border-b border-gray-100 animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Recent Activity
        </h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={fetchRecentActivity}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportToExcel}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
            title="Exportar a Excel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={fetchRecentActivity}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
            title="Refresh"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {recentActivity.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">
            Activity updates automatically every minute
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div
              key={`${activity.AttendanceId}-${activity.EventType}-${activity.EventTime}`}
              className="pb-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                {getActivityIcon(activity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getActivityTime(activity)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()} • Updates every
              minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
