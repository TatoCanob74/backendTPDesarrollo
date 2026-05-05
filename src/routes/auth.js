import { Router } from "express";
import { registro } from '../controllers/auth.controller.js';

const RouterAuth = Router();

RouterAuth.post('/registro', registro);

export default RouterAuth;

