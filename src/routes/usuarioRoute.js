import { Router } from "express";
import { createReserve, cancelReserve, seeMyReserves } from "../controllers/reserveController.js";
import { seeCourtsWithHoraries } from "../controllers/canchaController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { getMyProfile, updateMyProfile } from "../controllers/usuarioController.js";

const router = Router();

router.post("/usuarios/createReserve", verifyToken, createReserve);
router.patch("/reservas/:id/cancelar", verifyToken, cancelReserve);
router.get("/reservas/mis-reservas", verifyToken, seeMyReserves);

// Catálogo público: es lo primero que ve alguien que entra al sitio, así que no
// puede exigir sesión. Con verifyToken, un visitante sin cuenta veía la home y
// la pantalla de canchas vacías. El ABM sigue siendo admin-only (adminRoute.js).
router.get("/canchas/verCanchas", seeCourtsWithHoraries);

router.get("/usuarios/me", verifyToken, getMyProfile);
router.put("/usuarios/me", verifyToken, updateMyProfile);

export default router;