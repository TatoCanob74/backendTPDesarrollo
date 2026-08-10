import { Router } from "express";
import { seeLocations, createLocation, updateLocation, deleteLocation } from "../controllers/localidadController.js";
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js";

const routeLocation = Router();

routeLocation.get("/localidades", seeLocations);
routeLocation.post("/localidades", verifyToken, isAdmin, createLocation);
routeLocation.put("/localidades/:id", verifyToken, isAdmin, updateLocation);
routeLocation.delete("/localidades/:id", verifyToken, isAdmin, deleteLocation);

export default routeLocation;