// DX7 SysEx import/export: 32-voice bulk dumps (4104 bytes, packed) and
// single-voice dumps (163 bytes, unpacked). Compatible with Dexed and the
// thousands of DX7 banks shared online.

import { normalizePatch, type Curve, type LfoWave, type Operator, type Patch } from './patch';

const VOICE_PACKED = 128;
const VOICE_UNPACKED = 155;

function checksum(data: Uint8Array): number {
  let sum = 0;
  for (const b of data) sum += b;
  return (128 - (sum & 127)) & 127;
}

const nameFrom = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => {
    const c = b & 0x7f;
    return c >= 32 && c < 127 ? String.fromCharCode(c) : ' ';
  }).join('').trimEnd();

export function unpackVoice(d: Uint8Array): Patch {
  const ops: Operator[] = [];
  for (let i = 0; i < 6; i++) {
    const o = d.subarray((5 - i) * 17, (5 - i) * 17 + 17); // packed data stores OP6 first
    ops.push({
      rates: [o[0] & 127, o[1] & 127, o[2] & 127, o[3] & 127],
      levels: [o[4] & 127, o[5] & 127, o[6] & 127, o[7] & 127],
      breakPoint: o[8] & 127,
      leftDepth: o[9] & 127,
      rightDepth: o[10] & 127,
      leftCurve: (o[11] & 3) as Curve,
      rightCurve: ((o[11] >> 2) & 3) as Curve,
      rateScaling: o[12] & 7,
      detune: (o[12] >> 3) & 15,
      ampModSens: o[13] & 3,
      velocitySens: (o[13] >> 2) & 7,
      outputLevel: o[14] & 127,
      oscMode: (o[15] & 1) as 0 | 1,
      coarse: (o[15] >> 1) & 31,
      fine: o[16] & 127,
      enabled: true,
      shape: 0,
    });
  }
  return normalizePatch({
    name: nameFrom(d.subarray(118, 128)),
    ops,
    pitchEg: { rates: [d[102], d[103], d[104], d[105]], levels: [d[106], d[107], d[108], d[109]] },
    algorithm: (d[110] & 31) + 1,
    feedback: d[111] & 7,
    oscSync: ((d[111] >> 3) & 1) === 1,
    lfo: {
      speed: d[112],
      delay: d[113],
      pmd: d[114],
      amd: d[115],
      sync: (d[116] & 1) === 1,
      wave: ((d[116] >> 1) & 7) as LfoWave,
    },
    pitchModSens: (d[116] >> 4) & 7,
    transpose: d[117],
  });
}

export function packVoice(p: Patch): Uint8Array {
  const d = new Uint8Array(VOICE_PACKED);
  for (let i = 0; i < 6; i++) {
    const op = p.ops[i];
    const b = (5 - i) * 17;
    d.set(op.rates, b);
    d.set(op.levels, b + 4);
    d[b + 8] = op.breakPoint;
    d[b + 9] = op.leftDepth;
    d[b + 10] = op.rightDepth;
    d[b + 11] = (op.leftCurve & 3) | ((op.rightCurve & 3) << 2);
    d[b + 12] = (op.rateScaling & 7) | ((op.detune & 15) << 3);
    d[b + 13] = (op.ampModSens & 3) | ((op.velocitySens & 7) << 2);
    d[b + 14] = op.outputLevel;
    d[b + 15] = (op.oscMode & 1) | ((op.coarse & 31) << 1);
    d[b + 16] = op.fine;
  }
  d.set(p.pitchEg.rates, 102);
  d.set(p.pitchEg.levels, 106);
  d[110] = (p.algorithm - 1) & 31;
  d[111] = (p.feedback & 7) | ((p.oscSync ? 1 : 0) << 3);
  d[112] = p.lfo.speed;
  d[113] = p.lfo.delay;
  d[114] = p.lfo.pmd;
  d[115] = p.lfo.amd;
  d[116] = (p.lfo.sync ? 1 : 0) | ((p.lfo.wave & 7) << 1) | ((p.pitchModSens & 7) << 4);
  d[117] = p.transpose;
  const name = p.name.padEnd(10, ' ').slice(0, 10);
  for (let i = 0; i < 10; i++) d[118 + i] = name.charCodeAt(i) & 127;
  return d;
}

function unpackSingle(d: Uint8Array): Patch {
  const ops: Operator[] = [];
  for (let i = 0; i < 6; i++) {
    const o = d.subarray((5 - i) * 21, (5 - i) * 21 + 21);
    ops.push({
      rates: [o[0], o[1], o[2], o[3]],
      levels: [o[4], o[5], o[6], o[7]],
      breakPoint: o[8],
      leftDepth: o[9],
      rightDepth: o[10],
      leftCurve: o[11] as Curve,
      rightCurve: o[12] as Curve,
      rateScaling: o[13],
      ampModSens: o[14],
      velocitySens: o[15],
      outputLevel: o[16],
      oscMode: o[17] as 0 | 1,
      coarse: o[18],
      fine: o[19],
      detune: o[20],
      enabled: true,
      shape: 0,
    });
  }
  return normalizePatch({
    name: nameFrom(d.subarray(145, 155)),
    ops,
    pitchEg: { rates: [d[126], d[127], d[128], d[129]], levels: [d[130], d[131], d[132], d[133]] },
    algorithm: d[134] + 1,
    feedback: d[135],
    oscSync: d[136] === 1,
    lfo: { speed: d[137], delay: d[138], pmd: d[139], amd: d[140], sync: d[141] === 1, wave: d[142] as LfoWave },
    pitchModSens: d[143],
    transpose: d[144],
  });
}

export interface SysexResult {
  patches: Patch[];
  warnings: string[];
}

/** Parse any DX7 voice SysEx (one file may contain several messages). */
export function parseSysex(bytes: Uint8Array): SysexResult {
  const patches: Patch[] = [];
  const warnings: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    if (bytes[i] !== 0xf0) {
      i++;
      continue;
    }
    let end = i + 1;
    while (end < bytes.length && bytes[end] !== 0xf7) end++;
    const msg = bytes.subarray(i, end + 1);
    i = end + 1;
    if (msg.length < 6 || msg[1] !== 0x43) {
      warnings.push('Skipped a non-Yamaha SysEx message.');
      continue;
    }
    const format = msg[3];
    if (format === 0x09 && msg.length >= 4104) {
      const data = msg.subarray(6, 6 + 4096);
      if (checksum(data) !== msg[6 + 4096]) warnings.push('Bank checksum mismatch (loaded anyway).');
      for (let v = 0; v < 32; v++) patches.push(unpackVoice(data.subarray(v * VOICE_PACKED, (v + 1) * VOICE_PACKED)));
    } else if (format === 0x00 && msg.length >= 6 + VOICE_UNPACKED) {
      const data = msg.subarray(6, 6 + VOICE_UNPACKED);
      if (checksum(data) !== msg[6 + VOICE_UNPACKED]) warnings.push('Voice checksum mismatch (loaded anyway).');
      patches.push(unpackSingle(data));
    } else {
      warnings.push(`Unsupported DX7 SysEx format 0x${format.toString(16)} (${msg.length} bytes).`);
    }
  }
  // Raw 4096-byte bank without the SysEx header (some archives store these)
  if (!patches.length && bytes.length === 4096) {
    for (let v = 0; v < 32; v++) patches.push(unpackVoice(bytes.subarray(v * VOICE_PACKED, (v + 1) * VOICE_PACKED)));
  }
  if (!patches.length && !warnings.length) warnings.push('No DX7 voice data found in file.');
  return { patches, warnings };
}

/** Build a standard 32-voice bank dump; missing slots are filled with INIT VOICE. */
export function buildBank(patches: Patch[], fill: () => Patch): Uint8Array {
  const out = new Uint8Array(4104);
  out.set([0xf0, 0x43, 0x00, 0x09, 0x20, 0x00]);
  const data = out.subarray(6, 6 + 4096);
  for (let v = 0; v < 32; v++) data.set(packVoice(patches[v] ?? fill()), v * VOICE_PACKED);
  out[6 + 4096] = checksum(data);
  out[4103] = 0xf7;
  return out;
}
