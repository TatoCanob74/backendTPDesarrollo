import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import "./src/config/database.js";
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
import routeReserve from "./src/routes/reserveRoute.js";

const app = express();
app.use(express.json());

app.use("/auth", authRouter);
app.use("/", routeAdmin);
app.use("/", routeReserve);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/');
});
