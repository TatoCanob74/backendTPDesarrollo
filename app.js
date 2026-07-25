import express from "express";
import cors from "cors";
import "./src/config/database.js";
import authRouter from "./src/routes/auth.js";
import routeAdmin from "./src/routes/adminRoute.js";
import routeReserve from "./src/routes/reserveRoute.js";
import routePago from "./src/routes/pagoRoute.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/", routeAdmin);
app.use("/", routeReserve);
app.use("/", routePago);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}/`);
});
