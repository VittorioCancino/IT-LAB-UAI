import { Router, Request, Response } from "express";
import {
    checkIn,
    listActiveUsers,
    listInactiveUsers,
    listAllUsersAttendance,
    checkOut,
    getTopUsers,
    getLabUtilization,
    getMonthlyUtilization,
    getHourlyUtilization,
} from "../controllers/Attendance.Controller";
import { jwtAuth } from "../middleware/jwtAuth.middleware";
import { forceAttendanceAutoCheckout } from "../scheduler/attendanceAutoCheckout";

const router: Router = Router();

// Public endpoints for verification (no auth required)
router.post("/public-check-in", (req: Request, res: Response) => {
    checkIn(req, res);
});

router.post("/public-check-out", (req: Request, res: Response) => {
    checkOut(req, res);
});

router.post("/check-in-user", jwtAuth, (req: Request, res: Response) => {
    checkIn(req, res);
});

router.post("/check-out-user", jwtAuth, (req: Request, res: Response) => {
    checkOut(req, res);
});

router.get("/list-active-users", jwtAuth, (req: Request, res: Response) => {
    listActiveUsers(req, res);
});

router.get("/list-inactive-users", jwtAuth, (req: Request, res: Response) => {
    listInactiveUsers(req, res);
});

router.get("/list-all-users", jwtAuth, (req: Request, res: Response) => {
    listAllUsersAttendance(req, res);
});

router.get("/top-users", jwtAuth, (req: Request, res: Response) => {
    getTopUsers(req, res);
});

router.get("/lab-utilization", jwtAuth, (req: Request, res: Response) => {
    getLabUtilization(req, res);
});

router.get("/monthly-utilization", jwtAuth, (req: Request, res: Response) => {
    getMonthlyUtilization(req, res);
});

router.get("/hourly-utilization", jwtAuth, (req: Request, res: Response) => {
    getHourlyUtilization(req, res);
});

router.post("/force-auto-checkout", async (req: Request, res: Response) => {
    await forceAttendanceAutoCheckout();
    res.status(200).json({ message: "Force auto-checkout executed." });
});

export default router;
