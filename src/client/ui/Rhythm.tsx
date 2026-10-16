import { audio, PART } from '../audio/engine';
import { countLabels, type RhythmPattern } from '../theory/rhythm';
import type { Tone } from '../learn/types';

export function RhythmGrid({ pattern, marks, now, hideOnsets = false }: { pattern: RhythmPattern; marks?: Record<number, Tone>; now?: number; hideOnsets?: boolean }) {
  const labels = countLabels(pattern);
  const perBeat = pattern.steps / pattern.beatsPerBar;
  return (
    <div className="rg" style={{ gridTemplateColumns: `repeat(${pattern.steps}, minmax(0, 1fr))` }}>
      {labels.map((l, i) => {
        const on = !hideOnsets && pattern.onsets.includes(i);
        const mark = marks?.[i];
        const cls = ['cell', i % perBeat === 0 ? 'beat' : '', mark ? mark : on ? 'on' : '', now === i ? 'now' : ''].join(' ');
        return (
          <div key={i} className={cls}>
            {l}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Schedule a count-in (4 clicks) followed by one bar with metronome clicks
 * and, optionally, the pattern itself. Returns the AudioContext time of the
 * downbeat of the pattern bar.
 */
export async function playRhythm(pattern: RhythmPattern, bpm: number, opts: { countIn?: boolean; withPattern?: boolean } = {}): Promise<{ barStart: number; barLength: number }> {
  await audio.init();
  audio.stop();
  const beat = 60 / bpm;
  const t0 = audio.now() + 0.12;
  const countIn = opts.countIn !== false;
  const barStart = t0 + (countIn ? 4 * beat : 0);
  if (countIn) for (let b = 0; b < 4; b++) audio.drum(b === 0 ? 'accent' : 'click', t0 + b * beat);
  for (let b = 0; b < pattern.beatsPerBar; b++) audio.drum(b === 0 ? 'accent' : 'click', barStart + b * beat, 0.6);
  if (opts.withPattern !== false) {
    const step = (beat * pattern.beatsPerBar) / pattern.steps;
    for (const o of pattern.onsets) {
      const at = barStart + o * step;
      audio.noteOn(PART.lesson, 84, 100, at);
      audio.noteOff(PART.lesson, 84, at + Math.min(0.12, step * 0.9));
    }
  }
  audio.drum('accent', barStart + pattern.beatsPerBar * beat, 0.5);
  return { barStart, barLength: pattern.beatsPerBar * beat };
}
