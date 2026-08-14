import { Router } from "express";
import { seeHoraries, createHorary, updateHorary, deleteHorary } from "../controllers/horarioController.js";
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js";

const routeHorary = Router();

routeHorary.get("/horarios", seeHoraries);
routeHorary.post("/horarios", verifyToken, isAdmin, createHorary);
routeHorary.put("/horarios/:id", verifyToken, isAdmin, updateHorary);
routeHorary.delete("/horarios/:id", verifyToken, isAdmin, deleteHorary);

export default routeHorary;