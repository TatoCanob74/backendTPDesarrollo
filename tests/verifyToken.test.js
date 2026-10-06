import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { verifyToken } from "../src/middlewares/verifyToken.js";

const SECRET = "clave-de-prueba";

// Imita el res de Express: status() devuelve el mismo res para poder encadenar .json()
const crearRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

let res;
let next;

beforeEach(() => {
  vi.stubEnv("JWT_SECRET", SECRET);
  res = crearRes();
  next = vi.fn();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyToken", () => {
  it("Cuando el pedido no trae token responde 401 y no deja pasar", () => {
    const req = { headers: {} };

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token no proporcionado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("Cuando el header no empieza con Bearer responde 401", () => {
    const token = jwt.sign({ idUser: 1, typeUser: "CLIENTE" }, SECRET);
    const req = { headers: { authorization: token } };

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("Cuando el token está firmado con otra clave responde 401", () => {
    const token = jwt.sign({ idUser: 1, typeUser: "SUPERADMIN" }, "clave-falsa");
    const req = { headers: { authorization: `Bearer ${token}` } };

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
    expect(next).not.toHaveBeenCalled();
  });

  it("Cuando el token está vencido responde 401", () => {
    const token = jwt.sign({ idUser: 1, typeUser: "CLIENTE" }, SECRET, { expiresIn: -10 });
    const req = { headers: { authorization: `Bearer ${token}` } };

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("Cuando el token es válido guarda el usuario en req.user y deja pasar", () => {
    const token = jwt.sign({ idUser: 7, emailUser: "ana@test.com", typeUser: "ADMIN" }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ idUser: 7, emailUser: "ana@test.com", typeUser: "ADMIN" });
    expect(res.status).not.toHaveBeenCalled();
  });
});
