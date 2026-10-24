// Every sound the keys can play, in picker order: modular racks first, then
// your DX7 patches and the factory voices. Used by the header picker and by
// the controller's "next / previous sound" pads.

import { PRESETS } from '../audio/dx7/presets';
import { RACK_PRESETS } from '../audio/rack/patch';
import { loadRack, rack, setInstrument } from './rackState';
import { store } from './store';
import { loadPatch, synth } from './synthState';

export interface Sound {
  /** 'r:' factory rack, 'ur:' saved rack, 'u:' saved DX7 patch, 'p:' factory DX7 voice */
  key: string;
  name: string;
  group: 'Modular' | 'Your racks' | 'Your patches' | 'DX7';
}

export function soundList(): Sound[] {
  const d = store.get();
  return [
    ...RACK_PRESETS.map((p) => ({ key: `r:${p.patch.name}`, name: p.patch.name, group: 'Modular' as const })),
    ...d.rack.user.map((p) => ({ key: `ur:${p.name}`, name: p.name, group: 'Your racks' as const })),
    ...d.synth.userPatches.map((p) => ({ key: `u:${p.name}`, name: p.name, group: 'Your patches' as const })),
    ...PRESETS.map((p) => ({ key: `p:${p.patch.name}`, name: p.patch.name, group: 'DX7' as const })),
  ];
}

/** Key of what is playing now, or '' when it is an edited sound that matches nothing saved. */
export function currentSound(): string {
  const d = store.get();
  if (d.settings.instrument === 'rack') {
    const name = rack.get().patch.name;
    if (d.rack.user.some((p) => p.name === name)) return `ur:${name}`;
    return RACK_PRESETS.some((p) => p.patch.name === name) ? `r:${name}` : '';
  }
  const name = synth.get().patch.name;
  if (d.synth.userPatches.some((p) => p.name === name)) return `u:${name}`;
  // DX7 names hold 10 characters, so a loaded "LESSON KEYS" reads back as "LESSON KEY"
  const factory = PRESETS.find((p) => p.patch.name.slice(0, 10) === name);
  return factory ? `p:${factory.patch.name}` : '';
}

export function chooseSound(key: string): void {
  const d = store.get();
  const [src, ...rest] = key.split(':');
  const name = rest.join(':');
  if (src === 'r' || src === 'ur') {
    const p = src === 'ur' ? d.rack.user.find((x) => x.name === name) : RACK_PRESETS.find((x) => x.patch.name === name)?.patch;
    if (!p) return;
    loadRack(p);
    setInstrument('rack');
    return;
  }
  const p = src === 'u' ? d.synth.userPatches.find((x) => x.name === name) : PRESETS.find((x) => x.patch.name === name)?.patch;
  if (!p) return;
  loadPatch(structuredClone(p));
  setInstrument('dx7');
}

export function stepSound(dir: number): void {
  const list = soundList();
  const i = list.findIndex((s) => s.key === currentSound());
  const next = list[(i < 0 ? 0 : i + dir + list.length) % list.length];
  if (next) chooseSound(next.key);
}
