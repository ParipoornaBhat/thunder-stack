import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const helpHtmlPath = path.resolve(__dirname, "../../db-help.html");

const htmlContent = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ THUNDER Stack DB Commands & Migration Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 30, 46, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
      --primary-glow: rgba(59, 130, 246, 0.35);
      --accent: #8b5cf6;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
      min-height: 100vh;
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.12) 0%, transparent 45%);
    }

    .container {
      max-width: 1150px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
      padding-top: 1rem;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 2.6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 650px;
      margin: 0 auto;
    }

    /* Tabs Styling */
    .tabs-nav {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 0.75rem;
      overflow-x: auto;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 0.65rem 1.25rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }

    .tab-btn.active {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .search-bar {
      margin-bottom: 2rem;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1.5rem;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      color: #fff;
      font-size: 1rem;
      font-family: inherit;
      backdrop-filter: blur(12px);
      transition: all 0.2s ease;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
      gap: 1.5rem;
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.75rem;
      backdrop-filter: blur(12px);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .card:hover {
      transform: translateY(-3px);
      border-color: rgba(96, 165, 250, 0.3);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-primary { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-success { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }

    .card-desc {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
    }

    .code-block {
      background: #0d1322;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .copy-btn {
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-muted);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
    }

    .features-list {
      list-style: none;
      font-size: 0.88rem;
      color: #d1d5db;
    }

    .features-list li {
      margin-bottom: 0.4rem;
      position: relative;
      padding-left: 1.25rem;
    }

    .features-list li::before {
      content: "•";
      color: var(--primary);
      font-size: 1.2rem;
      position: absolute;
      left: 0;
      top: -2px;
    }

    /* Step flow box */
    .step-flow {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .step-item {
      background: rgba(13, 19, 34, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .step-number {
      display: inline-block;
      background: var(--primary);
      color: #fff;
      font-weight: 700;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      text-align: center;
      line-height: 28px;
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }

    .step-title {
      font-weight: 700;
      font-size: 1.05rem;
      display: inline-block;
    }

    footer {
      text-align: center;
      margin-top: 4rem;
      color: var(--text-muted);
      font-size: 0.9rem;
      border-top: 1px solid var(--card-border);
      padding-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">⚡ THUNDER Stack</div>
      <p class="subtitle">Complete Database Management & Migration Troubleshooting Guide</p>
    </header>

    <!-- Navigation Tabs -->
    <div class="tabs-nav">
      <button class="tab-btn active" onclick="switchTab('commands')">🛠️ CLI Reference</button>
      <button class="tab-btn" onclick="switchTab('troubleshooting')">🚨 Migration Failures & Fixes</button>
      <button class="tab-btn" onclick="switchTab('rollback')">↩️ Rollback Mastery</button>
      <button class="tab-btn" onclick="switchTab('seeding')">🌱 Seeding & Data</button>
      <button class="tab-btn" onclick="switchTab('safety')">🛡️ Safety & Reset</button>
    </div>

    <!-- TAB 1: CLI REFERENCE -->
    <div id="tab-commands" class="tab-content active">
      <div class="search-bar">
        <input type="text" id="searchInput" class="search-input" placeholder="Search DB commands (e.g. rollback, reset, status)...">
      </div>

      <div class="grid" id="commandGrid">
        
        <!-- Generate -->
        <div class="card" data-keywords="generate migrate name schema drizzle-kit">
          <div class="card-header">
            <div class="card-title">📦 pnpm migrate:generate &lt;name&gt;</div>
            <span class="badge badge-success">Create Migration</span>
          </div>
          <p class="card-desc">Inspects schema files in <code>src/schema/</code> and generates corresponding SQL migration files in <code>./drizzle/</code> with custom names.</p>
          <div class="code-block">
            <code>pnpm migrate:generate add_user_avatar</code>
            <button class="copy-btn" onclick="copyCode('pnpm migrate:generate add_user_avatar')">Copy</button>
          </div>
          <ul class="features-list">
            <li>Pass custom migration names via <code>pnpm migrate:generate my_feature</code></li>
            <li>Generates typed SQL migration files and updates <code>_journal.json</code></li>
          </ul>
        </div>

        <!-- Migrate -->
        <div class="card" data-keywords="migrate deploy apply cloud database">
          <div class="card-header">
            <div class="card-title">🚀 pnpm db:migrate</div>
            <span class="badge badge-success">Deploy Migration</span>
          </div>
          <p class="card-desc">Executes all unapplied local migration SQL files against the Cloud PostgreSQL database.</p>
          <div class="code-block">
            <code>pnpm db:migrate</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:migrate')">Copy</button>
          </div>
          <ul class="features-list">
            <li>Automatic Aiven & SSL connection parameter sanitization</li>
            <li>Bypasses self-signed certificate restrictions gracefully</li>
          </ul>
        </div>

        <!-- Rollback -->
        <div class="card" data-keywords="rollback migration clear head cloud delete">
          <div class="card-header">
            <div class="card-title">↩️ pnpm db:rollback [N | ~headN]</div>
            <span class="badge badge-warning">Rollback & Clear</span>
          </div>
          <p class="card-desc">Deletes recent migration files locally (.sql & snapshot JSONs) and removes matching records from Cloud DB's __drizzle_migrations table.</p>
          <div class="code-block">
            <code>pnpm db:rollback ~head3</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:rollback ~head3')">Copy</button>
          </div>
          <ul class="features-list">
            <li>Supports argument forms: <code>3</code>, <code>~head3</code>, <code>head3</code></li>
            <li>Cleans up local <code>./drizzle/</code> files and journal entries</li>
            <li>Wipes matching rows in Cloud DB's <code>__drizzle_migrations</code></li>
          </ul>
        </div>

        <!-- Status -->
        <div class="card" data-keywords="status list compare local cloud info">
          <div class="card-header">
            <div class="card-title">🔍 pnpm db:status</div>
            <span class="badge badge-primary">Inspect & Compare</span>
          </div>
          <p class="card-desc">Displays a side-by-side comparison table of local migration files versus applied records in the Cloud Database.</p>
          <div class="code-block">
            <code>pnpm db:status</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:status')">Copy</button>
          </div>
          <ul class="features-list">
            <li>Lists index, migration tag name, and timestamp</li>
            <li>Shows local file presence status</li>
            <li>Verifies if migration is <b>Applied</b> or <b>Pending</b> in Cloud DB</li>
          </ul>
        </div>

        <!-- Reset -->
        <div class="card" data-keywords="reset wipe drop schema clean seed">
          <div class="card-header">
            <div class="card-title">🧹 pnpm db:reset</div>
            <span class="badge badge-danger">Wipe & Rebuild</span>
          </div>
          <p class="card-desc">Drops public and drizzle schemas in Cloud DB (with safety confirmation prompt), re-applies all migrations, and runs seeders.</p>
          <div class="code-block">
            <code>pnpm db:reset</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:reset')">Copy</button>
          </div>
          <ul class="features-list">
            <li>Requires interactive <code>y</code> / <code>yes</code> confirmation</li>
            <li>Supports <code>-y</code> or <code>--force</code> flag for CI environments</li>
          </ul>
        </div>

        <!-- Seed -->
        <div class="card" data-keywords="seed users admin roles permission initial">
          <div class="card-header">
            <div class="card-title">🌱 pnpm db:seed</div>
            <span class="badge badge-primary">Data Seeding</span>
          </div>
          <p class="card-desc">Populates initial roles, RBAC permissions, and default trial accounts (e.g. admin@thunder.com).</p>
          <div class="code-block">
            <code>pnpm db:seed</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:seed')">Copy</button>
          </div>
        </div>

        <!-- Studio -->
        <div class="card" data-keywords="studio gui visual browser drizzle-kit UI">
          <div class="card-header">
            <div class="card-title">📊 pnpm db:studio</div>
            <span class="badge badge-primary">Visual UI</span>
          </div>
          <p class="card-desc">Launches Drizzle Studio in your browser for visually browsing and editing Cloud DB tables.</p>
          <div class="code-block">
            <code>pnpm db:studio</code>
            <button class="copy-btn" onclick="copyCode('pnpm db:studio')">Copy</button>
          </div>
        </div>

      </div>
    </div>

    <!-- TAB 2: TROUBLESHOOTING & FAILURES GUIDE -->
    <div id="tab-troubleshooting" class="tab-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div class="card-title">⚠️ Scenario 1: Adding a NOT NULL Column to a Table with Existing Data</div>
          <span class="badge badge-danger">Common Failure</span>
        </div>
        <p class="card-desc"><b>Problem:</b> Adding <code>.notNull()</code> to a column in a table that already contains existing rows causes PostgreSQL migration error: <i>column "x" contains null values</i>.</p>
        <p style="margin-bottom: 0.75rem; color: #d1d5db;"><b>Why it fails:</b> PostgreSQL cannot populate existing rows with <code>NULL</code> when a column is marked <code>NOT NULL</code> without a default value.</p>
        <div class="step-flow">
          <div class="step-item">
            <span class="step-number">✓</span>
            <span class="step-title">Solution A: Add a Default Value in Drizzle Schema (Recommended)</span>
            <div class="code-block" style="margin-top: 0.5rem;">
              <code>export const user = pgTable("user", { status: varchar("status").notNull().default("active") });</code>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">✓</span>
            <span class="step-title">Solution B: Two-Step Migration for Complex Backfills</span>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">
              1. Add the column without <code>.notNull()</code> -> Generate & Run migration.<br>
              2. Run a seed/script to populate existing rows.<br>
              3. Add <code>.notNull()</code> to schema -> Generate & Run second migration.
            </p>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div class="card-title">🚨 Scenario 2: Migration Failed Mid-Execution / Syntax Error</div>
          <span class="badge badge-danger">Broken Migration</span>
        </div>
        <p class="card-desc"><b>Problem:</b> <code>pnpm db:migrate</code> threw an error partway through due to invalid SQL, broken types, or lost network connection.</p>
        <div class="step-flow">
          <div class="step-item">
            <span class="step-number">1</span>
            <span class="step-title">Check Migration Status</span>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">Run <code>pnpm db:status</code> to see which migration was partially applied or failed.</p>
          </div>
          <div class="step-item">
            <span class="step-number">2</span>
            <span class="step-title">Roll Back the Failed Migration</span>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">Run <code>pnpm db:rollback 1</code> to remove the broken migration locally and in Cloud DB.</p>
          </div>
          <div class="step-item">
            <span class="step-number">3</span>
            <span class="step-title">Fix & Re-generate</span>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">Fix your schema in <code>src/schema/</code>, then run <code>pnpm migrate:generate fixed_schema</code> and <code>pnpm db:migrate</code>.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🔒 Scenario 3: Aiven / Managed DB SSL & Connection Errors</div>
          <span class="badge badge-warning">Connection Fix</span>
        </div>
        <p class="card-desc"><b>Problem:</b> <code>error: self signed certificate</code> or <code>sslmode=require</code> conflicts when connecting to Aiven, Neon, or Supabase.</p>
        <p style="font-size: 0.9rem; color: #d1d5db;"><b>Built-in Fix in THUNDER Stack:</b><br>
        - <code>client.ts</code> automatically strips <code>sslmode=</code> and <code>ssl=</code> query parameters from <code>DATABASE_URL</code> and passes <code>ssl: { rejectUnauthorized: false }</code>.<br>
        - <code>drizzle.config.ts</code> includes <code>process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"</code> for <code>drizzle-kit</code> operations.
        </p>
      </div>
    </div>

    <!-- TAB 3: ROLLBACK MASTERY -->
    <div id="tab-rollback" class="tab-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div class="card-title">↩️ Why & When to Use Rollback</div>
          <span class="badge badge-warning">Core Concept</span>
        </div>
        <p class="card-desc"><b>Why Rollback is Essential:</b><br>
        When developing features, you might generate a migration that turns out to have flaws, or you want to combine multiple recent iterations into a single clean migration before committing code to git.
        Unlike standard Drizzle CLI which only deletes local files, <code>pnpm db:rollback</code> cleans BOTH local files AND the Cloud DB <code>__drizzle_migrations</code> table!
        </p>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🔄 The 4-Step Rollback Workflow</div>
          <span class="badge badge-primary">Step-by-Step</span>
        </div>
        <div class="step-flow">
          <div class="step-item">
            <span class="step-number">1</span>
            <span class="step-title">Execute Rollback</span>
            <div class="code-block" style="margin-top: 0.5rem;">
              <code>pnpm db:rollback ~head3</code>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-muted);">Deletes 3 recent SQL & snapshot files locally and removes matching records from Cloud DB's <code>__drizzle_migrations</code> table.</p>
          </div>
          <div class="step-item">
            <span class="step-number">2</span>
            <span class="step-title">Update Schema Files</span>
            <p style="font-size: 0.88rem; color: var(--text-muted);">Edit your TypeScript schema files under <code>server/db/src/schema/</code> to your desired final state.</p>
          </div>
          <div class="step-item">
            <span class="step-number">3</span>
            <span class="step-title">Generate Consolidated Migration</span>
            <div class="code-block" style="margin-top: 0.5rem;">
              <code>pnpm migrate:generate consolidated_feature_schema</code>
            </div>
          </div>
          <div class="step-item">
            <span class="step-number">4</span>
            <span class="step-title">Deploy to Cloud DB</span>
            <div class="code-block" style="margin-top: 0.5rem;">
              <code>pnpm db:migrate</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: SEEDING & DATA -->
    <div id="tab-seeding" class="tab-content">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🌱 Seeding Management</div>
          <span class="badge badge-primary">Data Initialization</span>
        </div>
        <p class="card-desc">Populates default RBAC permissions, system roles, and trial administrator accounts in your Cloud PostgreSQL database.</p>
        <div class="code-block">
          <code>pnpm db:seed</code>
          <button class="copy-btn" onclick="copyCode('pnpm db:seed')">Copy</button>
        </div>
        <ul class="features-list">
          <li><b>Permissions created:</b> <code>users:view</code>, <code>users:manage</code>, <code>roles:manage</code></li>
          <li><b>Roles created:</b> <code>admin</code> (Active), <code>user</code></li>
          <li><b>Default Trial Accounts:</b>
            <br>• Admin: <code>admin@thunder.com</code> / <code>AdminPassword123</code>
            <br>• Standard User: <code>user@thunder.com</code> / <code>UserPassword123</code>
          </li>
        </ul>
      </div>
    </div>

    <!-- TAB 5: SAFETY & RESET -->
    <div id="tab-safety" class="tab-content">
      <div class="card">
        <div class="card-header">
          <div class="card-title">🛡️ Database Reset Confirmation & Safeguards</div>
          <span class="badge badge-danger">Safety Control</span>
        </div>
        <p class="card-desc"><code>pnpm db:reset</code> is protected with interactive confirmation prompts to prevent accidental data loss in production/cloud databases.</p>
        <div class="step-flow">
          <div class="step-item">
            <span class="step-number">!</span>
            <span class="step-title">Interactive Terminal Prompt</span>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">
              When running <code>pnpm db:reset</code>, you must explicitly type <code>y</code> or <code>yes</code> in the terminal to proceed.
            </p>
          </div>
          <div class="step-item">
            <span class="step-number">⚡</span>
            <span class="step-title">Bypass Confirmation for CI Pipelines</span>
            <div class="code-block" style="margin-top: 0.5rem;">
              <code>pnpm db:reset -- -y</code>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-muted);">Pass <code>-y</code> or <code>--force</code> or set <code>CI=true</code> in automated pipeline environments.</p>
          </div>
        </div>
      </div>
    </div>

    <footer>
      ⚡ THUNDER Stack Monorepo Framework • Interactive Database CLI & Troubleshooting Dashboard
    </footer>
  </div>

  <script>
    function copyCode(text) {
      navigator.clipboard.writeText(text);
      const btn = event.target;
      const orig = btn.innerText;
      btn.innerText = "Copied!";
      setTimeout(() => btn.innerText = orig, 1500);
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const val = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#tab-commands .card');
        cards.forEach(card => {
          const keywords = card.getAttribute('data-keywords') ? card.getAttribute('data-keywords').toLowerCase() : '';
          const text = card.innerText.toLowerCase();
          if (keywords.includes(val) || text.includes(val)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      });
    }
  </script>
</body>
</html>`;

function openInBrowser(filePath: string) {
  const platform = os.platform();
  let cmd = "";
  if (platform === "win32") {
    cmd = `start "" "${filePath}"`;
  } else if (platform === "darwin") {
    cmd = `open "${filePath}"`;
  } else {
    cmd = `xdg-open "${filePath}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      console.log(`🌐 Open in browser: file:///${filePath.replace(/\\/g, "/")}`);
    } else {
      console.log(`🌐 Opening DB Help & Troubleshooting Dashboard in browser...`);
    }
  });
}

function showHelp() {
  fs.writeFileSync(helpHtmlPath, htmlContent, "utf8");
  console.log(`⚡ THUNDER Stack Database Guide generated at: ${helpHtmlPath}`);
  openInBrowser(helpHtmlPath);
}

showHelp();
