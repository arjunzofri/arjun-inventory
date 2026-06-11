import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.VIDADIGITAL_DATABASE_URL!);

/** Read-only connection to Vida Digital — never use for writes. */
export const vd = drizzle(sql);
