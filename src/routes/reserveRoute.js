import { Router } from "express";
import { createReserve } from "../controllers/reserveController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const routeReserve = Router();

routeReserve.post('/reserves', verifyToken, createReserve);

export default routeReserve;
