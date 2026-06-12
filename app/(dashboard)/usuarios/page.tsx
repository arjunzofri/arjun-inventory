import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsuariosManager } from "@/components/usuarios/UsuariosManager";

export default async function UsuariosPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const rol = (session.user as any).rol;
  if (rol !== "admin") redirect("/reconciliacion");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#2d3748]">
          Gestión de Usuarios
        </h1>
        <p className="mt-1 text-sm text-[#718096]">
          Crear, activar y eliminar usuarios del sistema
        </p>
      </div>
      <UsuariosManager currentUserId={session.user.id!} />
    </div>
  );
}
