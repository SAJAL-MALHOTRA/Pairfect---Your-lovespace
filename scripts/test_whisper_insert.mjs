import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const anon = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);

async function main() {
  const testRecord = {
    pair_id: '495718ff-edf0-443b-bbb6-fef139efe0cc',
    sender_id: '1ae10371-c26e-4c49-bb65-98872b5b992c',
    sender_name: 'Test',
    frequency: 91.7,
    title: 'Anon insert test',
    audio_url: 'https://example.com/audio.webm',
    duration: 3,
    mood_tag: 'romantic',
  };

  const { data: insData, error: insErr } = await anon.from("whispers").insert(testRecord).select().single();
  console.log("Anon insert:", { insData, insErr });
}

main().catch(console.error);
