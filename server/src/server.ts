import express from "express";
import db from "./config/db";
import usersRouter from "./routes/Users.routes";
import adminsRouter from "./routes/Admins.routes";
import loginRouter from "./routes/Login.routes";
import rolesRouter from "./routes/Roles.routes";
import careersRouter from "./routes/Careers.routes";
import reasonsRouter from "./routes/Reasons.routes";
import attendanceRoutes from "./routes/Attendance.routes";
import { startAttendanceAutoCheckout } from "./scheduler/attendanceAutoCheckout";
import { seedDefaultAdmin, seedDefaultReasons } from "./utils/dbSeeder.util";
import { createDatabase } from "./utils/createDatabase";
import { startHeartbeat } from "./utils/heartbeatClient";
import heartbeatStatusRouter from "./routes/HeartbeatStatus.routes";
import configurationRouter from "./routes/Config.routes";

// Define Connection to the Data Base
async function connectDB() {
    try {
        // First, ensure the database exists
        await createDatabase();

        // Then connect to it
        await db.authenticate();
        await db.sync();

        // Seed default admin and reasons after DB sync
        await seedDefaultAdmin();
        await seedDefaultReasons();
        console.log("Database connected and initialized successfully");
    } catch (error) {
        console.log("Error while Trying to Connect to the Database", error);
        process.exit(1); // Exit if database connection fails
    }
}

// Establishing Connection
connectDB();

// Start scheduled attendance auto-checkout
startAttendanceAutoCheckout();

// Start heartbeat system to register with main server
startHeartbeat();

// Setting Up the Server
const server = express();
const cors = require("cors");
server.use(cors());
server.use(express.json());
server.use("/api/users", usersRouter);
server.use("/api/admins", adminsRouter);
server.use("/api/login", loginRouter);
server.use("/api/roles", rolesRouter);
server.use("/api/careers", careersRouter);
server.use("/api/reasons", reasonsRouter);
server.use("/api/attendance", attendanceRoutes);
server.use("/api/heartbeat-status", heartbeatStatusRouter);
server.use("/api/config", configurationRouter);

export default server;
