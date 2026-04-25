# Synth Studio

A browser-only mini-DAW: play a synth/guitar/bass/vocal sampler with your computer keyboard, hit drum pads, build patterns on a 16-step piano-roll sequencer, record live performances, and load free CC-licensed samples directly from Freesound.

## Features

- **Keyboard** — on-screen 2-octave piano with computer-key bindings (`a w s e d f t g y h u j k o l p ; '`, `z`/`x` for octave shift).
- **Multi-instrument** — synth (built-in saw lead), plus guitar / bass / vocal slots that load samples from Freesound and play them pitched across the keyboard via `Tone.Sampler`.
- **Drum pads** — kick / snare / hihat / tom / clap, mapped to keys `1`–`5`, synthesized with `Tone.MembraneSynth`, `NoiseSynth`, and `MetalSynth`.
- **Step sequencer (Score A)** — 16-step piano-roll grid for one pitched track and one drum track, runs through `Tone.Sequence` at adjustable BPM.
- **Live recorder (Score C)** — record-as-you-play capture of every attack/release/drum hit with millisecond timestamps, then play back with the original instrument selection.
- **Freesound browser** — search free CC-licensed samples by instrument, preview in-browser, and load directly into the active sampler slot. You provide your own API token.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Click anything once to unlock the browser audio context, then play.

## Build

```sh
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build locally
```

## Freesound API token

Sign in at [freesound.org](https://freesound.org/), visit `/apiv2/apply/` to register an application, copy the API key, and paste it into the **Sample Browser → API token** drawer. The token is stored only in your browser's `localStorage`.

When publishing tracks made with Freesound samples, attribute the original authors per their CC licenses.

## Tech

- [Vite](https://vite.dev) + React 19 + TypeScript
- [Tone.js](https://tonejs.github.io/) for synthesis, sampling, and transport scheduling
- [Tonal.js](https://github.com/tonaljs/tonal) for music-theory helpers
- [Freesound API v2](https://freesound.org/docs/api/) for sample search

## License

MIT for the application code. Sample audio is owned by its respective Freesound authors and used under the licenses they declare.
