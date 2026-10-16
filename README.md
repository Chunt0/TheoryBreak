# Theory Break

Music-theory workouts for your 15-minute break, driven by an **Arturia MiniLab 3**, plus **DX7 Lab** — a
DX7-style FM synth with an editor you can actually use.

- **Theory, not technique.** Intermediate level. Jazz, funk, R&B/gospel and Bach/common-practice vocabulary.
- **Jump in anywhere.** Nothing is locked. A library of dense reference topics, a gym of 58 drill types, and a
  planner that builds a 15-minute session from what's due, what's weak and what you haven't tried.
- **Computer keys or MIDI.** Everything works from the computer keyboard (piano layout on A–', digits 1–8 as
  pads, Enter/Space to move on). Plug in a MIDI keyboard — MiniLab 3 or any other — and it is picked up
  automatically: keys answer "play this chord/line" drills, pads answer and tap rhythms, knobs drive the synth.

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

## The 15-minute workout

| Block | ≈ time | What happens |
|---|---|---|
| Ear warm-up (or Groove) | 3 min | Chord qualities, intervals, scale degrees, progressions — or 16th-note tapping |
| Harmony gym | 4 min | Fast recall: tritone subs, related ii's, chord–scale, upper structures, spelling, figured bass… |
| Deep dive | 5 min | One library topic (least recently studied in your focus styles) + its drills |
| Apply | 3 min | A short musical task in the Lab (reharmonise, guide-tone lines, funk vamps, counterpoint) |

Skills use spaced repetition (due skills first, intervals grow when you're accurate — every Gym or Library set
counts, and cramming a skill early doesn't inflate its interval) and items inside a skill are weighted toward
what you miss. Pick 5/10/15/20 minutes and focus styles on the Today page. Leaving the workout to look something
up pauses it; the Today page and the sidebar offer to resume.

After a wrong ear-training answer, **▶ Yours / ▶ Right** play what you picked against the answer, and every
option can be clicked to hear it.

## What's inside

- **Library** — 37 lessons, each with explanation, sound examples, at least one worked example and a
  "working it out" section for every drill it teaches. Foundations: intervals, 7th chords, diatonic 7ths,
  modes, scale degrees, root motion, subdivision. Then: tensions & avoid notes, chord–scale, melodic-minor harmony, diminished/whole-tone,
  ii–V–I & guide tones, minor ii–V, tritone subs, secondary dominants, turnarounds, backdoor/modal interchange,
  rhythm changes, jazz & Bird blues, Coltrane changes, modal/quartal, upper structures, voicings, bebop
  language, reharmonisation, funk harmony & groove, neo-soul, gospel, four-part voice leading, counterpoint &
  suspensions, figured bass, chromatic harmony (N6, augmented sixths), sequences, fugue, cadences, clave.
- **Gym** — every drill on demand (ear, harmony, jazz, funk/soul, Bach, rhythm) with mastery, review dates and
  a link to the lesson that teaches it.
- **? on every question** — a hint for that specific question (plus a listening aid where it helps: the bass
  line alone, the last two chords, a slow arpeggio, the top note folded into the octave…), the step-by-step
  method for the drill, **Show solution** (counts as a miss, so the drill comes back sooner) and the lesson in a
  side drawer, so you never lose your place in a workout.
- **Lab** — *Progression Lab* (numerals or chord symbols, MIDI chord capture with automatic Roman-numeral
  analysis, swing/funk/ballad comping with bass & drums, presets, saved sketches); *Changes Trainer*
  (improvise over a loop, live chord-tone / tension / outside feedback and a downbeat score);
  *Chord & Scale Explorer* (chord–scale choices, upper structures, harmonised scales).
- **DX7 Lab** — 6-operator FM engine in an AudioWorklet (Dexed-derived envelope, scaling, LFO and feedback
  maths; all 32 algorithms), with clickable algorithm charts, draggable envelopes, keyboard-scaling curves,
  live operator meters, scope/spectrum, undo/redo, 17 original voices, and `.syx` import/export (32-voice
  banks and single voices).

## Playing on the computer keyboard

The letters are printed on the on-screen keys at the bottom of every page. Press **?** in the app for the full
sheet.

| Keys | Does |
|---|---|
| `A W S E D F T G Y H U J K O L P ; '` | play C to F an octave up (piano layout: white keys on the home row, black keys above) |
| `Z` / `X` | octave down / up |
| `1`–`8` | pads: pick answer 1–8, after answering go on; DX7 Lab: operators 1–6, voice ◀ ▶ |
| `Enter` / `Space` | next question · start a rhythm count-in · submit a chord you built |
| `Space` | tap (rhythm drills) |
| `Backspace` | clear the chord being built · take back the last note of a line |
| `R` | replay the question audio |
| `?` | on a question: hint, method, solution, lesson · elsewhere: the shortcut sheet · `Esc` closes |

Chord drills: on the computer keys (or by clicking keys) you **build the chord note by note** — press a key again
to drop it — and submit with Enter, so no key-rollover limits get in the way. On a MIDI keyboard you hold the
chord and release. Line drills (scales, dictation) check pitch classes, so the octave doesn't matter.

## Arturia MiniLab 3

Defaults (change or MIDI-learn in **Settings**, or right-click any synth knob):

| Control | Learning pages | DX7 Lab |
|---|---|---|
| Keys | play/answer | play |
| Pads 1–8 (ch 10, notes 36–51) | answer choices / tap rhythms | 1–6 select operator, 7/8 prev/next voice |
| Knobs 1–8 (CC 74 71 76 77 93 18 19 16) | — | OP1–6 level, feedback, algorithm |
| Faders 1–4 (CC 82 83 85 17) | — | selected op coarse, fine, attack, release |
| Mod strip / pitch strip / sustain | — | vibrato, bend, sustain |

Endless-encoder (relative) knob modes are detected automatically. The Settings page has a MIDI monitor and a
tap-latency calibration for the rhythm drills.

## Development

```bash
bun install
bun run dev        # rebuilds the client on change, serves on http://localhost:7777
bun test           # theory, DSP, sysex, generators, planner, content checks (SATB analyser, interchange)
bun run typecheck  # tsc --noEmit
bun run build && bun run start
```

Layout: `src/client/theory` (spelled notes, chords, scales, keys, progressions, voicing),
`src/client/audio` (DX7 DSP, worklet, engine), `src/client/learn` (generators, skills, library, planner, SRS),
`src/client/ui` (React UI), `src/server` (Bun server + sync API).
