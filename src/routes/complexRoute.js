import { Router } from "express";
import {
  seeComplexes, seeComplexById, seeMyComplex, createComplex, updateComplex, deleteComplex
} from "../controllers/complexController.js";
import { verifyToken, isAdmin, isSuperAdmin, loadAdminComplex } from "../middlewares/verifyAdmin.js";

const routeComplex = Router();

routeComplex.get("/complejos", seeComplexes);
routeComplex.get("/complejos/:id", seeComplexById);
routeComplex.get("/mi-complejo", verifyToken, isAdmin, seeMyComplex);
routeComplex.post("/complejos", verifyToken, isSuperAdmin, createComplex);
routeComplex.put("/complejos/:id", verifyToken, isAdmin, loadAdminComplex, updateComplex);
routeComplex.delete("/complejos/:id", verifyToken, isSuperAdmin, deleteComplex);

export default routeComplex;
