import { describe, expect, test } from 'bun:test';
import { CommandMatcher, commandLabel, encoderStep, defaultCommands, normalizeBindings } from '../src/client/midi/commands';

describe('controller commands', () => {
  test('encoder steps: binary offset and two’s complement', () => {
    expect(encoderStep(65)).toBe(1);
    expect(encoderStep(63)).toBe(-1);
    expect(encoderStep(1)).toBe(1);
    expect(encoderStep(127)).toBe(-1);
    expect(encoderStep(64)).toBe(0);
  });

  test('encoder click fires once per press, not on release', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(m.cc(115, 127, b, 0)).toEqual(['space']);
    expect(m.cc(115, 0, b, 50)).toEqual([]);
    expect(m.cc(115, 127, b, 100)).toEqual(['space']);
  });

  test('a quick spin of the encoder is one step', () => {
    const m = new CommandMatcher(220);
    const b = defaultCommands();
    expect(m.cc(114, 65, b, 0)).toEqual(['enter']);
    expect(m.cc(114, 66, b, 30)).toEqual([]);
    expect(m.cc(114, 65, b, 60)).toEqual([]);
    expect(m.cc(114, 65, b, 400)).toEqual(['enter']);
    expect(m.cc(114, 63, b, 410)).toEqual(['back']);
  });

  test('CCs no command uses pass through (null), so knobs still reach the synth', () => {
    expect(new CommandMatcher().cc(74, 100, defaultCommands(), 0)).toBeNull();
  });

  test('pad bank B holds the commands; bank A stays for answers', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(m.pad(8, b)).toBe('space');
    expect(m.pad(15, b)).toBe('soundNext');
    expect(m.pad(0, b)).toBeNull();
  });

  test('labels name the MiniLab control', () => {
    const b = defaultCommands();
    expect(commandLabel(b, 'space')).toBe('Click');
    expect(commandLabel(b, 'enter')).toBe('Turn ›');
    expect(commandLabel(b, 'back')).toBe('‹ Turn');
    expect(commandLabel(b, 'tabNext')).toBe('⇧ Turn ›');
    expect(commandLabel(b, 'soundNext')).toBe('Pad B8');
  });

  test('stored bindings: missing commands get defaults, junk is dropped', () => {
    const b = normalizeBindings({ space: [{ kind: 'press', cc: 20 }, null, 5], point: [] });
    expect(b.space).toEqual([{ kind: 'press', cc: 20 }]);
    expect(b.enter).toEqual(defaultCommands().enter);
  });

});

describe('MicroLab: pitch and mod strips (Hold is never used)', () => {
  const push = (m: CommandMatcher, b: ReturnType<typeof defaultCommands>, to: number, from: number, until: number) => {
    const fired = [...(m.bend(to, b, from) ?? [])];
    fired.push(...m.bendLong(b, until));
    fired.push(...(m.bend(0, b, until) ?? []));
    return fired;
  };

  test('quick push up = Space, long push up = Enter (not both)', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(push(m, b, 1, 0, 200)).toEqual(['space']);
    expect(push(m, b, 1, 1000, 1700)).toEqual(['enter']);
  });

  test('quick push down = Backspace, long push down = Esc', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(push(m, b, -1, 0, 150)).toEqual(['back']);
    expect(push(m, b, -1, 1000, 1700)).toEqual(['panic']);
  });

  test('the long action fires once per push', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    m.bend(1, b, 0);
    expect(m.bendLong(b, 300)).toEqual([]);
    expect(m.bendLong(b, 700)).toEqual(['enter']);
    expect(m.bendLong(b, 1400)).toEqual([]);
    expect(m.bend(0, b, 1500)).toEqual([]);
  });

  test('half-way pushes do nothing (the strip must go past half)', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(m.bend(0.4, b, 0)).toEqual([]);
    expect(m.bend(0, b, 100)).toEqual([]);
  });

  test('Hold (CC 64) is not a control by default', () => {
    expect(new CommandMatcher().cc(64, 127, defaultCommands(), 0)).toBeNull();
  });

  test('on the Synth tab the mod strip plays instead of pointing', () => {
    const m = new CommandMatcher();
    const b = defaultCommands();
    expect(m.slide(1, 100, b, false)).toBeNull();
    expect(m.slide(1, 127, b, true)).toBe(1);
  });

  test('labels name what a MicroLab has, and nothing it lacks', () => {
    const b = defaultCommands();
    expect(commandLabel(b, 'space', 'strips')).toBe('Pitch ↑');
    expect(commandLabel(b, 'enter', 'strips')).toBe('Pitch ↑ long');
    expect(commandLabel(b, 'back', 'strips')).toBe('Pitch ↓');
    expect(commandLabel(b, 'panic', 'strips')).toBe('Pitch ↓ long');
    expect(commandLabel(b, 'point', 'strips')).toBe('Mod strip');
    expect(commandLabel(b, 'tabNext', 'strips')).toBeNull();
  });
});
