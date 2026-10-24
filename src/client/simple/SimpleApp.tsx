// The practice app: one exercise at a time, one big keyboard, and the synths
// behind it all — the keys always play your current DX7 patch or modular rack.

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { audio } from '../audio/engine';
import { input } from '../midi/input';
import { COMMANDS, commandLabel, defaultCommands, triggerLabel, type Command } from '../midi/commands';
import { useMini } from '../app/createStore';
import { learnCommand, live, setLiveContext } from '../app/live';
import { go, href, useRoute } from '../app/router';
import { chooseSound, currentSound, soundList, stepSound, type Sound } from '../app/sounds';
import { updateSettings, useStore } from '../app/store';
import { rack, stopClocks } from '../app/rackState';
import { synth } from '../app/synthState';
import { detectChord } from '../theory/chords';
import { midiName } from '../theory/core';
import { Icon } from '../ui/Icon';
import { K, kb, releaseFocus, useControllerKind, useMidiConnected } from './common';
import { Piano } from './Piano';
import { ScalesMode } from './ScalesMode';
import { IntervalsMode } from './IntervalsMode';
import { ChordsMode } from './ChordsMode';
import { ProgressionsMode } from './ProgressionsMode';
import { KeysMode } from './KeysMode';
import { EarMode } from './EarMode';
import { ChangesMode } from './ChangesMode';
import { RhythmMode } from './RhythmMode';
import { ReadMode } from './ReadMode';
import { SynthMode } from './SynthMode';
import { Lessons } from './Lessons';
import { Backdrop } from '../ui/Backdrop';
import { resolveTheme, THEMES } from '../app/themes';

const MODES = [
  { id: 'scales', label: 'Scales', View: ScalesMode },
  { id: 'intervals', label: 'Intervals', View: IntervalsMode },
  { id: 'chords', label: 'Chords', View: ChordsMode },
  { id: 'progressions', label: 'Progressions', View: ProgressionsMode },
  { id: 'keys', label: 'Keys', View: KeysMode },
  { id: 'ear', label: 'Ear', View: EarMode },
  { id: 'changes', label: 'Changes', View: ChangesMode },
  { id: 'rhythm', label: 'Rhythm', View: RhythmMode },
  { id: 'read', label: 'Read', View: ReadMode },
  { id: 'synth', label: 'Synth', View: SynthMode },
];

let inputVersion = 0;
input.onChange(() => {
  inputVersion++;
});

// a phone or tablet with no keyboard: computer-key letters on the piano would only be clutter
const touchOnly = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches;

export function SimpleApp() {
  const route = useRoute();
  const mode = MODES.find((m) => m.id === route[0]) ?? MODES[0];
  const isSynth = mode.id === 'synth';
  useSyncExternalStore((fn) => input.onChange(fn), () => inputVersion);
  const audioState = useSyncExternalStore((fn) => audio.onState(fn), () => audio.state);
  const marks = useMini(kb, (k) => k.marks);
  const showKeys = useStore((d) => d.settings.showKeys);
  const midi = useMidiConnected();

  // on the Synth tab, pads select operators (or modules) and step voices
  useEffect(() => setLiveContext(isSynth ? 'synth' : 'learn'), [isSynth]);

  // Esc (or its controller button): all notes off, whatever is holding them
  useEffect(() => {
    const panic = () => {
      input.allNotesOff();
      audio.panic();
      if (audio.instrument === 'rack') stopClocks();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && panic();
    window.addEventListener('keydown', onKey);
    const off = input.on((e) => {
      if (e.type !== 'command') return;
      if (e.cmd === 'panic') panic();
      else if (e.cmd === 'tabPrev' || e.cmd === 'tabNext') {
        const i = MODES.indexOf(mode);
        go(MODES[(i + (e.cmd === 'tabNext' ? 1 : -1) + MODES.length) % MODES.length].id);
      } else if (e.cmd === 'soundPrev' || e.cmd === 'soundNext') stepSound(e.cmd === 'soundNext' ? 1 : -1);
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      off();
    };
  }, [mode]);

  const held = input.heldNotes();
  const chord = held.length >= 3 ? detectChord(held) : null;
  const midiIn = input.ports.find((p) => p.connected && !input.disabledPorts.has(p.id));

  return (
    <div className="s-app">
      <Backdrop />
      <header className="s-top">
        <nav className="s-tabs" aria-label="Mode">
          {MODES.map((m) => (
            <a key={m.id} href={href(m.id)} className={m === mode ? 'on' : ''} aria-current={m === mode ? 'page' : undefined}>{m.label}</a>
          ))}
        </nav>
        <div className="s-top-right">
          {audioState !== 'running' ? (
            <button type="button" className="s-sound-off" onClick={() => void audio.init()} title={audioState === 'error' ? audio.error : 'Sound starts on your first click or key press'}>
              <Icon name="mute" size={15} />
              <span>{audioState === 'error' ? 'Sound error' : 'Sound off'}</span>
            </button>
          ) : null}
          <SoundPicker />
          <FullscreenButton />
          <SoundSettings />
        </div>
      </header>

      <main className={`s-main ${isSynth ? 'wide' : ''}`}>
        <mode.View key={mode.id} />
      </main>

      <footer className={`s-dock ${midi ? 'midi' : ''} ${showKeys ? '' : 'folded'}`}>
        <div className="s-dock-info">
          <span className="s-legend">
            {midiIn ? (
              <>
                <button type="button" className="s-midi" popoverTarget="s-controls" title="Controller buttons — change what they do">● {midiIn.name}</button>
                <ControllerLegend />
              </>
            ) : (
              <>
                <span className="qw"><K>A</K> plays {midiName(input.qwertyStart)}</span>
                <span className="qw"><K>Z</K><K>X</K> octave</span>
                <span className="qw"><K>,</K><K>.</K> slide</span>
                <span className="qw"><K>Esc</K> silence</span>
                <button type="button" className="s-ctl-link" popoverTarget="s-controls">Controller…</button>
              </>
            )}
          </span>
          <span className="s-held" aria-live="polite">{chord ? chord.name : held.map((n) => midiName(n)).join(' ')}</span>
          <button type="button" className={`s-fold ${showKeys ? '' : 'off'}`} onClick={() => updateSettings({ showKeys: !showKeys })} aria-expanded={showKeys} title={showKeys ? 'Hide the on-screen keyboard (more room for the exercise)' : 'Show the on-screen keyboard'}>
            <span aria-hidden="true">{showKeys ? '▾' : '▴'}</span> {showKeys ? 'Hide keys' : 'Show keys'}
          </button>
        </div>
        {showKeys ? <Piano marks={marks} held={held} letters={midi || touchOnly ? {} : input.qwertyLabels()} onDown={(m) => input.screenNoteOn(m)} onUp={(m) => input.screenNoteOff(m)} /> : null}
      </footer>
      <ControllerSheet />
      <ThemeSheet />
      <Lessons />
    </div>
  );
}

/** What the controller's buttons do, in the dock. */
function ControllerLegend() {
  const controls = useStore((d) => d.settings.controls);
  const kind = useControllerKind() ?? 'encoder';
  const item = (cmd: Command, text: string) => {
    const l = commandLabel(controls, cmd, kind);
    return l ? <span><span className="kbd ctl">{l}</span> {text}</span> : null;
  };
  return kind === 'encoder' ? (
    <>
      {item('space', 'play · next')}
      {item('enter', 'next')}
      {item('back', 'back')}
      <span>Pads 1–8 answer</span>
      {item('tabNext', 'tabs')}
    </>
  ) : (
    <>
      {item('space', 'play · next · pick')}
      {item('enter', 'next key')}
      {item('point', 'points at an answer')}
      {item('back', 'back')}
    </>
  );
}

/** Which controller button does what, with learn: press Learn, then move the control. */
function ControllerSheet() {
  const controls = useStore((d) => d.settings.controls);
  const learning = useMini(live, (s) => s.learnCmd);
  const lastMsg = useMini(live, (s) => s.lastMsg);
  const midi = useMidiConnected();
  return (
    <div id="s-controls" popover="auto" className="s-pop s-ctl" onToggle={(e) => (e as unknown as ToggleEvent).newState === 'closed' && learning && learnCommand(null)}>
      <div className="s-ctl-head">
        <strong>Controller</strong>
        <span>
          {midi ? 'Press Learn, then press, turn, slide or hit the control you want.' : 'Plug in a MIDI controller (MiniLab 3 and MicroLab are set up already).'}{' '}
          On the practice tabs the pitch and mod strips are controls (quick or long push); on the Synth tab they bend and modulate. Hold is never used.
        </span>
      </div>
      <ul>
        {COMMANDS.map((c) => (
          <li key={c.id}>
            <span className="what">
              {c.label}
              {c.key ? <span className="kbd">{c.key}</span> : null}
            </span>
            <span className="how">
              {/* the MiniLab's Arturia and DAW modes send different CCs for the same control: one chip for both */}
              {[...new Set(controls[c.id].map(triggerLabel))].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="s-chip"
                  title="Remove"
                  onClick={() => updateSettings({ controls: { ...controls, [c.id]: controls[c.id].filter((x) => triggerLabel(x) !== label) } })}
                >
                  {label} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button type="button" className={`s-chip learn ${learning === c.id ? 'on' : ''}`} onClick={() => learnCommand(c.id)}>
                {learning === c.id ? 'Waiting…' : 'Learn'}
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="s-ctl-last">
        Last control received: <b>{lastMsg || 'nothing yet — press or move a control'}</b>
      </p>
      <button type="button" className="s-chip" onClick={() => updateSettings({ controls: defaultCommands() })}>Reset to defaults</button>
    </div>
  );
}

/** Pick what the keys play: modular racks, your DX7 patches and the factory voices. Edit it on the Synth tab. */
function SoundPicker() {
  // re-read whenever the patch, rack or saved lists change
  useMini(synth, (s) => s.patch.name);
  useMini(rack, (s) => s.patch.name);
  useStore((d) => `${d.settings.instrument}|${d.synth.userPatches.length}|${d.rack.user.length}`);
  const list = soundList();
  const known = currentSound();
  const name = useStore((d) => d.settings.instrument) === 'rack' ? rack.get().patch.name : synth.get().patch.name;
  const groups = list.reduce<Record<string, Sound[]>>((g, s) => ({ ...g, [s.group]: [...(g[s.group] ?? []), s] }), {});
  return (
    <label className="s-pill s-patch" title="The sound your keyboard plays (edit it on the Synth tab)">
      <Icon name="wave" size={15} />
      <select
        value={known}
        aria-label="Sound"
        onChange={(e) => {
          chooseSound(e.target.value);
          releaseFocus(e.currentTarget);
        }}
      >
        {known === '' ? <option value="">{name} (edited)</option> : null}
        {Object.entries(groups).map(([title, items]) => (
          <optgroup key={title} label={title}>
            {items.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/** Phones and tablets: hide the browser's bars and stay sideways. */
function FullscreenButton() {
  const [full, setFull] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  if (!document.fullscreenEnabled) return null;
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
      }
    } catch {
      /* not allowed here (desktop, or orientation lock unsupported): fullscreen alone is fine */
    }
  };
  return (
    <button type="button" className="s-icon-btn s-fs" onClick={() => void toggle()} aria-label={full ? 'Leave full screen' : 'Full screen'} title={full ? 'Leave full screen' : 'Full screen'}>
      <Icon name={full ? 'shrink' : 'expand'} size={16} />
    </button>
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
      <button type="button" className="s-icon-btn" popoverTarget="s-settings" aria-label="Settings" title="Sound, keys and theme">
        <Icon name="settings" size={17} />
      </button>
      <div id="s-settings" popover="auto" className="s-pop">
        <div className="s-pop-row">
          <span>Exercises play with</span>
          <div className="s-seg" role="radiogroup" aria-label="Exercise sound">
            <button type="button" role="radio" aria-checked={s.practiceSound === 'patch'} className={s.practiceSound === 'patch' ? 'on' : ''} onClick={() => updateSettings({ practiceSound: 'patch' })}>Your sound</button>
            <button type="button" role="radio" aria-checked={s.practiceSound === 'piano'} className={s.practiceSound === 'piano' ? 'on' : ''} onClick={() => updateSettings({ practiceSound: 'piano' })}>Practice piano</button>
          </div>
        </div>
        {slider('Volume', s.masterVolume, (v) => { updateSettings({ masterVolume: v }); audio.setMaster(v); })}
        {slider('Reverb', s.reverb, (v) => { updateSettings({ reverb: v }); audio.setReverb(v); })}
        {slider('Metronome', s.metronome, (v) => { updateSettings({ metronome: v }); audio.setMetronome(v); })}
        <div className="s-pop-row">
          <span>On-screen keys</span>
          <div className="s-seg" role="radiogroup" aria-label="On-screen keys">
            <button type="button" role="radio" aria-checked={s.showKeys} className={s.showKeys ? 'on' : ''} onClick={() => updateSettings({ showKeys: true })}>Show</button>
            <button type="button" role="radio" aria-checked={!s.showKeys} className={!s.showKeys ? 'on' : ''} onClick={() => updateSettings({ showKeys: false })}>Hide</button>
          </div>
        </div>
        <div className="s-pop-row">
          <span>Theme</span>
          <button type="button" className="s-chip" popoverTarget="s-theme">{s.theme === 'auto' ? 'Auto' : resolveTheme(s.theme).label}…</button>
        </div>
        <button type="button" className="s-chip" popoverTarget="s-controls">Controller buttons…</button>
        <span className="s-build">Build {process.env.BUILD_TIME ?? 'dev'}</span>
      </div>
    </>
  );
}

const BACKDROPS = [
  { id: 'theme', label: 'Theme', title: "The theme's own background: rain, petals, embers…" },
  { id: 'dots', label: 'Dots', title: 'A faint dot grid' },
  { id: 'off', label: 'Plain', title: 'Nothing behind the exercise' },
] as const;
const PATTERN_NAME: Record<string, string> = { none: 'a plain background', dots: 'a dot grid', rain: 'rain', synapse: 'a drifting network', embers: 'rising embers', petals: 'falling petals', constellations: 'constellations', 'perlin-flow': 'flowing lines', sparkles: 'sparkles' };

/** Every theme from the design kit, as swatches; the choice syncs like the other settings. */
function ThemeSheet() {
  const key = useStore((d) => d.settings.theme);
  const backdrop = useStore((d) => d.settings.backdrop);
  const shown = resolveTheme(key);
  const swatch = (t: (typeof THEMES)[number]) => ({ '--sw-bg': t.bg, '--sw-panel': t.panel, '--sw-fg': t.fg, '--sw-accent': t.accent }) as CSSProperties;
  return (
    <div id="s-theme" popover="auto" className="s-pop s-theme">
      <div className="s-ctl-head">
        <strong>Theme</strong>
        <span>{shown.label} pairs with {PATTERN_NAME[shown.pattern]}.{key === 'auto' ? ' Auto is Mono, light or dark with your system.' : ''}</span>
      </div>
      <div className="s-themes" role="radiogroup" aria-label="Theme">
        <button type="button" role="radio" aria-checked={key === 'auto'} className={key === 'auto' ? 'on' : ''} onClick={() => updateSettings({ theme: 'auto' })} title="Mono, light or dark with your system">
          <span className="s-sw auto"><i style={{ background: '#e06c75' }} /></span>
          <span className="nm">Auto</span>
        </button>
        {THEMES.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={key === t.key} className={key === t.key ? 'on' : ''} onClick={() => updateSettings({ theme: t.key })}>
            <span className="s-sw" style={swatch(t)}><i /></span>
            <span className="nm">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="s-pop-row">
        <span>Background</span>
        <div className="s-seg" role="radiogroup" aria-label="Background">
          {BACKDROPS.map((b) => (
            <button key={b.id} type="button" role="radio" aria-checked={backdrop === b.id} className={backdrop === b.id ? 'on' : ''} title={b.title} onClick={() => updateSettings({ backdrop: b.id })}>{b.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
