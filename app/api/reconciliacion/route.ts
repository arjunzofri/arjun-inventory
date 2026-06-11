import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComprasAnil } from "@/db/vidadigital/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await getComprasAnil();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching compras Anil:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de compras" },
      { status: 500 },
    );
  }
}
