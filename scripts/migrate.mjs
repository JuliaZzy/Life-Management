import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/life_management";
const pool = new Pool({ connectionString });
const directory = resolve(process.cwd(), "drizzle");

try {
  const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = await readFile(resolve(directory, file), "utf8");
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
} finally {
  await pool.end();
}
