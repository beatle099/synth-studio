# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server on port 5173.
- `npm run build` — runs `tsc -b` then `vite build`. Use this to type-check; there is no separate `typecheck` script.
- `npm run preview` — serve `dist/` locally.
- `npm run lint` — ESLint over the whole project.
- No test framework is configured.

## Architecture

The app is a single-page React/Vite client with no backend. All audio runs in-browser via Tone.js on top of the Web Audio API. Three concerns dominate the design:

### 1. The audio engine is a singleton with per-channel routing

`src/audio/engine.ts` exports a single `engine` instance. It owns every audio node and routes them through five `Tone.Channel` strips (synth, guitar, bass, vocal, drums) into a single master `Gain` connected to the destination. Each pitched instrument has its own default `Tone.PolySynth` connected to its channel; samplers, when loaded via `loadSamples`, connect to the same channel and replace the default for that instrument. Drum synths all share the drums channel.

Why per-instrument synths: the mixer's volume/pan/mute/solo work even before the user loads any samples. If we had a single shared PolySynth, switching instruments would not change which channel was attenuated.

Components never instantiate Tone nodes themselves; they call methods on `engine`. This keeps voices stable across re-renders and lets the recorder / sequencer / keyboard share the same instrument state.

`engine.start()` must be awaited before any sound — it calls `Tone.start()` to unlock the audio context after a user gesture. `App.tsx` does this lazily on the first attack/drum hit.

`pitchedVoice(instrument)` is the one place that decides "is there a loaded sampler for this instrument? if yes use it, otherwise fall back to that instrument's default synth." All trigger methods route through this so the rest of the codebase doesn't have to know whether a sample is loaded.

### 1a. Mixer state lives in React, audio state lives in the engine

The Mixer component (`components/Mixer.tsx`) keeps `ChannelState` in React local state for fader positions, then mirrors every change into the engine via `setChannelVolume / setChannelPan / setChannelMute / setChannelSolo`. The engine never reads back from React state. If you need to expose channel state to another component, lift the state up — don't add a getter on the engine.

Solo behavior comes from `Tone.Channel.solo`: when *any* channel has `solo = true`, all non-solo channels are muted at the audio graph level. The UI doesn't compute this — it just toggles per channel.

### 2. Two playback paths share the engine

- **Step sequencer** (`components/Sequencer.tsx`) — owns its own `Tone.Sequence`, walks 16 steps, fires the active cells per step. Uses `Tone.getDraw().schedule(...)` to keep the step-cursor UI in sync with the audio clock instead of `setInterval`.
- **Live recorder** (`audio/recorder.ts`, `useRecorder` hook) — uses wall-clock `performance.now()` for capture and `setTimeout` for playback. It is **not** on the Tone transport, deliberately: it captures human-timed performances rather than grid-aligned events.

These two paths can run simultaneously without coordination because they both ultimately call `engine.trigger*` methods, which are stateless dispatchers onto the shared voices.

The recorder captures the `instrument` at each event so playback restores the timbre even if the user has switched instruments since recording. See `play()` in `recorder.ts` — it temporarily flips `engine.setInstrument()` per event, then restores it.

### 3. Drums are a separate path from pitched instruments

The `InstrumentId` type includes `'drums'` for completeness, but `engine.triggerAttack/Release/Note` are no-ops when the current instrument is `'drums'`. Drums are always reachable via `engine.triggerDrum(hit)` independent of the current pitched instrument. The UI reflects this: `InstrumentPanel` only lists pitched options; `DrumPad` renders the 5 drum cells with their own keybindings (`1`–`5`).

When wiring a new feature that produces sound, decide first whether it is pitched (goes through `triggerAttack/triggerNote*`) or percussive (goes through `triggerDrum`). Don't try to unify them.

### 4. The Sequencer card has a collapse toggle

`Sequencer.tsx` keeps an `expanded` flag in local state. The grid is conditionally rendered, but the header (BPM / instrument selector / play / clear) is always visible so users can still drive playback while the score is hidden. Don't hoist `expanded` into App unless another component needs to read it — keeping it local prevents unnecessary App re-renders during play.

## Freesound integration notes

- `audio/freesound.ts` is a thin fetch wrapper. The token lives in `localStorage` under `synth-studio.freesound-token` — never hardcode one.
- The sample loader maps a single sample to `C4` and lets `Tone.Sampler` pitch-shift it across the keyboard. This works well for short one-shots (we filter `duration:[0.2 TO 6.0]` in the search query) but will sound stretched on extreme intervals — multi-zone sampling is a future extension.
- Drum samples are intentionally not loadable yet; the Freesound browser is for pitched instruments only. If adding drum sample support, build a parallel `loadDrumSamples` API on the engine — don't try to overload the existing pitched sampler map.

## Conventions worth following

- **No CSS framework.** All styling is in `src/styles.css` with CSS variables. Keep it that way unless you're adding something genuinely heavy — pulling in Tailwind for a few cards isn't worth the toolchain cost here.
- **Refs for hot paths in the sequencer.** `Sequencer.tsx` mirrors `pitchGrid`, `drumGrid`, and `pitchInstrument` into refs because the `Tone.Sequence` callback is created once and would otherwise capture stale state. If you add another grid, use the same ref pattern.
- **Computer-keyboard handlers are global `window` listeners** registered in `useEffect` cleanups. There's only one Keyboard component and one DrumPad on screen, so this is fine; if you ever render two, scope the listener instead.
