import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRawPool, findMigrationTable } from "./db-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const drizzleDir = path.resolve(__dirname, "../../drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");

function parseCountArg(): number {
  const args = process.argv.slice(2);
  for (const arg of args) {
    const headMatch = arg.match(/~?head(\d+)/i);
    if (headMatch) return parseInt(headMatch[1], 10);

    const numMatch = arg.match(/^~?(\d+)$/);
    if (numMatch) return parseInt(numMatch[1], 10);

    const countMatch = arg.match(/--count=(\d+)/);
    if (countMatch) return parseInt(countMatch[1], 10);
  }
  return 1;
}

async function rollback() {
  const count = parseCountArg();
  console.log(`⚡ Rolling back / Clearing recent ${count} migration(s) from Local and Cloud DB...`);

  if (!fs.existsSync(journalPath)) {
    console.error("❌ Migration journal (_journal.json) not found at:", journalPath);
    process.exit(1);
  }

  const journalContent = fs.readFileSync(journalPath, "utf8");
  const journal = JSON.parse(journalContent);
  const entries: any[] = journal.entries || [];

  if (entries.length === 0) {
    console.log("ℹ️ No migrations found in journal.");
    process.exit(0);
  }

  const actualCount = Math.min(count, entries.length);
  const entriesToRemove = entries.slice(entries.length - actualCount);
  const entriesToKeep = entries.slice(0, entries.length - actualCount);

  console.log(`\n🗑️ Removing ${actualCount} migration file(s) locally:`);

  for (const entry of entriesToRemove) {
    const sqlFile = path.join(drizzleDir, `${entry.tag}.sql`);
    if (fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
      console.log(`  - Deleted SQL: ${entry.tag}.sql`);
    }

    const snapshotName = `${String(entry.idx).padStart(4, "0")}_snapshot.json`;
    const snapshotFile = path.join(drizzleDir, "meta", snapshotName);
    if (fs.existsSync(snapshotFile)) {
      fs.unlinkSync(snapshotFile);
      console.log(`  - Deleted Snapshot: meta/${snapshotName}`);
    }
  }

  // Update journal file
  journal.entries = entriesToKeep;
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), "utf8");
  console.log("  ✅ Updated local _journal.json");

  // Cloud DB Cleanup
  console.log("\n☁️ Removing recent migration entries from Cloud DB...");
  const pool = getRawPool();
  try {
    const tableInfo = await findMigrationTable(pool);
    if (!tableInfo) {
      console.log("  ℹ️ No __drizzle_migrations table found in Cloud DB.");
    } else {
      const fullTableName = `"${tableInfo.schemaName}"."${tableInfo.tableName}"`;
      const deleteQuery = `
        DELETE FROM ${fullTableName} 
        WHERE id IN (
          SELECT id FROM ${fullTableName} 
          ORDER BY id DESC 
          LIMIT $1
        )
      `;
      const res = await pool.query(deleteQuery, [actualCount]);
      console.log(`  ✅ Removed ${res.rowCount} row(s) from Cloud DB table ${fullTableName}`);
    }
  } catch (error) {
    console.error("⚠️ Warning: Failed to clean Cloud DB migration table:", error);
  } finally {
    await pool.end();
  }

  console.log(`\n🎉 Successfully rolled back ${actualCount} migration(s)!`);
  console.log("👉 You can now edit your schema, run `pnpm db:generate` to generate a new migration, and `pnpm db:migrate` to deploy.");
}

rollback();
