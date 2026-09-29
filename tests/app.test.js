import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import sequelize, { dbReady } from "../src/config/database.js";

beforeAll(async () => {
  // dbReady atrapa su propio error y se resuelve igual aunque falle:
  // authenticate() sí rechaza si no hay conexión, y corta todo con un mensaje claro.
  await sequelize.authenticate();
  await dbReady;
});

afterAll(async () => {
  await sequelize.close();
});

describe("App", () => {
  it("responde 404 en JSON para una ruta que no existe", async () => {
    const res = await request(app).get("/ruta-que-no-existe");

    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.error).toContain("/ruta-que-no-existe");
  });
});
