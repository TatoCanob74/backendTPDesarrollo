import { Router } from "express";
import { seeLocations, createLocation, updateLocation, deleteLocation } from "../controllers/localidadController.js";
import { verifyToken, isSuperAdmin } from "../middlewares/verifyAdmin.js";

const routeLocation = Router();

routeLocation.get("/localidades", seeLocations);
routeLocation.post("/localidades", verifyToken, isSuperAdmin, createLocation);
routeLocation.put("/localidades/:id", verifyToken, isSuperAdmin, updateLocation);
routeLocation.delete("/localidades/:id", verifyToken, isSuperAdmin, deleteLocation);

export default routeLocation;