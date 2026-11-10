// Lightweight Web Audio API Procedural Ambient Soundscape Engine
// Zero external mp3 dependencies: 100% synthesized in real time

export type SoundscapeTrack = "off" | "rain" | "fireplace" | "night" | "vinyl";

export interface SoundscapeState {
  currentTrack: SoundscapeTrack;
  volume: number; // 0 to 1
  isPlaying: boolean;
}

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeStopFn: (() => void) | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getMasterGain(): GainNode | null {
  const c = getContext();
  if (!c) return null;
  if (!masterGain) {
    masterGain = c.createGain();
    masterGain.gain.setValueAtTime(0.3, c.currentTime);
    masterGain.connect(c.destination);
  }
  return masterGain;
}

// 1. Cozy Rain Synthesizer (Filtered Pink Noise + Droplet pulses)
function startRain(c: AudioContext, destination: GainNode): () => void {
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate pink noise
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
    b6 = white * 0.115926;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const lowpass = c.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(800, c.currentTime);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.35, c.currentTime);

  noise.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(destination);
  noise.start();

  // Random gentle droplets
  let isRunning = true;
  const dropletInterval = setInterval(() => {
    if (!isRunning || c.state === "closed") return;
    try {
      const osc = c.createOscillator();
      const dropGain = c.createGain();
      osc.type = "sine";
      const startFreq = 1200 + Math.random() * 800;
      osc.frequency.setValueAtTime(startFreq, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.08);

      dropGain.gain.setValueAtTime(0.02, c.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);

      osc.connect(dropGain);
      dropGain.connect(destination);
      osc.start();
      osc.stop(c.currentTime + 0.09);
    } catch {}
  }, 350 + Math.random() * 400);

  return () => {
    isRunning = false;
    clearInterval(dropletInterval);
    try {
      noise.stop();
      noise.disconnect();
      lowpass.disconnect();
      gain.disconnect();
    } catch {}
  };
}

// 2. Fireplace Glow Synthesizer (Warm Low Rumble + Intermittent Crackles)
function startFireplace(c: AudioContext, destination: GainNode): () => void {
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.08;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const bandpass = c.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(260, c.currentTime);
  bandpass.Q.setValueAtTime(1.2, c.currentTime);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.4, c.currentTime);

  noise.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(destination);
  noise.start();

  let isRunning = true;
  const crackleInterval = setInterval(() => {
    if (!isRunning || c.state === "closed") return;
    try {
      const crackleOsc = c.createOscillator();
      const crackleGain = c.createGain();
      crackleOsc.type = "sawtooth";
      crackleOsc.frequency.setValueAtTime(180 + Math.random() * 320, c.currentTime);

      crackleGain.gain.setValueAtTime(0.06, c.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);

      crackleOsc.connect(crackleGain);
      crackleGain.connect(destination);
      crackleOsc.start();
      crackleOsc.stop(c.currentTime + 0.05);
    } catch {}
  }, 180 + Math.random() * 220);

  return () => {
    isRunning = false;
    clearInterval(crackleInterval);
    try {
      noise.stop();
      noise.disconnect();
      bandpass.disconnect();
      gain.disconnect();
    } catch {}
  };
}

// 3. Starry Night Synthesizer (Harmonic Resonant Pad + Night Breeze)
function startNight(c: AudioContext, destination: GainNode): () => void {
  const chord = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 major triad
  const oscs: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  chord.forEach((freq) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(0.025, c.currentTime);

    osc.connect(gain);
    gain.connect(destination);
    osc.start();

    oscs.push(osc);
    gains.push(gain);
  });

  return () => {
    oscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    gains.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
  };
}

// 4. Warm Vinyl Hiss Synthesizer
function startVinyl(c: AudioContext, destination: GainNode): () => void {
  const bufferSize = c.sampleRate * 2;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.035;
  }

  const noise = c.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const highpass = c.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(1400, c.currentTime);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.25, c.currentTime);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);
  noise.start();

  return () => {
    try {
      noise.stop();
      noise.disconnect();
      highpass.disconnect();
      gain.disconnect();
    } catch {}
  };
}

// Soundscape Controller API
export function setSoundscape(track: SoundscapeTrack, volume: number = 0.3): void {
  if (activeStopFn) {
    activeStopFn();
    activeStopFn = null;
  }

  if (track === "off") {
    return;
  }

  const c = getContext();
  const mg = getMasterGain();
  if (!c || !mg) return;

  mg.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), c.currentTime);

  if (track === "rain") {
    activeStopFn = startRain(c, mg);
  } else if (track === "fireplace") {
    activeStopFn = startFireplace(c, mg);
  } else if (track === "night") {
    activeStopFn = startNight(c, mg);
  } else if (track === "vinyl") {
    activeStopFn = startVinyl(c, mg);
  }
}

export function setSoundscapeVolume(volume: number): void {
  const c = getContext();
  const mg = getMasterGain();
  if (c && mg) {
    mg.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), c.currentTime);
  }
}

export function stopSoundscape(): void {
  if (activeStopFn) {
    activeStopFn();
    activeStopFn = null;
  }
}
