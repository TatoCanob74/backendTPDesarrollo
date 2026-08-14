import { Router } from "express";
import { seeServices, createService, updateService, deleteService } from "../controllers/servicioController.js";
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js";

const routeService = Router();

routeService.get("/servicios", seeServices);
routeService.post("/servicios", verifyToken, isAdmin, createService);
routeService.put("/servicios/:id", verifyToken, isAdmin, updateService);
routeService.delete("/servicios/:id", verifyToken, isAdmin, deleteService);

export default routeService;