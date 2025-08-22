import cron from "node-cron";
import Attendance from "../models/Attendance.model";
import { Op } from "sequelize";
import { getLabConfiguration } from "../config/instance.config";

// Set your timezone if needed, e.g., 'America/Santiago'

export async function forceAttendanceAutoCheckout() {
    const today = new Date();
    const dataDeadline = getLabConfiguration();
    const dataDeadlineArray = dataDeadline.finalHour.split(":");
    const DEADLINE_HOUR = parseInt(dataDeadlineArray[0]);
    const DEADLIN_MINUTE = parseInt(dataDeadlineArray[1]);
    today.setHours(DEADLINE_HOUR, DEADLIN_MINUTE, 0, 0);

    try {
        await Attendance.update(
            { CheckOut: today },
            {
                where: {
                    CheckOut: null,
                    CheckIn: { [Op.lte]: today },
                },
            },
        );
    } catch (error) {}
}

export function startAttendanceAutoCheckout() {
    const dataDeadline = getLabConfiguration();
    const [hour, minute] = dataDeadline.finalHour.split(":"); // Destructuring más limpio

    const cronExpression = `${minute} ${hour} * * *`;
    console.log(`Programando auto-checkout con expresión: ${cronExpression}`);

    cron.schedule(
        cronExpression,
        async () => {
            console.log(`Ejecutando auto-checkout programado...`);
            await forceAttendanceAutoCheckout();
        },
        {
            timezone: "America/Santiago",
        },
    );
}
