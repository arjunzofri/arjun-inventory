import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type DB = NeonHttpDatabase;

let _vd: DB | null = null;

function getVd(): DB {
  if (!_vd) {
    const sql: NeonQueryFunction<false, false> = neon(
      process.env.VIDADIGITAL_DATABASE_URL!,
    );
    _vd = drizzle(sql);
  }
  return _vd;
}

const handler: ProxyHandler<object> = {
  get(_target, prop, _receiver) {
    return Reflect.get(getVd(), prop, getVd());
  },
};

/** Lazy read-only Vida Digital connection. Safe to import at build time. */
export const vd = new Proxy({}, handler) as unknown as DB;
