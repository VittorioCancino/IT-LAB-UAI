import axios from "axios";
import { getCurrentConfig, HEARTBEAT_CONFIG } from "../config/instance.config";
import {
    recordHeartbeatAttempt,
    setHeartbeatActive,
} from "../controllers/HeartbeatStatus.Controller";

// Obtener configuración de la instancia
const INSTANCE_CONFIG = getCurrentConfig();

// Intervalo de heartbeat desde configuración
const HEARTBEAT_INTERVAL = HEARTBEAT_CONFIG.interval;

// Variable para almacenar el timer del heartbeat
let heartbeatTimer: NodeJS.Timeout | null = null;

/**
 * Función para enviar heartbeat al servidor principal
 */
export const sendHeartbeat = async (): Promise<void> => {
    const startTime = Date.now();

    try {
        const response = await axios.post(
            `${INSTANCE_CONFIG.mainServerUrl}/api/instance/create-instance`,
            {
                instanceId: INSTANCE_CONFIG.instanceId,
                name: INSTANCE_CONFIG.name,
                port: INSTANCE_CONFIG.port,
                description: INSTANCE_CONFIG.description,
            },
            {
                timeout: HEARTBEAT_CONFIG.timeout,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        const responseTime = Date.now() - startTime;

        console.log(
            `[Heartbeat] Registrado exitosamente en servidor principal`,
        );
        console.log(
            `[Heartbeat] Instancia: ${INSTANCE_CONFIG.instanceId} (${INSTANCE_CONFIG.name}:${INSTANCE_CONFIG.port})`,
        );
        console.log(`[Heartbeat] Respuesta: ${response.data.message}`);
        console.log(`[Heartbeat] Tiempo de respuesta: ${responseTime}ms`);

        // Record successful attempt
        recordHeartbeatAttempt(true, responseTime);
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error.message || "Unknown error";

        console.error(
            `[Heartbeat] Error al registrar en servidor principal:`,
            errorMessage,
        );

        if (error.response) {
            console.error(`[Heartbeat] Status: ${error.response.status}`);
            console.error(
                `[Heartbeat] Error: ${error.response.data?.error || error.response.data?.message || "Unknown error"}`,
            );
        } else if (error.request) {
            console.error(
                `[Heartbeat] No se pudo conectar al servidor principal: ${INSTANCE_CONFIG.mainServerUrl}`,
            );
        }

        // Record failed attempt
        recordHeartbeatAttempt(false, responseTime, errorMessage);
    }
};

/**
 * Función para iniciar el sistema de heartbeat
 */
export const startHeartbeat = (): void => {
    console.log(
        `[Heartbeat] Iniciando sistema de heartbeat para instancia '${INSTANCE_CONFIG.instanceId}'`,
    );
    console.log(
        `[Heartbeat] Servidor principal: ${INSTANCE_CONFIG.mainServerUrl}`,
    );
    console.log(`[Heartbeat] Intervalo: ${HEARTBEAT_INTERVAL / 60000} minutos`);
    console.log(
        `[Heartbeat] Puerto de esta instancia: ${INSTANCE_CONFIG.port}`,
    );

    // Mark heartbeat as active
    setHeartbeatActive(true);

    // Enviar primer heartbeat inmediatamente
    sendHeartbeat();

    // Configurar envío periódico
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    console.log(
        `[Heartbeat] Timer configurado para enviar heartbeat cada ${HEARTBEAT_INTERVAL / 60000} minutos`,
    );
    console.log(`[Heartbeat] Ambiente: ${INSTANCE_CONFIG.environment}`);

    // Manejar cierre graceful del proceso
    process.on("SIGINT", () => {
        console.log(`[Heartbeat] Recibido SIGINT, deteniendo heartbeat...`);
        stopHeartbeat();
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        console.log(`[Heartbeat] Recibido SIGTERM, deteniendo heartbeat...`);
        stopHeartbeat();
        process.exit(0);
    });
};

/**
 * Función para detener el sistema de heartbeat
 */
export const stopHeartbeat = (): void => {
    if (heartbeatTimer) {
        console.log(
            `[Heartbeat] Deteniendo heartbeat para instancia '${INSTANCE_CONFIG.instanceId}'`,
        );
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;

        // Mark heartbeat as inactive
        setHeartbeatActive(false);
    }
};

/**
 * Función para enviar un heartbeat manual (para testing)
 */
export const manualHeartbeat = async (): Promise<void> => {
    console.log(`[Heartbeat] Enviando heartbeat manual...`);
    await sendHeartbeat();
};

/**
 * Función para obtener la configuración actual de la instancia
 */
export const getInstanceConfig = () => {
    return getCurrentConfig();
};

export default {
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat,
    manualHeartbeat,
    getInstanceConfig,
};
