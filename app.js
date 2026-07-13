import express from "express";
import cors from "cors";
import "./src/config/database.js";
<<<<<<< HEAD
//import usuarioRoute from "./src/routes/usuarioRoute.js";
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
<<<<<<< HEAD
=======
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
import routeReserve from "./src/routes/reserveRoute.js";
import routePago from "./src/routes/pagoRoute.js";
>>>>>>> origin/santy
=======
import router from "./src/routes/usuarioRoute.js";
import "./src/models/association.js";
>>>>>>> origin/rama/Francisco

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/", routeAdmin);
<<<<<<< HEAD
<<<<<<< HEAD

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/') //npm run dev
})
=======
app.use("/", routeReserve);
app.use("/", routePago);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/`);
});
>>>>>>> origin/santy
=======
app.use("/", router);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000/');
});


>>>>>>> origin/rama/Francisco
