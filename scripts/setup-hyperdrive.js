#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("⚡ Setting up Cloudflare Hyperdrive...");

// Helper to load environment variables from .env or server/hono/.dev.vars
function getDatabaseUrl() {
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
  console.error("❌ Error: Valid DATABASE_URL not found in .env or server/hono/.dev.vars");
  console.error("👉 Please define DATABASE_URL in your root .env file and re-run.");
  process.exit(1);
}

// Derive a clean name from package.json or directory
let projectName = "thunder-stack";
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
  projectName = (pkg.name || path.basename(rootDir)).replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
} catch {}

const hyperdriveName = `${projectName}-hyperdrive`;

console.log(`🔍 Checking existing Hyperdrive instances for "${hyperdriveName}"...`);

let hyperdriveId = null;

try {
  const listOutput = execSync("pnpm --filter server exec wrangler hyperdrive list", {
    cwd: rootDir,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  // Check if our Hyperdrive exists in the list
  const lines = listOutput.split("\n");
  for (const line of lines) {
    if (line.includes(hyperdriveName)) {
      // Extract UUID from row
      const match = line.match(/([a-f0-9]{32})/i) || line.match(/([a-f0-9-]{36})/i);
      if (match) {
        hyperdriveId = match[1];
        break;
      }
    }
  }
} catch (e) {
  // If list fails (e.g. not logged in), notify user
  console.log("ℹ️ Could not query existing Hyperdrives list, proceeding to create...");
}

if (hyperdriveId) {
  console.log(`✅ Found existing Hyperdrive configuration: ${hyperdriveId}`);
} else {
  console.log(`🚀 Creating new Cloudflare Hyperdrive configuration "${hyperdriveName}"...`);
  try {
    const createOutput = execSync(
      `pnpm --filter server exec wrangler hyperdrive create "${hyperdriveName}" --connection-string="${dbUrl}"`,
      {
        cwd: rootDir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const match =
      createOutput.match(/id:\s*["']?([a-f0-9-]{32,36})["']?/i) ||
      createOutput.match(/([a-f0-9]{32})/i) ||
      createOutput.match(/([a-f0-9-]{36})/i);

    if (match) {
      hyperdriveId = match[1];
    } else {
      console.log(createOutput);
    }
  } catch (error) {
    console.error("❌ Failed to create Hyperdrive instance:", error.message);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    console.error("👉 Make sure you are logged in by running: pnpm login:cf");
    process.exit(1);
  }
}

if (!hyperdriveId) {
  console.error("❌ Could not determine Hyperdrive ID from Wrangler output.");
  process.exit(1);
}

console.log(`✅ Hyperdrive ID: ${hyperdriveId}`);

// Update server/hono/wrangler.jsonc
const wranglerPath = path.join(rootDir, "server/hono/wrangler.jsonc");
if (fs.existsSync(wranglerPath)) {
  let wranglerContent = fs.readFileSync(wranglerPath, "utf-8");

  // Check if hyperdrive binding already exists
  if (wranglerContent.includes('"hyperdrive"')) {
    // Replace existing binding id
    wranglerContent = wranglerContent.replace(
      /"id":\s*"[^"]*"/,
      `"id": "${hyperdriveId}"`
    );
  } else {
    // Insert hyperdrive binding before the closing brace
    const bindingBlock = `  "hyperdrive": [\n    {\n      "binding": "HYPERDRIVE",\n      "id": "${hyperdriveId}"\n    }\n  ],\n`;
    const lastBraceIndex = wranglerContent.lastIndexOf("}");
    if (lastBraceIndex !== -1) {
      wranglerContent =
        wranglerContent.substring(0, lastBraceIndex) +
        bindingBlock +
        wranglerContent.substring(lastBraceIndex);
    }
  }

  fs.writeFileSync(wranglerPath, wranglerContent, "utf-8");
  console.log("✅ Updated server/hono/wrangler.jsonc with Hyperdrive binding!");
}

console.log("\n🎉 Cloudflare Hyperdrive successfully set up in 1 command!");
console.log("🚀 You can now deploy your backend server with: pnpm deploy:server\n");
