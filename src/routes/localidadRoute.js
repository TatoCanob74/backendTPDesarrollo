import { Router } from "express";
import { seeLocations, createLocation, updateLocation, deleteLocation } from "../controllers/localidadController.js";
import { verifyToken, isSuperAdmin } from "../middlewares/verifyAdmin.js";
import { validateCreateLocation, validateUpdateLocation } from "../middlewares/validations/localidadValidation.js";

const routeLocation = Router();

routeLocation.get("/localidades", seeLocations);
routeLocation.post("/localidades", verifyToken, isSuperAdmin, validateCreateLocation, createLocation);
routeLocation.put("/localidades/:id", verifyToken, isSuperAdmin, validateUpdateLocation, updateLocation);
routeLocation.delete("/localidades/:id", verifyToken, isSuperAdmin, deleteLocation);

export default routeLocation;
