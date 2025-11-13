import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_Attendance = axios.create({
  baseURL: `${API_BASE_URL}/attendance`,
});

// Add auth token to requests (for admin functions)
API_Attendance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserCheckInDTO {
  email: string;
  checkIn: string | Date;
  Reason: string;
}

export interface UserCheckOutDTO {
  email: string;
  checkOut: string | Date;
}

export interface ActiveUser {
  Id: number;
  UserId: number;
  ReasonId: number;
  CheckIn: string;
  CheckOut: string | null;
  Email: string;
  Name: string;
  LastName: string;
  Rut: string;
  Reason: string;
}

export interface ActivityEvent {
  Id: number;
  UserId: number;
  ReasonId: number;
  EventTime: string;
  EventType: "CheckIn" | "CheckOut";
  Email: string;
  Name: string;
  LastName: string;
  Rut: string;
  Reason: string;
  AttendanceId: number;
}

export interface TopUser {
  userId: number;
  email: string;
  name: string;
  lastName: string;
  totalTime: number;
  sessionCount: number;
  totalTimeHours: number;
  averageSessionHours: number;
}

export interface LabUtilization {
  utilizationPercentage: number;
  totalUtilizedMinutes: number;
  utilizationHours: number;
  utilizationMinutesRemainder: number;
  maxPossibleMinutes: number;
  currentOccupancy: number;
  maxCapacity: number;
  date: string;
}

export interface DailyUtilization {
  date: string;
  utilizationPercentage: number;
  utilizedMinutes: number;
  activeUsers: number;
}

export interface HourlyUtilization {
  hour: string;
  utilization: number;
  activeUsers: number;
  totalMinutes: number;
}

export interface MonthlyUtilization {
  month: number;
  year: number;
  monthlyUtilizationPercentage: number;
  averageDailyUtilizationPercentage: number;
  totalUtilizedMinutes: number;
  totalUtilizedHours: number;
  totalUtilizedMinutesRemainder: number;
  businessDaysCount: number;
  totalPossibleMinutes: number;
  dailyBreakdown: DailyUtilization[];
  peakDay: DailyUtilization;
  lowDay: DailyUtilization;
}

export const checkInUser = async (data: UserCheckInDTO) => {
  const response = await API_Attendance.post("/check-in-user", data);
  return response.data;
};

export const checkOutUser = async (data: UserCheckOutDTO) => {
  const response = await API_Attendance.post("/check-out-user", data);
  return response.data;
};

export const listActiveUsers = async (): Promise<ActiveUser[]> => {
  const response = await API_Attendance.get("/list-active-users");
  return response.data;
};

export const listInactiveUsers = async () => {
  const response = await API_Attendance.get("/list-inactive-users");
  return response.data;
};

export const listAllUsersAttendance = async () => {
  const response = await API_Attendance.get("/list-all-users");
  return response.data;
};

export const getRecentActivity = async (
  limit: number = 10,
): Promise<ActivityEvent[]> => {
  const response = await API_Attendance.get("/list-all-users");
  const allAttendance = response.data;

  // Convert each attendance record into separate CheckIn and CheckOut events
  const events: ActivityEvent[] = [];

  allAttendance.forEach((attendance: ActiveUser) => {
    // Always add CheckIn event
    events.push({
      Id: attendance.Id,
      UserId: attendance.UserId,
      ReasonId: attendance.ReasonId,
      EventTime: attendance.CheckIn,
      EventType: "CheckIn",
      Email: attendance.Email,
      Name: attendance.Name,
      LastName: attendance.LastName,
      Rut: attendance.Rut,
      Reason: attendance.Reason,
      AttendanceId: attendance.Id,
    });

    // Add CheckOut event if it exists
    if (attendance.CheckOut) {
      events.push({
        Id: attendance.Id,
        UserId: attendance.UserId,
        ReasonId: attendance.ReasonId,
        EventTime: attendance.CheckOut,
        EventType: "CheckOut",
        Email: attendance.Email,
        Name: attendance.Name,
        LastName: attendance.LastName,
        Rut: attendance.Rut,
        Reason: attendance.Reason,
        AttendanceId: attendance.Id,
      });
    }
  });

  // Sort by most recent event time
  const sorted = events.sort((a, b) => {
    const aTime = new Date(a.EventTime).getTime();
    const bTime = new Date(b.EventTime).getTime();
    return bTime - aTime;
  });

  return sorted.slice(0, limit);
};

export const getAllActivity = async (): Promise<ActivityEvent[]> => {
  const response = await API_Attendance.get("/list-all-users");
  const allAttendance = response.data;

  // Convert each attendance record into separate CheckIn and CheckOut events
  const events: ActivityEvent[] = [];

  allAttendance.forEach((attendance: ActiveUser) => {
    // Always add CheckIn event
    events.push({
      Id: attendance.Id,
      UserId: attendance.UserId,
      ReasonId: attendance.ReasonId,
      EventTime: attendance.CheckIn,
      EventType: "CheckIn",
      Email: attendance.Email,
      Name: attendance.Name,
      LastName: attendance.LastName,
      Rut: attendance.Rut,
      Reason: attendance.Reason,
      AttendanceId: attendance.Id,
    });

    // Add CheckOut event if it exists
    if (attendance.CheckOut) {
      events.push({
        Id: attendance.Id,
        UserId: attendance.UserId,
        ReasonId: attendance.ReasonId,
        EventTime: attendance.CheckOut,
        EventType: "CheckOut",
        Email: attendance.Email,
        Name: attendance.Name,
        LastName: attendance.LastName,
        Rut: attendance.Rut,
        Reason: attendance.Reason,
        AttendanceId: attendance.Id,
      });
    }
  });

  // Sort by most recent event time
  const sorted = events.sort((a, b) => {
    const aTime = new Date(a.EventTime).getTime();
    const bTime = new Date(b.EventTime).getTime();
    return bTime - aTime;
  });

  return sorted; // Return all events without limit
};

export const getTopUsers = async (): Promise<TopUser[]> => {
  const response = await API_Attendance.get("/top-users");
  return response.data;
};

export const getLabUtilization = async (
  date?: string,
): Promise<LabUtilization> => {
  const url = date ? `/lab-utilization?date=${date}` : "/lab-utilization";
  const response = await API_Attendance.get(url);
  return response.data;
};

export const getHourlyUtilization = async (
  date?: string,
): Promise<HourlyUtilization[]> => {
  const url = date ? `/hourly-utilization?date=${date}` : "/hourly-utilization";
  const response = await API_Attendance.get(url);
  return response.data;
};

export const getMonthlyUtilization = async (
  month?: number,
  year?: number,
): Promise<MonthlyUtilization> => {
  let url = "/monthly-utilization";
  const params: string[] = [];
  if (month) params.push(`month=${month}`);
  if (year) params.push(`year=${year}`);
  if (params.length > 0) url += `?${params.join("&")}`;

  const response = await API_Attendance.get(url);
  return response.data;
};

export default API_Attendance;
