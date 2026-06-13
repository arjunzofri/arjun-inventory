import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/arjun";
import { usuarios, auditLog } from "@/db/arjun/schema";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if ((session?.user as any)?.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
  try {
    const session = await auth();
    if ((session?.user as any)?.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // No permitir eliminar el propio usuario
    const currentUserId = parseInt((session!.user as any).id, 10);
    if (userId === currentUserId) {
      return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 403 });
    }

    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    await db.delete(auditLog).where(eq(auditLog.usuarioId, userId));
    await db.delete(usuarios).where(eq(usuarios.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE usuario:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
