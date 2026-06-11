# PRD — Arjun Inventory Reconciler

## 1. Descripción del proyecto

Aplicación web que permite a Anil Chandnani y sus bodegueros cuadrar el
inventario físico de Arjun almacenado en las bodegas de Vida Digital.
Extrae compras históricas de Anil desde Neon de Vida Digital (read-only),
las cruza con saldos Zofri y permite ingresar conteos físicos manuales
para calcular diferencias y sugerencias de pertenencia por caja.

## 2. Usuarios y roles

| Rol       | Acciones                                                                 |
|-----------|--------------------------------------------------------------------------|
| admin     | Ve todo, puede editar conteos físicos, ve auditoría completa             |
| bodeguero | Ve la tabla de reconciliación, ingresa y edita conteos físicos           |

## 3. Stack

| Capa            | Tecnología                          |
|-----------------|-------------------------------------|
| Framework       | Next.js 14 (App Router)             |
| Lenguaje        | TypeScript                          |
| BD propia app   | Neon de Arjun (read/write)          |
| BD externa      | Neon de Vida Digital (read-only)    |
| ORM             | Drizzle ORM                         |
| Auth            | NextAuth.js v5 (credentials)        |
| UI              | Tailwind CSS + shadcn/ui            |
| Deploy          | Vercel de Arjun                     |

## 4. Clientes Anil en Vida Digital

Los tres registros que representan a Anil/Arjun:

| kcodclie | nombress                            | rutclien |
|----------|-------------------------------------|----------|
| 218      | ANIL CHANDNANI                      | 14710832 |
| 20       | ANIL CHANDNANI IMPORT EXPORT EIRL   | 52003473 |
| 2        | ANIL CHANDNANI IMPORT. EXPORT. EIRL | 52003473 |

Constante en el código: `ANIL_CLIENT_IDS = [2, 20, 218]`

## 5. Modelo de datos — Neon Vida Digital (read-only)

### Query principal de compras de Anil

```sql
-- Todas las compras de Anil agrupadas por producto
SELECT
  p.codigo,
  p.detalle,
  p.cantcaja                                      AS packing,
  p.umed,
  SUM(i.cantsali)                                 AS total_unidades_compradas,
  CEIL(SUM(i.cantsali)::numeric / NULLIF(p.cantcaja, 0))
                                                  AS total_cajas_compradas,
  p.saldo                                         AS saldo_zofri_unidades,
  FLOOR(p.saldo::numeric / NULLIF(p.cantcaja, 0)) AS saldo_zofri_cajas
FROM vida.itemdcto i
JOIN vida.movidcto m    ON m.knumfoli  = i.knumfoli
JOIN public.productos p ON p.codigo   = i.codunico
WHERE m.tipomovi = 'V'
  AND m.kcodcli2 IN (2, 20, 218)
GROUP BY p.codigo, p.detalle, p.cantcaja, p.umed, p.saldo
ORDER BY p.detalle;
```

> Nota: Si los esquemas vida y sanjh requieren queries separadas y UNION,
> Claude Code debe verificar en qué esquema están las compras de Anil
> antes del primer slice.

## 6. Modelo de datos — Neon Arjun (read/write)

### Tabla: usuarios
```sql
CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('admin', 'bodeguero')),
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: conteos_fisicos
```sql
CREATE TABLE conteos_fisicos (
  id               SERIAL PRIMARY KEY,
  codigo_producto  TEXT NOT NULL,
  unidades_fisicas INTEGER NOT NULL,
  usuario_id       INTEGER REFERENCES usuarios(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
-- Un registro por producto. Upsert por codigo_producto.
```

### Tabla: audit_log
```sql
CREATE TABLE audit_log (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER REFERENCES usuarios(id),
  accion           TEXT NOT NULL,
  codigo_producto  TEXT,
  valor_anterior   INTEGER,
  valor_nuevo      INTEGER,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

## 7. Lógica de las 6 columnas

| # | Columna                        | Fórmula                                                           |
|---|--------------------------------|-------------------------------------------------------------------|
| 1 | Compras Anil                   | SUM(cantsali) agrupado por producto + cajas = unidades/packing    |
| 2 | Saldo Zofri                    | productos.saldo + cajas = saldo/packing                           |
| 3 | Conteo físico                  | Ingresado manualmente por bodeguero (unidades + cajas calculadas) |
| 4 | Diferencia Zofri vs Compras    | saldo_zofri_unidades - total_unidades_compradas                   |
| 5 | Diferencia Físico vs Compras   | unidades_fisicas - total_unidades_compradas                       |
| 6 | Sugerencia cajas de Anil       | FLOOR(total_unidades_compradas / packing) cajas completas         |

## 8. Backlog priorizado

### Fase 1 — MVP

- [ ] S01: Infraestructura base — Next.js, Drizzle, conexiones dual-Neon, variables de entorno
- [ ] S02: Auth — tabla usuarios, NextAuth credentials, login/logout, seed usuario admin
- [ ] S03: Query compras Anil — endpoint GET /api/reconciliacion, datos de Vida Digital
- [ ] S04: Tabla de reconciliación — UI con las 6 columnas, datos read-only
- [ ] S05: Conteo físico — input editable por fila, upsert en conteos_fisicos, audit_log
- [ ] S06: Cálculo de diferencias y sugerencias — columnas 4, 5 y 6 con lógica completa

### Fase 2 — Post MVP

- [ ] Exportar tabla a Excel/CSV
- [ ] Historial de conteos por producto
- [ ] Vista de auditoría para admin
- [ ] Filtros por categoría o fecha de compra

## 9. Estructura de carpetas

```
arjun-inventory/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── reconciliacion/
│   │       └── page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       └── reconciliacion/
│           └── route.ts
├── components/
│   └── reconciliacion/
│       ├── ReconciliacionTable.tsx
│       └── ConteoFisicoInput.tsx
├── db/
│   ├── arjun/
│   │   ├── schema.ts
│   │   └── index.ts
│   └── vidadigital/
│       ├── queries.ts
│       └── index.ts
├── lib/
│   └── auth.ts
├── config/
│   └── feature-flags.json
├── drizzle/
│   └── migrations/
├── .env.local.example
├── CLAUDE.md
└── PRD.md
```

## 10. Variables de entorno requeridas

```
# Neon Arjun (read/write)
DATABASE_URL=

# Neon Vida Digital (read-only)
VIDADIGITAL_DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```
