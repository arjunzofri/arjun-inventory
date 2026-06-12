import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "./index";
import { conteosFisicos, auditLog } from "./schema";

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
