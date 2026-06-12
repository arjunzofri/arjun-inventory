import { NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/arjun";
import { usuarios } from "@/db/arjun/schema";

function isAdmin(token: any): boolean {
  return token?.rol === "admin";
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!isAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body requerido" }, { status: 400 });

  const updates: Record<string, any> = {};

  if (typeof body.password === "string" && body.password) {
    updates.passwordHash = await hash(body.password, 10);
  }

  if (typeof body.activo === "boolean") {
    updates.activo = body.activo;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  await db.update(usuarios).set(updates).where(eq(usuarios.id, userId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!isAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // No permitir eliminar el propio usuario
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const currentUserId = parseInt((token.id ?? token.sub) as string, 10);
  if (userId === currentUserId) {
    return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 403 });
  }

  const [user] = await db.select().from(usuarios).where(eq(usuarios.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await db.delete(usuarios).where(eq(usuarios.id, userId));

  return NextResponse.json({ ok: true });
}
