import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getRawPool, findMigrationTable } from "./db-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const drizzleDir = path.resolve(__dirname, "../../drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");

interface LocalMigration {
  idx: number;
  tag: string;
  when: number;
}

interface CloudMigration {
  id: number;
  hash: string;
  created_at: number | string;
}

async function status() {
  console.log("🔍 Checking Migration & DB Status (Local vs Cloud DB)...\n");

  // 1. Read local migrations
  let localEntries: LocalMigration[] = [];
  if (fs.existsSync(journalPath)) {
    try {
      const content = fs.readFileSync(journalPath, "utf8");
      const parsed = JSON.parse(content);
      localEntries = parsed.entries || [];
    } catch (e) {
      console.error("⚠️ Failed to parse local _journal.json");
    }
  }

  // 2. Read Cloud DB migrations
  let cloudEntries: CloudMigration[] = [];
  let tableFound = false;

  const pool = getRawPool();
  try {
    const tableInfo = await findMigrationTable(pool);
    if (tableInfo) {
      tableFound = true;
      const fullTableName = `"${tableInfo.schemaName}"."${tableInfo.tableName}"`;
      const res = await pool.query(`SELECT * FROM ${fullTableName} ORDER BY id ASC`);
      cloudEntries = res.rows;
    }
  } catch (error: any) {
    console.error("⚠️ Error connecting or reading Cloud DB migrations:", error.message || error);
  } finally {
    await pool.end();
  }

  console.log(`Local Migration Files: ${localEntries.length}`);
  console.log(`Cloud DB Migration Table: ${tableFound ? `${cloudEntries.length} records applied` : "Not Initialized / 0 records"}\n`);

  const maxLen = Math.max(localEntries.length, cloudEntries.length);

  if (maxLen === 0) {
    console.log("ℹ️ No migrations found locally or in Cloud DB.");
    return;
  }

  console.log("----------------------------------------------------------------------------------");
  console.log(
    "Index".padEnd(8) +
    "Tag / Migration Name".padEnd(35) +
    "Local File".padEnd(15) +
    "Cloud DB Status"
  );
  console.log("----------------------------------------------------------------------------------");

  for (let i = 0; i < maxLen; i++) {
    const local = localEntries[i];
    const cloud = cloudEntries[i];

    const idxStr = (local ? local.idx : cloud ? cloud.id : i).toString().padEnd(8);
    const tagStr = (local ? local.tag : cloud ? `(Cloud ID ${cloud.id})` : "Unknown").padEnd(35);
    const localStatus = local ? "✅ Present".padEnd(15) : "❌ Missing".padEnd(15);
    let cloudStatus = "⏳ Pending";

    if (cloud) {
      cloudStatus = "✅ Applied";
    }

    console.log(`${idxStr}${tagStr}${localStatus}${cloudStatus}`);
  }

  console.log("----------------------------------------------------------------------------------\n");
}

status();
