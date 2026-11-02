import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import sequelize, { dbReady } from "../src/config/database.js";
import { Location } from "../src/models/location.js";
import { Complex } from "../src/models/complex.js";

// Recorre todas las capas contra la base de test:
// ruta → verifyToken → isSuperAdmin → validación → controller → servicio → MySQL

const tokenDe = (typeUser) =>
  jwt.sign({ idUser: 999999, emailUser: "test@canchaya.test", typeUser }, process.env.JWT_SECRET, { expiresIn: "1h" });

// Único por corrida: la localidad tiene un índice único y la base de test se reutiliza
const NOMBRE = `Localidad de test ${Date.now()}`;
const COMPLEJO = `Complejo de test ${Date.now()}`;

let superadmin;
let cliente;
let idLocation;

beforeAll(async () => {
  await sequelize.authenticate();
  await dbReady;

  superadmin = tokenDe("SUPERADMIN");
  cliente = tokenDe("CLIENTE");
});

afterAll(async () => {
  // Limpia aunque algún test haya fallado a mitad de camino
  await Complex.destroy({ where: { nameComplex: COMPLEJO } });
  await Location.destroy({ where: { nomLocation: [NOMBRE, `${NOMBRE} editada`] } });
  await sequelize.close();
});

describe("CRUD de localidades", () => {
  it("Cuando el pedido no trae token responde 401 y no crea nada", async () => {
    const res = await request(app)
      .post("/localidades")
      .send({ nameCountry: "Argentina", nomLocation: NOMBRE });

    expect(res.status).toBe(401);
    expect(await Location.count({ where: { nomLocation: NOMBRE } })).toBe(0);
  });

  it("Cuando un cliente intenta crear una localidad responde 403 y no crea nada", async () => {
    const res = await request(app)
      .post("/localidades")
      .set("Authorization", `Bearer ${cliente}`)
      .send({ nameCountry: "Argentina", nomLocation: NOMBRE });

    expect(res.status).toBe(403);
    expect(await Location.count({ where: { nomLocation: NOMBRE } })).toBe(0);
  });

  it("Cuando los datos son inválidos la validación responde 400 y no crea nada", async () => {
    const res = await request(app)
      .post("/localidades")
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nameCountry: 123, nomLocation: NOMBRE });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("país");
    expect(await Location.count({ where: { nomLocation: NOMBRE } })).toBe(0);
  });

  it("Cuando el superadmin crea una localidad la guarda en la base, sin espacios de más", async () => {
    const res = await request(app)
      .post("/localidades")
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nameCountry: " Argentina ", nomLocation: ` ${NOMBRE} ` });

    expect(res.status).toBe(201);
    idLocation = res.body.idLocation;

    const guardada = await Location.findByPk(idLocation);
    expect(guardada.nameCountry).toBe("Argentina");
    expect(guardada.nomLocation).toBe(NOMBRE);
  });

  it("Cuando la localidad ya existe responde 409", async () => {
    const res = await request(app)
      .post("/localidades")
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nameCountry: "Argentina", nomLocation: NOMBRE });

    expect(res.status).toBe(409);
  });

  it("El listado público muestra la localidad creada sin pedir token", async () => {
    const res = await request(app).get("/localidades");

    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.idLocation)).toContain(idLocation);
  });

  it("Cuando se edita un solo campo cambia ese campo y el otro queda igual", async () => {
    const res = await request(app)
      .put(`/localidades/${idLocation}`)
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nomLocation: `${NOMBRE} editada` });

    expect(res.status).toBe(200);

    const guardada = await Location.findByPk(idLocation);
    expect(guardada.nomLocation).toBe(`${NOMBRE} editada`);
    expect(guardada.nameCountry).toBe("Argentina");
  });

  it("Cuando se edita una localidad que no existe responde 404", async () => {
    const res = await request(app)
      .put("/localidades/999999999")
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nomLocation: "No existe" });

    expect(res.status).toBe(404);
  });

  it("Cuando la localidad tiene complejos no se puede eliminar", async () => {
    const complejo = await request(app)
      .post("/complejos")
      .set("Authorization", `Bearer ${superadmin}`)
      .send({ nameComplex: COMPLEJO, addressComplex: "Calle de test 123", idLocation });
    expect(complejo.status).toBe(201);

    const res = await request(app)
      .delete(`/localidades/${idLocation}`)
      .set("Authorization", `Bearer ${superadmin}`);

    expect(res.status).toBe(409);
    expect(await Location.findByPk(idLocation)).not.toBeNull();

    await Complex.destroy({ where: { nameComplex: COMPLEJO } });
  });

  it("Cuando la localidad no tiene complejos se elimina de la base", async () => {
    const res = await request(app)
      .delete(`/localidades/${idLocation}`)
      .set("Authorization", `Bearer ${superadmin}`);

    expect(res.status).toBe(200);
    expect(await Location.findByPk(idLocation)).toBeNull();
  });
});
