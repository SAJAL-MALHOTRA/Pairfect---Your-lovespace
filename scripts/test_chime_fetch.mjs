async function test() {
  const res = await fetch("http://localhost:3000/whisper-chime.wav");
  console.log("Status:", res.status, "Type:", res.headers.get("content-type"), "Length:", res.headers.get("content-length"));
}
test().catch(console.error);
