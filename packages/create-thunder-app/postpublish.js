import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.join(__dirname, 'template');

if (fs.existsSync(templateDir)) {
  console.log('Cleaning up temporary template directory...');
  fs.rmSync(templateDir, { recursive: true, force: true });
  console.log('Cleanup complete.');
}
