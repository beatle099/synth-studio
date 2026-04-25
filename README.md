# Synth Studio

A browser-only polyphonic synthesizer. Play with your computer keyboard or click the on-screen piano. No backend, no audio engine library — built directly on the Web Audio API.

## Features

- **Two-octave piano keyboard** (C4–B5) with visually distinct white and black keys.
- **Computer-keyboard mapping** — every key labelled on the corresponding piano key.
  - Lower octave: `A W S E D F T G Y H U J` → C4 through B4
  - Upper octave: `K O L P ; '` → C5 through F5
  - `Z` / `X` shift the global octave down / up
- **Polyphonic playback** — multiple keys held = chord; releasing one key only stops that note.
- **No retrigger on key repeat** — held keys won't re-strike.
- **Web Audio synth voice** with selectable waveform (sine / square / sawtooth / triangle).
- **ADSR envelope** — independent attack, decay, sustain, release sliders.
- **Master volume** and **panic / clear** to instantly stop every voice.
- **Live visual feedback** — held keys highlight on the piano, active note ids appear as chips.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. The audio context is created on the first key press / click to comply with the browser autoplay policy.

## Build & lint

```sh
npm run build     # tsc -b && vite build → dist/
npm run lint      # eslint
npm run preview   # serve dist/ locally
```

## Code layout

```
src/
  App.tsx                  global state, key handlers, panic, octave shift
  main.tsx
  styles.css
  audio/
    synthEngine.ts         Web Audio API synth: oscillator + ADSR + polyphony
  data/
    keyboardMap.ts         computer-key → note table; octave-shift helpers
  components/
    PianoKeyboard.tsx      on-screen piano with key labels and highlighting
    SynthControls.tsx      waveform / volume / ADSR / octave / panic
    ActiveNotes.tsx        live chip list of currently sounding notes
```

## Tech

- Vite + React 19 + TypeScript
- Web Audio API (no Tone.js, no audio framework)
- Plain CSS with CSS variables

## License

MIT.
