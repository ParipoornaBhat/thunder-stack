import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = __dirname;
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 pixel transparent PNG hex
const pngHex = "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000500010d0a2db40000000049454e44ae426082";
const pngBuffer = Buffer.from(pngHex, "hex");

const files = ["icon.png", "splash-image.png", "adaptive-icon.png", "favicon.png"];

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`Created asset: ${filePath}`);
}
