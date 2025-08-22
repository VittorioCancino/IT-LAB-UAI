import { Request, Response } from "express";
import User from "../models/User.model";
import Attendance from "../models/Attendance.model";
import ReasonModel from "../models/Reason.model"; // Alias to avoid shadowing
import { INSTANCE_CONFIG } from "../config/instance.config";

// Utility function to safely parse date strings to avoid timezone issues
const parseQueryDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
};

// NEW: Utility function to parse time strings and create Date objects
const parseTimeToDate = (targetDate: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        hours,
        minutes,
        0,
    );
};

// NEW: Get working hours range from configuration
const getWorkingHoursRange = (targetDate: Date) => {
    const startOfDay = parseTimeToDate(targetDate, INSTANCE_CONFIG.inicialHour);
    const endOfDay = parseTimeToDate(targetDate, INSTANCE_CONFIG.finalHour);

    return { startOfDay, endOfDay };
};

// NEW: Generate working hours array dynamically
const getWorkingHoursArray = (): number[] => {
    const [startHour] = INSTANCE_CONFIG.inicialHour.split(":").map(Number);
    const [endHour] = INSTANCE_CONFIG.finalHour.split(":").map(Number);

    const hours: number[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        hours.push(hour);
    }
    return hours;
};

// DTOs
export interface UserCheckInDTO {
    email: string;
    checkIn: string | Date;
    Reason: string;
}

export interface UserCheckOutDTO {
    email: string;
    checkOut: string | Date;
}

export const checkIn = async (
    req: Request<{}, {}, UserCheckInDTO>,
    res: Response,
) => {
    const { email, checkIn, Reason } = req.body;

    if (!email || !checkIn || !Reason) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const user = await User.findOne({ where: { Email: email } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Prevent multiple open check-ins
        const openAttendance = await Attendance.findOne({
            where: { UserId: user.Id, CheckOut: null },
        });
        if (openAttendance) {
            return res.status(400).json({
                message:
                    "User already has an open check-in. Please check out first.",
            });
        }

        const reason = await ReasonModel.findOne({ where: { Name: Reason } });
        if (!reason) {
            return res.status(404).json({ message: "Reason not found." });
        }

        const attendance = await Attendance.create({
            UserId: user.Id,
            ReasonId: reason.Id,
            CheckIn: new Date(checkIn),
            CheckOut: null,
        });

        return res.status(201).json(attendance);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

function formatAttendanceFlat(attendance: any) {
    return {
        Id: attendance.Id,
        UserId: attendance.UserId,
        ReasonId: attendance.ReasonId,
        CheckIn: attendance.CheckIn,
        CheckOut: attendance.CheckOut,
        Email: attendance.User?.Email,
        Name: attendance.User?.Name,
        LastName: attendance.User?.LastName,
        Rut: attendance.User?.Rut,
        Reason: attendance.Reason?.Name,
    };
}

export const listActiveUsers = async (req: Request, res: Response) => {
    try {
        const activeAttendances = await Attendance.findAll({
            where: { CheckOut: null },
            include: [{ model: User }, { model: ReasonModel }],
        });
        const formatted = activeAttendances.map((a) => formatAttendanceFlat(a));
        return res.status(200).json(formatted);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const listInactiveUsers = async (req: Request, res: Response) => {
    try {
        const inactiveAttendances = await Attendance.findAll({
            where: { CheckOut: { [require("sequelize").Op.not]: null } },
            include: [{ model: User }, { model: ReasonModel }],
        });
        const formatted = inactiveAttendances.map((a) =>
            formatAttendanceFlat(a),
        );
        return res.status(200).json(formatted);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const listAllUsersAttendance = async (req: Request, res: Response) => {
    try {
        const allAttendances = await Attendance.findAll({
            include: [{ model: User }, { model: ReasonModel }],
        });
        const formatted = allAttendances.map((a) => formatAttendanceFlat(a));
        return res.status(200).json(formatted);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const getTopUsers = async (req: Request, res: Response) => {
    try {
        // Get all completed attendance records (with CheckOut)
        const completedAttendances = await Attendance.findAll({
            where: {
                CheckOut: {
                    [require("sequelize").Op.not]: null,
                },
            },
            include: [{ model: User }, { model: ReasonModel }],
        });

        // Calculate total time for each user
        const userStats = new Map();

        completedAttendances.forEach((attendance: any) => {
            const userId = attendance.UserId;
            const checkIn = new Date(attendance.CheckIn);
            const checkOut = new Date(attendance.CheckOut);
            const duration = checkOut.getTime() - checkIn.getTime(); // milliseconds

            if (!userStats.has(userId)) {
                userStats.set(userId, {
                    userId: userId,
                    email: attendance.User?.Email,
                    name: attendance.User?.Name,
                    lastName: attendance.User?.LastName,
                    totalTime: 0,
                    sessionCount: 0,
                });
            }

            const user = userStats.get(userId);
            user.totalTime += duration;
            user.sessionCount += 1;
        });

        // Convert to array and sort by total time
        const sortedUsers = Array.from(userStats.values())
            .sort((a, b) => b.totalTime - a.totalTime)
            .slice(0, 5) // Top 5
            .map((user) => ({
                ...user,
                totalTimeHours:
                    Math.round((user.totalTime / (1000 * 60 * 60)) * 100) / 100, // Convert to hours with 2 decimals
                averageSessionHours:
                    Math.round(
                        (user.totalTime /
                            user.sessionCount /
                            (1000 * 60 * 60)) *
                            100,
                    ) / 100,
            }));

        return res.status(200).json(sortedUsers);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const getLabUtilization = async (req: Request, res: Response) => {
    try {
        const { Op } = require("sequelize");

        // Get date from query parameters, default to today
        const dateParam = req.query.date as string;
        let targetDate: Date;

        if (dateParam) {
            targetDate = parseQueryDate(dateParam);
        } else {
            targetDate = new Date();
        }

        const isToday = targetDate.toDateString() === new Date().toDateString();

        const { startOfDay, endOfDay } = getWorkingHoursRange(targetDate);

        // For active sessions, use current time if viewing today, otherwise use end of day
        const currentTime = new Date();
        const effectiveEndTime =
            isToday && currentTime < endOfDay ? currentTime : endOfDay;

        // Get all attendance records for the target date (both active and completed)
        const dayAttendances = await Attendance.findAll({
            where: {
                CheckIn: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay,
                },
            },
            include: [{ model: User }, { model: ReasonModel }],
        });

        // Constants
        const MAX_CAPACITY = INSTANCE_CONFIG.maxCapacity;

        const workingMilliseconds = endOfDay.getTime() - startOfDay.getTime();
        const TOTAL_MINUTES = workingMilliseconds / (1000 * 60);
        const MAX_POSSIBLE_MINUTES = MAX_CAPACITY * TOTAL_MINUTES;

        // Calculate utilization by minute
        let totalUtilizedMinutes = 0;

        // Create time slots for each minute of the day
        for (let minute = 0; minute < TOTAL_MINUTES; minute++) {
            const currentTimeSlot = new Date(
                startOfDay.getTime() + minute * 60000,
            ); // Add minutes

            // Skip future time slots when viewing today
            if (isToday && currentTimeSlot > currentTime) {
                break;
            }
            let usersAtThisTime = 0;

            // Count how many users were present at this specific minute
            dayAttendances.forEach((attendance: any) => {
                const checkIn = new Date(attendance.CheckIn);
                const checkOut = attendance.CheckOut
                    ? new Date(attendance.CheckOut)
                    : effectiveEndTime;

                // If user was present at this time and the time slot has already passed
                if (checkIn <= currentTimeSlot && checkOut > currentTimeSlot) {
                    usersAtThisTime++;
                }
            });

            // Cap at maximum capacity for calculation
            const effectiveUsers = Math.min(usersAtThisTime, MAX_CAPACITY);
            totalUtilizedMinutes += effectiveUsers;
        }

        // Calculate percentage
        const utilizationPercentage = Math.round(
            (totalUtilizedMinutes / MAX_POSSIBLE_MINUTES) * 100,
        );

        // Convert minutes to hours and minutes for better readability
        const utilizationHours = Math.floor(totalUtilizedMinutes / 60);
        const utilizationMinutesRemainder = totalUtilizedMinutes % 60;

        return res.status(200).json({
            utilizationPercentage,
            totalUtilizedMinutes,
            utilizationHours,
            utilizationMinutesRemainder,
            maxPossibleMinutes: MAX_POSSIBLE_MINUTES,
            currentOccupancy: dayAttendances.filter((a: any) => !a.CheckOut)
                .length,
            maxCapacity: MAX_CAPACITY,
            date: targetDate.toISOString().split("T")[0],
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const getMonthlyUtilization = async (req: Request, res: Response) => {
    try {
        const { Op } = require("sequelize");

        // Get month and year from query parameters, default to current month
        const monthParam = req.query.month as string;
        const yearParam = req.query.year as string;

        const currentDate = new Date();
        const targetMonth = monthParam
            ? parseInt(monthParam) - 1
            : currentDate.getMonth(); // Month is 0-indexed
        const targetYear = yearParam
            ? parseInt(yearParam)
            : currentDate.getFullYear();

        // Get first and last day of the month
        const firstDay = new Date(targetYear, targetMonth, 1);
        const lastDay = new Date(targetYear, targetMonth + 1, 0);

        // Generate all business days in the month (excluding weekends)
        const businessDays = [];
        for (
            let d = new Date(firstDay);
            d <= lastDay;
            d.setDate(d.getDate() + 1)
        ) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // Exclude Sunday (0) and Saturday (6)
                businessDays.push(new Date(d));
            }
        }

        const { startOfDay: sampleStart, endOfDay: sampleEnd } =
            getWorkingHoursRange(firstDay);
        const TOTAL_MINUTES = Math.floor(
            (sampleEnd.getTime() - sampleStart.getTime()) / (1000 * 60),
        );
        const MAX_CAPACITY = INSTANCE_CONFIG.maxCapacity;

        // Calculate utilization for each business day
        const dailyUtilizations = [];
        let totalMonthlyUtilizedMinutes = 0;

        for (const day of businessDays) {
            const { startOfDay, endOfDay } = getWorkingHoursRange(day);

            // Get attendance records for this day
            const dayAttendances = await Attendance.findAll({
                where: {
                    CheckIn: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay,
                    },
                },
                include: [{ model: User }, { model: ReasonModel }],
            });

            // Calculate daily utilization
            let dailyUtilizedMinutes = 0;

            for (let minute = 0; minute < TOTAL_MINUTES; minute++) {
                const currentTime = new Date(
                    startOfDay.getTime() + minute * 60000,
                );
                let usersAtThisTime = 0;

                dayAttendances.forEach((attendance: any) => {
                    const checkIn = new Date(attendance.CheckIn);
                    const checkOut = attendance.CheckOut
                        ? new Date(attendance.CheckOut)
                        : endOfDay;

                    // Only count if the time slot has already passed (for historical days, count all slots)
                    const dayIsInPast =
                        day < new Date(new Date().setHours(0, 0, 0, 0));
                    if (
                        checkIn <= currentTime &&
                        checkOut > currentTime &&
                        (dayIsInPast || currentTime <= new Date())
                    ) {
                        usersAtThisTime++;
                    }
                });

                const effectiveUsers = Math.min(usersAtThisTime, MAX_CAPACITY);
                dailyUtilizedMinutes += effectiveUsers;
            }

            const dailyPercentage = Math.round(
                (dailyUtilizedMinutes / (MAX_CAPACITY * TOTAL_MINUTES)) * 100,
            );
            totalMonthlyUtilizedMinutes += dailyUtilizedMinutes;

            dailyUtilizations.push({
                date: day.toISOString().split("T")[0],
                utilizationPercentage: dailyPercentage,
                utilizedMinutes: dailyUtilizedMinutes,
                activeUsers: dayAttendances.length,
            });
        }

        // Calculate monthly averages
        const totalPossibleMinutes =
            businessDays.length * MAX_CAPACITY * TOTAL_MINUTES;
        const monthlyPercentage = Math.round(
            (totalMonthlyUtilizedMinutes / totalPossibleMinutes) * 100,
        );
        const averageDailyPercentage = Math.round(
            dailyUtilizations.reduce(
                (sum, day) => sum + day.utilizationPercentage,
                0,
            ) / dailyUtilizations.length,
        );

        // Convert total minutes to hours and minutes
        const totalHours = Math.floor(totalMonthlyUtilizedMinutes / 60);
        const totalMinutesRemainder = totalMonthlyUtilizedMinutes % 60;

        return res.status(200).json({
            month: targetMonth + 1, // Convert back to 1-indexed
            year: targetYear,
            monthlyUtilizationPercentage: monthlyPercentage,
            averageDailyUtilizationPercentage: averageDailyPercentage,
            totalUtilizedMinutes: totalMonthlyUtilizedMinutes,
            totalUtilizedHours: totalHours,
            totalUtilizedMinutesRemainder: totalMinutesRemainder,
            businessDaysCount: businessDays.length,
            totalPossibleMinutes,
            dailyBreakdown: dailyUtilizations,
            peakDay: dailyUtilizations.reduce(
                (max, day) =>
                    day.utilizationPercentage > max.utilizationPercentage
                        ? day
                        : max,
                dailyUtilizations[0] || {},
            ),
            lowDay: dailyUtilizations.reduce(
                (min, day) =>
                    day.utilizationPercentage < min.utilizationPercentage
                        ? day
                        : min,
                dailyUtilizations[0] || {},
            ),
        });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const getHourlyUtilization = async (req: Request, res: Response) => {
    try {
        const { Op } = require("sequelize");

        // Get date from query parameters, default to today
        const dateParam = req.query.date as string;
        let targetDate: Date;

        if (dateParam) {
            targetDate = parseQueryDate(dateParam);
        } else {
            targetDate = new Date();
        }

        const isToday = targetDate.toDateString() === new Date().toDateString();

        const { startOfDay, endOfDay } = getWorkingHoursRange(targetDate);

        // For active sessions, use current time if viewing today, otherwise use end of day
        const currentTime = new Date();
        const effectiveEndTime =
            isToday && currentTime < endOfDay ? currentTime : endOfDay;

        // Get all attendance records for the target date
        const dayAttendances = await Attendance.findAll({
            where: {
                CheckIn: {
                    [Op.gte]: startOfDay,
                    [Op.lte]: endOfDay,
                },
            },
            include: [{ model: User }, { model: ReasonModel }],
        });

        // Constants
        const MAX_CAPACITY = INSTANCE_CONFIG.maxCapacity;
        const WORKING_HOURS = getWorkingHoursArray();

        const hourlyData = [];

        // Calculate utilization for each hour
        for (const hour of WORKING_HOURS) {
            const hourStart = new Date(
                targetDate.getFullYear(),
                targetDate.getMonth(),
                targetDate.getDate(),
                hour,
                0,
                0,
            );
            const hourEnd = new Date(
                targetDate.getFullYear(),
                targetDate.getMonth(),
                targetDate.getDate(),
                hour + 1,
                0,
                0,
            );

            // Skip future hours when viewing today
            if (isToday && hourStart > currentTime) {
                continue;
            }

            let totalUtilizedMinutes = 0;
            let maxUsersInHour = 0;

            // Calculate utilization minute by minute for this hour
            for (let minute = 0; minute < 60; minute++) {
                const currentMinute = new Date(
                    hourStart.getTime() + minute * 60000,
                );

                // Skip future minutes when viewing today
                if (isToday && currentMinute > currentTime) {
                    break;
                }

                let usersAtThisMinute = 0;

                // Count users present at this minute
                dayAttendances.forEach((attendance: any) => {
                    const checkIn = new Date(attendance.CheckIn);
                    const checkOut = attendance.CheckOut
                        ? new Date(attendance.CheckOut)
                        : effectiveEndTime;

                    if (checkIn <= currentMinute && checkOut > currentMinute) {
                        usersAtThisMinute++;
                    }
                });

                const effectiveUsers = Math.min(
                    usersAtThisMinute,
                    MAX_CAPACITY,
                );
                totalUtilizedMinutes += effectiveUsers;
                maxUsersInHour = Math.max(maxUsersInHour, usersAtThisMinute);
            }

            // Calculate hourly metrics
            const maxPossibleMinutes = MAX_CAPACITY * 60;
            const hourlyUtilization = Math.round(
                (totalUtilizedMinutes / maxPossibleMinutes) * 100,
            );

            hourlyData.push({
                hour: `${hour.toString().padStart(2, "0")}:00`,
                utilization: hourlyUtilization,
                activeUsers: maxUsersInHour,
                totalMinutes: totalUtilizedMinutes,
            });
        }

        return res.status(200).json(hourlyData);
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};

export const checkOut = async (
    req: Request<{}, {}, UserCheckOutDTO>,
    res: Response,
) => {
    const { email, checkOut } = req.body;

    if (!email || !checkOut) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const user = await User.findOne({ where: { Email: email } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Find the open attendance record
        const openAttendance = await Attendance.findOne({
            where: { UserId: user.Id, CheckOut: null },
        });

        if (!openAttendance) {
            return res
                .status(400)
                .json({ message: "No open check-in found for this user." });
        }

        openAttendance.CheckOut = new Date(checkOut);
        await openAttendance.save();

        return res.status(200).json({ message: "Checked out successfully." });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal server error.", error });
    }
};
