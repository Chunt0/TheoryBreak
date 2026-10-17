# Theory Break

A music-theory practice app and a DX7-style FM synth in one: every exercise is played on a keyboard — your
computer keys, the on-screen keys or a MIDI controller (Arturia MiniLab 3 or any other) — and the keyboard always
plays your current synth patch.

- **One thing at a time.** Six tabs, one row of options, one exercise in the middle, one big keyboard at the bottom.
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

## What's inside

| Tab | Exercises |
|---|---|
| **Scales** | 17 scales (major/minor, modes, Lydian ♭7, altered, diminished, whole tone, bebop, pentatonics, blues) in any key. Straight, in 3rds, in 4ths, groups of 4, diatonic triads or 7ths; 1–2 octaves; up, down or both. *Notes shown* marks every key, *From memory* only the first note. Free time (best time per key) or with a metronome: one bar count-in, then a timing graph of every note and the tempo goes up after a clean, even run. The key strip under the title runs round the circle of fifths (like *Next key*) and dots the keys you have done. |
| **Intervals** | *Play it* (find the note on the keys), *Hear it* (name it), *Name it* (spell it: a minor 6th above E is C, not B♯). Up, down or together; basic, all 12, or jazz tensions (♭9 9 ♯9 11 ♯11 ♭13 13). |
| **Chords** | *Build it* (triads, 7ths, 6ths/sus/add9, 9ths–13ths, altered dominants; root position, any voicing, or a named inversion with the right bass note), *Hear it* (name the quality), *In a key* (build the vi7 in E♭; minor keys borrow V7 and vii°7 from harmonic minor). |
| **Progressions** | *Name the chords* (hear a progression in a random key, give each chord as a Roman numeral: I IV V vi, all triads, diatonic 7ths, minor) and *Name the progression* (ii–V–I, backdoor, Lady Bird, Coltrane cycle, "Just the Two of Us", Dorian vamps, Phrygian cadence, lament bass… comped in the style they come from, then explained). |
| **Keys** | Key ↔ signature, relative major/minor, and spelling scale degrees ("submediant of A♭ major"), with a circle of fifths and the key's scale on the keyboard. |
| **Synth** | The DX7 Lab: 6-operator FM engine in an AudioWorklet (Dexed-derived envelope, scaling, LFO and feedback maths; all 32 algorithms), clickable algorithm charts, draggable envelopes, keyboard-scaling curves, operator meters, scope/spectrum, undo/redo, 17 original voices, **Save** to your own bank, `.syx` import/export (32-voice banks and single voices). |

The **Sound** menu in the header switches between factory voices and your saved patches; ⚙ chooses whether
exercises play back with your patch or a plain practice piano, and sets volume, reverb and metronome level.
Your choices, records and patches are saved locally and synced to the server.

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

Defaults (MIDI-learn by right-clicking any synth knob):

| Control | Practice tabs | Synth tab |
|---|---|---|
| Keys | play your patch, answer | play |
| Pads 1–8 (ch 10, notes 36–51) | pick answers 1–8 | 1–6 select operator, 7/8 prev/next voice |
| Knobs 1–8 (CC 74 71 76 77 93 18 19 16) | — | OP1–6 level, feedback, algorithm |
| Faders 1–4 (CC 82 83 85 17) | — | selected op coarse, fine, attack, release |
| Mod strip / pitch strip / sustain | — | vibrato, bend, sustain |

Endless-encoder (relative) knob modes are detected automatically. The mod strip, pitch strip and sustain work
on every tab, since the keys always play your patch.

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
`src/client/simple` (the app: header, the six tabs, the keyboard dock), `src/client/ui` (DX7 Lab and shared
components), `src/client/fonts` (Inter and the accidentals; `scripts/fit-music-font.py` says how they were made),
`src/server` (Bun server + sync API).
