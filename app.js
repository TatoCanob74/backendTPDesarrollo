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

app.use((req, res) => {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe.` });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors.map((e) => e.message).join(" ") });
  }

  res.status(500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/`)
})