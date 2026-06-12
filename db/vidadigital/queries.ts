import { neon } from "@neondatabase/serverless";

export interface CompraDetalle {
  knumfoli: string;
  fechanvt: string;
  empresa: string;
  unidades: number;
}

export interface IngresoRow {
  nroingreso: string;
  anio: string;
  bodega_code: string;
  bodega_nombre: string;
  saldo_zofri_unidades: number;
  packing: number;
}

export interface ReconciliacionRow {
  codigo: string;
  detalle: string;
  packing: number;
  umed: string;
  total_unidades_compradas: number;
  total_cajas_compradas: number;
  saldo_zofri_unidades: number;
  saldo_zofri_cajas: number;
  compras: CompraDetalle[];
  ingresos: IngresoRow[];
}

/** Trae todas las compras de Anil desde Vida Digital (read-only). */
export async function getComprasAnil(): Promise<ReconciliacionRow[]> {
  const sql = neon(process.env.VIDADIGITAL_DATABASE_URL!);

  const [rows, detalles] = await Promise.all([
    // Agregado por producto.
    // DISTINCT ON(codigo) evita que filas duplicadas en public.productos
    // (mismo codigo, distinto detalle) tripliquen SUM(i.cantsali).
    sql`
      SELECT
        sub.codigo,
        sub.detalle,
        sub.cantcaja                                     AS packing,
        sub.umed,
        SUM(i.cantsali)                                   AS total_unidades_compradas,
        CEIL(SUM(i.cantsali)::numeric / NULLIF(sub.cantcaja, 0))
                                                         AS total_cajas_compradas,
        sub.saldo                                        AS saldo_zofri_unidades,
        FLOOR(sub.saldo::numeric / NULLIF(sub.cantcaja, 0))
                                                         AS saldo_zofri_cajas
      FROM vida.itemdcto i
      JOIN vida.movidcto m ON m.knumfoli = i.knumfoli
      JOIN (
        SELECT DISTINCT ON (codigo)
          codigo, detalle, cantcaja, umed, saldo
        FROM public.productos
        ORDER BY codigo
      ) sub ON sub.codigo = i.codunico
      WHERE m.tipomovi = 'V'
        AND m.kcodcli2 IN (2, 20, 218)
      GROUP BY sub.codigo, sub.detalle, sub.cantcaja, sub.umed, sub.saldo
      ORDER BY sub.detalle
    `,

    // Desglose individual de notas de venta (agrupado por NV + producto).
    // No necesita JOIN a public.productos — usamos i.codunico directamente
    // para evitar explosión por duplicados en la tabla productos.
    sql`
      SELECT
        i.codunico          AS codigo,
        m.knumfoli,
        m.fechanvt::text    AS fechanvt,
        'vida'              AS empresa,
        SUM(i.cantsali)     AS unidades
      FROM vida.itemdcto i
      JOIN vida.movidcto m ON m.knumfoli = i.knumfoli
      WHERE m.tipomovi = 'V'
        AND m.kcodcli2 IN (2, 20, 218)
      GROUP BY i.codunico, m.knumfoli, m.fechanvt
      ORDER BY i.codunico, m.fechanvt DESC
    `,
  ]);

  // Helpers para convertir numeric de PG a número real
  const toNum = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  // Indexar detalles por código de producto
  const comprasPorCodigo: Record<string, CompraDetalle[]> = {};
  for (const d of detalles as any[]) {
    const codigo = d.codigo as string;
    if (!comprasPorCodigo[codigo]) comprasPorCodigo[codigo] = [];
    comprasPorCodigo[codigo].push({
      knumfoli: d.knumfoli as string,
      fechanvt: d.fechanvt as string,
      empresa: d.empresa as string,
      unidades: toNum(d.unidades),
    });
  }

  // Query 3: ingresos por producto (solo para codigos comprados por Anil)
  const codigos = (rows as any[]).map((r) => r.codigo as string);
  const ingresos = await getIngresosPorProducto(codigos);

  return (rows as any[]).map((row) => ({
    codigo: row.codigo as string,
    detalle: row.detalle as string,
    packing: toNum(row.packing),
    umed: (row.umed as string) ?? "",
    total_unidades_compradas: toNum(row.total_unidades_compradas),
    total_cajas_compradas: toNum(row.total_cajas_compradas),
    saldo_zofri_unidades: toNum(row.saldo_zofri_unidades),
    saldo_zofri_cajas: toNum(row.saldo_zofri_cajas),
    compras: comprasPorCodigo[row.codigo as string] ?? [],
    ingresos: ingresos[row.codigo as string] ?? [],
  }));
}

/** Trae los ingresos individuales por producto desde public.productos,
 *  filtrando solo los códigos comprados por Anil. */
export async function getIngresosPorProducto(
  codigos: string[],
): Promise<Record<string, IngresoRow[]>> {
  if (codigos.length === 0) return {};

  const sql = neon(process.env.VIDADIGITAL_DATABASE_URL!);

  const rows = await sql`
    SELECT
      p.codigo,
      p.nroingreso,
      SPLIT_PART(p.nroingreso, '-', 2)    AS anio,
      SPLIT_PART(p.nroingreso, '-', 5)    AS bodega_code,
      CASE SPLIT_PART(p.nroingreso, '-', 5)
        WHEN 'GLP' THEN 'Bodega 1'
        WHEN 'GL1' THEN 'Bodega 2'
        ELSE SPLIT_PART(p.nroingreso, '-', 5)
      END                                 AS bodega_nombre,
      p.saldo                             AS saldo_zofri_unidades,
      p.cantcaja                          AS packing
    FROM public.productos p
    WHERE p.codigo = ANY(${codigos}::text[])
      AND p.nroingreso IS NOT NULL
      AND p.nroingreso != ''
    ORDER BY p.codigo, p.nroingreso DESC
  `;

  const toNum = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const result: Record<string, IngresoRow[]> = {};
  for (const r of rows as any[]) {
    const codigo = r.codigo as string;
    if (!result[codigo]) result[codigo] = [];
    result[codigo].push({
      nroingreso: r.nroingreso as string,
      anio: r.anio as string,
      bodega_code: r.bodega_code as string,
      bodega_nombre: r.bodega_nombre as string,
      saldo_zofri_unidades: toNum(r.saldo_zofri_unidades),
      packing: toNum(r.packing),
    });
  }
  return result;
}
