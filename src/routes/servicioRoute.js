import { Router } from "express";
import { seeServices, createService, updateService, deleteService } from "../controllers/servicioController.js";
import { verifyToken, isSuperAdmin } from "../middlewares/verifyAdmin.js";
import { validateCreateService, validateUpdateService } from "../middlewares/validations/servicioValidation.js";

const routeService = Router();

routeService.get("/servicios", seeServices);
routeService.post("/servicios", verifyToken, isSuperAdmin, validateCreateService, createService);
routeService.put("/servicios/:id", verifyToken, isSuperAdmin, validateUpdateService, updateService);
routeService.delete("/servicios/:id", verifyToken, isSuperAdmin, deleteService);

export default routeService;
