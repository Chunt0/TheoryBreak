# Music theory practice

A music-theory practice app and two synths in one — a DX7-style FM synth and a patch-cable modular rack. Every
exercise is played on a keyboard — your computer keys, the on-screen keys or a MIDI controller (Arturia MiniLab 3
or any other) — and the keyboard always plays your current sound. With a MiniLab plugged in, the whole app runs
from the controller: no computer keys or screen taps needed.

- **One thing at a time.** Five sections up top (Notes, Chords, Keys, Ear, Synth); the open one shows its drills beside its name and remembers the last one you used. One row of options (the finer ones folded into **More**), one exercise in the middle, one big keyboard at the bottom.
- **Theory, not technique.** Intermediate level, jazz / funk / R&B / Bach vocabulary.
- **Computer keys laid out like a piano.** The middle row plays white keys, the row above plays the black keys
  between them. The window follows the exercise, so the shape under your fingers matches the real keyboard.

## Run it (Docker)

```bash
docker compose up -d --build
# open http://localhost:7777 in Chrome or Edge
```

Progress is stored in the browser **and** in the `theory-break-data` volume (`/data/state.json`), so it
follows you between browsers that use the same server. Change the port with `HOST_PORT=8080 docker compose up -d`.

Plain Docker:

```bash
docker build -t theory-break .
docker run -d -p 7777:7777 -v theory-break-data:/data --name theory-break theory-break
```

### Using it from another machine (e.g. at work)

Web MIDI and AudioWorklet only run in a **secure context**: `http://localhost` or **HTTPS**.

- **Easiest:** run the container on the machine the MiniLab is plugged into and open `http://localhost:7777`.
- **Server at home, browser at work:** expose it over HTTPS, e.g. with Tailscale
  (`tailscale serve --bg 7777` → `https://<host>.<tailnet>.ts.net`), or a reverse proxy (Caddy/nginx) with a
  real certificate.
- **Built-in TLS:** mount a cert/key and set `TLS_CERT_FILE` / `TLS_KEY_FILE` (see `docker-compose.yml`).
  A self-signed certificate works after you accept the browser warning.
- If it's reachable beyond your own network, set `BASIC_AUTH=user:password`.

Browser support: Chrome / Edge (best), Firefox (Web MIDI behind a permission prompt). Safari has no Web MIDI —
the app still works there with the computer keyboard and on-screen keys.

### On a phone, sideways

The layout is built for a phone in landscape (it fits ~360 px of height): options scroll sideways in one row, the
question sits left of its answers, and the on-screen keys shrink when a controller is plugged in (**▾ Keys** folds
them away completely).

- Open it over HTTPS (Tailscale above is the easy way), then **Add to Home screen**: it opens full screen, stays
  in landscape and **works offline** — the files are cached, and progress syncs when the server is reachable again.
  In the browser, the ⛶ button in the header goes full screen.
- **MiniLab on the phone:** Android + Chrome, with a USB-C OTG adapter or cable. The screen stays on while you play.
- **iPhone / iPad:** no browser on iOS has Web MIDI, so the MiniLab can't connect there; the on-screen keys work.

## What's inside

| Section · drill | Exercises |
|---|---|
| **Notes · Scales** | 17 scales (major/minor, modes, Lydian ♭7, altered, diminished, whole tone, bebop, pentatonics, blues) in any key. Straight, in 3rds, in 4ths, groups of 4, diatonic triads or 7ths; 1–2 octaves; up, down or both (pattern, range and direction sit under **More**). *Notes shown* marks every key, *From memory* only the first note. Free time (best time per key) or with a metronome: one bar count-in, then a timing graph of every note and the tempo goes up after a clean, even run. The key strip under the title runs round the circle of fifths (like *Next key*) and dots the keys you have done. |
| **Notes · Intervals** | *Play it* (find the note on the keys), *Hear it* (name it), *Name it* (spell it: a minor 6th above E is C, not B♯). Up, down or together; basic, all 12, or jazz tensions (♭9 9 ♯9 11 ♯11 ♭13 13). |
| **Notes · Reading** | Notes on the treble, bass or grand staff (ledger lines and accidentals optional; name it or play it, timed), key signatures drawn on the staff, and chords stacked on the grand staff (triads or 7ths, inversions optional). |
| **Chords · Types** | *Build it* (triads, 7ths, 6ths/sus/add9, 9ths–13ths, altered dominants; root position, any voicing, or a named inversion with the right bass note), *Hear it* (name the quality), *In a key* (build the vi7 in E♭; minor keys borrow V7 and vii°7 from harmonic minor). |
| **Chords · Progressions** | *Name the chords* (hear a progression in a random key, give each chord as a Roman numeral: I IV V vi, all triads, diatonic 7ths, minor, secondary dominants, borrowed chords, tritone subs) and *Name the progression* (ii–V–I, backdoor, Lady Bird, Coltrane cycle, "Just the Two of Us", Dorian vamps, Phrygian cadence, lament bass… comped in the style they come from, then explained). |
| **Chords · Changes** | A rhythm section (swing, funk, ballad, bossa) loops one of 32 progressions in six groups: jazz (ii–Vs, turnarounds, rhythm changes, passing diminished, line cliché), blues (12-bar, jazz, minor, Bird), substitutions (tritone, chromatic ii–Vs, Lady Bird, Coltrane, backdoor), modal & Latin (So What, sus, Andalusian, bossa), soul & funk, and gospel. Every note you play is scored against the chord sounding: *Guide tones* (a 3rd or 7th on every chord), *Beat 1* (a chord tone on each change), *Guide-tone line* (3rds and 7ths moving by step). Pick a key or leave it on Any; with a key picked, Enter moves it up a 4th, so you can take a progression round all 12. Each progression has a note on what to listen for. A run lasts about ten bars, or 1–16 times round the form, or nonstop; Stop scores the chords played so far. Targets can be shown on the keys or hidden, even mid-run. |
| **Keys · Signatures** | Key ↔ signature, relative major/minor, spelling scale degrees ("submediant of A♭ major") and modes ("E♭ Dorian: which signature?"), with a circle of fifths and the key's scale on the keyboard. |
| **Keys · Circle** | Scale degrees on the circle of fifths, each its own colour round the rainbow (tonic red, 5 orange, 2 yellow … the flats cool), with the tonic on top. Whatever you play lights its degree and the centre shows the degrees sounding; the keyboard's marks wear the same colours. A drone (Off · 1 · 1 + 5; level in ⚙) gives the ear an anchor, follows the key, and makes the tonic breathe. **Info** adds the circle-of-fifths detail: note names, the triad or 7th chord on each degree (tap to play), chord shapes, the scale's arc, C-on-top view and words. *Explore* (Space drone, Enter / ⌫ move the key a 5th), *Find* (play the degree named, or the one you hear; tap the centre to hear again or reveal), *Walk* (every root round the circle in 4ths or 5ths and home, timed). |
| **Keys · Tonnetz** | The Tonnetz: the twelve notes on a triangular lattice, right a 5th, up-right a major 3rd, down-right a minor 3rd, so every up-triangle is a major triad, every down-triangle a minor one, and neighbours share two notes. Notes wear the Circle tab's degree colours; *Names* spells them by where they sit (sharps up and to the right, flats down and to the left, so G♯ and A♭ are both on the chart, three rows apart), or all *Sharps*, all *Flats*, or as *Degrees*. The scale's triads are tinted (a major key is a strip of six triangles). Whatever you play lights its notes, the 5ths and 3rds between them and every triad inside it (Cmaj7 lights C and Em), and a trail follows your last chords. **Info** adds chord names on the triangles, what stays and what moves between chords ("C A stay · E → F"), buttons that apply P, L, R, N, S or H to the last chord, and a legend. Tap a note or a triangle to play it. *Explore* (Space drone, Enter / ⌫ move the key a 5th), *Move* (a triad and a move — P L R, two moves, N S H or all — play where it lands, by name or by ear; hold the notes that stay and move one finger), *Cycle* (P L hexatonic, P R octatonic, or all 24 triads in falling or rising 5ths, timed). |
| **Ear · Melody** | Hearing in a key: a cadence sets the key, then *Degrees* (name or play the scale degree of a note; major, minor or chromatic), *Echo* (play back a 3–6 note line; chromatic lines end with an enclosure), *Bass line* (play back the bass under real progressions, line clichés and passing diminished chords included), *Cadences* (authentic, plagal, half, deceptive, Phrygian, Picardy, backdoor, tritone sub). |
| **Ear · Rhythm** | *Tap it* (read a bar on the counting grid and tap it twice through: hits, extras, how early or late and how even), *Hear it* (pick the bar you heard from four), *Clave* (son, rumba, bossa, tresillo). 16ths, syncopation, triplets/shuffle, funk 16ths. |
| **Synth · DX7 FM** | The DX7 Lab: 6-operator FM engine in an AudioWorklet (Dexed-derived envelope, scaling, LFO and feedback maths; all 32 algorithms), clickable algorithm charts, draggable envelopes, keyboard-scaling curves, operator meters, scope/spectrum, undo/redo, 17 original voices, **Save** to your own bank, `.syx` import/export (32-voice banks and single voices). Fits a 720-pixel-high window: algorithm on the left, the six operators and the selected one's envelope / frequency / scaling pages in the middle, voices, LFO, pitch EG and play settings on the right. |
| **Synth · Modular** | A Eurorack-style rack with 53 modules. **Sources:** MIDI→CV, VCO, wavetable, FM pair, plucked string, noise + S&H. **Drums:** kick, snare, hats. **Modulation:** LFO, ADSR, function generator (envelope / looping LFO / slew), random. **Clocks & sequencing:** clock, 16-step sequencer, Turing machine, Euclidean rhythms, divider, Bernoulli gate, sequential switch, arpeggiator. **Filters & shapers:** state-variable, ladder, low-pass gate, comb, formant (vowel), ring mod, wavefolder. **Effects:** delay, reverb, chorus/flanger, phaser, overdrive, bitcrusher; and a granular looper after the Hologram Microcosm pedal, following its manual (11 effects × 4 variations: micro loops, granules, glitches, multi-tap delays; Activity, Repeats and the four-zone Shape as the pedal's macro knobs; tempo from a knob, tap or clock in its six subdivisions; then pitch modulation, four reverbs with echo, and a resonant filter in the pedal's order; EXP input; Hold sampler; and a 60-second looper with overdub, undo, ¼–4× speed, reverse, fades, Pre-FX, Burst, Looper only and Quantize); and a two-channel micro-looper after the Chase Bliss MOOD MKII, following its manual (a Wet Channel of Reverb, Delay and Slip; an always-listening Micro-Looper in Env, Tape and Stretch; both at the sample rate the Clock knob sets, 64 kHz down to 2 kHz in harmonized steps; routing between them; footswitches on its screen, tap to switch and hold to freeze or overdub; the hidden options; the dip switches Spread, Classic, Smooth, Trails, Latch, No dub and Dry kill; ramping; EXP and gate jacks). **Utility:** chord generator (any quality, or the diatonic chord of a key), quantizer, attenuverter/offset, logic, crossfader, panner, mixer, VCA, out. **Scopes & meters:** oscilloscope; spectrum analyser (log scale with the Cs marked, names the fundamental and numbers its harmonics); spectrogram; XY scope (Lissajous figures, names the interval between X and Y and its distance in cents from the pure ratio); tuner and pitch tracker (note and cents from audio or a V/Oct cable, with V/Oct and gate out); keyboard display (lights every voice and names the chord); piano roll; four-channel voltmeter. Drag a cable from an output (dark plate) to an input, or tap one then the other; tap a patched input to unplug it. Cables are polyphonic (up to 8 voices). 20 factory racks (drum machine, Turing bass, diatonic 7ths, arpeggio through a low-pass gate, harp, talk box, FM bells, three that show the display modules: harmonics, Lissajous, chord view, and two through the granular looper: micro loops, glitch seq; two through the micro-looper: mood loops, slip fifths…), undo/redo, and your own saved racks. A **guide** (the **?** on any module, or *Guide*) explains patching basics and every module's knobs and jacks, with a patch to try. On a tall window the rack becomes a two-row case (the modules split evenly in order; ↑/↓ on a selected module moves it between rows). |

Every drill remembers each answer per item and leans new questions toward what you miss. Tap the ✓/✗ score for
the drill's weak spots, a **Weak spots** switch (ask mostly what you miss, everywhere) and, once a level is down,
an ↑ to the next one (or a step back when most recent answers are misses). The **?** opens the lessons for the drill, and from there all 87: six theory categories (core harmony, jazz, funk, R&B/gospel, Bach & counterpoint, rhythm) and three synth ones (modular synthesis, sequencing, FM synthesis), each a path from basics to advanced, with a Next button to follow the path. Each lesson is a proper read of five to ten minutes: why the idea matters, headed sections that build it up, worked examples and demos you can hear, a Try it note and a short recap to come back to. They live one file each in `src/client/learn/library/lessons/<category>/`, and a category's `index.ts` list is its path. The Synth tab stays a plain instrument until you press its **?**: the synth lessons' demos are rendered offline with the real rack and DX7 engines, so each one plays its variants and draws their waveform and spectrum without touching your patch, and **Open in rack / DX7** loads the one you heard (undo brings yours back).

The **Sound** menu in the header switches between modular racks, factory DX7 voices and your saved patches; ⚙
chooses whether exercises play back with your sound or a plain practice piano, and sets volume, reverb and
metronome level. Your choices, records, patches and racks are saved locally and synced to the server.

**Themes.** The look comes from the design kit in `putty-ai-design/`: near-greyscale surfaces, one accent, Inter and
Fira Code, borders over shadows. ⚙ → *Theme…* picks any of its 18 themes (Mono, Mono light, Original, Light,
Midnight, Paper, Cyberpunk, Retrowave, Forest, Ocean, Ume, Copper, Terminal, Organs, Lavender, GPT, Claude, Cute) or
**Auto** (Mono, light or dark with the system). *Background* shows the theme's own moving background (rain, petals,
embers, a drifting network, constellations, flowing lines, sparkles), the kit's dot grid, or nothing; it holds still
when the system asks for reduced motion. Right and wrong keep green and red in every theme. The colours live in
`src/client/themes.css`, generated from the kit by `bun scripts/themes.ts`.

## Playing on the computer keyboard

The letters are printed on the on-screen keys, and a bar under the keyboard shows the stretch they reach.

| Keys | Does |
|---|---|
| `A S D F G H J K L ; '` | white keys |
| `Q W E R T Y U I O P [ ]` | the black keys between them (only where a piano has one) |
| `Z` / `X` | window down / up an octave |
| `,` / `.` | slide the window down / up one white key |
| `Space` | replay the question · start the metronome count-in · next question once answered |
| `Enter` | next question / next key |
| `1`–`8` | pick a multiple-choice answer (same as pads 1–8) |
| `Backspace` | restart the scale · clear the chord you are building · take back a numeral |
| `Esc` | all notes off (panic) |

Scales and intervals start the window on the root: a white root on `A`, a black root on `W`. Chords are built
note by note (any order; any octave unless an inversion is asked for), so key rollover never gets in the way.

## Arturia MiniLab 3

Every computer-key command has a MiniLab control, so you can practise with the controller alone. The buttons
on screen show the control (**Next `Click`**, **Next key `Turn ›`**) while it is plugged in.

| Control | Practice tabs | Synth tab (DX7) | Synth tab (Modular) |
|---|---|---|---|
| Keys, pitch / mod strips, sustain | play and answer | play | play (MIDI module: V/Oct, Gate, Mod…) |
| Main encoder **click** (CC 115) | `Space`: hear it · start · next once answered | — | — |
| Main encoder **turn ›** / **‹ turn** (CC 114) | `Enter` next question · next key / `Backspace` restart · clear | — | select next / previous module |
| **Shift + click** (CC 113) | `Esc`: silence (and stop a rack's clocks) | same | same |
| **Shift + turn** (CC 112) | previous / next tab | same | same |
| Pads 1–8, bank A (ch 10, notes 36–43) | pick answers 1–8 | 1–6 select operator, 7/8 prev/next voice | select modules 1–8 |
| Pads 1–8, bank B (Shift + pad 2; notes 44–51) | Space · Enter · Backspace · Esc · prev tab · next tab · prev sound · next sound | same | same |
| Knobs 1–8 (CC 74 71 76 77 93 18 19 16) | turn your current sound's knobs | OP1–6 level, feedback, algorithm | the selected module's knobs 1–8 |
| Faders 1–4 (CC 82 83 85 17) | | selected op coarse, fine, attack, release | the selected module's knobs 9–12 |

### Arturia MicroLab (mk3) and other keyboards without an encoder or pads

A MicroLab's Shift + key combinations only change its own MIDI channel and send nothing, and Hold stays as it
is. So on the practice tabs the pitch strip works as four buttons and the mod strip points at answers:

| MicroLab | Does |
|---|---|
| Pitch strip, **quick push up** | `Space`: hear it · start · next once answered — or picks the answer the mod strip points at |
| Pitch strip, **long push up** (keep it there ~½ s) | `Enter`: next question · next key |
| Pitch strip, **quick push down** | `Backspace`: restart · clear · undo |
| Pitch strip, **long push down** | `Esc`: silence |
| **Mod strip** | points at an answer (bottom = first): multiple choice, the note-spelling grid, key signatures |

On the Synth tab both strips bend and modulate as usual. Any other keyboard with pitch and mod wheels works the
same way. ⚙ shows the build time, so you can check a phone is running the latest version.

The DAW-mode CCs (encoder 28/118, Shift 29/119) work too. To change any of it, click the controller's name in
the dock (or ⚙ → *Controller buttons…*), press **Learn** next to a command and press, turn or hit the control.
DX7 knobs MIDI-learn by right-click. Endless-encoder (relative) knob modes are detected automatically.

## Development

```bash
bun install
bun run dev        # rebuilds the client on change, serves on http://localhost:7777
bun test           # theory, DX7 + modular DSP, sysex, controller commands, generators, planner, content checks
bun run typecheck  # tsc --noEmit
bun run build && bun run start
```

Layout: `src/client/theory` (spelled notes, chords, scales, keys, progressions, voicing),
`src/client/audio` (DX7 DSP, modular `rack/` modules and DSP, worklets, engine), `src/client/learn` (generators,
skills, library, planner, SRS), `src/client/midi` (input, controller commands, CC mapping), `src/client/simple`
(the app: header, the tabs, the keyboard dock), `src/client/ui` (DX7 Lab, the rack and shared components), `src/client/fonts` (Inter, Fira Code and the accidentals; `scripts/fit-music-font.py` says how they were made),
`src/server` (Bun server + sync API).
