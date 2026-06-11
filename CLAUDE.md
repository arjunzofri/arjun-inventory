# CLAUDE.md — Arjun Inventory Reconciler

## Stack

- Next.js 14 (App Router) + TypeScript
- Drizzle ORM
- NextAuth.js v5 (credentials)
- Tailwind CSS + shadcn/ui
- Neon (dual connection: Arjun r/w + Vida Digital read-only)
- Vercel

## Conexiones a base de datos

| Variable                 | BD                | Acceso     |
|--------------------------|-------------------|------------|
| DATABASE_URL             | Neon Arjun        | read/write |
| VIDADIGITAL_DATABASE_URL | Neon Vida Digital | read-only  |

Nunca hacer writes a VIDADIGITAL_DATABASE_URL.

## IDs de cliente Anil (constante — no modificar)

```typescript
export const ANIL_CLIENT_IDS = [2, 20, 218] as const;
```

## Comandos

```bash
npm run dev        # servidor local
npm run build      # build producción
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run db:push    # drizzle-kit push (solo Neon Arjun)
npm run db:studio  # drizzle studio
```

## Naming conventions

- Archivos de componentes: PascalCase → `ReconciliacionTable.tsx`
- Archivos de utilidades/queries: camelCase → `queries.ts`
- Tablas DB: snake_case → `conteos_fisicos`
- Variables TS: camelCase → `totalUnidadesCompradas`
- Constantes: UPPER_SNAKE_CASE → `ANIL_CLIENT_IDS`

## Reglas de desarrollo

1. Máximo 200 líneas por slice
2. Cada slice entregado como DIFF unificado por archivo
3. No hacer commits sin aprobación de Pablo
4. No modificar archivos fuera del alcance del slice actual
5. Confirmar files-to-touch antes de escribir código
6. Writes solo a DATABASE_URL (Neon Arjun) — nunca a VIDADIGITAL_DATABASE_URL

## Feature flags

Todos los slices agregan su flag en `config/feature-flags.json` con valor `false`.

## Referencia

Ver PRD.md para backlog completo, queries SQL y lógica de columnas.
