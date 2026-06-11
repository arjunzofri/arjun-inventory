import { neon } from "@neondatabase/serverless";

export interface ReconciliacionRow {
  codigo: string;
  detalle: string;
  packing: number;
  umed: string;
  total_unidades_compradas: number;
  total_cajas_compradas: number;
  saldo_zofri_unidades: number;
  saldo_zofri_cajas: number;
}

/** Trae todas las compras de Anil desde Vida Digital (read-only). */
export async function getComprasAnil(): Promise<ReconciliacionRow[]> {
  const sql = neon(process.env.VIDADIGITAL_DATABASE_URL!);

  const rows = await sql`
    SELECT
      p.codigo,
      p.detalle,
      p.cantcaja                                     AS packing,
      p.umed,
      SUM(i.cantsali)                                 AS total_unidades_compradas,
      CEIL(SUM(i.cantsali)::numeric / NULLIF(p.cantcaja, 0))
                                                     AS total_cajas_compradas,
      p.saldo                                        AS saldo_zofri_unidades,
      FLOOR(p.saldo::numeric / NULLIF(p.cantcaja, 0)) AS saldo_zofri_cajas
    FROM vida.itemdcto i
    JOIN vida.movidcto m    ON m.knumfoli  = i.knumfoli
    JOIN public.productos p ON p.codigo    = i.codunico
    WHERE m.tipomovi = 'V'
      AND m.kcodcli2 IN (2, 20, 218)
    GROUP BY p.codigo, p.detalle, p.cantcaja, p.umed, p.saldo
    ORDER BY p.detalle
  `;

  return rows as ReconciliacionRow[];
}
