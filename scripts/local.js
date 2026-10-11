import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const mode = process.argv[2];
const modes = new Set(["dev", "build", "start"]);

if (!modes.has(mode)) {
  console.error("Usage: node scripts/local.js <dev|build|start>");
  process.exit(1);
}

function run(command) {
  execSync(command, { cwd: rootDir, stdio: "inherit", shell: true });
}

function runPersistent(command) {
  const child = spawn(command, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });
  const stop = (signal) => {
    if (!child.killed) child.kill(signal);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  child.on("exit", (code) => process.exit(code ?? 0));
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1500);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

async function waitForPort(host, port) {
  for (let attempt = 1; attempt <= 40; attempt++) {
    if (await canConnect(host, port)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Postgres did not accept connections on ${host}:${port}`);
}

function ensureDependencies() {
  if (fs.existsSync(path.join(rootDir, "node_modules"))) return;
  console.log("Installing dependencies...");
  run("pnpm install");
}

function ensureEnv() {
  const envPath = path.join(rootDir, ".env");
  const examplePath = path.join(rootDir, ".env.example");
  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(examplePath)) {
      throw new Error(".env.example is missing, so a local .env cannot be created.");
    }
    fs.copyFileSync(examplePath, envPath);
    console.log("Created .env from .env.example");
  }
  run("node scripts/setup-env.js");
  return readEnvFile(envPath);
}

async function ensureDatabase(env) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }

  const host = parsed.hostname;
  const port = Number(parsed.port || 5432);

  if (!isLocalHost(host)) {
    console.log(`Using remote database at ${host}. Skipping local Postgres.`);
    return;
  }

  if (await canConnect(host === "0.0.0.0" ? "127.0.0.1" : host, port)) {
    console.log(`Postgres is already accepting connections on ${host}:${port}`);
    return;
  }

  console.log("Local Postgres is not running. Starting it with Docker...");
  const probeHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  try {
    run("docker compose up -d");
  } catch {
    try {
      run("docker-compose up -d");
    } catch {
      throw new Error(
        "Could not start local Postgres. Install Docker and run again, or start Postgres yourself on the DATABASE_URL host."
      );
    }
  }

  await waitForPort(probeHost, port);
  console.log("Local Postgres is ready.");
}

function ensureSchema() {
  console.log("Applying database migrations...");
  run("pnpm db:migrate");
  console.log("Seeding database...");
  run("pnpm db:seed");
}

function hasWebBuild() {
  return fs.existsSync(path.join(rootDir, "client", "nextjs", ".next"));
}

async function main() {
  console.log(`\nTHUNDER local:${mode}\n`);
  ensureDependencies();
  const env = ensureEnv();
  await ensureDatabase(env);
  ensureSchema();

  if (mode === "build") {
    console.log("Building all local apps...");
    run("pnpm exec turbo run build");
    console.log("\nLocal build finished. Start it with: pnpm local:start");
    return;
  }

  if (mode === "start") {
    if (!hasWebBuild()) {
      console.log("No local Next.js build found. Building first...");
      run("pnpm exec turbo run build");
    }
    console.log("Starting the local production build (Next.js .next + API)...");
    runPersistent("pnpm exec turbo run start --filter=!mobile");
    return;
  }

  console.log("Starting local dev servers...");
  runPersistent("pnpm exec turbo run dev");
}

main().catch((error) => {
  console.error(`\nlocal:${mode} failed: ${error.message || error}`);
  process.exit(1);
});
