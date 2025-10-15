import { Request, Response } from "express";
import { getCurrentConfig } from "../config/instance.config";
import { sendHeartbeat } from "../utils/heartbeatClient";

// Store heartbeat attempts and status
interface HeartbeatAttempt {
  timestamp: Date;
  success: boolean;
  responseTime?: number;
  error?: string;
}

// In-memory storage for heartbeat history
const heartbeatHistory: HeartbeatAttempt[] = [];
const MAX_HISTORY_ENTRIES = 50; // Keep last 50 attempts

// Track heartbeat statistics
let totalAttempts = 0;
let successfulAttempts = 0;
let lastHeartbeatTime: Date | null = null;
let isHeartbeatActive = false;

/**
 * Record a heartbeat attempt
 */
export const recordHeartbeatAttempt = (
  success: boolean,
  responseTime?: number,
  error?: string,
): void => {
  const attempt: HeartbeatAttempt = {
    timestamp: new Date(),
    success,
    responseTime,
    error,
  };

  // Add to history
  heartbeatHistory.push(attempt);

  // Keep only the last MAX_HISTORY_ENTRIES
  if (heartbeatHistory.length > MAX_HISTORY_ENTRIES) {
    heartbeatHistory.shift();
  }

  // Update statistics
  totalAttempts++;
  if (success) {
    successfulAttempts++;
    lastHeartbeatTime = attempt.timestamp;
  }

  console.log(
    `[HeartbeatStatus] Recorded attempt: ${success ? "SUCCESS" : "FAILED"} at ${attempt.timestamp.toISOString()}`,
  );
};

/**
 * Mark heartbeat as active/inactive
 */
export const setHeartbeatActive = (active: boolean): void => {
  isHeartbeatActive = active;
  console.log(
    `[HeartbeatStatus] Heartbeat marked as ${active ? "ACTIVE" : "INACTIVE"}`,
  );
};

/**
 * Get local heartbeat status
 */
export const getHeartbeatStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const config = getCurrentConfig();
    const now = new Date();

    // Calculate statistics
    const successRate =
      totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;
    const recentAttempts = heartbeatHistory.slice(-10); // Last 10 attempts
    const recentSuccessRate =
      recentAttempts.length > 0
        ? (recentAttempts.filter((a) => a.success).length /
            recentAttempts.length) *
          100
        : 0;

    // Calculate time since last heartbeat
    const minutesSinceLastHeartbeat = lastHeartbeatTime
      ? Math.floor((now.getTime() - lastHeartbeatTime.getTime()) / 60000)
      : null;

    // Determine health status
    const isHealthy =
      isHeartbeatActive &&
      minutesSinceLastHeartbeat !== null &&
      minutesSinceLastHeartbeat < 5 &&
      recentSuccessRate > 50;

    res.status(200).json({
      message: "Local heartbeat status retrieved successfully",
      instance: {
        id: config.instanceId,
        name: config.name,
        port: config.route,
        environment: config.environment,
        mainServerUrl: config.mainServerUrl,
      },
      heartbeat: {
        isActive: isHeartbeatActive,
        isHealthy,
        lastHeartbeat: lastHeartbeatTime
          ? lastHeartbeatTime.toISOString()
          : null,
        minutesSinceLastHeartbeat,
        statistics: {
          totalAttempts,
          successfulAttempts,
          failedAttempts: totalAttempts - successfulAttempts,
          successRate: Math.round(successRate * 100) / 100,
          recentSuccessRate: Math.round(recentSuccessRate * 100) / 100,
        },
      },
      recentHistory: recentAttempts.map((attempt) => ({
        timestamp: attempt.timestamp.toISOString(),
        success: attempt.success,
        responseTime: attempt.responseTime,
        error: attempt.error,
      })),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error getting local heartbeat status:", error);
    res.status(500).json({
      error: "Failed to get heartbeat status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get detailed heartbeat history
 */
export const getHeartbeatHistory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = heartbeatHistory.slice(-limit).map((attempt) => ({
      timestamp: attempt.timestamp.toISOString(),
      success: attempt.success,
      responseTime: attempt.responseTime,
      error: attempt.error,
    }));

    res.status(200).json({
      message: "Heartbeat history retrieved successfully",
      history,
      totalEntries: heartbeatHistory.length,
      requestedLimit: limit,
    });
  } catch (error) {
    console.error("Error getting heartbeat history:", error);
    res.status(500).json({
      error: "Failed to get heartbeat history",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Reset heartbeat statistics
 */
export const resetHeartbeatStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Reset statistics
    totalAttempts = 0;
    successfulAttempts = 0;
    lastHeartbeatTime = null;

    // Clear history
    heartbeatHistory.length = 0;

    console.log("[HeartbeatStatus] Statistics and history reset");

    res.status(200).json({
      message: "Heartbeat statistics reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error resetting heartbeat stats:", error);
    res.status(500).json({
      error: "Failed to reset heartbeat statistics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Trigger manual heartbeat
 */
export const triggerManualHeartbeat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log("[HeartbeatStatus] Manual heartbeat triggered via API");
    await sendHeartbeat();

    res.status(200).json({
      message: "Manual heartbeat triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error triggering manual heartbeat:", error);
    res.status(500).json({
      error: "Failed to trigger manual heartbeat",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
