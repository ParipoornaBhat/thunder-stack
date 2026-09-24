#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔍 Checking latest EAS Android APK build artifacts...");

try {
  const output = execSync(
    "npx --yes eas-cli build:list --platform=android --limit=10 --json",
    {
      cwd: path.join(rootDir, "client/expo"),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  const builds = JSON.parse(output);

  // Find the latest finished build that specifically produced a direct .apk file
  const finishedApkBuild = builds.find((b) => {
    if (b.status !== "FINISHED") return false;
    const url = b.artifacts?.applicationArchiveUrl || b.artifacts?.buildUrl || "";
    return url.endsWith(".apk") || url.includes(".apk");
  });

  if (!finishedApkBuild) {
    console.log("ℹ️ No finished Android .apk build artifact found.");
    process.exit(0);
  }

  const apkUrl =
    finishedApkBuild.artifacts.applicationArchiveUrl ||
    finishedApkBuild.artifacts.buildUrl;

  console.log(`✅ Found latest .apk build: ${finishedApkBuild.id}`);
  console.log(`🔗 Direct APK URL: ${apkUrl}`);

  // Helper to update or append environment variable in untracked .env files
  const updateEnvFile = (filePath) => {
    let envContent = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf-8")
      : "";
    const key = "NEXT_PUBLIC_APP_DOWNLOAD_URL";
    const line = `${key}="${apkUrl}"`;
    const regex = new RegExp(`^${key}=.*$`, "m");

    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, line);
    } else {
      envContent = envContent ? `${envContent.trim()}\n${line}\n` : `${line}\n`;
    }

    fs.writeFileSync(filePath, envContent, "utf-8");
  };

  // Update untracked .env & .dev.vars files
  const envPaths = [
    path.join(rootDir, ".env"),
    path.join(rootDir, "client/nextjs/.env"),
    path.join(rootDir, "client/nextjs/.env.local"),
    path.join(rootDir, "client/nextjs/.dev.vars"),
  ];

  for (const envPath of envPaths) {
    updateEnvFile(envPath);
  }
  console.log("✅ Updated untracked .env files with NEXT_PUBLIC_APP_DOWNLOAD_URL");

  // Also update .internal/deploy.md if it exists
  const deployDocPath = path.join(rootDir, ".internal/deploy.md");
  if (fs.existsSync(deployDocPath)) {
    let deployDoc = fs.readFileSync(deployDocPath, "utf-8");
    deployDoc = deployDoc.replace(
      /\[Download Live APK\]\([^)]+\)/g,
      `[Download Live APK](${apkUrl})`
    );
    fs.writeFileSync(deployDocPath, deployDoc, "utf-8");
    console.log("✅ Updated .internal/deploy.md");
  }

  // Trigger web client build and deployment with the injected environment variable
  console.log("🚀 Building and deploying Next.js web client to Cloudflare Pages...");
  execSync("pnpm --filter nextjs run deploy:cf", {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_DOWNLOAD_URL: apkUrl,
    },
  });

  console.log("🎉 Direct APK link successfully synchronized and deployed to Cloudflare Pages!");
} catch (error) {
  console.error("❌ Failed to sync EAS APK artifact:", error.message);
  process.exit(1);
}
