/**
 * Lightweight pure TypeScript QR Code Matrix Generator.
 * Self-contained, 0 external dependencies, offline-capable, creates real scannable QR codes (ISO/IEC 18004).
 */

// Galois Field GF(256) tables for QR Reed-Solomon encoding
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function rsComputePoly(ecLen: number): number[] {
  let poly = [1];
  for (let i = 0; i < ecLen; i++) {
    const root = EXP_TABLE[i];
    const nextPoly = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMultiply(poly[j], root);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly.reverse(); // highest power first
}

function rsCalculateEC(data: Uint8Array, ecLen: number): Uint8Array {
  const genPoly = rsComputePoly(ecLen);
  const remainder = new Array(ecLen).fill(0);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < ecLen; j++) {
      remainder[j] ^= gfMultiply(genPoly[j], factor);
    }
  }
  return new Uint8Array(remainder);
}

// Version table configuration for common QR sizes (Version 1 to 5, ECC Level M)
// Version 3-M holds up to 70 bytes, Version 4-M holds 93 bytes, Version 5-M holds 134 bytes
interface VersionSpec {
  version: number;
  size: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  alignmentPositions: number[];
}

const VERSION_SPECS: VersionSpec[] = [
  { version: 1, size: 21, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, alignmentPositions: [] },
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, alignmentPositions: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, alignmentPositions: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, alignmentPositions: [6, 26] },
  { version: 5, size: 37, totalCodewords: 134, ecCodewords: 48, dataCodewords: 86, alignmentPositions: [6, 30] },
  { version: 6, size: 41, totalCodewords: 172, ecCodewords: 64, dataCodewords: 108, alignmentPositions: [6, 34] },
];

/**
 * Encodes text into a standard QR code 2D boolean grid.
 * Returns true for black module, false for white module.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const utf8Encoder = new TextEncoder();
  const rawBytes = utf8Encoder.encode(text);

  // Pick smallest fitting version (ECC M: mode 4 = byte mode)
  // Byte mode header = 4 bits (0100) + length bits (8 bits for v1-9)
  const requiredDataBytes = rawBytes.length + 2; // ~header + termination
  const spec = VERSION_SPECS.find((s) => s.dataCodewords >= requiredDataBytes) || VERSION_SPECS[VERSION_SPECS.length - 1];

  // 1. Bitstream encoding: 0100 (Byte mode) + 8-bit length + data + terminator (0000)
  const bitStream: number[] = [];
  const pushBits = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) {
      bitStream.push((value >>> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(rawBytes.length, 8); // Character count indicator (8 bits for versions 1-9)
  for (let i = 0; i < rawBytes.length; i++) {
    pushBits(rawBytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const capacityBits = spec.dataCodewords * 8;
  const terminatorCount = Math.min(4, capacityBits - bitStream.length);
  pushBits(0, terminatorCount);

  // Pad to byte boundary
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Pad bytes: alternating 0xEC (11101100) and 0x11 (00010001)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitStream.length < capacityBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bitstream to data codewords
  const dataCodewords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitStream[i * 8 + b];
    }
    dataCodewords[i] = byteVal;
  }

  // 2. Generate Reed-Solomon error correction codewords
  const ecCodewords = rsCalculateEC(dataCodewords, spec.ecCodewords);

  // Combined codewords
  const finalCodewords = new Uint8Array(spec.dataCodewords + spec.ecCodewords);
  finalCodewords.set(dataCodewords, 0);
  finalCodewords.set(ecCodewords, spec.dataCodewords);

  // 3. Setup Matrix Grid
  const size = spec.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, func = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (func) isFunction[r][c] = true;
    }
  };

  // 4. Place Finder Patterns (7x7) at (0,0), (0, size-7), (size-7, 0)
  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          setModule(row, col, true);
        } else {
          setModule(row, col, false);
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 5. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    setModule(6, i, val);
    setModule(i, 6, val);
  }

  // 6. Alignment patterns (for version >= 2)
  if (spec.alignmentPositions.length > 0) {
    for (const r of spec.alignmentPositions) {
      for (const c of spec.alignmentPositions) {
        // Skip finders
        if (
          (r < 9 && c < 9) ||
          (r < 9 && c > size - 9) ||
          (r > size - 9 && c < 9)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // 7. Dark module at (4 * version + 9, 8)
  setModule(4 * spec.version + 9, 8, true);

  // 8. Reserve Format Information areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 9. Place Data Bits using Zig-Zag path with standard Mask Pattern 0: (row + col) % 2 === 0
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;

  let right = size - 1;
  let upward = true;

  while (right > 0) {
    if (right === 6) right--; // Skip vertical timing pattern column
    for (let vert = 0; vert < size; vert++) {
      const row = upward ? size - 1 - vert : vert;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = right - colOffset;
        if (!isFunction[row][col]) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const bytePos = Math.floor(bitIdx / 8);
            const bitPos = 7 - (bitIdx % 8);
            bit = (finalCodewords[bytePos] >>> bitPos) & 1;
            bitIdx++;
          }
          // Apply mask (pattern 0: (row + col) % 2 === 0)
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = (bit === 1) !== mask;
        }
      }
    }
    right -= 2;
    upward = !upward;
  }

  // 10. Write Format Info: ECC Level M (00) with Mask 0 (000) => 00000 ^ 101010000010010 = 101010000010010
  // Standard format information for ECC M, Mask 0 with BCH (15,5) code: 0x5412 (101010000010010)
  const formatInfo = 0x5412;
  const formatBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    formatBits.push(((formatInfo >>> i) & 1) === 1);
  }

  // Top-left format placement
  const tlCoords: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  tlCoords.forEach(([r, c], idx) => {
    matrix[r][c] = formatBits[idx];
  });

  // Split format placement (bottom-left & top-right)
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i];
  }

  return matrix.map((row) => row.map((cell) => cell === true));
}

