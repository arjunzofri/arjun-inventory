import { NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";
import { upsertConteoFisico } from "@/db/arjun/queries";

export async function POST(request: Request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id && !token?.sub) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const usuarioId = parseInt((token.id ?? token.sub) as string, 10);

  if (isNaN(usuarioId)) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.codigo_producto !== "string" || !body.codigo_producto) {
    return NextResponse.json(
      { error: "Falta codigo_producto" },
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

  try {
    await upsertConteoFisico(body.codigo_producto, unidades, usuarioId);
    return NextResponse.json({
      codigo_producto: body.codigo_producto,
      unidades_fisicas: unidades,
    });
  } catch (error) {
    console.error("Error en upsert conteo físico:", error);
    return NextResponse.json(
      { error: "Error al guardar conteo físico" },
      { status: 500 },
    );
  }
}
