import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const rootEnv = path.join(rootDir, ".env");
const rootEnvExample = path.join(rootDir, ".env.example");
const envConfigFile = path.join(rootDir, "env.config.json");
const serverDevVars = path.join(rootDir, "server", "hono", ".dev.vars");
const serverWrangler = path.join(rootDir, "server", "hono", "wrangler.jsonc");
const templateServerWrangler = path.join(rootDir, "packages", "create-thunder-app", "template", "server", "hono", "wrangler.jsonc");

console.log("⚙️  Syncing environment variables & Wrangler vars...");

// 1. Ensure root .env exists
if (!fs.existsSync(rootEnv)) {
  if (fs.existsSync(rootEnvExample)) {
    console.log("📝 Creating .env from .env.example...");
    fs.copyFileSync(rootEnvExample, rootEnv);
  } else {
    console.warn("⚠️  .env.example not found. Cannot create root .env.");
  }
}

// 2. Ensure server/hono/.dev.vars is connected to root .env
if (fs.existsSync(rootEnv)) {
  let isLinked = false;
  if (fs.existsSync(serverDevVars)) {
    try {
      const rootStat = fs.statSync(rootEnv);
      const devVarsStat = fs.statSync(serverDevVars);
      if (rootStat.ino === devVarsStat.ino && rootStat.dev === devVarsStat.dev) {
        isLinked = true;
      } else {
        const lstat = fs.lstatSync(serverDevVars);
        if (lstat.isSymbolicLink()) {
          isLinked = true;
        }
      }
    } catch {
      // Ignore stat errors
    }
  }

  if (!isLinked) {
    try {
      if (fs.existsSync(serverDevVars)) {
        fs.unlinkSync(serverDevVars);
      }
      fs.symlinkSync("../../.env", serverDevVars, "file");
      console.log("🔗 Connected server/hono/.dev.vars -> .env via symlink");
    } catch {
      try {
        fs.linkSync(rootEnv, serverDevVars);
        console.log("🔗 Connected server/hono/.dev.vars <-> .env via hardlink");
      } catch {
        try {
          fs.copyFileSync(rootEnv, serverDevVars);
          console.log("📋 Copied .env to server/hono/.dev.vars");
        } catch (copyErr) {
          console.error("❌ Failed to connect .dev.vars:", copyErr);
        }
      }
    }
  }
}

// 3. Helper to parse key-values from env file
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove inline comments if not inside quotes
      if (!value.startsWith('"') && !value.startsWith("'")) {
        const commentIdx = value.indexOf("#");
        if (commentIdx !== -1) {
          value = value.slice(0, commentIdx).trim();
        }
      }
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

// 4. Load or initialize env.config.json
let envConfig = {
  NODE_ENV: false,
  CLIENT_URL: false,
  NEXT_PUBLIC_SERVER_URL: false,
  EXPO_PUBLIC_SERVER_URL: false,
  NEXT_PUBLIC_IS_DOCS_ONLY: false,
  DATABASE_URL: true,
  BETTER_AUTH_SECRET: true,
  BETTER_AUTH_URL: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB: true,
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS: true,
  EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID: true,
  SMTP_APP_PASSWORD: true,
  SMTP_EMAIL: true,
  SMTP_NAME: true,
};

if (fs.existsSync(envConfigFile)) {
  try {
    envConfig = JSON.parse(fs.readFileSync(envConfigFile, "utf8"));
  } catch (err) {
    console.warn("⚠️  Could not parse env.config.json, using defaults.");
  }
}

// 5. Detect all keys in .env and .env.example
const parsedEnv = { ...parseEnv(rootEnvExample), ...parseEnv(rootEnv) };
let configUpdated = false;

for (const key of Object.keys(parsedEnv)) {
  if (!(key in envConfig)) {
    // By default, newly discovered keys are sensitive (true)
    envConfig[key] = true;
    configUpdated = true;
    console.log(`🔒 New ENV key detected: "${key}" -> Defaulted to sensitive (true) in env.config.json`);
  }
}

if (configUpdated || !fs.existsSync(envConfigFile)) {
  fs.writeFileSync(envConfigFile, JSON.stringify(envConfig, null, 2) + "\n", "utf8");
  console.log("💾 Updated env.config.json");
}

// 6. Update wrangler.jsonc with non-sensitive (public) vars
function updateWranglerVars(wranglerPath) {
  if (!fs.existsSync(wranglerPath)) return;
  try {
    const raw = fs.readFileSync(wranglerPath, "utf8");
    const parsed = JSON.parse(raw);
    const nonSensitiveVars = {};

    for (const [key, isSensitive] of Object.entries(envConfig)) {
      if (key.startsWith("$")) continue;
      if (!isSensitive) {
        if (key in parsedEnv) {
          nonSensitiveVars[key] = parsedEnv[key];
        } else if (parsed.vars && key in parsed.vars) {
          nonSensitiveVars[key] = parsed.vars[key];
        }
      }
    }

    parsed.vars = {
      NODE_ENV: nonSensitiveVars.NODE_ENV || "development",
      ...nonSensitiveVars,
    };

    fs.writeFileSync(wranglerPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } catch (e) {
    console.warn(`⚠️  Could not update wrangler vars at ${path.relative(rootDir, wranglerPath)}:`, e.message);
  }
}

updateWranglerVars(serverWrangler);
updateWranglerVars(templateServerWrangler);

console.log("✅ Environment & Wrangler vars successfully synchronized.");
