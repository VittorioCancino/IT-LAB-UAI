import { Router } from "express";
import {
    getHeartbeatStatus,
    getHeartbeatHistory,
    resetHeartbeatStats,
    triggerManualHeartbeat,
} from "../controllers/HeartbeatStatus.Controller";

const router = Router();

// GET /api/heartbeat-status - Get current heartbeat status
router.get("/", getHeartbeatStatus);

// GET /api/heartbeat-status/history - Get heartbeat history
router.get("/history", getHeartbeatHistory);

// POST /api/heartbeat-status/reset - Reset heartbeat statistics
router.post("/reset", resetHeartbeatStats);

// POST /api/heartbeat-status/manual - Trigger manual heartbeat
router.post("/manual", triggerManualHeartbeat);

export default router;
