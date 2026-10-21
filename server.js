import app from "./app.js";
import { dbReady } from "./src/config/database.js";
import { expireStaleReserves } from "./src/controllers/pagoController.js";

const PORT = process.env.PORT || 3000;

// Cada cuánto se buscan reservas pendientes que vencieron sin pagarse
const EXPIRATION_CHECK_MS = 5 * 60 * 1000;

const runExpiration = () =>
  expireStaleReserves()
    .then((expired) => {
      if (expired > 0) console.log(`[reservas] ${expired} reserva(s) pendiente(s) vencida(s) por falta de pago.`);
    })
    .catch((error) => console.error("[reservas] Error al vencer reservas pendientes:", error.message));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/`)

  dbReady.then(runExpiration);
  setInterval(runExpiration, EXPIRATION_CHECK_MS);
})
