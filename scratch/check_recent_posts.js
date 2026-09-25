import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envText = '';
try {
  envText = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  console.error("Could not read .env.local");
}

const envVars = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecent() {
  console.log("=== RECENT LOVE STORIES ===");
  const { data: stories, error: storiesErr } = await supabase
    .from('love_stories')
    .select('id, title, content, problem_statement, visibility, story_status, is_anonymous, author_display, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(storiesErr || stories);

  console.log("\n=== RECENT LOVE LETTERS ===");
  const { data: letters, error: lettersErr } = await supabase
    .from('love_letters')
    .select('id, sender_id, recipient_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(lettersErr || letters);

  console.log("\n=== RECENT GRATITUDE ENTRIES ===");
  const { data: grat, error: gratErr } = await supabase
    .from('gratitude_entries')
    .select('id, sender_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(gratErr || grat);

  console.log("\n=== RECENT SHARED MOMENTS ===");
  const { data: mom, error: momErr } = await supabase
    .from('shared_moments')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(momErr || mom);
}

checkRecent();
