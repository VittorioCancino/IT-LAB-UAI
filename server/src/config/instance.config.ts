import fs from "fs";
import path from "path";

export interface InstanceConfiguration {
    instanceId: string;
    name: string;
    port: string | number;
    description: string;
    mainServerUrl: string;
    environment: "production" | "development" | "test";
    inicialHour: string;
    finalHour: string;
    maxCapacity: number;
}

export interface LabConfiguration {
    inicialHour: string;
    finalHour: string;
    maxCapacity: number;
    lastUpdated: string;
    updatedBy: string;
}

const getLabConfig = (): LabConfiguration => {
    try {
        const configPath = path.join(__dirname, "instance-config.json");
        const configData = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configData);
    } catch (error) {
        console.warn(
            "[Config] No se pudo leer lab-config.json, usando valores por defecto",
        );
        return {
            inicialHour: "08:30",
            finalHour: "17:30",
            maxCapacity: 10,
            lastUpdated: new Date().toISOString(),
            updatedBy: "system",
        };
    }
};

export const saveLabConfig = (config: Partial<LabConfiguration>): void => {
    try {
        const configPath = path.join(__dirname, "instance-config.json");
        const currentConfig = getLabConfig();

        const newConfig: LabConfiguration = {
            ...currentConfig,
            ...config,
            lastUpdated: new Date().toISOString(),
        };

        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4));

        // Actualizar configuración en memoria
        labConfig = newConfig;

        console.log(
            "[Config] Configuración del laboratorio actualizada:",
            newConfig,
        );
    } catch (error) {
        console.error("[Config] Error al guardar configuración:", error);
        throw new Error("No se pudo guardar la configuración");
    }
};

let labConfig = getLabConfig();

// CONFIGURACIÓN DE ESTA INSTANCIA
// ================================
// IMPORTANTE: Modifica estos valores antes de desplegar
export const INSTANCE_CONFIG: InstanceConfiguration = {
    instanceId: process.env.INSTANCE_ID || "FZ105_VINA",
    name: process.env.INSTANCE_NAME || "Laboratorio informática Fz105",
    port: process.env.PORT || 3001,
    description:
        process.env.INSTANCE_DESCRIPTION || "Laboratorio de informática Fz105",
    mainServerUrl: process.env.MAIN_SERVER_URL || "http://192.168.2.2:3002",
    environment:
        (process.env.NODE_ENV as "production" | "development" | "test") ||
        "development",

    // USAR CONFIGURACIÓN DINÁMICA DEL LABORATORIO
    inicialHour: labConfig.inicialHour,
    finalHour: labConfig.finalHour,
    maxCapacity: labConfig.maxCapacity,
};

export const getLabConfiguration = (): LabConfiguration => {
    return { ...labConfig };
};

// CONFIGURACIÓN DEL HEARTBEAT
// ===========================
export const HEARTBEAT_CONFIG = {
    // Intervalo entre heartbeats (15 segundos en milisegundos)
    interval: 15 * 1000,

    // Timeout para las peticiones HTTP (10 segundos)
    timeout: 10000,

    // Reintentos en caso de fallo
    maxRetries: 3,

    // Delay entre reintentos (30 segundos)
    retryDelay: 30 * 1000,
};

// VALIDACIÓN DE CONFIGURACIÓN
// ===========================
export const validateInstanceConfig = (
    config: InstanceConfiguration,
): boolean => {
    const errors: string[] = [];

    if (!config.instanceId || config.instanceId.trim() === "") {
        errors.push("instanceId es requerido y no puede estar vacío");
    }

    if (!config.name || config.name.trim() === "") {
        errors.push("name es requerido y no puede estar vacío");
    }

    const port = Number(config.port);
    if (isNaN(port) || port < 1000 || port > 65535) {
        errors.push("port debe ser un número válido entre 1000 y 65535");
    }

    if (!config.mainServerUrl || !config.mainServerUrl.startsWith("http")) {
        errors.push(
            "mainServerUrl debe ser una URL válida que comience con http",
        );
    }

    if (errors.length > 0) {
        console.error("[Instance Config] Errores de validación:");
        errors.forEach((error) => console.error(`  - ${error}`));
        return false;
    }

    return true;
};

export const updateLabConfiguration = (
    updates: Partial<LabConfiguration>,
): LabConfiguration => {
    saveLabConfig(updates);

    // Actualizar también INSTANCE_CONFIG
    if (updates.inicialHour) INSTANCE_CONFIG.inicialHour = updates.inicialHour;
    if (updates.finalHour) INSTANCE_CONFIG.finalHour = updates.finalHour;
    if (updates.maxCapacity) INSTANCE_CONFIG.maxCapacity = updates.maxCapacity;

    return getLabConfiguration();
};

// FUNCIÓN PARA OBTENER LA CONFIGURACIÓN ACTUAL
// ============================================
export const getCurrentConfig = (): InstanceConfiguration => {
    // Validar configuración antes de retornarla
    if (!validateInstanceConfig(INSTANCE_CONFIG)) {
        throw new Error(
            "Configuración de instancia inválida. Revisa los valores en instance.config.ts",
        );
    }

    return {
        ...INSTANCE_CONFIG,
        port: Number(INSTANCE_CONFIG.port), // Asegurar que el puerto sea número
    };
};

// LOG DE CONFIGURACIÓN AL IMPORTAR
console.log("[Instance Config] Configuración cargada:");
console.log(`[Instance Config] ID: ${INSTANCE_CONFIG.instanceId}`);
console.log(`[Instance Config] Nombre: ${INSTANCE_CONFIG.name}`);
console.log(`[Instance Config] Puerto: ${INSTANCE_CONFIG.port}`);
console.log(
    `[Instance Config] Servidor Principal: ${INSTANCE_CONFIG.mainServerUrl}`,
);
console.log(`[Instance Config] Ambiente: ${INSTANCE_CONFIG.environment}`);
