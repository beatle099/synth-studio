# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server on port 5173.
- `npm run build` — runs `tsc -b` then `vite build`. Use this to type-check; there is no separate `typecheck` script.
- `npm run lint` — ESLint over the whole project.
- `npm run preview` — serve `dist/` locally.
- No test framework is configured.

## Architecture

The app is a single-page React/Vite client with no backend. Audio runs **directly on the Web Audio API** — there is no Tone.js or other audio framework.

### 1. The synth engine is a singleton

`src/audio/synthEngine.ts` exports a single `synthEngine` instance. It owns the `AudioContext`, the master `GainNode`, and a `Map<noteId, Voice>` of currently sounding voices. A `Voice` is `{ oscillator: OscillatorNode, gain: GainNode }` — created on `noteOn`, torn down inside the oscillator's `onended` callback after the release envelope completes.

Components never construct Web Audio nodes themselves; they call methods on `synthEngine`.

`synthEngine.start()` constructs the AudioContext lazily and is idempotent. **It must be invoked from a user gesture** (the first key press or click). `App.tsx` does this through `ensureStarted()` before every `noteOn` so the user never has to think about it.

### 2. Held-key tracking lives in App, not the engine

`App.tsx` keeps a `heldKeysRef: Map<computerKey, noteId>`. This is what enforces:
- **No retrigger on key repeat** — `keydown` is ignored if the physical key is already in the map (we don't rely on `KeyboardEvent.repeat` because `keyup` is the source of truth for "key released").
- **Correct note-off after octave shift** — the noteId is captured at attack time, so even if the user shifts octave while a key is still held, the original note is the one released.
- **Window-blur cleanup** — losing focus can swallow `keyup` events; the `blur` listener flushes everything held.

The engine has no concept of physical keys. Don't try to push held-key state into `synthEngine`; keep it in App where the keyboard event lives.

### 3. Octave shift is global and additive

`data/keyboardMap.ts` stores each key's *base* octave (4 for the lower row, 5 for the upper). The actual sounding note is `noteName + (baseOctave + octaveShift)`. The on-screen piano is fixed at C4–B5; what changes with octave shift is *which* keyboard label appears on which piano key (`labelForPianoNote(noteId, octaveShift)`). When a piano key has no current keyboard mapping (e.g. labels move off-range), the label is simply not rendered — the visual highlight still works for mouse clicks.

### 4. Waveform changes affect held voices

`SynthEngine.setWaveform` updates `osc.type` on every active voice, so the timbre changes mid-note. ADSR changes don't retroactively modify the envelope of voices already in their attack/decay phase — that's intentional, because rewriting scheduled gain ramps mid-flight is more disruptive than the visual feedback is worth.

## Conventions

- **No CSS framework.** All styling is in `src/styles.css` with CSS variables.
- **One global keydown/keyup listener pair**, owned by App. There is intentionally no per-component keyboard handler — adding more would race for the same event.
- **`noteId` is the canonical note format** everywhere: name + octave, e.g. `"C4"`, `"F#5"`. Never split into `{ name, octave }` objects when passing across module boundaries.
