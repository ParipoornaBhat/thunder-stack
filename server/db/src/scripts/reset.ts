import { getRawPool } from "./db-utils.js";
import { execSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPackageDir = path.resolve(__dirname, "../..");

function askConfirmation(): Promise<boolean> {
  const args = process.argv.slice(2);
  const isForce = args.includes("-y") || args.includes("--force") || process.env.CI === "true";
  if (isForce) return Promise.resolve(true);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n⚠️  ------------------------------------------------------------- ⚠️");
    console.log("   DANGER: DATABASE RESET REQUESTED!");
    console.log("   This will permanently DROP all tables and ERASE ALL DATA");
    console.log("   in your Cloud PostgreSQL Database.");
    console.log("⚠️  ------------------------------------------------------------- ⚠️\n");

    rl.question("Are you SURE you want to continue? Type 'yes' or 'y' to confirm: ", (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

async function reset() {
  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log("❌ Database reset cancelled by user.");
    process.exit(0);
  }

  console.log("\n⚡ Resetting Database (Dropping Schemas & Re-applying Migrations)...");

  const pool = getRawPool();
  try {
    console.log("  Dropping schemas 'public' and 'drizzle'...");
    await pool.query("DROP SCHEMA IF EXISTS public CASCADE;");
    await pool.query("CREATE SCHEMA public;");
    await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE;");
    console.log("  ✅ Schemas dropped and recreated successfully.");
  } catch (error) {
    console.error("❌ Failed to drop/recreate database schemas:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  try {
    console.log("\n📦 Applying migrations...");
    execSync("pnpm db:migrate", { cwd: dbPackageDir, stdio: "inherit" });

    console.log("\n🌱 Seeding initial data...");
    execSync("pnpm db:seed", { cwd: dbPackageDir, stdio: "inherit" });

    console.log("\n🎉 Database Reset Completed Successfully!");
  } catch (error) {
    console.error("❌ Migration or seeding after reset failed:", error);
    process.exit(1);
  }
}

reset();
