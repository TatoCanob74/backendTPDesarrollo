import express from "express";
import "./src/config/database.js";
import usuarioRoute from "./src/routes/usuarioRoute.js";

const app = express();
app.use(express.json())

app.use("/Usuarios", usuarioRoute);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/') //npm run dev
})

