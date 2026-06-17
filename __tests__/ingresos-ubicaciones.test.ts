import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// Cargar dotenv antes que cualquier otra cosa
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });

let getIngresosPorProducto: typeof import("../db/vidadigital/queries").getIngresosPorProducto;

/**
 * Fase B — Tests Rojos
 *
 * Contrato: Query 3 (getIngresosPorProducto) debe devolver 4 columnas nuevas
 * desde public.ubicaciones_bodega:
 *   - conteo_fisico_unidades         (ub.fisico)
 *   - conteo_fisico_cajas            (ub.fisico_cajas)
 *   - conteo_fisico_unidades_sueltas (ub.fisico_unidades)
 *   - ubicacion_bodega               (ub.ubicacion)
 *
 * Estos tests DEBEN FALLAR (rojo) porque el Query 3 actual no hace
 * el LEFT JOIN a ubicaciones_bodega ni retorna estas columnas.
 *
 * Comando para ejecutar:
 *   cd arjun-inventory && npx tsx --test __tests__/ingresos-ubicaciones.test.ts
 */

const CODIGOS_ANIL = ["00769-1", "101-2", "1161", "1055"];

before(async () => {
  const mod = await import("../db/vidadigital/queries");
  getIngresosPorProducto = mod.getIngresosPorProducto;
});

describe("getIngresosPorProducto — nuevas columnas de ubicaciones_bodega", () => {
  it("cada ingreso retornado debe incluir las 4 nuevas propiedades", async () => {
    const result = await getIngresosPorProducto(CODIGOS_ANIL);

    assert.ok(typeof result === "object" && result !== null);
    assert.ok(
      Object.keys(result).length > 0,
      "debe haber al menos un código con ingresos",
    );

    for (const [codigo, ingresos] of Object.entries(result)) {
      assert.ok(Array.isArray(ingresos), `${codigo}: ingresos debe ser array`);
      assert.ok(
        ingresos.length > 0,
        `${codigo}: debe tener al menos 1 ingreso`,
      );

      for (const ing of ingresos) {
        assert.ok(
          "conteo_fisico_unidades" in ing,
          `Falta propiedad conteo_fisico_unidades en ingreso ${ing.nroingreso}`,
        );
        assert.ok(
          "conteo_fisico_cajas" in ing,
          `Falta propiedad conteo_fisico_cajas en ingreso ${ing.nroingreso}`,
        );
        assert.ok(
          "conteo_fisico_unidades_sueltas" in ing,
          `Falta propiedad conteo_fisico_unidades_sueltas en ingreso ${ing.nroingreso}`,
        );
        assert.ok(
          "ubicacion_bodega" in ing,
          `Falta propiedad ubicacion_bodega en ingreso ${ing.nroingreso}`,
        );
      }
    }
  });

  it("los valores de conteo deben coincidir con ubicaciones_bodega para un caso conocido", async () => {
    const result = await getIngresosPorProducto(["1161"]);

    const ingresos1161 = result["1161"];
    assert.ok(ingresos1161, "debe haber ingresos para código 1161");
    assert.ok(ingresos1161.length > 0);

    const ingreso = ingresos1161.find(
      (i) => i.nroingreso === "101-25-078583-005-GL1",
    );
    assert.ok(ingreso, "debe existir el nroingreso 101-25-078583-005-GL1");

    // Valores confirmados manualmente en ubicaciones_bodega:
    // empresa_id=2, fisico=1.00, fisico_cajas=1, fisico_unidades=0,
    // ubicacion='2B-CP3'
    assert.equal(ingreso!.conteo_fisico_unidades, 1);
    assert.equal(ingreso!.conteo_fisico_cajas, 1);
    assert.equal(ingreso!.conteo_fisico_unidades_sueltas, 0);
    assert.equal(ingreso!.ubicacion_bodega, "2B-CP3");
  });

  it("productos sin match deben tener las 4 propiedades (aunque null)", async () => {
    const result = await getIngresosPorProducto(["101-2"]);

    const ingresos = result["101-2"];
    assert.ok(ingresos, "debe haber ingresos para código 101-2");

    for (const ing of ingresos) {
      assert.ok("conteo_fisico_unidades" in ing);
      assert.ok("conteo_fisico_cajas" in ing);
      assert.ok("conteo_fisico_unidades_sueltas" in ing);
      assert.ok("ubicacion_bodega" in ing);
    }
  });
});
