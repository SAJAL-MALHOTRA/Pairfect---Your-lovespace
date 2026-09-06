const fs = require('fs');

// Generate 58 seconds of beautiful, soft romantic ambient piano chords (C - G/B - Am - F)
const sampleRate = 44100;
const duration = 58;
const totalSamples = sampleRate * duration;
const buffer = Buffer.alloc(totalSamples * 2); // 16-bit PCM

// Chord frequencies (Hz) in C Major: warm romantic progression
// Chords: Cmaj7 (C3, E3, G3, B3), G (G2, D3, G3, B3), Am7 (A2, E3, G3, C4), Fmaj7 (F2, C3, E3, A3)
const progressions = [
  [130.81, 164.81, 196.00, 246.94], // Cmaj7
  [98.00, 146.83, 196.00, 246.94],  // G
  [110.00, 164.81, 196.00, 261.63], // Am7
  [87.31, 130.81, 164.81, 220.00],  // Fmaj7
];

const chordDuration = 7.25; // 7.25s per chord * 8 chords = 58s

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const chordIdx = Math.floor((t / chordDuration) % progressions.length);
  const chordTime = t % chordDuration;
  const notes = progressions[chordIdx];

  // Soft piano-like envelope: quick attack, smooth exponential decay, warm sustain
  const env = Math.min(chordTime / 0.1, 1) * Math.exp(-chordTime / 4.5);

  let sample = 0;
  for (let n = 0; n < notes.length; n++) {
    const f = notes[n];
    // Fundamental + gentle warm harmonics (soft bell/piano character)
    const s = Math.sin(2 * Math.PI * f * t) * 0.55 +
              Math.sin(2 * Math.PI * f * 2 * t) * 0.25 +
              Math.sin(2 * Math.PI * f * 3 * t) * 0.12 +
              Math.sin(2 * Math.PI * f * 4 * t) * 0.05;
    sample += s * (0.22 / notes.length);
  }

  // Soft master fade in and fade out
  let masterFade = 1;
  if (t < 2.5) masterFade = t / 2.5;
  if (t > 54.0) masterFade = Math.max(0, (58 - t) / 4.0);

  const val = Math.max(-1, Math.min(1, sample * env * masterFade * 0.45));
  const intVal = Math.floor(val * 32767);
  buffer.writeInt16LE(intVal, i * 2);
}

// Write WAV header
function createWavHeader(dataLength, sampleRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

const header = createWavHeader(buffer.length, sampleRate);
fs.writeFileSync('temp_audio/soundtrack.wav', Buffer.concat([header, buffer]));
console.log('Ambient romantic soundtrack generated: temp_audio/soundtrack.wav');
