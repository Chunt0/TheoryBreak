# Theory Break

Music-theory workouts for your 15-minute break, driven by an **Arturia MiniLab 3**, plus **DX7 Lab** — a
DX7-style FM synth with an editor you can actually use.

- **Theory, not technique.** Intermediate level. Jazz, funk, R&B/gospel and Bach/common-practice vocabulary.
- **Jump in anywhere.** Nothing is locked. A library of dense reference topics, a gym of 58 drill types, and a
  planner that builds a 15-minute session from what's due, what's weak and what you haven't tried.
- **Hardware-first.** Keys answer "play this chord/line" drills, pads 1–8 answer multiple choice and tap
  rhythms, knobs/faders drive the synth. Works without the MiniLab too (computer keys A–K, digits 1–8).

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

Skills use spaced repetition (due skills first, intervals grow when you're accurate) and items inside a
skill are weighted toward what you miss. Pick 5/10/15/20 minutes and focus styles on the Today page.

## What's inside

- **Library** — 30 topics: tensions & avoid notes, chord–scale, melodic-minor harmony, diminished/whole-tone,
  ii–V–I & guide tones, minor ii–V, tritone subs, secondary dominants, turnarounds, backdoor/modal interchange,
  rhythm changes, jazz & Bird blues, Coltrane changes, modal/quartal, upper structures, voicings, bebop
  language, reharmonisation, funk harmony & groove, neo-soul, gospel, four-part voice leading, counterpoint &
  suspensions, figured bass, chromatic harmony (N6, augmented sixths), sequences, fugue, cadences, clave.
- **Gym** — every drill on demand (ear, harmony, jazz, funk/soul, Bach, rhythm) with mastery and review dates.
- **Lab** — *Progression Lab* (numerals or chord symbols, MIDI chord capture with automatic Roman-numeral
  analysis, swing/funk/ballad comping with bass & drums, presets, saved sketches); *Changes Trainer*
  (improvise over a loop, live chord-tone / tension / outside feedback and a downbeat score);
  *Chord & Scale Explorer* (chord–scale choices, upper structures, harmonised scales).
- **DX7 Lab** — 6-operator FM engine in an AudioWorklet (Dexed-derived envelope, scaling, LFO and feedback
  maths; all 32 algorithms), with clickable algorithm charts, draggable envelopes, keyboard-scaling curves,
  live operator meters, scope/spectrum, undo/redo, 17 original voices, and `.syx` import/export (32-voice
  banks and single voices).

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
bun test           # theory, DSP, sysex, generators, planner
bun run typecheck  # tsc --noEmit
bun run build && bun run start
```

Layout: `src/client/theory` (spelled notes, chords, scales, keys, progressions, voicing),
`src/client/audio` (DX7 DSP, worklet, engine), `src/client/learn` (generators, skills, library, planner, SRS),
`src/client/ui` (React UI), `src/server` (Bun server + sync API).
