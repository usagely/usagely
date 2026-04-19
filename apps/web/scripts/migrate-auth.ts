import { getMigrations } from "better-auth/db/migration"
import { auth } from "../src/lib/auth"

async function migrate() {
  const { runMigrations } = await getMigrations(auth.options)
  await runMigrations()
  console.log("Auth DB migrated")
}

migrate().catch(console.error)
