import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const templateDir = path.join(__dirname, 'template');

// Clean target first
if (fs.existsSync(templateDir)) {
  fs.rmSync(templateDir, { recursive: true, force: true });
}
fs.mkdirSync(templateDir, { recursive: true });

const foldersToCopy = ['client', 'server', 'packages/shared', 'scripts'];
const filesToCopy = [
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  '.gitignore',
  '.env.example',
  'THUNDER_STACK.md',
  'README.md'
];

function copyRecursive(src, dest) {
  const lstats = fs.lstatSync(src);
  if (lstats.isSymbolicLink()) {
    // Skip symbolic links and junctions (they will be created fresh by the installer)
    return;
  }
  
  if (lstats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    for (const file of files) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.next' && file !== '.turbo' && file !== '.expo' && file !== 'web-build') {
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Packaging monorepo template files...');

// Copy folders
for (const folder of foldersToCopy) {
  const src = path.join(rootDir, folder);
  const dest = path.join(templateDir, folder);
  if (fs.existsSync(src)) {
    copyRecursive(src, dest);
  }
}

// Copy files
for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(templateDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

console.log('Template packaging complete.');
