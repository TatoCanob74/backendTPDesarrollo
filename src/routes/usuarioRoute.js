import { Router } from "express";
import { createUsuarios } from "../controllers/usuarioController.js";

const router = Router();

router.post("/", createUsuarios);

export default router;
