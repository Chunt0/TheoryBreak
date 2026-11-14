// Registry of every drill. Everything is available from day one — the session
// planner uses spacing + weakness to choose, not prerequisites.

import { SIMPLE_INTERVAL_IDS } from '../theory/core';
import type { Area, GenContext, Question, Skill } from './types';
import { intervalEar, intervalSpell } from './gen/intervals';
import { chordName, chordPlay, chordSpell, scalePlay, shellPlay } from './gen/chords';
import {
  analysisQ, chordScaleQ, dimQ, guideToneQ, interchangeQ, keyCenterQ, keyChordsQ, melodicModesQ, relatedIiQ, secondaryQ, tritoneQ, ustQ,
} from './gen/jazz';
import { cadenceEar, chordEar, degreeEar, melodyEcho, progressionEar, rootMotionEar, scaleEar } from './gen/ear';
import { chromaticChordQ, figuredBassQ, voiceLeadingQ } from './gen/bach';
import { claveEar, rhythmEar, rhythmTap } from './gen/rhythm';
import { conceptQ } from './gen/concepts';
import { plrQ } from './gen/tonnetz';
import { SKILL_HELP } from './help';

type Gen = (ctx: GenContext) => Question;

const ALL_INTERVALS = SIMPLE_INTERVAL_IDS.filter((i) => i !== 'P1');
const COMPOUND = ['m9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13'];

const S = (id: string, name: string, area: Area, tags: Skill['tags'], desc: string, gen: Gen): Skill => ({ id, name, area, tags, desc, gen, ...SKILL_HELP[id] });

export const SKILLS: Skill[] = [
  // ---------------------------------------------------------------- ear
  S('ear.int', 'Intervals ↑', 'ear', ['ear'], 'All simple intervals, ascending.', intervalEar('ear.int', ALL_INTERVALS, ['asc'])),
  S('ear.int.desc', 'Intervals ↓', 'ear', ['ear'], 'All simple intervals, descending.', intervalEar('ear.int.desc', ALL_INTERVALS, ['desc'])),
  S('ear.int.harm', 'Harmonic intervals', 'ear', ['ear'], 'Dyads, simple and compound.', intervalEar('ear.int.harm', [...ALL_INTERVALS.filter((i) => i !== 'P8'), 'M9', 'M10', 'A11'], ['harm'])),
  S('ear.int.compound', 'Compound intervals', 'ear', ['ear'], '9ths through 13ths — the tensions.', intervalEar('ear.int.compound', COMPOUND, ['harm', 'asc'])),
  S('ear.chord.7', '7th-chord qualities', 'ear', ['ear'], 'maj7 · 7 · m7 · m7♭5 · °7 · m(maj7).', chordEar('ear.chord.7', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7'])),
  S('ear.chord.ext', 'Extended chords', 'ear', ['ear'], 'maj9 · m9 · 9 · 13 · 6/9 · m11 · 13sus4 · maj7♯11.', chordEar('ear.chord.ext', ['maj9', 'min9', 'dom9', 'dom13', '69', 'min11', '13sus4', 'maj7s11'])),
  S('ear.chord.alt', 'Dominant colours', 'ear', ['ear'], '7 · 7♭9 · 7♯9 · 7♯11 · 7alt · 7♭13 · 13♭9 · 7♯5.', chordEar('ear.chord.alt', ['dom7', '7b9', '7s9', '7s11', '7alt', '7b13', '13b9', 'aug7'])),
  S('ear.chord.inv', 'Triads & sus in inversion', 'ear', ['ear'], 'Quick warm-up: quality regardless of bass note.', chordEar('ear.chord.inv', ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'], true)),
  S('ear.degree', 'Scale degrees', 'ear', ['ear'], 'Diatonic degrees after a cadence.', degreeEar('ear.degree', 'diatonic')),
  S('ear.degree.chrom', 'Chromatic degrees', 'ear', ['ear'], 'All 12 degrees in context — ♭2, ♯4, ♭6, ♭7…', degreeEar('ear.degree.chrom', 'chromatic')),
  S('ear.degree.minor', 'Degrees in minor', 'ear', ['ear'], 'Degrees after a minor cadence.', degreeEar('ear.degree.minor', 'minor')),
  S('ear.motion', 'Root motion', 'ear', ['ear'], 'Hear the bass interval between chords.', rootMotionEar('ear.motion')),
  S('ear.prog.jazz', 'Jazz progressions', 'ear', ['ear'], 'ii–V–I, minor ii–V, turnarounds, rhythm bridge.', progressionEar('ear.prog.jazz', ['jazz'])),
  S('ear.prog.subs', 'Substitutions by ear', 'ear', ['ear'], 'Tritone sub, backdoor, Lady Bird, Coltrane.', progressionEar('ear.prog.subs', ['subs'])),
  S('ear.prog.soul', 'Soul & gospel progressions', 'ear', ['ear'], 'Neo-soul, gospel, R&B cadences.', progressionEar('ear.prog.soul', ['soul', 'funk'])),
  S('ear.prog.bach', 'Common-practice progressions', 'ear', ['ear'], 'Phrygian cadence, N6, Ger+6, lament, 5–6.', progressionEar('ear.prog.bach', ['bach'])),
  S('ear.cadence', 'Cadences', 'ear', ['ear'], 'PAC, plagal, half, Phrygian, deceptive, Picardy.', cadenceEar('ear.cadence')),
  S('ear.modes', 'Modes of major', 'ear', ['ear'], 'Seven modes over a drone.', scaleEar('ear.modes', ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'minor', 'locrian'])),
  S('ear.scales.jazz', 'Jazz scales', 'ear', ['ear'], 'Melodic-minor modes, diminished, whole tone, bebop.', scaleEar('ear.scales.jazz', ['melodic_minor', 'lydian_dom', 'altered', 'locrian_n2', 'mixolydian_b6', 'dim_hw', 'whole_tone', 'bebop_dom'])),
  S('ear.melody', 'Melodic dictation', 'ear', ['ear', 'keys'], 'Hear a line, play it back.', melodyEcho('ear.melody', 5, false)),
  S('ear.melody.bebop', 'Bebop line dictation', 'ear', ['ear', 'keys'], 'Lines ending with an enclosure.', melodyEcho('ear.melody.bebop', 6, true)),

  // ---------------------------------------------------------------- harmony gym
  S('gym.spell.7', 'Spell 7th chords', 'harmony', ['recall'], 'Any root, any 7th quality.', chordSpell('gym.spell.7', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7', 'maj7s5', '7b5'])),
  S('gym.spell.ext', 'Spell extended & altered', 'harmony', ['recall'], '9ths, 11ths, 13ths, altered dominants.', chordSpell('gym.spell.ext', ['maj9', 'min9', 'dom9', 'dom13', 'min11', 'maj7s11', '7b9', '7s9', '7alt', '13b9', '7b13', 'm9b5'])),
  S('gym.play.7', 'Play 7th chords', 'harmony', ['keys'], 'Grab any 7th chord on the keys.', chordPlay('gym.play.7', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7'])),
  S('gym.play.ext', 'Play extended chords', 'harmony', ['keys'], 'Grab 9ths, 13ths and altered dominants.', chordPlay('gym.play.ext', ['maj9', 'min9', 'dom9', 'dom13', '13sus4', 'min11', '7s9', '7alt', '7b9', 'maj7s11'])),
  S('gym.shells', 'Guide tones on the keys', 'harmony', ['keys'], 'Play only the 3rd + 7th.', shellPlay('gym.shells', ['maj7', 'dom7', 'min7', 'm7b5', 'mmaj7', 'maj6', 'min6'])),
  S('gym.name', 'Name the voicing', 'harmony', ['recall'], 'Read a voicing, name the chord.', chordName('gym.name', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mmaj7', 'maj9', 'min9', 'dom13', '7s9', '7alt', '13sus4'])),
  S('gym.int.spell', 'Spell intervals', 'harmony', ['recall'], 'Simple and compound, correct letters.', intervalSpell('gym.int.spell', ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'm9', 'M9', 'A9', 'P11', 'A11', 'm13', 'M13'])),
  S('gym.keys7', 'Diatonic 7ths (major)', 'harmony', ['recall'], 'Imaj7 … viiø7 in any key.', keyChordsQ('gym.keys7', 'major')),
  S('gym.keys7.harm', 'Harmonic-minor 7ths', 'harmony', ['recall'], 'im(maj7) iiø7 ♭IIImaj7♯5 iv7 V7 ♭VImaj7 vii°7.', keyChordsQ('gym.keys7.harm', 'harmonic')),
  S('gym.keys7.mel', 'Melodic-minor 7ths', 'harmony', ['recall'], 'The jazz-minor harmony.', keyChordsQ('gym.keys7.mel', 'melodic')),
  S('gym.scales.play', 'Play jazz scales', 'harmony', ['keys'], 'Modes, melodic-minor modes, symmetric scales.', scalePlay('gym.scales.play', ['dorian', 'lydian', 'mixolydian', 'phrygian', 'melodic_minor', 'lydian_dom', 'altered', 'locrian_n2', 'dim_hw', 'whole_tone', 'bebop_dom'])),
  S('gym.secondary', 'Secondary dominants', 'harmony', ['recall'], 'V7/x in any key, both directions.', secondaryQ('gym.secondary')),
  S('gym.plr', 'Tonnetz moves', 'harmony', ['recall'], 'P, L, R, two in a row, and N S H from any triad.', plrQ('gym.plr')),
  S('gym.interchange', 'Modal interchange', 'harmony', ['recall'], 'Which mode lends ♭VI, iv, ♭VII7, ♭II…', interchangeQ('gym.interchange')),

  // ---------------------------------------------------------------- jazz vocabulary
  S('jazz.tritone', 'Tritone substitution', 'jazz', ['recall'], 'subV7 in any key.', tritoneQ('jazz.tritone')),
  S('jazz.relatedii', 'Related ii & ii–Vs', 'jazz', ['recall'], 'Backcycling into any target, major or minor.', relatedIiQ('jazz.relatedii')),
  S('jazz.guide', 'Guide-tone motion', 'jazz', ['recall'], '7→3 and 3→7 through ii–V–I.', guideToneQ('jazz.guide')),
  S('jazz.chordscale', 'Chord–scale', 'jazz', ['recall'], 'The scale for any chord (and context).', chordScaleQ('jazz.chordscale')),
  S('jazz.mm', 'Melodic-minor modes', 'jazz', ['recall'], 'Altered, Lydian dominant, Locrian ♮2 — find the parent.', melodicModesQ('jazz.mm')),
  S('jazz.ust', 'Upper-structure triads', 'jazz', ['recall'], 'Triads over a dominant shell → tensions.', ustQ('jazz.ust')),
  S('jazz.dim', 'Diminished relationships', 'jazz', ['recall'], 'dim7 families, rootless 7♭9, passing °7.', dimQ('jazz.dim')),
  S('jazz.keycenter', 'Key centres', 'jazz', ['recall'], 'Read ii–Vs, name the target key.', keyCenterQ('jazz.keycenter')),
  S('jazz.analysis', 'Analyse jazz changes', 'jazz', ['recall'], 'Roman-numeral analysis of standards vocabulary.', analysisQ('jazz.analysis', ['jazz', 'subs'])),
  S('jazz.concepts', 'Jazz harmony concepts', 'jazz', ['recall'], 'Avoid notes, subs, backcycling, Coltrane.', conceptQ('jazz.concepts', ['jazz'])),
  S('jazz.bebop', 'Bebop & modal concepts', 'jazz', ['recall'], 'Enclosures, bebop scales, quartal harmony.', conceptQ('jazz.bebop', ['bebop', 'modal'])),

  // ---------------------------------------------------------------- funk / soul
  S('soul.analysis', 'Analyse soul & funk changes', 'soul', ['recall'], 'Neo-soul, gospel and funk progressions.', analysisQ('soul.analysis', ['soul', 'funk'])),
  S('soul.concepts', 'Funk & gospel concepts', 'soul', ['recall'], 'The One, ghost notes, IV/V, minor iv, planing.', conceptQ('soul.concepts', ['funk', 'soul'])),

  // ---------------------------------------------------------------- Bach
  S('bach.vl', 'Voice-leading errors', 'bach', ['recall'], 'Spot parallels, doubling and resolution problems.', voiceLeadingQ('bach.vl')),
  S('bach.figured', 'Figured bass', 'bach', ['recall'], '5/3, 6, 6/4, 7, 6/5, 4/3, 4/2.', figuredBassQ('bach.figured')),
  S('bach.chromatic', 'Chromatic predominants', 'bach', ['recall'], 'N6, It/Fr/Ger+6, vii°7/V.', chromaticChordQ('bach.chromatic')),
  S('bach.analysis', 'Analyse common practice', 'bach', ['recall'], 'Cadences and sequences in Roman numerals.', analysisQ('bach.analysis', ['bach'])),
  S('bach.concepts', 'Counterpoint & fugue', 'bach', ['recall'], 'Suspensions, invertible counterpoint, fugue.', conceptQ('bach.concepts', ['bach'])),

  // ---------------------------------------------------------------- rhythm
  S('rhythm.tap.16', 'Tap 16th rhythms', 'rhythm', ['rhythm'], '16th-note grid.', rhythmTap('rhythm.tap.16', 2)),
  S('rhythm.tap.sync', 'Tap syncopation', 'rhythm', ['rhythm'], 'Anticipations and pushes.', rhythmTap('rhythm.tap.sync', 3)),
  S('rhythm.tap.funk', 'Tap funk 16ths', 'rhythm', ['rhythm'], 'Off-beat e/a hits.', rhythmTap('rhythm.tap.funk', 5)),
  S('rhythm.tap.shuffle', 'Tap triplets / shuffle', 'rhythm', ['rhythm'], 'Triplet grid.', rhythmTap('rhythm.tap.shuffle', 4)),
  S('rhythm.ear.funk', 'Rhythmic dictation', 'rhythm', ['ear', 'rhythm'], 'Identify syncopated 16th patterns.', rhythmEar('rhythm.ear.funk', 5)),
  S('rhythm.clave', 'Clave & timelines', 'rhythm', ['ear', 'rhythm'], 'Son, rumba, bossa, tresillo.', claveEar('rhythm.clave')),
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill {
  const s = SKILL_BY_ID[id];
  if (!s) throw new Error(`Unknown skill ${id}`);
  return s;
}
