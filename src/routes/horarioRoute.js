import { Router } from "express";
import { seeHoraries, createHorary, updateHorary, deleteHorary } from "../controllers/horarioController.js";
import { verifyToken, isAdmin, loadAdminComplex } from "../middlewares/verifyAdmin.js";
import { validateHoraryFilters, validateCreateHorary, validateUpdateHorary } from "../middlewares/validations/horarioValidation.js";

const routeHorary = Router();

routeHorary.get("/horarios", validateHoraryFilters, seeHoraries);
routeHorary.post("/horarios", verifyToken, isAdmin, loadAdminComplex, validateCreateHorary, createHorary);
routeHorary.put("/horarios/:id", verifyToken, isAdmin, loadAdminComplex, validateUpdateHorary, updateHorary);
routeHorary.delete("/horarios/:id", verifyToken, isAdmin, loadAdminComplex, deleteHorary);

export default routeHorary;
