import { Router } from "express";
import { verUsuarios, verReservas } from "../controllers/adminController.js"
import { verificarToken, esAdmin } from "../middlewares/verifyAdmin.js"

const rutaAdmin = Router();

rutaAdmin.get('/verUsuarios', verificarToken, esAdmin, verUsuarios);
rutaAdmin.get('/verReservas', verificarToken, esAdmin, verReservas);

export default rutaAdmin;