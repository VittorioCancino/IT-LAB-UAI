import { Router, Request, Response } from "express";
import {
    getConfiguration,
    updateConfiguration,
} from "../controllers/Config.Controller";
import { jwtAuth } from "../middleware/jwtAuth.middleware";

const router: Router = Router();

router.put("/update-config", jwtAuth, (req: Request, res: Response) => {
    updateConfiguration(req, res);
});

router.get("/get-config", jwtAuth, (req: Request, res: Response) => {
    getConfiguration(req, res);
});

export default router;
