import { useEffect, useState, useSyncExternalStore } from 'react';
import { audio, PART } from '../../audio/engine';
import { PRESETS, presetByName } from '../../audio/dx7/presets';
import { useMini } from '../../app/createStore';
import { live } from '../../app/live';
import { store, updateSettings, useStore } from '../../app/store';
import { startLearn, synth } from '../../app/synthState';
import { input } from '../../midi/input';
import { MAPPABLE, minilab3Defaults, type KnobMode } from '../../midi/mapping';
import { TAG_NAMES, type Tag } from '../../learn/library';

let monitorTick = 0;
const subscribe = (fn: () => void) =>
  input.on(() => {
    monitorTick++;
    fn();
  });

export function SettingsPage() {
  const settings = useStore((d) => d.settings);
  const mappings = useStore((d) => d.synth.mappings);
  const learn = useMini(synth, (s) => s.learn);
  const lastCc = useMini(live, (s) => s.lastCc);
  useSyncExternalStore(subscribe, () => monitorTick);
  useSyncExternalStore((fn) => input.onChange(fn), () => input.ports.length + input.status);
  const [calib, setCalib] = useState<string>('');

  useEffect(() => {
    input.pads.channel = settings.padChannel;
  }, [settings.padChannel]);

  const calibrate = async () => {
    await audio.init();
    const bpm = 90;
    const beat = 60 / bpm;
    const t0 = audio.now() + 0.3;
    const clicks = Array.from({ length: 12 }, (_, i) => t0 + i * beat);
    clicks.forEach((t, i) => audio.drum(i % 4 === 0 ? 'accent' : 'click', t));
    setCalib('Tap a pad (or space) on every click after the first four…');
    const taps: number[] = [];
    const off = input.on((e) => {
      if ((e.type === 'pad' && e.on) || e.type === 'noteon') taps.push(audio.perfToCtx(e.time));
    });
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        taps.push(audio.perfToCtx(e.timeStamp));
      }
    };
    window.addEventListener('keydown', key);
    setTimeout(() => {
      off();
      window.removeEventListener('keydown', key);
      const errs = taps
        .map((t) => {
          const near = clicks.slice(4).reduce((b, c) => (Math.abs(c - t) < Math.abs(b - t) ? c : b), clicks[4]);
          return t - near;
        })
        .filter((e) => Math.abs(e) < 0.2);
      if (errs.length < 4) return setCalib('Not enough taps — try again.');
      const mean = Math.round((errs.reduce((a, b) => a + b, 0) / errs.length) * 1000);
      updateSettings({ tapOffsetMs: mean });
      setCalib(`Offset set to ${mean} ms (${errs.length} taps).`);
    }, (clicks.length * beat + 0.8) * 1000);
  };

  const setMapping = (i: number, patch: Partial<(typeof mappings)[number]>) =>
    store.update((d) => {
      d.synth.mappings = d.synth.mappings.map((m, j) => (j === i ? { ...m, ...patch } : m));
    });

  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="grid two" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>MIDI</h3>
          <p className="small muted">
            Status: <strong>{input.status}</strong>{input.error ? ` — ${input.error}` : ''}. Web MIDI needs Chrome/Edge and a secure page (localhost or HTTPS).
          </p>
          {input.status !== 'ready' ? <button type="button" className="btn small" onClick={() => void input.requestMidi()}>Request MIDI access</button> : null}
          <div className="col" style={{ marginTop: 8 }}>
            {input.ports.map((p) => (
              <label key={p.id} className="row small" style={{ gap: 8 }}>
                <input type="checkbox" checked={!input.disabledPorts.has(p.id)} onChange={(e) => input.setPortEnabled(p.id, e.target.checked)} />
                {p.name} <span className="faint">{p.manufacturer} {p.connected ? '' : '(disconnected)'}</span>
              </label>
            ))}
            {!input.ports.length ? <span className="small faint">No MIDI inputs found.</span> : null}
          </div>
          <label className="field" style={{ marginTop: 10 }}>
            Pad channel (MiniLab 3 default 10; pads send notes 36–51)
            <select value={settings.padChannel} onChange={(e) => updateSettings({ padChannel: Number(e.target.value) })}>
              {Array.from({ length: 16 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
            </select>
          </label>
          <h4 style={{ marginTop: 14 }}>Monitor</h4>
          <div className="monitor">
            {input.monitor.slice(0, 16).map((m, i) => <div key={i}>{m.text} <span className="faint">· {m.port}</span></div>)}
            {!input.monitor.length ? <span className="faint">Play something…</span> : null}
          </div>
        </div>

        <div className="card">
          <h3>Knobs & faders → DX7</h3>
          <p className="small muted">Last CC: {lastCc ? `CC ${lastCc.cc} = ${lastCc.value} (ch ${lastCc.channel})` : '—'}. "Learn" then move a control. Endless-encoder (relative) modes are detected automatically.</p>
          <div className="table-wrap">
            <table className="t">
              <thead><tr><th>Control</th><th>CC</th><th>Target</th><th>Mode</th><th /></tr></thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={`${m.cc}-${i}`}>
                    <td>{m.control}</td>
                    <td className="mono">{m.cc}</td>
                    <td>
                      <select value={m.target} onChange={(e) => setMapping(i, { target: e.target.value })}>
                        {MAPPABLE.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={m.mode} onChange={(e) => setMapping(i, { mode: e.target.value as KnobMode })}>
                        <option value="absolute">absolute</option>
                        <option value="rel64">relative (64±)</option>
                        <option value="rel2c">relative (2's comp.)</option>
                      </select>
                    </td>
                    <td className="nowrap">
                      <button type="button" className={`btn small ${learn === m.target ? 'active' : ''}`} onClick={() => startLearn(m.target)}>Learn</button>
                      <button type="button" className="btn small ghost" onClick={() => store.update((d) => { d.synth.mappings = d.synth.mappings.filter((_, j) => j !== i); })}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <select defaultValue="" onChange={(e) => { if (e.target.value) startLearn(e.target.value); e.target.value = ''; }} aria-label="Learn a new mapping">
              <option value="" disabled>Learn new mapping for…</option>
              {MAPPABLE.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button type="button" className="btn small" onClick={() => store.update((d) => { d.synth.mappings = minilab3Defaults(); })}>Reset to MiniLab 3 defaults</button>
          </div>
          {learn ? <div className="banner" style={{ marginTop: 8 }}>Waiting for a control… <button type="button" className="btn small" onClick={() => startLearn(null)}>Cancel</button></div> : null}
        </div>

        <div className="card">
          <h3>Audio</h3>
          <label className="field">Master volume <input type="range" min={0} max={1} step={0.01} value={settings.masterVolume} onChange={(e) => { const v = Number(e.target.value); audio.setMaster(v); updateSettings({ masterVolume: v }); }} /></label>
          <label className="field">Reverb <input type="range" min={0} max={0.6} step={0.01} value={settings.reverb} onChange={(e) => { const v = Number(e.target.value); audio.setReverb(v); updateSettings({ reverb: v }); }} /></label>
          <label className="field">Metronome & drums <input type="range" min={0} max={1} step={0.01} value={settings.metronome} onChange={(e) => { const v = Number(e.target.value); audio.setMetronome(v); updateSettings({ metronome: v }); }} /></label>
          <label className="field">Lesson / ear-training sound
            <select value={settings.lessonPatch} onChange={(e) => { updateSettings({ lessonPatch: e.target.value }); audio.setPatch(PART.lesson, presetByName(e.target.value)); }}>
              {PRESETS.map((p) => <option key={p.patch.name} value={p.patch.name}>{p.patch.name}</option>)}
            </select>
          </label>
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" className="btn small" onClick={async () => { await audio.init(); audio.play([{ note: 60, start: 0, dur: 0.5 }, { note: 64, start: 0.1, dur: 0.5 }, { note: 67, start: 0.2, dur: 0.6 }]); }}>Test sound</button>
            <span className="small muted">Engine: {audio.state}{audio.ctx ? ` · ${audio.ctx.sampleRate} Hz · latency ≈ ${Math.round(audio.latency() * 1000)} ms` : ''}</span>
          </div>
        </div>

        <div className="card">
          <h3>Workout</h3>
          <label className="field">Default length
            <select value={settings.sessionMinutes} onChange={(e) => updateSettings({ sessionMinutes: Number(e.target.value) })}>
              {[5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <div className="small muted" style={{ marginTop: 8 }}>Focus</div>
          <div className="row">
            {(['core', 'jazz', 'funk', 'soul', 'bach', 'rhythm'] as Tag[]).map((t) => (
              <label key={t} className="small row" style={{ gap: 4 }}>
                <input type="checkbox" checked={settings.focusTags.includes(t)} onChange={(e) => {
                  const next = e.target.checked ? [...settings.focusTags, t] : settings.focusTags.filter((x) => x !== t);
                  if (next.length) updateSettings({ focusTags: next });
                }} /> {TAG_NAMES[t]}
              </label>
            ))}
          </div>
          <label className="small row" style={{ gap: 6, marginTop: 10 }}>
            <input type="checkbox" checked={settings.autoAdvance} onChange={(e) => updateSettings({ autoAdvance: e.target.checked })} /> Auto-advance after a correct answer
          </label>
          <h4 style={{ marginTop: 14 }}>Tap timing calibration</h4>
          <p className="small muted">Current offset: {settings.tapOffsetMs} ms. Calibrate once per setup (USB + audio latency differ).</p>
          <div className="row"><button type="button" className="btn small" onClick={() => void calibrate()}>Calibrate</button><span className="small">{calib}</span></div>
        </div>
      </div>
    </div>
  );
}
