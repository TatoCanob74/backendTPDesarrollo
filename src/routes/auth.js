import { Router } from "express";
import { registro, login } from '../controllers/auth.controller.js';
import { verificarToken } from "../middlewares/verifyToken.js";

const RouterAuth = Router();

RouterAuth.post('/registro', registro);
RouterAuth.post('/login', verificarToken, login);

export default RouterAuth;

