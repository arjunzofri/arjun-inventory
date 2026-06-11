// Script manual: npx tsx db/arjun/seed.ts
// Crea el usuario admin inicial en Neon Arjun si no existe.

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/arjun";
import { usuarios } from "@/db/arjun/schema";

async function seed() {
  const username = "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.error("❌ SEED_ADMIN_PASSWORD no está definida en .env.local");
    process.exit(1);
  }

  const [existing] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.username, username))
    .limit(1);

  if (existing) {
    console.log("⚠ Usuario admin ya existe, saltando seed.");
    process.exit(0);
  }

  const passwordHash = await hash(password, 10);

  await db.insert(usuarios).values({
    nombre: "Admin",
    username,
    passwordHash,
    rol: "admin",
  });

  console.log("✅ Usuario admin creado:", username);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
