import fs from "fs";
import path from "path";

const dir = "C:/Users/2006s/.gemini/antigravity/scratch/hoedex/supabase";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql"));

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), "utf-8");
  const lines = content.split("\n");
  
  const tables = [];
  const rlsEnabled = [];
  const policies = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ctMatch = line.match(/create\s+table(?:\s+if\s+not\s+exists)?\s+([^\s(]+)/i);
    if (ctMatch) {
      tables.push(ctMatch[1].replace(/public\./i, ''));
    }
    const rlsMatch = line.match(/alter\s+table\s+([^\s]+)\s+enable\s+row\s+level\s+security/i);
    if (rlsMatch) {
      rlsEnabled.push(rlsMatch[1].replace(/public\./i, ''));
    }
    const polMatch = line.match(/create\s+policy\s+"([^"]+)"\s+on\s+([^\s]+)\s+(?:for\s+([^\s]+)\s+)?(?:to\s+([^\s]+)\s+)?using\s*\(([^;]+)\)/i);
    if (polMatch) {
      policies.push({
        name: polMatch[1],
        table: polMatch[2].replace(/public\./i, ''),
        cmd: polMatch[3] || 'ALL',
        to: polMatch[4] || 'public',
        using: polMatch[5].trim().substring(0, 100)
      });
    }
  }

  if (tables.length > 0 || rlsEnabled.length > 0) {
    console.log(`\n=== FILE: ${file} ===`);
    console.log(`Tables:`, tables);
    console.log(`RLS Enabled:`, rlsEnabled);
    if (policies.length > 0) {
      console.log(`Policies:`, policies.map(p => `[${p.table}] (${p.cmd} to ${p.to}) "${p.name}" => ${p.using}`));
    }
  }
}
