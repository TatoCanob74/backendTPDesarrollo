import { Router } from "express";
import { register, login } from '../controllers/auth.controller.js';
<<<<<<< HEAD
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/verifyAdmin.js";
=======
>>>>>>> origin/santy

const routerAuth = Router();

routerAuth.post('/register', register);
routerAuth.post('/login', login);
<<<<<<< HEAD

export default routerAuth;
=======
>>>>>>> origin/santy

export default routerAuth;
