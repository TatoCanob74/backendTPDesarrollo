import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { validateBirthDate } from "../src/utils/birthDate.js";

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime("2026-06-15T12:00:00")
})

afterEach(() => {
  vi.useRealTimers()
})

describe("validateBirthDate", () => {
  it("Cuando el usuario no ingresa nada le dice que la fecha de nacimiento es obligatoria", () => {
    const res = validateBirthDate('')

    expect(res).toBe("La fecha de nacimiento es obligatoria.");
  });

  it("Cuando el usuario ingresa un formato inválido de fecha de nacimiento", () => {
    const res = validateBirthDate("2006-05-14")

    expect(res).toBe("La fecha de nacimiento no es válida. Usá el formato dd/mm/aaaa.")
  });

  it("Cuando el usuario ingresa como fecha de nacimiento una fecha futura", () => {
    const fecha = validateBirthDate("16/06/2026");

    expect(fecha).toBe("La fecha de nacimiento no puede ser una fecha futura.");
  });

  it("Cuando el usuario no cumple con la cantidad de año necesarios", () => {
    const age = validateBirthDate("16/06/2010")

    expect(age).toMatch(/al menos 16 años/);
  });

  it("Cuando el usuario ingresa una fecha de nacimiento fuera del rango", () => {
    const age = validateBirthDate("14/06/1905")

    expect(age).toMatch(/Revisá la fecha de nacimiento/);
  });
});