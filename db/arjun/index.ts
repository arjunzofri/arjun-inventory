import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type DB = NeonHttpDatabase;

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) {
    const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql);
  }
  return _db;
}

const handler: ProxyHandler<object> = {
  get(_target, prop, _receiver) {
    return Reflect.get(getDb(), prop, getDb());
  },
};

/** Lazy Neon Arjun connection (read/write). Safe to import at build time. */
export const db = new Proxy({}, handler) as unknown as DB;
