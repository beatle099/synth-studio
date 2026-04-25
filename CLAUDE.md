# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173.
- `npm run build` — `tsc -b` + `vite build`. Use this for type-check; there's no separate script.
- `npm run lint` — ESLint over the project. The project's ESLint config rejects `useEffect`s that contain unconditional `setState` calls — use `useMemo` or move state up instead.
- `npm run preview` — serve `dist/`.
- No tests are configured.

## Architecture

Single-page React + Vite client, no backend. Audio runs **directly on the Web Audio API** — no Tone.js or other framework.

### 1. The synth engine is a singleton

`src/audio/synthEngine.ts` exports a single `synthEngine`. It owns the `AudioContext`, the master `GainNode`, and a `Map<noteId, Voice>` of currently sounding voices. A `Voice` is `{ oscillator, gain }` — created on `noteOn`, torn down inside the oscillator's `onended` callback after the release envelope completes. Components never construct Web Audio nodes themselves.

`synthEngine.start()` is idempotent and **must be invoked from a user gesture**. App's `ensureStarted()` does this before every `noteOn`.

### 2. The keyboard system is data-driven, not hardcoded

`src/data/keyboardMap.ts` exposes:
- **MIDI helpers** — `noteToMidi`, `midiToNote`, `isBlack`, `rangeMidi`, `rangeNotes`. Every component that renders or scrolls the piano calls `rangeNotes(range)` rather than baking a fixed octave.
- **Range presets** (`RANGE_PRESETS`) — 1/2/3/4-octave and full 88-key. The full-piano preset (`A0`, octaveCount=7) is detected via `isFullPiano(range)` which special-cases MIDI 21–108.
- **Mapping presets** — `SIMPLE_MAP` and `EXTENDED_MAP` are static `KeyMapping[]`. The active mapping is selected via `mappingForMode(mode, customMap)` and stored in `mappingsRef` in App so the global `keydown` handler can resolve the latest binding without re-attaching listeners on every state change.
- **Custom map** — `loadCustomMap`, `saveCustomMap`, `clearCustomMap` round-trip through `localStorage` under `synth-studio.custom-keymap`.

`labelForNote(noteId, octaveShift, mappings)` is the single function that decides which keyboard label appears on a given piano key. It accounts for both the active mapping and the octave shift, so view changes don't require recomputing labels in components.

### 3. Octave-shift hot-keys depend on mapping mode

In simple mode `Z`/`X` are octave −/+. Extended mode reuses Z and X as note keys, so `octaveShiftKeysFor('extended')` returns `[`/`]`. App's keydown handler reads these via `shiftKeys` so adding a new mapping mode means just extending `octaveShiftKeysFor`.

### 4. Held-key tracking lives in App, not the engine

`heldKeysRef: Map<computerKey, noteId>` enforces:
- **No retrigger on key repeat** — `keydown` is ignored if the physical key is already in the map.
- **Correct note-off after octave shift** — the noteId is captured at attack time, so changing octave shift while a key is held still releases the original note.
- **Window-blur cleanup** — losing focus can swallow `keyup` events; the `blur` listener flushes everything.

The engine has no concept of physical keys.

### 5. Custom-mapping edit flow

Custom mode flips two pieces of state owned by App:
- `editMode` — when true, App's main `keydown` handler bails out so it doesn't play notes, and the piano's onclick path emits `onPianoKeyClick(noteId)` instead of `onAttack`.
- `awaitingNote` — set when the user clicks a piano key. `KeyMappingSettings` registers a one-shot capture-phase `keydown` listener that binds the next press to the awaiting note, then clears it. `Esc` cancels.

`KeyMappingSettings` writes through `setCustomMap`, which both updates state and persists immediately. There's no "Save" button — every binding is durable on the spot.

### 6. Mini-keyboard navigator uses click-to-recentre

`MiniKeyboard.tsx` renders all 88 keys as a fixed-width strip with the visible range overlaid. Clicking the strip translates the click X position into a white-key index and jumps the visible range so that key becomes the new start. For the full-piano range there's no scrolling so click is a no-op via App's `onJumpTo` early-return.

### 7. View modes are pure CSS

`PianoKeyboard.tsx` always renders every note in the range. The `view-{mode}` class on the wrapper switches between layouts:
- `view-fit-to-screen` — `width: 100%`, keys flex.
- `view-compact` — content-sized, capped height.
- `view-scrollable` / `view-full` — fixed `min-width` on keys, container has `overflow-x: auto`.

If you add a new view mode, do it in CSS, not in component logic.

## Conventions

- **No CSS framework.** All styling is in `src/styles.css` with CSS variables.
- **One global keydown/keyup listener pair**, owned by App. Component-level capture (KeyMappingSettings) uses the **capture phase** to intercept first.
- **`noteId` is the canonical note format** everywhere: name + octave (e.g. `"C4"`, `"F#5"`). Don't split into `{ name, octave }` objects across module boundaries.
- **Avoid `setState` inside `useEffect` bodies** — the project's lint config will fail. Use `useMemo` for derived values, or move state up.
