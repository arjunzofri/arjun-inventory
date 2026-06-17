import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";

/**
 * Test de alineación: verifica que header, fila principal y sub-filas
 * tengan el mismo número de celdas en ambos estados del toggle.
 *
 * Comando:
 *   npx tsx --test __tests__/toggle-alineacion.test.ts
 */

const COMPONENT_PATH = path.resolve(
  __dirname,
  "..",
  "components",
  "reconciliacion",
  "ReconciliacionTable.tsx",
);

function readSource(): string {
  return fs.readFileSync(COMPONENT_PATH, "utf8");
}

/** Cuenta TableHead en el source. */
function countTableHeads(source: string): number {
  // Match <TableHead ...> or <TableHead> (not closing </TableHead>)
  const matches = source.match(/<TableHead[\s>]/g);
  return matches ? matches.length : 0;
}

/** Cuenta TableCell en el source. */
function countTableCells(source: string): number {
  // Match <TableCell ...> or <TableCell> (not closing </TableCell>)
  const matches = source.match(/<TableCell[\s>]/g);
  return matches ? matches.length : 0;
}

describe("Alineación de columnas con el toggle", () => {
  const source = readSource();

  it("los <TableHead> están balanceados (debe ser par: titulo + condicionales)", () => {
    // Headers base (siempre visibles): Productos, C.Anil, SaldoZ, C.Físico, Ubicación, Corr.Anil = 6
    // Headers condicionales (toggle ON): ZvA, FvA, FvZ = 3
    // Total: 9 headers con toggle ON, 6 con toggle OFF
    const total = countTableHeads(source);
    // 6 fijos + 3 condicionales = 9
    assert.equal(
      total,
      9,
      `Debe haber 9 <TableHead> en total (6 fijos + 3 condicionales), encontrados: ${total}`,
    );
  });

  it("las sub-filas tienen celda Zofri vs Anil condicional para alinear con header", () => {
    // La sub-fila debe tener un <TableCell> con contenido "—" bajo
    // el comentario "Zofri vs Anil (no aplica a nivel ingreso)"
    assert.ok(
      source.includes("Zofri vs Anil (no aplica a nivel ingreso)"),
      "Falta celda Zofri vs Anil en sub-filas",
    );
  });

  it("la fila principal tiene celda Ubicación fija", () => {
    assert.ok(
      source.includes("Ubicación (no aplica a nivel producto"),
      "Falta celda Ubicación en fila principal",
    );
  });

  it("el header tiene columna Ubicación fija (no condicional)", () => {
    // Verificar que el header "Ubicación" NO está envuelto en mostrarComparativas
    const headerSection = source.substring(
      source.indexOf("<TableHeader>"),
      source.indexOf("</TableHeader>"),
    );
    const ubIndex = headerSection.indexOf("<TableHead") +
      headerSection.substring(headerSection.indexOf("<TableHead")).indexOf("Ubicación");
    // Buscar si hay un "mostrarComparativas &&" antes del Ubicación TableHead
    const beforeUb = headerSection.substring(
      headerSection.lastIndexOf("{mostrarComparativas", headerSection.indexOf("Ubicación")),
      headerSection.indexOf("Ubicación"),
    );
    // Si Ubicación no está después de un mostrarComparativas, es fijo
    const ubicacionStart = headerSection.indexOf("<TableHead className=\"w-[110px] text-right\">Ubicación</TableHead>");
    const zvzStart = headerSection.indexOf("{mostrarComparativas && (");
    // Ubicación debe aparecer ANTES del primer mostrarComparativas
    assert.ok(
      ubicacionStart > 0 && ubicacionStart < zvzStart,
      "Ubicación debe estar antes de las columnas condicionales en el header",
    );
  });
});
