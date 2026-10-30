import { Router } from "express";
import {
  seeComplexes, seeComplexById, seeMyComplex, createComplex, updateComplex, deleteComplex
} from "../controllers/complexController.js";
import { verifyToken, isAdmin, isSuperAdmin, loadAdminComplex } from "../middlewares/verifyAdmin.js";
import { validateCreateComplex, validateUpdateComplex } from "../middlewares/validations/complexValidation.js";

const routeComplex = Router();

routeComplex.get("/complejos", seeComplexes);
routeComplex.get("/complejos/:id", seeComplexById);
routeComplex.get("/mi-complejo", verifyToken, isAdmin, seeMyComplex);
routeComplex.post("/complejos", verifyToken, isSuperAdmin, validateCreateComplex, createComplex);
routeComplex.put("/complejos/:id", verifyToken, isAdmin, loadAdminComplex, validateUpdateComplex, updateComplex);
routeComplex.delete("/complejos/:id", verifyToken, isSuperAdmin, deleteComplex);

export default routeComplex;
