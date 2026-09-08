import fs from "fs";
import path from "path";

const dir = "C:/Users/2006s/.gemini/antigravity/scratch/hoedex/supabase";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

const allTables = new Map(); // tableName -> { createdIn: [], rlsEnabledIn: [], policies: [] }

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf-8");
  
  // Find tables created
  const ctRegex = /create\s+table(?:\s+if\s+not\s+exists)?\s+([^\s(]+)/gi;
  let match;
  while ((match = ctRegex.exec(content)) !== null) {
    const table = match[1].replace(/public\./i, '').replace(/["']/g, '');
    if (!allTables.has(table)) {
      allTables.set(table, { createdIn: [], rlsEnabledIn: [], policies: [] });
    }
    allTables.get(table).createdIn.push(file);
  }

  // Find RLS enabled
  const rlsRegex = /alter\s+table\s+([^\s]+)\s+enable\s+row\s+level\s+security/gi;
  while ((match = rlsRegex.exec(content)) !== null) {
    const table = match[1].replace(/public\./i, '').replace(/["';]/g, '');
    if (!allTables.has(table)) {
      allTables.set(table, { createdIn: [], rlsEnabledIn: [], policies: [] });
    }
    allTables.get(table).rlsEnabledIn.push(file);
  }

  // Find policies
  // match "create policy ... ;"
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

console.log(`TOTAL DISTINCT TABLES FOUND: ${allTables.size}\n`);

for (const [table, info] of Array.from(allTables.entries()).sort((a,b) => a[0].localeCompare(b[0]))) {
  console.log(`================================================================`);
  console.log(`TABLE: ${table}`);
  console.log(`  Created in: ${info.createdIn.join(', ') || 'UNKNOWN'}`);
  console.log(`  RLS enabled in: ${info.rlsEnabledIn.join(', ') || 'NO RLS CALL FOUND! ⚠️'}`);
  console.log(`  Total policies: ${info.policies.length}`);
  for (const pol of info.policies) {
    console.log(`    [${pol.file}] ${pol.name}:`);
    console.log(`      ${pol.full.substring(0, 300)}...`);
  }
}
