import { Router } from "express";
import { register, login } from '../controllers/auth.controller.js';
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/verifyAdmin.js";

const routerAuth = Router();

routerAuth.post('/register', register);
routerAuth.post('/login', login);

export default routerAuth;

