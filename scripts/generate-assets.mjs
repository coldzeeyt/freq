// Generates the procedural sound + texture assets used by the tuning effect.
// Run with: node scripts/generate-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const soundDir = join(root, 'assets', 'sounds');
const noiseDir = join(root, 'assets', 'noise');
mkdirSync(soundDir, { recursive: true });
mkdirSync(noiseDir, { recursive: true });

// --- WAV ---------------------------------------------------------------
function wav(samples, sampleRate = 22050) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
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
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Short mechanical detent click: a decaying noise burst plus a tiny resonant tick.
{
  const sr = 22050;
  const n = Math.floor(sr * 0.03);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 260);
    out.push(env * (0.55 * (Math.random() * 2 - 1) + 0.6 * Math.sin(2 * Math.PI * 2400 * t)));
  }
  writeFileSync(join(soundDir, 'click.wav'), wav(out, sr));
}

// Radio static: band-limited noise with a slow wobble. Loops seamlessly-ish.
{
  const sr = 22050;
  const n = sr * 1;
  const out = [];
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45;
    const wobble = 0.75 + 0.25 * Math.sin(2 * Math.PI * 3 * t);
    out.push(lp * 0.5 * wobble);
  }
  // crossfade the ends so the loop does not pop
  const fade = 400;
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] *= k;
    out[n - 1 - i] *= k;
  }
  writeFileSync(join(soundDir, 'static.wav'), wav(out, sr));
}

// --- PNG noise frames --------------------------------------------------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
for (let f = 0; f < 4; f++) {
  const w = 128;
  const h = 256;
  const buf = png(w, h, (x, y) => {
    const scan = y % 3 === 0 ? 0.55 : 1;
    const v = Math.floor(Math.random() * 255 * scan);
    return [v, v, v, 255];
  });
  writeFileSync(join(noiseDir, `noise${f}.png`), buf);
}
console.log('assets generated');
