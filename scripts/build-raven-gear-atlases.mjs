import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

const root = process.cwd();
const sprites = path.join(root, 'public/assets/sprites');
const packs = {
  armor: path.join(root, 'ảnh/Raven Fantasy HD - RPG Icons, Pixel Art Icons, Textures and Sprites - Armor/Icons/Separated Files'),
};
const armorAtlases = [
  ['raven_traveler_vest', 'a2.png'],
  ['raven_scale_coat', 'a18.png'],
  ['raven_crimson_cuirass', 'a34.png'],
];

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

async function decodeRgba(file) {
  const png = await readFile(file);
  if (png.toString('hex', 0, 8) !== '89504e470d0a1a0a' || png[24] !== 8 || png[25] !== 6) {
    throw new Error(`Expected an 8-bit RGBA PNG: ${file}`);
  }
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const parts = [];
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') parts.push(png.subarray(offset + 8, offset + 8 + size));
    offset += size + 12;
    if (type === 'IEND') break;
  }
  const filtered = inflateSync(Buffer.concat(parts));
  const stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  let inputOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = filtered[inputOffset++];
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = filtered[inputOffset++];
      const left = x >= 4 ? pixels[rowOffset + x - 4] : 0;
      const above = y ? pixels[rowOffset + x - stride] : 0;
      const upperLeft = y && x >= 4 ? pixels[rowOffset + x - stride - 4] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above : filter === 3
        ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : null;
      if (predictor === null) throw new Error(`Unsupported PNG filter ${filter}: ${file}`);
      pixels[rowOffset + x] = (value + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}
async function encodeRgba(file, width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const stride = width * 4;
  const rows = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) pixels.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const output = Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0)),
  ]);
  await writeFile(file, output);
}

for (const [itemId, sourceName] of armorAtlases) {
  const icon = await decodeRgba(path.join(packs.armor, sourceName));
  if (icon.width !== 32 || icon.height !== 32) throw new Error(`Expected 32x32 armor icon: ${sourceName}`);
  const frameSize = 64, iconInset = 16, width = frameSize * 6, height = frameSize * 8;
  const atlas = Buffer.alloc(width * height * 4);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 6; col++) {
    for (let y = 0; y < icon.height; y++) {
      const srcStart = y * icon.width * 4;
      const dstStart = ((row * frameSize + iconInset + y) * width + col * frameSize + iconInset) * 4;
      icon.pixels.copy(atlas, dstStart, srcStart, srcStart + icon.width * 4);
    }
  }
  const folder = path.join(sprites, 'equipment', itemId, 'humanoid_standard');
  for (const stage of ['child', 'adult', 'elder']) {
    const stageDir = path.join(folder, stage);
    await mkdir(stageDir, { recursive: true });
    await encodeRgba(path.join(stageDir, 'front.png'), width, height, atlas);
  }
  await writeFile(path.join(folder, 'visual.json'), JSON.stringify({ frameSize, attribution: 'Clockwork Raven Studios, adapted from the collected Raven Fantasy armor icons.' }, null, 2) + '\n');
}

console.log(`Generated ${armorAtlases.length} armor atlases with 64px frames for child, adult, and elder humanoid appearances.`);
