import fs from 'fs';
import zlib from 'zlib';

// Function to generate an uncompressed/deflated valid RGBA PNG
function createPNG(width, height, getPixel) {
  // RGBA buffer with filter byte 0 at beginning of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(typeStr, dataBuf) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);

    const typeBuf = Buffer.from(typeStr, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, dataBuf]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);

    return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Moto Icon color map
function getMotoPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Base dark background (#0f172a to #1e293b gradient)
  const gradT = (x + y) / (w + h);
  const rBg = Math.round(15 + gradT * 15);
  const gBg = Math.round(23 + gradT * 18);
  const bBg = Math.round(42 + gradT * 17);

  // Rounded outer squircle or maskable circle
  const maxR = isMaskable ? w * 0.48 : w * 0.46;
  if (!isMaskable && (Math.abs(dx) > w * 0.44 || Math.abs(dy) > h * 0.44)) {
    // Round corners
    const cornerR = w * 0.22;
    const cornerDx = Math.max(0, Math.abs(dx) - (w * 0.5 - cornerR));
    const cornerDy = Math.max(0, Math.abs(dy) - (h * 0.5 - cornerR));
    if (cornerDx * cornerDx + cornerDy * cornerDy > cornerR * cornerR) {
      return [0, 0, 0, 0];
    }
  }

  // Draw technical orange ring
  const ringR = w * 0.38;
  if (Math.abs(dist - ringR) < w * 0.015) {
    return [249, 115, 22, 220]; // #f97316
  }

  // Wheels (left and right)
  const leftWheelX = cx - w * 0.22;
  const rightWheelX = cx + w * 0.22;
  const wheelY = cy + h * 0.12;
  const wheelR = w * 0.13;
  const wheelThick = w * 0.04;

  const dLeft = Math.hypot(x - leftWheelX, y - wheelY);
  const dRight = Math.hypot(x - rightWheelX, y - wheelY);

  if ((dLeft <= wheelR && dLeft >= wheelR - wheelThick) || (dRight <= wheelR && dRight >= wheelR - wheelThick)) {
    return [234, 88, 12, 255]; // Orange tire rim #ea580c
  }
  if (dLeft < w * 0.03 || dRight < w * 0.03) {
    return [249, 115, 22, 255]; // Axle
  }

  // Moto Body & Tank / Fairing
  if (y >= cy - h * 0.18 && y <= cy + h * 0.08 && x >= cx - w * 0.25 && x <= cx + w * 0.28) {
    // Upper tank shape
    const relY = (y - (cy - h * 0.18)) / (h * 0.26);
    if (x > cx - w * 0.15 && x < cx + w * 0.2) {
      return [249, 115, 22, 255]; // Vibrant Orange #f97316
    }
    // Engine / lower body
    if (y > cy - h * 0.02) {
      return [71, 85, 105, 255]; // Steel #475569
    }
  }

  // Wrench Cross in Upper Badge
  const badgeY = cy - h * 0.26;
  const dBadge = Math.hypot(x - cx, y - badgeY);
  if (dBadge <= w * 0.09) {
    if (Math.abs(dBadge - w * 0.09) < w * 0.01) {
      return [249, 115, 22, 255];
    }
    // Wrench cross
    if (Math.abs(x - cx) < w * 0.02 || Math.abs(y - badgeY) < h * 0.02) {
      return [241, 245, 249, 255];
    }
  }

  return [rBg, gBg, bBg, 255];
}

const icons = [
  { path: 'public/pwa-192x192.png', size: 192, maskable: false },
  { path: 'public/pwa-512x512.png', size: 512, maskable: false },
  { path: 'public/pwa-maskable-512x512.png', size: 512, maskable: true },
  { path: 'public/apple-touch-icon.png', size: 180, maskable: false },
  { path: 'public/favicon.ico', size: 64, maskable: false },
];

for (const icon of icons) {
  const buf = createPNG(icon.size, icon.size, (x, y, w, h) => getMotoPixel(x, y, w, h, icon.maskable));
  fs.writeFileSync(icon.path, buf);
  console.log(`Generated ${icon.path} (${icon.size}x${icon.size})`);
}
