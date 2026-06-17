import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";

/**
 * Fase B — Tests Rojos
 *
 * Contrato: Toggle "Mostrar comparativas" en ReconciliacionTable
 *   - Botón/switch en zona de filtros
 *   - Estado inicial oculto (false), leído desde localStorage
 *   - Key: "arjun-reconciliacion-mostrar-comparativas"
 *   - Renderizado condicional de 3 columnas: Zofri vs Anil,
 *     Físico vs Anil, Físico vs Zofri (header + fila principal + sub-filas)
 *
 * Estos tests leen el source real de ReconciliacionTable.tsx.
 * Deben fallar (rojo) porque el toggle aún no está implementado.
 *
 * Comando:
 *   npx tsx --test __tests__/toggle-comparativas.test.ts
 */

const COMPONENT_PATH = path.resolve(
  __dirname,
  "..",
  "components",
  "reconciliacion",
  "ReconciliacionTable.tsx",
);

const TOGGLE_KEY = "arjun-reconciliacion-mostrar-comparativas";

function readSource(): string {
  return fs.readFileSync(COMPONENT_PATH, "utf8");
}

describe("Contrato — toggle Mostrar comparativas (source real)", () => {
  let source: string;

  beforeEach(() => {
    source = readSource();
  });

  it("RED — la key de localStorage del toggle no existe aún en el source", () => {
    assert.ok(
      source.includes(TOGGLE_KEY),
      `Falta la key "${TOGGLE_KEY}" en ReconciliacionTable.tsx`,
    );
  });

  it("RED — la variable de estado mostrarComparativas no existe aún en el source", () => {
    assert.ok(
      source.includes("mostrarComparativas"),
      "Falta useState mostrarComparativas en ReconciliacionTable.tsx",
    );
  });

  it("los 3 headers comparativos siguen presentes (no los rompimos)", () => {
    assert.ok(source.includes("Zofri vs Anil"), "header Zofri vs Anil ausente");
    assert.ok(source.includes("Físico vs Anil"), "header Físico vs Anil ausente");
    assert.ok(source.includes("Físico vs Zofri"), "header Físico vs Zofri ausente");
  });
});
