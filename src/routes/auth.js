import { Router } from "express";
import { register, login, verifyEmail, resendCode, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { verifyToken } from "../middlewares/verifyToken.js";
import { isAdmin } from "../middlewares/verifyAdmin.js";

const routerAuth = Router();

routerAuth.post('/register', register);
routerAuth.post('/login', login);
routerAuth.post('/verifyemail', verifyEmail);
routerAuth.post('/resend', resendCode);
routerAuth.post('/forgotpassword', forgotPassword);
routerAuth.post('/resetpass', resetPassword);

export default routerAuth;