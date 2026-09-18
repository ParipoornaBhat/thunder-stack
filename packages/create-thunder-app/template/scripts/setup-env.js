import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const rootEnv = path.join(rootDir, ".env");
const rootEnvExample = path.join(rootDir, ".env.example");
const serverDevVars = path.join(rootDir, "server", "hono", ".dev.vars");

console.log("⚙️ Setting up environment variables...");

// 1. Ensure root .env exists
if (!fs.existsSync(rootEnv)) {
  if (fs.existsSync(rootEnvExample)) {
    console.log("📝 Creating .env from .env.example...");
    fs.copyFileSync(rootEnvExample, rootEnv);
  } else {
    console.warn("⚠️ .env.example not found. Cannot create root .env.");
  }
} else {
  console.log("✅ Root .env already exists.");
}

// 2. Ensure server/hono/.dev.vars is connected to root .env
if (fs.existsSync(rootEnv)) {
  let isLinked = false;
  if (fs.existsSync(serverDevVars)) {
    try {
      const rootStat = fs.statSync(rootEnv);
      const devVarsStat = fs.statSync(serverDevVars);
      // Check if they are hard-linked (same inode and device)
      if (rootStat.ino === devVarsStat.ino && rootStat.dev === devVarsStat.dev) {
        isLinked = true;
      } else {
        // Also check if symlink
        const lstat = fs.lstatSync(serverDevVars);
        if (lstat.isSymbolicLink()) {
          isLinked = true;
        }
      }
    } catch (e) {
      // Ignore stat errors
    }

    if (isLinked) {
      console.log("✅ server/hono/.dev.vars is already linked/connected to .env.");
      process.exit(0);
    }

    // If it exists but is not linked, let's see if we should back it up.
    try {
      const rootContent = fs.readFileSync(rootEnv, "utf8");
      const devVarsContent = fs.readFileSync(serverDevVars, "utf8");
      if (rootContent !== devVarsContent) {
        const backupPath = `${serverDevVars}.backup-${Date.now()}`;
        console.log(`⚠️ server/hono/.dev.vars exists and differs from .env. Backing up to ${path.basename(backupPath)}...`);
        fs.copyFileSync(serverDevVars, backupPath);
      }
      fs.unlinkSync(serverDevVars);
    } catch (err) {
      console.error("Failed to process existing .dev.vars:", err);
    }
  }

  // Create the link
  console.log("🔗 Connecting .env and server/hono/.dev.vars...");
  
  // Try symbolic link first (relative to link's folder: ../../.env)
  try {
    fs.symlinkSync("../../.env", serverDevVars, "file");
    console.log("✅ Connected server/hono/.dev.vars -> .env via symbolic link");
  } catch (err) {
    // If symlink fails, try hardlink (requires absolute paths or relative to process cwd)
    try {
      fs.linkSync(rootEnv, serverDevVars);
      console.log("✅ Connected server/hono/.dev.vars <-> .env via hard link");
    } catch (err2) {
      // Fallback to copy
      try {
        fs.copyFileSync(rootEnv, serverDevVars);
        console.log("📋 Copied .env to server/hono/.dev.vars (fallback).");
      } catch (err3) {
        console.error("❌ Failed to connect or copy environment variables:", err3);
      }
    }
  }
} else {
  console.warn("⚠️ Cannot connect server/hono/.dev.vars because root .env was not created.");
}
