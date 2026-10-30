import { Router } from "express";
import { register, login, verifyEmail, resendCode, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { verifyTurnstile } from "../middlewares/verifyTurnstile.js";

const routerAuth = Router();

routerAuth.post('/register', verifyTurnstile("register"), register);
routerAuth.post('/login', verifyTurnstile("login"), login);
routerAuth.post('/verifyemail', verifyEmail);
routerAuth.post('/resend', resendCode);
routerAuth.post('/forgotpassword', forgotPassword);
routerAuth.post('/resetpass', resetPassword);

export default routerAuth;