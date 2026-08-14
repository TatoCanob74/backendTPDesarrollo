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

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/') //npm run dev
})