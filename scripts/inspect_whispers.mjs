import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

console.log("Supabase URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data, error } = await supabase.from("whispers").select("*").order("created_at", { ascending: false }).limit(5);
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Found whispers:", data.length);
  for (const w of data) {
    console.log({
      id: w.id,
      title: w.title,
      sender_name: w.sender_name,
      frequency: w.frequency,
      duration: w.duration,
      audio_url_type: w.audio_url?.startsWith("data:") ? `base64 (${w.audio_url.slice(0, 40)}... length ${w.audio_url.length})` : w.audio_url,
      created_at: w.created_at,
    });
  }
}

main().catch(console.error);
