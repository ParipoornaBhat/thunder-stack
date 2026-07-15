#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interactive readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\x1b[33m%s\x1b[0m', '⚡ Welcome to the THUNDER Stack Installer! ⚡');
  
  let projectName = process.argv[2]?.trim();
  let targetDir;
  let isCurrentDir = false;

  if (projectName === '.') {
    targetDir = process.cwd();
    projectName = path.basename(targetDir);
    isCurrentDir = true;
  } else if (projectName) {
    projectName = projectName.toLowerCase();
    targetDir = path.resolve(process.cwd(), projectName);
  } else {
    projectName = await question('Enter your project name (default: my-thunder-app): ');
    projectName = projectName.trim().toLowerCase() || 'my-thunder-app';
    targetDir = path.resolve(process.cwd(), projectName);
  }

  // Sanitize name to be compliant with npm package naming guidelines
  projectName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  if (isCurrentDir) {
    const existingFiles = fs.readdirSync(targetDir);
    const nonIgnoredFiles = existingFiles.filter(file => ![
      'node_modules',
      'dist',
      '.next',
      '.turbo',
      '.expo',
      'create-thunder-app',
      'package.json'
    ].includes(file));

    if (nonIgnoredFiles.length > 0) {
      const overwrite = await question('Current directory is not empty. Proceed anyway? (y/N): ');
      if (overwrite.toLowerCase().trim() !== 'y') {
        console.log('Aborted.');
        rl.close();
        process.exit(0);
      }
    }
  } else if (fs.existsSync(targetDir)) {
    const overwrite = await question(`Directory "${projectName}" already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase().trim() !== 'y') {
      console.log('Aborted.');
      rl.close();
      process.exit(0);
    }
    console.log(`Cleaning target directory: ${targetDir}`);
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  console.log(`\nCreating a new THUNDER Stack app in: ${targetDir}\n`);
  if (!isCurrentDir) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Locate the source template directory
  // In development, the template is the monorepo root.
  // We check if we are inside a monorepo development structure
  let sourceDir = path.resolve(__dirname, '../..');
  
  // Verify if it's the correct source monorepo
  const rootPackageJsonPath = path.join(sourceDir, 'package.json');
  let isDevMode = false;
  if (fs.existsSync(rootPackageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
    if (pkg.name === 'thunder-monorepo') {
      isDevMode = true;
    }
  }

  if (!isDevMode) {
    sourceDir = path.join(__dirname, 'template');
  }

  const ignoreList = [
    'node_modules',
    'dist',
    '.next',
    '.open-next',
    '.turbo',
    '.expo',
    'web-build',
    '.git',
    'pnpm-lock.yaml',
    '.env',
    'create-thunder-app', // Ignore this package directory itself
    'create-thunder-stack', // Ignore renamed package directory itself
  ];

  const safeProjectName = projectName.toLowerCase();
  const capitalizedProjectName = projectName.charAt(0).toUpperCase() + projectName.slice(1);

  function copyFolderRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      const folderName = path.basename(src);
      if (ignoreList.includes(folderName)) return;

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const files = fs.readdirSync(src);
      for (const file of files) {
        copyFolderRecursive(path.join(src, file), path.join(dest, file));
      }
    } else {
      // Copy file and perform replacements if text-based
      const ext = path.extname(src);
      const textExtensions = ['.json', '.js', '.ts', '.tsx', '.css', '.html', '.md', '.toml', '.yml', '.yaml', '.example'];
      
      const filename = path.basename(src);
      let targetDest = dest;
      if (filename === 'gitignore') {
        targetDest = path.join(path.dirname(dest), '.gitignore');
      }

      if (textExtensions.includes(ext) || filename.startsWith('.') || filename === 'gitignore') {
        let content = fs.readFileSync(src, 'utf8');
        
        // Perform template replacements
        content = content.replace(/thunder-monorepo/g, `${safeProjectName}-monorepo`);
        content = content.replace(/@thunder\//g, `@${safeProjectName}/`);
        content = content.replace(/thunder-api/g, `${safeProjectName}-api`);
        content = content.replace(/Thunder Mobile App/g, `${capitalizedProjectName} Mobile App`);
        content = content.replace(/thunder-mobile-app/g, `${safeProjectName}-mobile-app`);
        content = content.replace(/"scheme": "thunder"/g, `"scheme": "${safeProjectName}"`);
        content = content.replace(/com\.thunder\.app/g, `com.${safeProjectName}.app`);
        content = content.replace(/admin@thunderstack\.dev/g, `admin@${safeProjectName}.dev`);
        
        fs.writeFileSync(targetDest, content, 'utf8');
      } else {
        // Binary copy
        fs.copyFileSync(src, targetDest);
      }
    }
  }

  console.log('Scaffolding files...');
  copyFolderRecursive(sourceDir, targetDir);

  // Copy .env.example to .env
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('Created .env config file from template.');
  }

  // Copy .dev.vars.example to .dev.vars
  const devVarsExamplePath = path.join(targetDir, 'server/hono/.dev.vars.example');
  const devVarsPath = path.join(targetDir, 'server/hono/.dev.vars');
  if (fs.existsSync(devVarsExamplePath)) {
    fs.copyFileSync(devVarsExamplePath, devVarsPath);
    console.log('Created server/hono/.dev.vars config file from template.');
  }

  // Automate dependency installation
  console.log('\nInstalling dependencies... This may take a minute.');
  try {
    let installCmd = 'pnpm install';
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
    } catch (e) {
      installCmd = 'npm install';
    }
    
    console.log(`Running "${installCmd}" in project directory: ${targetDir}`);
    execSync(installCmd, { cwd: targetDir, stdio: 'inherit' });
    console.log('\x1b[32m%s\x1b[0m', 'Dependencies installed and assets mapped successfully!');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Warning: Failed to install dependencies automatically. You can install them manually using "pnpm install" or "npm install".');
  }

  console.log('\x1b[32m%s\x1b[0m', '\nProject successfully scaffolded!');
  console.log('\nTo get started, run:');
  console.log(`  cd ${projectName}`);
  console.log('  pnpm dev\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error during scaffolding:', err);
  rl.close();
  process.exit(1);
});
