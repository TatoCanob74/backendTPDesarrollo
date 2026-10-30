import { Router } from "express";
import { createReserve, cancelReserve, seeMyReserves, seeReserveById } from "../controllers/reserveController.js";
import { seeCourtsWithHoraries } from "../controllers/canchaController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getMyProfile, updateMyProfile } from "../controllers/usuarioController.js";
import { validateCreateReserve } from "../middlewares/validations/reserveValidation.js";
import { validateProfileUpdate } from "../middlewares/validations/usuarioValidation.js";

const router = Router();

router.post("/usuarios/createReserve", verifyToken, ...validateCreateReserve, createReserve);
router.patch("/reservas/:id/cancelar", verifyToken, cancelReserve);
router.get("/reservas/mis-reservas", verifyToken, seeMyReserves);
router.get("/reservas/:id", verifyToken, seeReserveById);

// Catálogo público: sin token, es lo primero que ve un visitante sin cuenta
router.get("/canchas/verCanchas", seeCourtsWithHoraries);

router.get("/usuarios/me", verifyToken, getMyProfile);
router.put("/usuarios/me", verifyToken, validateProfileUpdate, updateMyProfile);

export default router;
