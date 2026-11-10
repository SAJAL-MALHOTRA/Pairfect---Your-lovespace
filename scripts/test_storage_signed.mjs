import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function testUpload() {
  const buffer = Buffer.from("RIFF....WAVEfmt ....data....", "utf8");
  const filePath = `test-pair/whispers/test_${Date.now()}.webm`;

  const { data: uploadData, error: uploadErr } = await admin.storage
    .from("memories")
    .upload(filePath, buffer, { contentType: "audio/webm", upsert: true });

  console.log("Upload result:", { uploadData, uploadErr });

  if (uploadData?.path) {
    const { data: signedData, error: signedErr } = await admin.storage
      .from("memories")
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365);

    console.log("Signed URL result:", { signedData, signedErr });
  }
}

testUpload().catch(console.error);
