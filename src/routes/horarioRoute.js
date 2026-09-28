import { Router } from "express";
import { seeHoraries, createHorary, updateHorary, deleteHorary } from "../controllers/horarioController.js";
import { verifyToken, isAdmin, loadAdminComplex } from "../middlewares/verifyAdmin.js";

const routeHorary = Router();

routeHorary.get("/horarios", seeHoraries);
routeHorary.post("/horarios", verifyToken, isAdmin, loadAdminComplex, createHorary);
routeHorary.put("/horarios/:id", verifyToken, isAdmin, loadAdminComplex, updateHorary);
routeHorary.delete("/horarios/:id", verifyToken, isAdmin, loadAdminComplex, deleteHorary);

export default routeHorary;