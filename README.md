# Synth Studio

A browser-only polyphonic synthesizer. Play with your computer keyboard or click the on-screen piano. No backend, no audio engine library — built directly on the Web Audio API.

## Features

### Keyboard
- **Selectable range:** 1, 2, 3, 4 octaves, or full 88-key piano (A0–C8). Default 2-octave C4–B5.
- **Dynamic key generation** — keys are computed from the active range, never hardcoded.
- **Octave shift** transposes computer-key bindings up to ±3 octaves without changing the visible range.
- **Mini keyboard navigator** shows the full 88-key range; click anywhere to jump the visible window.
- **View modes:** compact, fit-to-screen, scrollable, full (wide with octave guides).
- **Label modes:** note + key, note only, key only, off.

### Computer-keyboard mapping modes
- **Simple** (default, no conflicts): `A W S E D F T G Y H U J` = C4–B4 · `K O L P ; '` = C5–F5 · `Z` / `X` = octave −/+
- **Extended** (3 rows, no conflicts): adds lower row `Z 2 X 3 C V 5 B 6 N 7 M` = C3–B3 (sharps on the number row), keeps `A W S E … '` for C4–F5. Octave shift moves to `[` / `]` because Z and X become note keys.
- **Custom** — open the Keyboard Mapping panel, click a piano key, press a computer key. Saved to `localStorage` and survives reload. Reset / clear-all supported. Duplicate-key bindings warn but don't break (first match wins).

### Synth voice (Web Audio API)
- Polyphonic — a fresh `OscillatorNode` per note, no max-voices cap.
- Waveform selector: sine / square / sawtooth / triangle. Live changes are heard on held notes.
- ADSR envelope: independent attack, decay, sustain, release.
- Master volume.
- **Panic** instantly fades and tears down every voice.
- AudioContext is constructed lazily on the first user gesture (no autoplay-policy errors).

### Visual feedback
- Held notes highlight on the piano and appear as chips in the Active Notes panel.
- Active notes also show on the mini-keyboard navigator.
- Octave shift, visible range, and currently-awaiting custom binding are always visible.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. The audio context starts on the first key press / click.

## Build & lint

```sh
npm run build     # tsc -b && vite build → dist/
npm run lint      # eslint
npm run preview   # serve dist/ locally
```

## Code layout

```
src/
  App.tsx                       global state, key handlers, persistence
  main.tsx
  styles.css
  audio/
    synthEngine.ts              Web Audio synth: oscillator + ADSR + polyphony
  data/
    types.ts                    KeyboardRange / ViewMode / MappingMode / KeyMapping / LabelMode
    keyboardMap.ts              MIDI helpers, range presets, simple+extended maps, custom-map storage
    preferences.ts              localStorage helpers for keyboard prefs
  components/
    PianoKeyboard.tsx           dynamic piano renderer, view-mode aware
    KeyboardControlBar.tsx      range / view / labels / mapping mode / octave shift
    MiniKeyboard.tsx            full 88-key overview with click-to-jump
    KeyMappingSettings.tsx      custom mapping panel with click-and-press capture
    SynthControls.tsx           waveform / volume / ADSR / octave / panic
    ActiveNotes.tsx             live chip list of currently sounding notes
```

## Persistence

Everything below is kept in `localStorage`:
- Range, view mode, mapping mode, label mode, octave shift — under `synth-studio.preferences`
- Custom key map — under `synth-studio.custom-keymap`

Clear browser storage to reset to defaults.

## Tech

- Vite + React 19 + TypeScript
- Web Audio API (no Tone.js, no audio framework)
- Plain CSS with CSS variables

## License

MIT.
