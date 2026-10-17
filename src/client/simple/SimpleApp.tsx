// The practice app: one exercise at a time, one big keyboard, and the DX7
// synth behind it all — the keys always play your current patch.

import { useEffect, useSyncExternalStore } from 'react';
import { audio } from '../audio/engine';
import { PRESETS } from '../audio/dx7/presets';
import { input } from '../midi/input';
import { useMini } from '../app/createStore';
import { setLiveContext } from '../app/live';
import { href, useRoute } from '../app/router';
import { updateSettings, useStore } from '../app/store';
import { loadPatch, synth } from '../app/synthState';
import { detectChord } from '../theory/chords';
import { midiName } from '../theory/core';
import { Icon } from '../ui/Icon';
import { SynthPage } from '../ui/pages/SynthPage';
import { K, kb, releaseFocus } from './common';
import { Piano } from './Piano';
import { ScalesMode } from './ScalesMode';
import { IntervalsMode } from './IntervalsMode';
import { ChordsMode } from './ChordsMode';
import { ProgressionsMode } from './ProgressionsMode';
import { KeysMode } from './KeysMode';

const MODES = [
  { id: 'scales', label: 'Scales', View: ScalesMode },
  { id: 'intervals', label: 'Intervals', View: IntervalsMode },
  { id: 'chords', label: 'Chords', View: ChordsMode },
  { id: 'progressions', label: 'Progressions', View: ProgressionsMode },
  { id: 'keys', label: 'Keys', View: KeysMode },
  { id: 'synth', label: 'Synth', View: SynthPage },
];

let inputVersion = 0;
input.onChange(() => {
  inputVersion++;
});

export function SimpleApp() {
  const route = useRoute();
  const mode = MODES.find((m) => m.id === route[0]) ?? MODES[0];
  const isSynth = mode.id === 'synth';
  useSyncExternalStore((fn) => input.onChange(fn), () => inputVersion);
  const audioState = useSyncExternalStore((fn) => audio.onState(fn), () => audio.state);
  const marks = useMini(kb, (k) => k.marks);

  // on the Synth tab, pads select operators and step voices
  useEffect(() => setLiveContext(isSynth ? 'synth' : 'learn'), [isSynth]);

  // Esc: all notes off, whatever is holding them
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      input.allNotesOff();
      audio.panic();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const held = input.heldNotes();
  const chord = held.length >= 3 ? detectChord(held) : null;
  const midiIn = input.ports.find((p) => p.connected && !input.disabledPorts.has(p.id));

  return (
    <div className="s-app">
      <header className="s-top">
        <a className="s-brand" href={href('scales')}>
          <span className="s-logo" aria-hidden="true"><Icon name="note" size={14} /></span>
          <span className="t">Theory Break</span>
        </a>
        <nav className="s-tabs" aria-label="Mode">
          {MODES.map((m) => (
            <a key={m.id} href={href(m.id)} className={m === mode ? 'on' : ''} aria-current={m === mode ? 'page' : undefined}>{m.label}</a>
          ))}
        </nav>
        <div className="s-top-right">
          {audioState !== 'running' ? (
            <button type="button" className="s-sound-off" onClick={() => void audio.init()} title={audioState === 'error' ? audio.error : 'Sound starts on your first click or key press'}>
              <Icon name="mute" size={15} />
              {audioState === 'error' ? 'Sound error' : 'Sound off'}
            </button>
          ) : null}
          <SoundPicker />
          <SoundSettings />
        </div>
      </header>

      <main className={`s-main ${isSynth ? 'wide' : ''}`}>
        <mode.View key={mode.id} />
      </main>

      <footer className="s-dock">
        <div className="s-dock-info">
          <span className="s-legend">
            <span><K>A</K> plays {midiName(input.qwertyStart)}</span>
            <span><K>Z</K><K>X</K> octave</span>
            <span><K>,</K><K>.</K> slide</span>
            <span><K>Esc</K> silence</span>
            {midiIn ? <span className="s-midi" title="MIDI input">● {midiIn.name}</span> : null}
          </span>
          <span className="s-held" aria-live="polite">{chord ? chord.name : held.map((n) => midiName(n)).join(' ')}</span>
        </div>
        <Piano marks={marks} held={held} letters={input.qwertyLabels()} onDown={(m) => input.screenNoteOn(m)} onUp={(m) => input.screenNoteOff(m)} />
      </footer>
    </div>
  );
}

/** Pick the patch the keyboard plays: factory voices and your saved bank. Edit it on the Synth tab. */
function SoundPicker() {
  const current = useMini(synth, (s) => s.patch.name);
  const user = useStore((d) => d.synth.userPatches);
  const choose = (v: string) => {
    const src = v.slice(0, 1);
    const name = v.slice(2);
    const p = src === 'u' ? user.find((x) => x.name === name) : PRESETS.find((x) => x.patch.name === name)?.patch;
    if (p) loadPatch(structuredClone(p));
  };
  const known = user.some((p) => p.name === current) ? `u:${current}` : PRESETS.some((p) => p.patch.name === current) ? `p:${current}` : '';
  return (
    <label className="s-pill s-patch" title="The sound your keyboard plays (edit it on the Synth tab)">
      <Icon name="wave" size={15} />
      <select
        value={known}
        aria-label="Sound"
        onChange={(e) => {
          choose(e.target.value);
          releaseFocus(e.currentTarget);
        }}
      >
        {known === '' ? <option value="">{current} (edited)</option> : null}
        {user.length ? (
          <optgroup label="Your patches">
            {user.map((p) => <option key={p.name} value={`u:${p.name}`}>{p.name}</option>)}
          </optgroup>
        ) : null}
        <optgroup label="Factory">
          {PRESETS.map((p) => <option key={p.patch.name} value={`p:${p.patch.name}`}>{p.patch.name}</option>)}
        </optgroup>
      </select>
    </label>
  );
}

function SoundSettings() {
  const s = useStore((d) => d.settings);
  const slider = (label: string, value: number, set: (v: number) => void) => (
    <label className="s-slider">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  return (
    <>
      <button type="button" className="s-icon-btn" popoverTarget="s-settings" aria-label="Sound settings" title="Sound settings">
        <Icon name="settings" size={17} />
      </button>
      <div id="s-settings" popover="auto" className="s-pop">
        <div className="s-pop-row">
          <span>Exercises play with</span>
          <div className="s-seg" role="radiogroup" aria-label="Exercise sound">
            <button type="button" role="radio" aria-checked={s.practiceSound === 'patch'} className={s.practiceSound === 'patch' ? 'on' : ''} onClick={() => updateSettings({ practiceSound: 'patch' })}>Your patch</button>
            <button type="button" role="radio" aria-checked={s.practiceSound === 'piano'} className={s.practiceSound === 'piano' ? 'on' : ''} onClick={() => updateSettings({ practiceSound: 'piano' })}>Practice piano</button>
          </div>
        </div>
        {slider('Volume', s.masterVolume, (v) => { updateSettings({ masterVolume: v }); audio.setMaster(v); })}
        {slider('Reverb', s.reverb, (v) => { updateSettings({ reverb: v }); audio.setReverb(v); })}
        {slider('Metronome', s.metronome, (v) => { updateSettings({ metronome: v }); audio.setMetronome(v); })}
      </div>
    </>
  );
}
