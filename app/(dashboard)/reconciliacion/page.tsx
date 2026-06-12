import { getComprasAnil } from "@/db/vidadigital/queries";
import { ReconciliacionTable } from "@/components/reconciliacion/ReconciliacionTable";

export default async function ReconciliacionPage() {
  let data;
  let error: string | null = null;

  try {
    data = await getComprasAnil();
  } catch (e) {
    console.error("ReconciliacionPage error:", e);
    error = "No se pudieron cargar los datos de compras. Verificá la conexión a Vida Digital.";
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Reconciliación</h1>
        <p className="text-sm text-muted-foreground">
          Cruce de compras Anil con saldo Zofri y conteo físico
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-10 text-center text-sm text-destructive">
          {error}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">
          No se encontraron compras para los clientes de Anil.
        </div>
      ) : (
        <ReconciliacionTable data={data} />
      )}
    </div>
  );
}
