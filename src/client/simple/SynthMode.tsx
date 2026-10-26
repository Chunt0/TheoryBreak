// The Synth tab: the DX7 editor or the modular rack, whichever the keys play.

import { setInstrument } from '../app/rackState';
import { useStore } from '../app/store';
import { RackPage, RackToolbar } from '../ui/rack/RackPage';
import { SynthPage } from '../ui/pages/SynthPage';
import { Bar, Chips, type Choice } from './common';
import type { Help } from './Lessons';

const KINDS: Choice<'dx7' | 'rack'>[] = [
  { id: 'dx7', label: 'DX7 FM', title: 'Six-operator FM synth' },
  { id: 'rack', label: 'Modular', title: 'Patch your own synth from modules and cables' },
];

// the ? opens the lessons for whichever synth is up; the panel stays out of the way until asked for
const HELP: Record<'dx7' | 'rack', Help> = {
  rack: { topics: ['modular.voltage', 'modular.osc', 'modular.filter', 'modular.env', 'seq.step'] },
  dx7: { topics: ['fm.basics', 'fm.ratios', 'fm.envelopes', 'fm.algorithms'] },
};

export function SynthMode() {
  const instrument = useStore((d) => d.settings.instrument);
  return (
    <div className={`s-mode s-synth ${instrument}`}>
      <Bar help={HELP[instrument]}>
        <Chips label="Synth" value={instrument} options={KINDS} onChange={setInstrument} />
        {instrument === 'rack' ? <RackToolbar /> : null}
      </Bar>
      {instrument === 'rack' ? <RackPage /> : <SynthPage />}
    </div>
  );
}
