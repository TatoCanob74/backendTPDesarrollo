import { Router } from "express";
import { registro, login } from '../controllers/auth.controller.js';
import { verificarToken } from "../middlewares/verifyToken.js";
import { esAdmin } from "../middlewares/verifyAdmin.js";

const RouterAuth = Router();

RouterAuth.post('/registro', registro);
RouterAuth.post('/login', login);

export default RouterAuth;

