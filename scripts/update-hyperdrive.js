#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔄 Updating Cloudflare Hyperdrive connection string...");

// Helper to get database connection string from CLI argument or .env
function getDatabaseUrl() {
  const cliArg = process.argv[2];
  if (cliArg && (cliArg.startsWith("postgres://") || cliArg.startsWith("postgresql://"))) {
    return cliArg.trim();
  }

  const envPaths = [
    path.join(rootDir, ".env"),
    path.join(rootDir, "server/hono/.dev.vars"),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      const match = content.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1] && !match[1].includes("user:password@localhost")) {
        return match[1].trim();
      }
    }
  }
  return null;
}

const dbUrl = getDatabaseUrl();

if (!dbUrl) {
  console.error("❌ Error: Valid DATABASE_URL not found in .env or passed as argument.");
  console.error('👉 Usage: pnpm update:hyperdrive [optional_new_connection_string]');
  process.exit(1);
}

// Find the Hyperdrive name or ID
let targetHyperdrive = null;

// Check wrangler.jsonc for existing bound ID
const wranglerPath = path.join(rootDir, "server/hono/wrangler.jsonc");
if (fs.existsSync(wranglerPath)) {
  const wranglerContent = fs.readFileSync(wranglerPath, "utf-8");
  const match = wranglerContent.match(/"id":\s*"([^"]+)"/);
  if (match && match[1]) {
    targetHyperdrive = match[1];
  }
}

// Fallback to project-name-hyperdrive
if (!targetHyperdrive) {
  let projectName = "thunder-stack";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
    projectName = (pkg.name || path.basename(rootDir)).replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  } catch {}
  targetHyperdrive = `${projectName}-hyperdrive`;
}

console.log(`📡 Updating Hyperdrive "${targetHyperdrive}" with new connection string...`);

try {
  const output = execSync(
    `pnpm --filter server exec wrangler hyperdrive update "${targetHyperdrive}" --connection-string="${dbUrl}"`,
    {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  console.log(output);
  console.log(`🎉 Cloudflare Hyperdrive "${targetHyperdrive}" successfully updated!`);
} catch (error) {
  console.error("❌ Failed to update Hyperdrive:", error.message);
  if (error.stdout) console.log(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}
