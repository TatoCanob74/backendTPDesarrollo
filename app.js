import express from "express";
import cors from "cors";
import "./src/config/database.js";
import "./src/models/association.js";
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
import routePago from "./src/routes/pagoRoute.js";
import route from "./src/routes/usuarioRoute.js";
import routeLocation from "./src/routes/localidadRoute.js";
import routeService from "./src/routes/servicioRoute.js";
import routeHorary from "./src/routes/horarioRoute.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/", routeAdmin);
app.use("/", routePago);
app.use("/", route);
app.use("/", routeLocation);
app.use("/", routeService);
app.use("/", routeHorary);

// 404: cualquier ruta que no matcheó ninguna de las anteriores.
// Sin esto Express devolvía un HTML "Cannot GET /..." en vez de JSON.
app.use((req, res) => {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe.` });
});

// Manejador de errores global. Va último y con 4 parámetros: así lo reconoce
// Express. Evita que se filtren stack traces al cliente (por ejemplo con un
// JSON mal formado, que antes devolvía las rutas internas del servidor).
app.use((err, req, res, next) => {
  console.error(err);

  // Body con JSON inválido: lo lanza express.json() antes de llegar al controller
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join(" ") });
  }

  res.status(500).json({ error: "Error interno del servidor." });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/') //npm run dev
})