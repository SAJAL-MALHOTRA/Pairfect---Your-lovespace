"use client";

// Shared Web Audio Context
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Realistic vintage FM static swoosh sound when turning between frequencies
 */
export function playStaticNoise(durationSec = 0.22, volume = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    // Generate white noise with random grain
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Bandpass filter to sound like an old transistor radio tuner
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(1.8, now);

    // Gain envelope with rapid attack and smooth exponential decay
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + durationSec);
  } catch (err) {
    console.debug("Audio FX playStaticNoise error:", err);
  }
}

/**
 * Tactile mechanical radio push-button click
 */
export function playRadioClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    console.debug("Audio FX playRadioClick error:", err);
  }
}

/**
 * Gentle melodic chime when tuning locks onto a loved one's whisper
 */
export function playStationLockChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880.0]; // D5, A5 warm bell harmonic

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.36);
    });
  } catch (err) {
    console.debug("Audio FX playStationLockChime error:", err);
  }
}
