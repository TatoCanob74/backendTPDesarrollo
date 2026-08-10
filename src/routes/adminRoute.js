import { Router } from "express";
import { seeUsers, seeReserves, updateUserState,seeCourts } from "../controllers/adminController.js"
import { verifyToken, isAdmin } from "../middlewares/verifyAdmin.js"
import { createCourt, updateCourt, updateCourtState, deleteCourt } from "../controllers/canchaController.js";
import { deleteUser } from "../controllers/adminController.js";
import { updateReserveState, deleteReserve } from "../controllers/reserveController.js";
import { seePayments } from "../controllers/pagoController.js";

const routeAdmin = Router();

routeAdmin.get('/seeUsers', verifyToken, isAdmin, seeUsers);
routeAdmin.get('/seeReserves', verifyToken, isAdmin, seeReserves);
routeAdmin.patch('/usuarios/:id/estado',verifyToken, isAdmin, updateUserState);
routeAdmin.post('/canchas', verifyToken, isAdmin, createCourt);
routeAdmin.put('/canchas/:id', verifyToken, isAdmin, updateCourt);
routeAdmin.patch('/canchas/:id/estado', verifyToken, isAdmin, updateCourtState);
routeAdmin.delete('/canchas/:id', verifyToken, isAdmin, deleteCourt);
routeAdmin.delete('/usuarios/:id', verifyToken, isAdmin, deleteUser);
routeAdmin.patch('/reservas/:id/estado', verifyToken, isAdmin, updateReserveState);
routeAdmin.delete('/reservas/:id', verifyToken, isAdmin, deleteReserve);
routeAdmin.get('/pagos', verifyToken, isAdmin, seePayments);
routeAdmin.get('/seeCourts', verifyToken, isAdmin, seeCourts);

export default routeAdmin;
