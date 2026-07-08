import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targets = ["node_modules", ".next", "dist", "build", ".turbo", ".wrangler", ".expo"];

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  // Prevent traversing into node_modules if we encounter it
  const base = path.basename(dir);
  if (targets.includes(base)) {
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    // Check if path exists before getting stats (in case it was deleted during loop)
    if (!fs.existsSync(filePath)) continue;
    const stat = fs.lstatSync(filePath);
    
    if (targets.includes(file)) {
      console.log(`🧹 Removing: ${filePath}`);
      try {
        fs.rmSync(filePath, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to remove ${filePath}:`, err);
      }
    } else if (stat.isDirectory()) {
      cleanDirectory(filePath);
    }
  }
}

console.log("🧹 Starting workspace clean...");

// Clean targets in the root directory first
for (const target of targets) {
  const rootTarget = path.join(rootDir, target);
  if (fs.existsSync(rootTarget)) {
    console.log(`🧹 Removing root target: ${rootTarget}`);
    try {
      fs.rmSync(rootTarget, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to remove root target ${rootTarget}:`, err);
    }
  }
}

cleanDirectory(rootDir);
console.log("✨ Workspace clean completed successfully!");
