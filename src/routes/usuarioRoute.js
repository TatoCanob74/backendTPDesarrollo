import { Router } from "express";
import { createReserve, cancelReserve, seeMyReserves } from "../controllers/reserveController.js";
import { seeCourtsWithHoraries } from "../controllers/canchaController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getMyProfile, updateMyProfile } from "../controllers/usuarioController.js";

const router = Router();

router.post("/usuarios/createReserve", verifyToken, createReserve);
router.patch("/reservas/:id/cancelar", verifyToken, cancelReserve);
router.get("/reservas/mis-reservas", verifyToken, seeMyReserves);
router.get("/canchas/verCanchas", verifyToken, seeCourtsWithHoraries);
router.get("/usuarios/me", verifyToken, getMyProfile);
router.put("/usuarios/me", verifyToken, updateMyProfile);

export default router;