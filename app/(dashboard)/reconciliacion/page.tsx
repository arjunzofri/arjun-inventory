import { getComprasAnil } from "@/db/vidadigital/queries";
import { getConteosFisicos, getConteosFisicosIngreso } from "@/db/arjun/queries";
import { ReconciliacionTable } from "@/components/reconciliacion/ReconciliacionTable";

export default async function ReconciliacionPage() {
  let data;
  let conteos: Record<string, number> = {};
  let conteosIngreso: Record<string, { unidades: number; piso: string | null }> = {};
  let error: string | null = null;

  try {
    [data, conteos, conteosIngreso] = await Promise.all([
      getComprasAnil(),
      getConteosFisicos(),
      getConteosFisicosIngreso(),
    ]);
  } catch (e) {
    console.error("ReconciliacionPage error:", e);
    error = "No se pudieron cargar los datos de compras. Verificá la conexión a Vida Digital.";
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#2d3748]">
          Reconciliación
        </h1>
        <p className="mt-1 text-sm text-[#718096]">
          Cruce de compras Anil con saldo Zofri y conteo físico
        </p>
      </div>

      {error ? (
        <div className="shadow-neumorph rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#e53e3e]">
          {error}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="shadow-neumorph rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#718096]">
          No se encontraron compras para los clientes de Anil.
        </div>
      ) : (
        <ReconciliacionTable
          data={data}
          initialConteos={conteos}
          initialConteosIngreso={conteosIngreso}
        />
      )}
    </div>
  );
}
