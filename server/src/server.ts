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

    await seedDefaultAdmin();
    await seedDefaultReasons();
    console.log("Database connected and initialized successfully");
  } catch (error) {
    console.log("Error while Trying to Connect to the Database", error);
    process.exit(1); // Exit if database connection fails
  }
}

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Permitir requests sin origin (como apps móviles, Postman, etc.)
    if (!origin) return callback(null, true);

    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // En producción, puedes ser más específico
    const allowedOrigins = [
      /^http:\/\/localhost:\d+$/, // localhost con cualquier puerto
      /^http:\/\/127\.0\.0\.1:\d+$/, // 127.0.0.1 con cualquier puerto
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Red local 192.168.x.x
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Red local 10.x.x.x
      /^http:\/\/client\.k8s$/, // ✅ Agregar dominio de Kubernetes
      /^http:\/\/client\.k8s:\d+$/, // ✅ Con puerto si es necesario
      /^https:\/\/client\.k8s$/, // ✅ HTTPS si usas SSL
      /^https:\/\/client\.k8s:\d+$/, // ✅ HTTPS con puerto
    ];

    const isAllowed = allowedOrigins.some((pattern) => pattern.test(origin));
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
};

export async function initializeServer() {
  await connectDB();
  startAttendanceAutoCheckout();
  startHeartbeat();
  return server;
}

// Setting Up the Server
const server = express();
const cors = require("cors");
server.use(cors(corsOptions));
server.options("*", cors(corsOptions));
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
