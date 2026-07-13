import { Router } from "express";
import { seeUsers, seeReserves, updateUserState } from "../controllers/adminController.js"
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js"

const routeAdmin = Router();

routeAdmin.get('/seeUsers', verifyToken, isAdmin, seeUsers);
routeAdmin.get('/seeReserves', verifyToken, isAdmin, seeReserves);
routeAdmin.patch('/usuarios/:id/estado',verifyToken, isAdmin, updateUserState);

export default routeAdmin;