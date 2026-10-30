import { Router } from "express";
import { register, login, verifyEmail, resendCode, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { verifyTurnstile } from "../middlewares/verifyTurnstile.js";
import {
  validateRegister, validateLogin, validateVerifyEmail, validateEmailOnly, validateResetPassword
} from "../middlewares/validations/authValidation.js";

const routerAuth = Router();

routerAuth.post('/register', verifyTurnstile("register"), validateRegister, register);
routerAuth.post('/login', verifyTurnstile("login"), validateLogin, login);
routerAuth.post('/verifyemail', validateVerifyEmail, verifyEmail);
routerAuth.post('/resend', validateEmailOnly, resendCode);
routerAuth.post('/forgotpassword', validateEmailOnly, forgotPassword);
routerAuth.post('/resetpass', validateResetPassword, resetPassword);

export default routerAuth;
