import { Router } from "express";
import { seeUsers, seeReserves, updateUserState, seeCourts, seeAdmins, createAdmin } from "../controllers/adminController.js"
import { verifyToken, isAdmin, isSuperAdmin, loadAdminComplex } from "../middlewares/verifyAdmin.js"
import { createCourt, updateCourt, updateCourtState, deleteCourt } from "../controllers/canchaController.js";
import { deleteUser } from "../controllers/adminController.js";
import { updateReserveState, deleteReserve } from "../controllers/reserveController.js";
import { seePayments } from "../controllers/pagoController.js";

const routeAdmin = Router();

// Cadena para todo lo que es de un complejo: token → rol admin/superadmin → qué complejo administra
const complexAdmin = [verifyToken, isAdmin, loadAdminComplex];

// Gestión de usuarios: es de la plataforma, no de un complejo → solo superadmin
routeAdmin.get('/seeUsers', verifyToken, isSuperAdmin, seeUsers);
routeAdmin.patch('/usuarios/:id/estado', verifyToken, isSuperAdmin, updateUserState);
routeAdmin.delete('/usuarios/:id', verifyToken, isSuperAdmin, deleteUser);
routeAdmin.get('/admins', verifyToken, isSuperAdmin, seeAdmins);
routeAdmin.post('/admins', verifyToken, isSuperAdmin, createAdmin);

// Canchas, reservas y pagos: el admin ve y toca solo lo de su complejo
routeAdmin.get('/seeReserves', ...complexAdmin, seeReserves);
routeAdmin.get('/seeCourts', ...complexAdmin, seeCourts);
routeAdmin.post('/canchas', ...complexAdmin, createCourt);
routeAdmin.put('/canchas/:id', ...complexAdmin, updateCourt);
routeAdmin.patch('/canchas/:id/estado', ...complexAdmin, updateCourtState);
routeAdmin.delete('/canchas/:id', ...complexAdmin, deleteCourt);
routeAdmin.patch('/reservas/:id/estado', ...complexAdmin, updateReserveState);
routeAdmin.delete('/reservas/:id', ...complexAdmin, deleteReserve);
routeAdmin.get('/pagos', ...complexAdmin, seePayments);

export default routeAdmin;
