// The Synth tab: the DX7 editor or the modular rack, whichever the keys play.

import { setInstrument } from '../app/rackState';
import { useStore } from '../app/store';
import { RackPage, RackToolbar } from '../ui/rack/RackPage';
import { SynthPage } from '../ui/pages/SynthPage';
import { Bar, Chips, type Choice } from './common';

const KINDS: Choice<'dx7' | 'rack'>[] = [
  { id: 'dx7', label: 'DX7 FM', title: 'Six-operator FM synth' },
  { id: 'rack', label: 'Modular', title: 'Patch your own synth from modules and cables' },
];

export function SynthMode() {
  const instrument = useStore((d) => d.settings.instrument);
  return (
    <div className={`s-mode s-synth ${instrument}`}>
      <Bar>
        <Chips label="Synth" value={instrument} options={KINDS} onChange={setInstrument} />
        {instrument === 'rack' ? <RackToolbar /> : null}
      </Bar>
      {instrument === 'rack' ? <RackPage /> : <SynthPage />}
    </div>
  );
}
