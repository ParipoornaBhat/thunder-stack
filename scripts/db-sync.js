import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import nodeFs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const direction = process.argv[2];
const force = process.argv.includes("--yes") || process.argv.includes("-y");

if (direction !== "local" && direction !== "remote") {
  console.error("Usage: node scripts/db-sync.js <local|remote> [--yes]");
  process.exit(1);
}

function readEnvFile(filePath) {
  const result = {};
  for (const line of nodeFs.readFileSync(filePath, "utf8").split("\n")) {
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

function describe(urlString) {
  const url = new URL(urlString);
  const dbName = url.pathname.replace(/^\//, "") || "postgres";
  return `${url.hostname}:${url.port || "5432"}/${dbName}`;
}

function forDocker(urlString) {
  const url = new URL(urlString);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") {
    url.hostname = "host.docker.internal";
  }
  return url.toString();
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function commandExists(command) {
  return new Promise((resolve) => {
    const checker = process.platform === "win32" ? "where" : "command";
    const args = process.platform === "win32" ? [command] : ["-v", command];
    const child = spawn(checker, args, {
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

function run(command, args, { inputFile, outputFile } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: [inputFile ? "pipe" : "ignore", "pipe", "inherit"],
    });

    if (inputFile) {
      createReadStream(inputFile).pipe(child.stdin);
    }

    let outputDone = Promise.resolve();
    if (outputFile) {
      const output = createWriteStream(outputFile);
      child.stdout.pipe(output);
      outputDone = new Promise((done, fail) => {
        output.on("finish", done);
        output.on("error", fail);
      });
    } else {
      child.stdout.resume();
    }

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }
      outputDone.then(resolve, reject);
    });
  });
}

async function pg(tool, args, connectionUrl, io) {
  if (await commandExists(tool)) {
    await run(tool, [...args, `--dbname=${connectionUrl}`], io);
    return;
  }

  if (!(await commandExists("docker"))) {
    throw new Error(`Neither ${tool} nor Docker is available. Install PostgreSQL client tools or Docker.`);
  }

  await run(
    "docker",
    [
      "run",
      "--rm",
      "-i",
      "--add-host=host.docker.internal:host-gateway",
      "postgres:17-alpine",
      tool,
      ...args,
      `--dbname=${forDocker(connectionUrl)}`,
    ],
    io
  );
}

const WIPE_SQL = [
  "DROP SCHEMA IF EXISTS public CASCADE",
  "CREATE SCHEMA public",
  "GRANT ALL ON SCHEMA public TO public",
  "DROP SCHEMA IF EXISTS drizzle CASCADE",
].join("; ");

async function main() {
  const envPath = path.join(rootDir, ".env");
  if (!nodeFs.existsSync(envPath)) {
    throw new Error(".env is missing. Copy .env.example to .env and set both database URLs.");
  }

  const env = readEnvFile(envPath);
  const localUrl = env.DATABASE_URL;
  const remoteUrl = env.REMOTE_DATABASE_URL || env.DATABASE_URL_REMOTE;

  if (!localUrl) throw new Error("DATABASE_URL is missing from .env");
  if (!remoteUrl) {
    throw new Error("REMOTE_DATABASE_URL is missing from .env. Set it to the online Postgres URL.");
  }
  if (localUrl === remoteUrl) {
    throw new Error("DATABASE_URL and REMOTE_DATABASE_URL are the same. Refusing to sync a database onto itself.");
  }

  const sourceUrl = direction === "local" ? remoteUrl : localUrl;
  const targetUrl = direction === "local" ? localUrl : remoteUrl;
  const sourceLabel = describe(sourceUrl);
  const targetLabel = describe(targetUrl);

  console.log(`\nHard sync: ${sourceLabel}  ->  ${targetLabel}`);
  console.log("Schemas public and drizzle on the target are dropped, then replaced with the source.");

  if (!force) {
    const answer = await ask(`Type "yes" to overwrite ${targetLabel}: `);
    if (answer !== "yes") {
      console.log("Cancelled.");
      return;
    }
  }

  const dumpPath = path.join(os.tmpdir(), `thunder-db-sync-${process.pid}.sql`);
  const wipePath = `${dumpPath}.wipe.sql`;
  try {
    console.log(`\nDumping ${sourceLabel}...`);
    await pg(
      "pg_dump",
      ["--no-owner", "--no-acl", "--format=plain", "--clean", "--if-exists"],
      sourceUrl,
      { outputFile: dumpPath }
    );

    console.log(`Replacing schemas on ${targetLabel}...`);
    await fs.writeFile(wipePath, WIPE_SQL, "utf8");
    await pg("psql", ["-v", "ON_ERROR_STOP=1"], targetUrl, { inputFile: wipePath });

    console.log(`Restoring dump into ${targetLabel}...`);
    await pg("psql", ["-v", "ON_ERROR_STOP=1"], targetUrl, { inputFile: dumpPath });
    console.log(`\n${direction === "local" ? "Local" : "Remote"} database now matches ${sourceLabel}.`);
  } finally {
    await fs.rm(dumpPath, { force: true });
    await fs.rm(wipePath, { force: true });
  }
}

main().catch((error) => {
  console.error(`\ndb:sync:${direction} failed: ${error.message || error}`);
  process.exit(1);
});
