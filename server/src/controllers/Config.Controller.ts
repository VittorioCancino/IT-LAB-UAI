import { Request, Response } from "express";
import {
    getLabConfiguration,
    updateLabConfiguration,
    LabConfiguration,
} from "../config/instance.config";

export const getConfiguration = async (req: Request, res: Response) => {
    try {
        const config = getLabConfiguration();
        res.json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error("Error getting configuration:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener la configuración",
        });
    }
};

export const updateConfiguration = async (req: Request, res: Response) => {
    try {
        const { inicialHour, finalHour, maxCapacity, updatedBy } = req.body;

        // Validaciones
        const errors: string[] = [];

        console.log(req);

        if (inicialHour && !isValidTimeFormat(inicialHour)) {
            errors.push("inicialHour debe tener formato HH:MM (ej: 08:30)");
        }

        if (finalHour && !isValidTimeFormat(finalHour)) {
            errors.push("finalHour debe tener formato HH:MM (ej: 17:30)");
        }

        if (maxCapacity && (isNaN(maxCapacity) || maxCapacity < 1)) {
            errors.push("maxCapacity debe ser un número mayor a 1");
        }

        // Validar que hora inicial sea menor que hora final
        if (inicialHour && finalHour) {
            const startMinutes = timeToMinutes(inicialHour);
            const endMinutes = timeToMinutes(finalHour);

            if (startMinutes >= endMinutes) {
                errors.push("La hora inicial debe ser menor que la hora final");
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Errores de validación",
                errors,
            });
        }

        // Actualizar configuración
        const updates: Partial<LabConfiguration> = {};
        if (inicialHour !== undefined) updates.inicialHour = inicialHour;
        if (finalHour !== undefined) updates.finalHour = finalHour;
        if (maxCapacity !== undefined)
            updates.maxCapacity = parseInt(maxCapacity);
        if (updatedBy !== undefined) updates.updatedBy = updatedBy;

        const updatedConfig = updateLabConfiguration(updates);

        res.json({
            success: true,
            message: "Configuración actualizada exitosamente",
            data: updatedConfig,
        });
    } catch (error) {
        console.error("Error updating configuration:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar la configuración",
        });
    }
};

const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};
