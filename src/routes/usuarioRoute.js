import { Router } from "express";
import { createUsuarios } from "../controllers/usuarioController.js";

const router = Router();

router.post("/usuarios", createUsuarios);

export default router;
