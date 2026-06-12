import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { conteosFisicos, conteosFisicosIngreso, auditLog } from "./schema";

/** Devuelve todos los conteos físicos como Record<codigo, unidades>. */
export async function getConteosFisicos(): Promise<Record<string, number>> {
  const rows = await db.select().from(conteosFisicos);
  return Object.fromEntries(
    rows.map((r) => [r.codigoProducto, r.unidadesFisicas]),
  );
}

/** Upsert del conteo físico de un producto + registro en audit_log. */
export async function upsertConteoFisico(
  codigoProducto: string,
  unidadesFisicas: number,
  usuarioId: number,
): Promise<void> {
  // Leer valor anterior para auditoría
  const [existing] = await db
    .select()
    .from(conteosFisicos)
    .where(eq(conteosFisicos.codigoProducto, codigoProducto))
    .limit(1);

  const valorAnterior = existing?.unidadesFisicas ?? null;

  await db
    .insert(conteosFisicos)
    .values({ codigoProducto, unidadesFisicas, usuarioId })
    .onConflictDoUpdate({
      target: conteosFisicos.codigoProducto,
      set: {
        unidadesFisicas,
        usuarioId,
        updatedAt: sql`now()`,
      },
    });

  // Auditoría
  await db.insert(auditLog).values({
    usuarioId,
    accion: existing ? "UPDATE" : "INSERT",
    codigoProducto,
    valorAnterior,
    valorNuevo: unidadesFisicas,
  });
}

// ── Conteos por ingreso ──────────────────────────────────────────────

/** Devuelve conteos físicos por ingreso.
 *  Key = "codigo|nroingreso", value = { unidades, piso }. */
export async function getConteosFisicosIngreso(): Promise<
  Record<string, { unidades: number; piso: string | null }>
> {
  const rows = await db.select().from(conteosFisicosIngreso);
  const result: Record<string, { unidades: number; piso: string | null }> = {};
  for (const r of rows) {
    const key = `${r.codigoProducto}|${r.nroingreso}`;
    result[key] = { unidades: r.unidadesFisicas, piso: r.piso ?? null };
  }
  return result;
}

/** Upsert del conteo físico por ingreso + registro en audit_log. */
export async function upsertConteoFisicoIngreso(
  codigoProducto: string,
  nroingreso: string,
  unidadesFisicas: number,
  piso: "A" | "B" | "C" | "D" | "E" | null,
  usuarioId: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(conteosFisicosIngreso)
    .where(
      and(
        eq(conteosFisicosIngreso.codigoProducto, codigoProducto),
        eq(conteosFisicosIngreso.nroingreso, nroingreso),
      ),
    )
    .limit(1);

  const valorAnterior = existing?.unidadesFisicas ?? null;

  await db
    .insert(conteosFisicosIngreso)
    .values({ codigoProducto, nroingreso, unidadesFisicas, piso, usuarioId })
    .onConflictDoUpdate({
      target: [conteosFisicosIngreso.codigoProducto, conteosFisicosIngreso.nroingreso],
      set: {
        unidadesFisicas,
        piso,
        usuarioId,
        updatedAt: sql`now()`,
      },
    });

  await db.insert(auditLog).values({
    usuarioId,
    accion: existing ? "UPDATE" : "INSERT",
    codigoProducto: `${codigoProducto}|${nroingreso}`,
    valorAnterior,
    valorNuevo: unidadesFisicas,
  });
}
