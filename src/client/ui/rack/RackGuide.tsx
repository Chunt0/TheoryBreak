// The rack's manual, in a side panel: the basics of patching, then one page per
// module — what it is, every knob and jack, and a patch to try. Opened by the
// ? on a module (at that module's page) or the Guide button.

import { useEffect, useRef } from 'react';
import { BASICS, GUIDE } from '../../audio/rack/guide';
import { MODULES, MODULE_LIST, type ModuleType } from '../../audio/rack/modules';
import { RACK_PRESETS } from '../../audio/rack/patch';
import { createStore, useMini } from '../../app/createStore';
import { addModule } from '../../app/rackState';
import { chooseSound } from '../../app/sounds';

type Topic = ModuleType | 'basics';

const guide = createStore<{ open: boolean; topic: Topic }>({ open: false, topic: 'basics' });

export const openGuide = (topic: Topic = 'basics'): void => guide.set({ open: true, topic });
const closeGuide = (): void => guide.set((g) => ({ ...g, open: false }));

const TOPICS: Topic[] = ['basics', ...MODULE_LIST.map((m) => m.type)];
const PRESET_NAMES = RACK_PRESETS.map((p) => p.patch.name);

/** The sequencer's 8 step knobs and 8 step lights read as one entry each. */
const paramLabel = (type: ModuleType, id: string, label: string): string =>
  type === 'seq' && id === 's0' ? 'Steps 1–8' : type === 'seq' && id === 'g0' ? 'Step lights' : label;

export function RackGuide() {
  const { open, topic } = useMini(guide, (g) => g);
  const el = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = el.current;
    if (!p) return;
    if (open && !p.matches(':popover-open')) p.showPopover();
    if (!open && p.matches(':popover-open')) p.hidePopover();
  }, [open]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    el.current?.querySelector(`[data-topic="${topic}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [topic, open]);

  const step = (d: number) => guide.set((g) => ({ ...g, topic: TOPICS[(TOPICS.indexOf(g.topic) + d + TOPICS.length) % TOPICS.length] }));

  return (
    <div
      ref={el}
      id="rk-guide"
      popover="auto"
      className="rk-guide"
      onToggle={(e) => (e as unknown as ToggleEvent).newState === 'closed' && closeGuide()}
      aria-label="Rack guide"
    >
      <div className="rk-g-head">
        <strong>Rack guide</strong>
        <span className="rk-g-step">
          <button type="button" onClick={() => step(-1)} aria-label="Previous page">‹</button>
          <button type="button" onClick={() => step(1)} aria-label="Next page">›</button>
          <button type="button" onClick={closeGuide} aria-label="Close guide">×</button>
        </span>
      </div>
      <nav className="rk-g-topics" aria-label="Guide pages">
        {TOPICS.map((t) => (
          <button key={t} type="button" data-topic={t} className={`${t === topic ? 'on' : ''} ${t === 'basics' ? '' : `fam-${MODULES[t].family}`}`} onClick={() => guide.set((g) => ({ ...g, topic: t }))}>
            {t === 'basics' ? 'Basics' : MODULES[t].name}
          </button>
        ))}
      </nav>
      <div className="rk-g-body" ref={body}>
        {topic === 'basics' ? <Basics /> : <ModulePage type={topic} />}
      </div>
    </div>
  );
}

function Basics() {
  return (
    <>
      <h2>How the rack works</h2>
      {BASICS.map((b) => (
        <section key={b.title}>
          <h3>{b.title}</h3>
          <p>{b.body}</p>
        </section>
      ))}
      <section>
        <h3>Where to start</h3>
        <p>Each factory rack is a lesson. Load one, play it, then pick its modules apart here.</p>
        <div className="rk-g-presets">
          {RACK_PRESETS.map((p) => (
            <button key={p.patch.name} type="button" className="s-chip" title={p.notes} onClick={() => chooseSound(`r:${p.patch.name}`)}>
              {p.patch.name}
            </button>
          ))}
        </div>
        <ul className="rk-g-notes">
          {RACK_PRESETS.map((p) => <li key={p.patch.name}><b>{p.patch.name}</b> — {p.notes}</li>)}
        </ul>
      </section>
    </>
  );
}

function ModulePage({ type }: { type: ModuleType }) {
  const def = MODULES[type];
  const g = GUIDE[type];
  const knobs = def.params.filter((p) => g.knobs[p.id]);
  // "Load MONO LEAD" in a step becomes a button
  const preset = g.tryIt.map((s) => PRESET_NAMES.find((n) => s.includes(`Load ${n}`))).find(Boolean);
  return (
    <>
      <h2 className={`fam-${def.family}`}>
        <span className="rk-g-name">{def.name}</span> {def.title}
      </h2>
      <p className="rk-g-what">{g.what}</p>
      {knobs.length ? (
        <section>
          <h3>Knobs</h3>
          <dl>
            {knobs.map((p) => (
              <div key={p.id}>
                <dt>{paramLabel(type, p.id, p.label)}</dt>
                <dd>{g.knobs[p.id]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {def.ins.length ? (
        <section>
          <h3>Inputs</h3>
          <dl>
            {def.ins.map((p) => (
              <div key={p.id}>
                <dt className="jack">{p.label}</dt>
                <dd>{g.ins[p.id]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {def.outs.length ? (
        <section>
          <h3>Outputs</h3>
          <dl>
            {def.outs.map((p) => (
              <div key={p.id}>
                <dt className="jack out">{p.label}</dt>
                <dd>{g.outs[p.id]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      <section>
        <h3>Try it</h3>
        <ol>
          {g.tryIt.map((s) => <li key={s}>{s}</li>)}
        </ol>
        {g.tip ? <p className="rk-g-tip">{g.tip}</p> : null}
        <div className="rk-g-presets">
          {preset ? <button type="button" className="s-chip" onClick={() => chooseSound(`r:${preset}`)}>Load {preset}</button> : null}
          <button type="button" className="s-chip" onClick={() => { addModule(type); closeGuide(); }}>+ Add a {def.name}</button>
        </div>
      </section>
    </>
  );
}
