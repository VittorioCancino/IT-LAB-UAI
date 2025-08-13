// Configuración de la instancia para el sistema de heartbeat
// Modifica estos valores según la instancia específica

export interface InstanceConfiguration {
    instanceId: string;
    name: string;
    port: string | number;
    description: string;
    mainServerUrl: string;
    environment: "production" | "development" | "test";
}

// CONFIGURACIÓN DE ESTA INSTANCIA
// ================================
// IMPORTANTE: Modifica estos valores antes de desplegar
export const INSTANCE_CONFIG: InstanceConfiguration = {
    // ID único de esta instancia (debe ser único en todo el sistema)
    instanceId: "FZ105_VINA",

    // Nombre descriptivo de esta instancia
    name: "Laboratorio informática Fz105",

    // Puerto donde corre esta instancia (se toma de process.env.PORT si está disponible)
    port: process.env.PORT,

    // Descripción detallada de esta instancia
    description: "Laboratorio de informática Fz105",

    // URL del servidor principal (donde se registrará esta instancia)
    mainServerUrl: "http://192.168.2.2:3002",

    // Ambiente de esta instancia
    environment: "development",
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
