import { Router } from "express";
import { seeUsers, seeReserves } from "../controllers/adminController.js"
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js"

const routeAdmin = Router();

routeAdmin.get('/seeUsers', verifyToken, isAdmin, seeUsers);
routeAdmin.get('/seeReserves', verifyToken, isAdmin, seeReserves);

export default routeAdmin;