# CONTEXT — Arjun Inventory Reconciler

## Propósito de este archivo

Pega este archivo completo al inicio de una conversación nueva con Claude chat
cuando necesites al Director Técnico para decisiones de arquitectura.
Actualiza la sección "Estado actual" manualmente a medida que avanzas.

## Descripción del proyecto

App web para que Anil Chandnani y sus bodegueros cuadren el inventario físico
de Arjun almacenado en bodegas de Vida Digital. Muestra compras históricas de
Anil cruzadas con saldo Zofri, permite ingresar conteos físicos y calcula
diferencias y sugerencias de cajas.

## Stack

- Next.js 14 (App Router) + TypeScript
- Drizzle ORM
- NextAuth.js v5 (credentials)
- Tailwind CSS + shadcn/ui
- Neon Arjun (r/w) + Neon Vida Digital (read-only)
- Vercel de Arjun

## IDs cliente Anil en Vida Digital

`ANIL_CLIENT_IDS = [2, 20, 218]`
Tabla: vida.movidcto, campo: kcodcli2, tipomovi = 'V'

## Relaciones clave en Vida Digital

```
vida.clientes.kcodclie  <--  vida.movidcto.kcodcli2
                                     | knumfoli
                             vida.itemdcto.codunico  -->  public.productos.codigo
                                                              saldo (Zofri)
                                                              cantcaja (packing)
```

## Tablas propias en Neon Arjun

- usuarios (id, nombre, username, password_hash, rol, activo, created_at)
- conteos_fisicos (id, codigo_producto, unidades_fisicas, usuario_id, created_at, updated_at)
- audit_log (id, usuario_id, accion, codigo_producto, valor_anterior, valor_nuevo, created_at)

## Lógica de las 6 columnas

| Col | Nombre                      | Fórmula                                         |
|-----|-----------------------------|-------------------------------------------------|
| 1   | Compras Anil                | SUM(cantsali) agrupado por producto + cajas     |
| 2   | Saldo Zofri                 | productos.saldo + cajas = saldo/packing         |
| 3   | Conteo físico               | Input manual bodeguero                          |
| 4   | Diferencia Zofri - Compras  | saldo_zofri_unidades - total_unidades_compradas |
| 5   | Diferencia Físico - Compras | unidades_fisicas - total_unidades_compradas     |
| 6   | Sugerencia cajas Anil       | FLOOR(total_unidades_compradas / packing)       |

## Estado actual

- **Último slice completado**: S05 — Conteo físico (2026-06-12)
- **Próximo slice**: S06 — Cálculo de diferencias y sugerencias (columnas 4, 5 y 6 con lógica completa)
- **Feature flags activos**: s01_infraestructura, s02_auth, s03_query_compras, s04_reconciliacion_table, s05_conteo_fisico
- **Commits**: d818f52 (S01), 34eb0a8 (S02 + S03), S04 y S05 pendientes de commit

### Cambios fuera de slice
- Auth migrado de email a username (`lib/auth.ts`, `db/arjun/schema.ts`, login page, seed)
- Conexiones Drizzle lazy (Proxy) para evitar crash en build sin `.env.local`
- `drizzle-kit push --force` no funciona sin TTY — usar SQL directo para rename de columnas

### Cómo correr
```bash
npm run dev            # http://localhost:3000
npx tsx db/arjun/seed.ts   # crea usuario admin (username: admin)
```
- Login: usuario `admin` + contraseña definida en `SEED_ADMIN_PASSWORD` de `.env.local`
- `GET /api/reconciliacion` devuelve datos reales de Vida Digital

## Notas técnicas abiertas

- Verificar si las compras de Anil están también en esquema `sanjh` además de `vida`.
  Query pendiente:
  ```sql
  SELECT COUNT(*) FROM sanjh.movidcto WHERE tipomovi='V' AND kcodcli2 IN (2,20,218);
  ```
- Si hay registros en sanjh, la query de `db/vidadigital/queries.ts` necesita UNION con `sanjh.itemdcto`
