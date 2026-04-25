# 🎹 Synth Studio

A polyphonic synthesizer that runs entirely in your browser. Play with your computer keyboard or click the on-screen piano. Built directly on the Web Audio API — no plugins, no installs (unless you want to develop on it).

**[▶ Try it in your browser](https://beatle099.github.io/synth-studio/)**

> First time? Click anywhere on the page once to unlock audio (browsers require a user gesture before they'll play sound), then start mashing keys.

---

## What can you do with it?

- **Play music with your computer keyboard.** `A` is C4, `S` is D4, `D` is E4, and so on. Hold multiple keys for chords.
- **Stretch the piano** from 1 octave up to the full 88-key concert grand.
- **Pick a sound** — sine / square / sawtooth / triangle, plus full ADSR envelope control.
- **Remap any key** to any note and save your custom layout — it survives reloads.
- **Use a tiny computer screen** — the keyboard fits, scrolls, or shrinks to match.

A walkthrough of every feature lives in **[USER_GUIDE.md](./USER_GUIDE.md)**.

---

## Install

Three ways, easiest first.

### 1. Open the hosted app — no install
Just open **<https://beatle099.github.io/synth-studio/>** in any modern browser (Chrome / Edge / Firefox / Safari). You're done.

### 2. Run from source — for tinkerers
Requires **Node.js 20+** and **npm**.

```sh
git clone https://github.com/beatle099/synth-studio.git
cd synth-studio
npm install
npm run dev
```

Open <http://localhost:5173>. Edit any file under `src/` and the page hot-reloads.

### 3. Static build for self-hosting
```sh
npm install
npm run build
npx serve dist     # or copy dist/ to any static host
```

The `dist/` folder is a complete static site — drop it on any web server.

---

## Keyboard cheat sheet

Default mapping (Simple mode):

```
 ┌─────────────────────────── 2 octaves, C4–B5 ────────────────────────────┐
 │  C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5                                       │
 │   A  S  D  F  G  H  J  K  L  ;  '   ← white keys                        │
 │   W  E    T  Y  U     O  P          ← black keys (sharps)               │
 │                                                                         │
 │   Z = octave down     X = octave up                                     │
 └─────────────────────────────────────────────────────────────────────────┘
```

Need more reach? Switch to **Extended mode** in the Mapping selector — it adds the lower row `Z–M` for C3–B3 (with the number row `2 3 5 6 7` as sharps), and octave shift moves to `[` / `]` because Z and X become note keys.

Want your own layout? Switch to **Custom**, click any piano key, then press the key you want bound. It saves automatically.

---

## How it's built

- **Vite + React 19 + TypeScript**
- **Web Audio API** directly — no Tone.js or other audio framework
- **Plain CSS** with CSS variables — no Tailwind, no styled-components

Code map:

```
src/
  App.tsx                   global state, key handlers, persistence
  audio/synthEngine.ts      oscillator + ADSR + polyphony + panic
  data/
    types.ts                public types (KeyboardRange / ViewMode / etc.)
    keyboardMap.ts          MIDI helpers, range presets, mapping presets
    preferences.ts          localStorage round-tripper
  components/
    PianoKeyboard.tsx       dynamic piano — works for any range
    KeyboardControlBar.tsx  range / view / labels / mapping mode
    MiniKeyboard.tsx        88-key overview with click-to-jump
    KeyMappingSettings.tsx  custom-mapping panel
    SynthControls.tsx       waveform / volume / ADSR / panic
    ActiveNotes.tsx         live chip list of currently sounding notes
```

`CLAUDE.md` documents the architectural decisions in more depth — useful if you want to extend the engine.

---

## Development scripts

| Script              | What it does                       |
|---------------------|------------------------------------|
| `npm run dev`       | Vite dev server with HMR           |
| `npm run build`     | Type-check + production build      |
| `npm run lint`      | ESLint over the project            |
| `npm run preview`   | Serve the production build locally |

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/pages.yml`.

---

## Browser support

Anything that supports the Web Audio API and ES modules — that's every current Chrome, Edge, Firefox, and Safari. Mobile browsers work too but the keyboard handling is desktop-first.

---

## License

MIT. Do whatever you want with it.
