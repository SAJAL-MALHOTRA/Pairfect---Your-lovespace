const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ffmpeg = require('ffmpeg-static');
const audioDir = path.resolve('temp_audio_30s');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// 1. Five voiceover segments with exact text and timed post-phrase pauses
const voiceSegments = [
  { text: "Our most important relationships are trapped in everyday noise.", pause: 0.6 },
  { text: "Love deserves better than a chat history.", pause: 0.8 },
  { text: "Welcome to Pairfect. Where date night indecision becomes a game, and spontaneous moments become keepsakes you keep forever.", pause: 0.8 },
  { text: "No feeds. No followers. Just a private room built for you both.", pause: 0.8 },
  { text: "Pairfect. Start your room at pairfect dot site.", pause: 1.5 },
];

console.log("1. Synthesizing voiceover segments with Windows SAPI (Zira)...");
const segmentFiles = [];

voiceSegments.forEach((seg, idx) => {
  const rawWav = path.join(audioDir, `seg_raw_${idx}.wav`);
  const paddedWav = path.join(audioDir, `seg_padded_${idx}.wav`);

  // PowerShell script to speak with Microsoft Zira at rate 1 (articulate, confident)
  const psScript = `
    Add-Type -AssemblyName System.Speech;
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    $s.SelectVoice('Microsoft Zira Desktop');
    $s.Rate = 1;
    $s.SetOutputToWaveFile('${rawWav.replace(/\\/g, '\\\\')}');
    $s.Speak('${seg.text.replace(/'/g, "''")}');
    $s.Dispose();
  `;

  spawnSync('powershell', ['-NoProfile', '-Command', psScript], { stdio: 'inherit' });

  // Add precise post-phrase pause using ffmpeg apad
  spawnSync(ffmpeg, [
    '-y',
    '-i', rawWav,
    '-af', `apad=pad_dur=${seg.pause}`,
    paddedWav
  ], { stdio: 'ignore' });

  segmentFiles.push(paddedWav);
});

// Concatenate all voice segments
console.log("2. Concatenating voice segments...");
const concatListFile = path.join(audioDir, 'voice_concat.txt');
const listContent = segmentFiles
  .map(f => `file '${f.replace(/\\/g, '/')}'`)
  .join('\n');
fs.writeFileSync(concatListFile, listContent);

const finalVoiceFile = path.join(audioDir, 'voiceover_full.wav');
spawnSync(ffmpeg, [
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', concatListFile,
  '-c:a', 'pcm_s16le',
  finalVoiceFile
], { stdio: 'ignore' });

// 3. Synthesize 30-second cinematic soundtrack
console.log("3. Synthesizing 30-second romantic piano + vinyl ambiance soundtrack...");
const sampleRate = 44100;
const totalDuration = 30.0;
const totalSamples = Math.floor(sampleRate * totalDuration);
const pcmBuffer = Buffer.alloc(totalSamples * 2);

// Chord frequencies in C Major / A Minor: warm romantic progressions
const chords = [
  [130.81, 164.81, 196.00, 246.94], // Cmaj7 (0 - 4s)
  [110.00, 164.81, 196.00, 261.63], // Am7   (4 - 10s)
  [87.31,  130.81, 164.81, 220.00], // Fmaj7 (10 - 18s)
  [98.00,  146.83, 196.00, 246.94], // G      (18 - 24s)
  [130.81, 164.81, 196.00, 261.63], // Cmaj  (24 - 30s)
];

const chordTimes = [4.0, 6.0, 8.0, 6.0, 6.0]; // cumulative timings

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;

  // Determine current chord
  let chordIdx = 0;
  let elapsed = 0;
  for (let c = 0; c < chordTimes.length; c++) {
    if (t < elapsed + chordTimes[c]) {
      chordIdx = c;
      break;
    }
    elapsed += chordTimes[c];
  }

  const chordRelTime = t - elapsed;
  const notes = chords[chordIdx];

  // Piano harmonic synthesis with smooth exponential decay
  const env = Math.min(chordRelTime / 0.08, 1) * Math.exp(-chordRelTime / 4.2);

  let tone = 0;
  for (let n = 0; n < notes.length; n++) {
    const f = notes[n];
    const s = Math.sin(2 * Math.PI * f * t) * 0.50 +
              Math.sin(2 * Math.PI * f * 2 * t) * 0.28 +
              Math.sin(2 * Math.PI * f * 3 * t) * 0.14 +
              Math.sin(2 * Math.PI * f * 4 * t) * 0.06;
    tone += s * (0.28 / notes.length);
  }

  // Add subtle warm vinyl crackle + low rain texture
  const vinylNoise = (Math.random() - 0.5) * 0.012;
  const rainTexture = (Math.random() - 0.5) * 0.008;

  // Master fade in (0 - 2s) and fade out (27 - 30s)
  let masterFade = 1.0;
  if (t < 2.0) masterFade = t / 2.0;
  if (t > 27.0) masterFade = Math.max(0, (30.0 - t) / 3.0);

  const sampleVal = (tone * env * 0.55 + vinylNoise + rainTexture) * masterFade;
  const clamped = Math.max(-1, Math.min(1, sampleVal));
  pcmBuffer.writeInt16LE(Math.floor(clamped * 32767), i * 2);
}

// Write soundtrack WAV file with header
function writeWav(filePath, buffer, sRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + buffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sRate, 24);
  header.writeUInt32LE(sRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(buffer.length, 40);
  fs.writeFileSync(filePath, Buffer.concat([header, buffer]));
}

const soundtrackWav = path.join(audioDir, 'soundtrack_30s.wav');
writeWav(soundtrackWav, pcmBuffer, sampleRate);
console.log("Soundtrack created at:", soundtrackWav);

// 4. Composite voiceover + soundtrack into final AAC mix
console.log("4. Mixing voiceover and soundtrack with ducking...");
const finalAudioMix = path.join(audioDir, 'cinematic_audio_30s.aac');

const mixFilter = [
  '[0:a]volume=1.0[voice]',
  '[1:a]volume=0.45[music]',
  '[voice][music]amix=inputs=2:duration=first:dropout_transition=2[out]'
].join(';');

spawnSync(ffmpeg, [
  '-y',
  '-i', finalVoiceFile,
  '-i', soundtrackWav,
  '-filter_complex', mixFilter,
  '-map', '[out]',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-t', '30.0',
  finalAudioMix
], { stdio: 'inherit' });

console.log("Final cinematic 30-second audio mix created at:", finalAudioMix);
