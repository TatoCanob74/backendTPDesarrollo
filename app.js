import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago"; 
import "./src/config/database.js";
//import usuarioRoute from "./src/routes/usuarioRoute.js";
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
import router from "./src/routes/usuarioRoute.js";
import "./src/models/association.js";

const app = express();
app.use(express.json())

app.use("/auth", authRouter);
app.use("/", routeAdmin);
app.use("/", router);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/');
});


