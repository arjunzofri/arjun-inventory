import { NextResponse } from "next/server";
import { getToken } from "@auth/core/jwt";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/arjun";
import { usuarios } from "@/db/arjun/schema";

function isAdmin(token: any): boolean {
  return token?.rol === "admin";
}

export async function GET(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!isAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await db
    .select({
      id: usuarios.id,
      username: usuarios.username,
      rol: usuarios.rol,
      activo: usuarios.activo,
      createdAt: usuarios.createdAt,
    })
    .from(usuarios)
    .orderBy(usuarios.username);

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!isAdmin(token)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.username || !body?.password || !body?.rol) {
    return NextResponse.json({ error: "Faltan username, password o rol" }, { status: 400 });
  }

  const username = (body.username as string).toLowerCase().trim();
  if (!username) return NextResponse.json({ error: "Username inválido" }, { status: 400 });

  const rol = body.rol as string;
  if (rol !== "admin" && rol !== "bodeguero") {
    return NextResponse.json({ error: "Rol debe ser admin o bodeguero" }, { status: 400 });
  }

  // Verificar duplicado
  const [exist] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1);
  if (exist) return NextResponse.json({ error: "El usuario ya existe" }, { status: 409 });

  const passwordHash = await hash(body.password as string, 10);

  const [created] = await db
    .insert(usuarios)
    .values({ username, passwordHash, rol, nombre: username })
    .returning({ id: usuarios.id });

  return NextResponse.json({ id: created.id, username, rol }, { status: 201 });
}
