import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["admin", "bodeguero"]);

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  rol: rolEnum("rol").notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conteosFisicos = pgTable("conteos_fisicos", {
  id: serial("id").primaryKey(),
  codigoProducto: text("codigo_producto").notNull().unique(),
  unidadesFisicas: integer("unidades_fisicas").notNull(),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  accion: text("accion").notNull(),
  codigoProducto: text("codigo_producto"),
  valorAnterior: integer("valor_anterior"),
  valorNuevo: integer("valor_nuevo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const pisoEnum = pgEnum("piso", ["A", "B", "C", "D", "E"]);

export const conteosFisicosIngreso = pgTable("conteos_fisicos_ingreso", {
  id: serial("id").primaryKey(),
  codigoProducto: text("codigo_producto").notNull(),
  nroingreso: text("nroingreso").notNull(),
  unidadesFisicas: integer("unidades_fisicas").notNull(),
  piso: pisoEnum("piso"),
  usuarioId: integer("usuario_id").references(() => usuarios.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unico: unique().on(t.codigoProducto, t.nroingreso),
}));
