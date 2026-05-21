import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago"; 
import sequelize from "./src/config/database.js";
import usuarioRoute from "./src/routes/usuarioRoute.js";
import authRouter from "./src/routes/auth.js";
import rutaAdmin from "./src/routes/adminRoute.js";

const app = express();
app.use(express.json());

const conexion = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(); 
        console.log('CONECTADO A MYSQL');
    } catch (error) {
        console.error('ERROR AL CONECTAR:', error);
    }
}

conexion();

app.use("/auth", authRouter);
app.use("/", rutaAdmin);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/');
});

