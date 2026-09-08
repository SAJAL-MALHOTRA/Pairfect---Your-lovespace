import fs from "fs";
import path from "path";

const dir = "C:/Users/2006s/.gemini/antigravity/scratch/hoedex/supabase";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

const allTables = new Map();

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf-8");
  
  const ctRegex = /create\s+table(?:\s+if\s+not\s+exists)?\s+([^\s(]+)/gi;
  let match;
  while ((match = ctRegex.exec(content)) !== null) {
    const table = match[1].replace(/public\./i, '').replace(/["']/g, '');
    if (!allTables.has(table)) {
      allTables.set(table, { createdIn: [], rlsEnabledIn: [], policies: [] });
    }
    allTables.get(table).createdIn.push(file);
  }

  const rlsRegex = /alter\s+table\s+([^\s]+)\s+enable\s+row\s+level\s+security/gi;
  while ((match = rlsRegex.exec(content)) !== null) {
    const table = match[1].replace(/public\./i, '').replace(/["';]/g, '');
    if (!allTables.has(table)) {
      allTables.set(table, { createdIn: [], rlsEnabledIn: [], policies: [] });
    }
    allTables.get(table).rlsEnabledIn.push(file);
  }

  const polRegex = /create\s+policy\s+"?([^"\n]+)"?\s+on\s+([^\s\n]+)[\s\S]*?(?:;|\n\n(?=create|alter|drop|--|\$))/gi;
  while ((match = polRegex.exec(content)) !== null) {
    const polText = match[0].replace(/\s+/g, ' ').trim();
    const name = match[1];
    const rawTable = match[2].replace(/public\./i, '').replace(/["';]/g, '');
    if (!allTables.has(rawTable)) {
      allTables.set(rawTable, { createdIn: [], rlsEnabledIn: [], policies: [] });
    }
    allTables.get(rawTable).policies.push({ file, name, full: polText });
  }
}

console.log("=== CHECK 1: TABLES MISSING RLS ENABLED ===");
let missingRls = 0;
for (const [table, info] of allTables.entries()) {
  if (info.createdIn.length > 0 && info.rlsEnabledIn.length === 0) {
    console.log(`🚨 TABLE WITHOUT RLS: ${table} (created in ${info.createdIn.join(', ')})`);
    missingRls++;
  }
}
if (missingRls === 0) console.log("✓ All tables explicitly have ALTER TABLE ... ENABLE ROW LEVEL SECURITY.");

console.log("\n=== CHECK 2: POLICIES WITH USING (true) OR WITH CHECK (true) ===");
for (const [table, info] of allTables.entries()) {
  for (const pol of info.policies) {
    if (/\busing\s*\(\s*true\s*\)/i.test(pol.full) || /\bwith\s+check\s*\(\s*true\s*\)/i.test(pol.full)) {
      console.log(`⚠️ PERMISSIVE POLICY: Table [${table}] - "${pol.name}" in ${pol.file}`);
      console.log(`   ${pol.full}\n`);
    }
  }
}

console.log("\n=== CHECK 3: TABLES WITH ZERO POLICIES ===");
for (const [table, info] of allTables.entries()) {
  if (info.createdIn.length > 0 && info.policies.length === 0) {
    console.log(`ℹ️ TABLE WITH ZERO POLICIES: ${table} (created in ${info.createdIn.join(', ')})`);
  }
}
