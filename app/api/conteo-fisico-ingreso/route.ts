import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { upsertConteoFisicoIngreso } from "@/db/arjun/queries";

const PISO_VALUES = ["A", "B", "C", "D", "E"] as const;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const usuarioId = parseInt((session.user as any).id, 10);

  if (isNaN(usuarioId)) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.codigo_producto !== "string" ||
    !body.codigo_producto ||
    typeof body.nroingreso !== "string" ||
    !body.nroingreso
  ) {
    return NextResponse.json(
      { error: "Faltan codigo_producto o nroingreso" },
      { status: 400 },
    );
  }

  const unidades = parseInt(body.unidades_fisicas, 10);

  if (isNaN(unidades) || unidades < 0) {
    return NextResponse.json(
      { error: "unidades_fisicas debe ser un entero >= 0" },
      { status: 400 },
    );
  }

  let piso: "A" | "B" | "C" | "D" | "E" | null = null;
  if (body.piso != null) {
    if (typeof body.piso !== "string" || !(PISO_VALUES as readonly string[]).includes(body.piso)) {
      return NextResponse.json(
        { error: `piso debe ser uno de: ${PISO_VALUES.join(", ")}` },
        { status: 400 },
      );
    }
    piso = body.piso as "A" | "B" | "C" | "D" | "E";
  }

  try {
    await upsertConteoFisicoIngreso(
      body.codigo_producto,
      body.nroingreso,
      unidades,
      piso,
      usuarioId,
    );
    return NextResponse.json({
      codigo_producto: body.codigo_producto,
      nroingreso: body.nroingreso,
      unidades_fisicas: unidades,
      piso,
    });
  } catch (error) {
    console.error("Error en upsert conteo físico ingreso:", error);
    return NextResponse.json(
      { error: "Error al guardar conteo físico por ingreso" },
      { status: 500 },
    );
  }
}
