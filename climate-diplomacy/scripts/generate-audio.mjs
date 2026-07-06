/**
 * Generates procedural CC0-style placeholder audio assets (WAV, 44.1kHz mono).
 * Run: node scripts/generate-audio.mjs
 * Optional: ffmpeg -i file.wav file.mp3 for MP3 conversion.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "src", "assets", "audio");
const SAMPLE_RATE = 44100;

function writeWav(path, samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
}

function env(t, attack, decay, duration) {
  if (t < attack) return t / attack;
  if (t > duration - decay) return Math.max(0, (duration - t) / decay);
  return 1;
}

function tone(freq, duration, { attack = 0.005, decay = 0.05, gain = 0.35, type = "sine" } = {}) {
  const n = Math.ceil(duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const e = env(t, attack, decay, duration) * gain;
    const phase = 2 * Math.PI * freq * t;
    let v = 0;
    if (type === "sine") v = Math.sin(phase);
    else if (type === "square") v = Math.sign(Math.sin(phase));
    else if (type === "triangle") v = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (type === "noise") v = Math.random() * 2 - 1;
    out[i] = v * e;
  }
  return out;
}

function mix(...parts) {
  const len = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(len);
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) out[i] += p[i];
  }
  return out;
}

function click() {
  return mix(tone(1200, 0.04, { gain: 0.25 }), tone(800, 0.03, { gain: 0.15, type: "triangle" }));
}

function tabSwitch() {
  return mix(tone(600, 0.05, { gain: 0.2 }), tone(900, 0.04, { gain: 0.12, attack: 0.01 }));
}

function panelOpen() {
  const n = Math.ceil(0.12 * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 400 + t * 1200;
    out[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.01, 0.04, 0.12) * 0.2;
  }
  return out;
}

function panelClose() {
  const n = Math.ceil(0.1 * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 1400 - t * 900;
    out[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.005, 0.05, 0.1) * 0.18;
  }
  return out;
}

function toggle() {
  return mix(tone(500, 0.03, { gain: 0.2 }), tone(700, 0.05, { gain: 0.15, attack: 0.01 }));
}

function buildPlace() {
  return mix(
    tone(220, 0.08, { gain: 0.3, type: "triangle" }),
    tone(440, 0.06, { gain: 0.15, attack: 0.02 })
  );
}

function buildUpgrade() {
  return mix(tone(330, 0.1, { gain: 0.28 }), tone(660, 0.08, { gain: 0.18, attack: 0.015 }));
}

function buildDemolish() {
  return mix(tone(180, 0.15, { gain: 0.35, type: "square" }), tone(90, 0.2, { gain: 0.2, type: "noise" }));
}

function cycleTick() {
  return tone(880, 0.06, { gain: 0.15, type: "triangle" });
}

function cycleComplete() {
  return mix(
    tone(523, 0.15, { gain: 0.22, attack: 0.01 }),
    tone(659, 0.15, { gain: 0.2, attack: 0.02 }),
    tone(784, 0.25, { gain: 0.25, attack: 0.03, decay: 0.12 })
  );
}

function tradePropose() {
  return mix(tone(740, 0.08, { gain: 0.2 }), tone(988, 0.06, { gain: 0.12, attack: 0.02 }));
}

function tradeAccept() {
  return mix(tone(880, 0.1, { gain: 0.25 }), tone(1175, 0.12, { gain: 0.2, attack: 0.02 }));
}

function tradeReject() {
  return mix(tone(300, 0.12, { gain: 0.25, type: "square" }), tone(200, 0.15, { gain: 0.15 }));
}

function coin() {
  return mix(tone(1800, 0.05, { gain: 0.2 }), tone(2400, 0.04, { gain: 0.12, attack: 0.005 }));
}

function sliderTick() {
  return tone(640, 0.025, { gain: 0.1, type: "triangle" });
}

function warning() {
  return mix(tone(660, 0.12, { gain: 0.3 }), tone(880, 0.15, { gain: 0.25, attack: 0.02 }));
}

function crisis() {
  const n = Math.ceil(0.6 * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 400 + 200 * Math.sin(t * 12);
    out[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.01, 0.15, 0.6) * 0.35;
  }
  return out;
}

function tempMilestone() {
  const n = Math.ceil(0.5 * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const f = 500 + t * 600;
    out[i] = Math.sin(2 * Math.PI * f * t) * env(t, 0.02, 0.2, 0.5) * 0.3;
  }
  return out;
}

function summitGavel() {
  return mix(tone(120, 0.08, { gain: 0.45, type: "square" }), tone(80, 0.12, { gain: 0.25, type: "noise" }));
}

function voteCast() {
  return mix(tone(400, 0.05, { gain: 0.25, type: "square" }), tone(600, 0.04, { gain: 0.15 }));
}

function resolutionPass() {
  return mix(
    tone(523, 0.12, { gain: 0.22 }),
    tone(659, 0.12, { gain: 0.22, attack: 0.02 }),
    tone(784, 0.2, { gain: 0.28, attack: 0.03, decay: 0.1 })
  );
}

function resolutionFail() {
  return mix(tone(350, 0.2, { gain: 0.3, type: "square" }), tone(250, 0.25, { gain: 0.2 }));
}

function ambientLoop(seconds, baseFreq, intensity = 0.08) {
  const n = Math.ceil(seconds * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const lfo = 0.5 + 0.5 * Math.sin(t * 0.3);
    const v =
      Math.sin(2 * Math.PI * baseFreq * t) * 0.5 +
      Math.sin(2 * Math.PI * (baseFreq * 1.5) * t) * 0.3 +
      Math.sin(2 * Math.PI * (baseFreq * 0.5) * t) * 0.2;
    out[i] = v * intensity * lfo;
  }
  return out;
}

function ambientTension(seconds) {
  const n = Math.ceil(seconds * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.2);
    const v =
      Math.sin(2 * Math.PI * 110 * t) * 0.4 +
      Math.sin(2 * Math.PI * 165 * t) * 0.25 +
      (Math.random() * 2 - 1) * 0.03;
    out[i] = v * 0.12 * pulse;
  }
  return out;
}

function ambientSummit(seconds) {
  const n = Math.ceil(seconds * SAMPLE_RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const v =
      Math.sin(2 * Math.PI * 196 * t) * 0.35 +
      Math.sin(2 * Math.PI * 294 * t) * 0.25 +
      Math.sin(2 * Math.PI * 392 * t) * 0.15;
    out[i] = v * 0.1 * (0.7 + 0.3 * Math.sin(t * 0.5));
  }
  return out;
}

const SOUNDS = {
  "ui/click": click,
  "ui/tab-switch": tabSwitch,
  "ui/hover": () => tone(1000, 0.02, { gain: 0.08 }),
  "ui/open-panel": panelOpen,
  "ui/close-panel": panelClose,
  "ui/toggle": toggle,
  "game/build-place": buildPlace,
  "game/build-upgrade": buildUpgrade,
  "game/build-demolish": buildDemolish,
  "game/cycle-tick": cycleTick,
  "game/cycle-complete": cycleComplete,
  "game/trade-propose": tradePropose,
  "game/trade-accept": tradeAccept,
  "game/trade-reject": tradeReject,
  "game/coin": coin,
  "game/slider-tick": sliderTick,
  "alerts/warning": warning,
  "alerts/crisis": crisis,
  "alerts/temp-milestone": tempMilestone,
  "alerts/summit-gavel": summitGavel,
  "summit/vote-cast": voteCast,
  "summit/resolution-pass": resolutionPass,
  "summit/resolution-fail": resolutionFail,
  "music/ambient-main": () => ambientLoop(20, 130, 0.09),
  "music/ambient-tension": () => ambientTension(20),
  "music/ambient-summit": () => ambientSummit(20),
};

if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true });

let count = 0;
for (const [rel, fn] of Object.entries(SOUNDS)) {
  const wavPath = join(ROOT, `${rel}.wav`);
  writeWav(wavPath, fn());
  count++;
  console.log(`Wrote ${wavPath}`);
}

console.log(`Generated ${count} audio files in ${ROOT}`);
