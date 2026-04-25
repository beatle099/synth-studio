# Synth Studio — User Guide

A walkthrough for everything Synth Studio can do, written for someone who has never opened a digital audio workstation. If you just want to play, jump to [Make your first sound](#make-your-first-sound). If you're stuck, see [Troubleshooting](#troubleshooting) at the bottom.

---

## Table of contents

- [Make your first sound](#make-your-first-sound)
- [Playing notes](#playing-notes)
  - [Computer keyboard](#computer-keyboard)
  - [On-screen piano](#on-screen-piano)
- [Octave shift](#octave-shift)
- [Range — choose how much piano you see](#range--choose-how-much-piano-you-see)
- [View modes — fitting the piano on your screen](#view-modes--fitting-the-piano-on-your-screen)
- [Mapping modes — picking a key layout](#mapping-modes--picking-a-key-layout)
  - [Simple](#simple-mode)
  - [Extended](#extended-mode)
  - [Custom](#custom-mode)
- [Sound design — making it sound the way you want](#sound-design--making-it-sound-the-way-you-want)
  - [Waveform](#waveform)
  - [ADSR envelope](#adsr-envelope)
  - [Master volume](#master-volume)
- [The mini keyboard navigator](#the-mini-keyboard-navigator)
- [Labels — what's written on each key](#labels--whats-written-on-each-key)
- [Panic — stopping every note instantly](#panic--stopping-every-note-instantly)
- [What's saved between visits](#whats-saved-between-visits)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Make your first sound

1. Open <https://beatle099.github.io/synth-studio/> (or run `npm run dev` locally — see [README](./README.md#install)).
2. **Click anywhere on the page once.** Browsers don't let websites play audio until you've interacted with the page; one click is enough to unlock it forever.
3. Press the **A** key on your computer keyboard.

You should hear a sawtooth-wave C4 (middle C). The on-screen piano lights up the matching key. Press **S**, **D**, **F**, **G**, **H**, **J** to play a C-major scale.

**Hold multiple keys at once for a chord.** Releasing one key only stops that note — the others keep ringing.

---

## Playing notes

### Computer keyboard

Two rows of letters cover two octaves by default:

| Key | Note | | Key | Note |
|---|---|---|---|---|
| `A` | C4  | | `K` | C5 |
| `W` | C#4 | | `O` | C#5 |
| `S` | D4  | | `L` | D5 |
| `E` | D#4 | | `P` | D#5 |
| `D` | E4  | | `;` | E5 |
| `F` | F4  | | `'` | F5 |
| `T` | F#4 | | | |
| `G` | G4  | | | |
| `Y` | G#4 | | | |
| `H` | A4  | | | |
| `U` | A#4 | | | |
| `J` | B4  | | | |

Plus:
- `Z` = octave down · `X` = octave up
- (In Extended mode, octave shift moves to `[` / `]` — see [Mapping modes](#mapping-modes--picking-a-key-layout))

The same key won't retrigger while it's held — a single press = a single note, exactly like a real keyboard.

### On-screen piano

Click and hold any key with your mouse to play it, release to stop. White and black keys are styled differently so you can read sheet music or copy chords visually. Held keys highlight in purple.

If you click into a black-key region, the click is captured by the black key — there's no way to accidentally press the white key behind it.

---

## Octave shift

Octave shift moves where your computer-keyboard mapping lands on the piano, **without changing what's visible**. It's how you reach notes outside the default C4–B5 window.

Three ways to shift:
- Press `Z` (down) or `X` (up) — `[` / `]` in Extended mode.
- Click the **− oct** / **+ oct** buttons in the keyboard control bar at the top.
- Use the buttons in the Synth Controls panel.

The current shift is shown in the title bar (e.g. **Octave shift +1**). Range is ±3 octaves.

A held note continues sounding the original pitch even if you shift while it's pressed — the new shift only affects future presses.

---

## Range — choose how much piano you see

The **Range** dropdown in the keyboard control bar lets you pick how many octaves the piano displays.

| Preset | Range |
|---|---|
| 1 octave | C4–B4 |
| 2 octaves | C4–B5 *(default)* |
| 3 octaves | C3–B5 |
| 4 octaves | C2–B5 |
| Full 88-key | A0–C8 |

For 1–4 octave presets you can also nudge the **Start octave** with the − / + buttons — e.g. switch the 2-octave preset to start at C2 instead of C4.

The piano always renders the full selected range; how it fits on screen is decided by the [view mode](#view-modes--fitting-the-piano-on-your-screen).

---

## View modes — fitting the piano on your screen

Different rooms need different layouts. The **View** dropdown picks one of four:

- **Fit-to-screen** *(default)* — keys flex to fill the width. Good for laptops and most monitors.
- **Compact** — content-sized; the piano takes only as much space as it needs and stops growing. Good if you want the piano in a corner of your screen.
- **Scrollable** — keys keep a comfortable size; if they don't all fit, scroll horizontally. Good for picking the full 88-key range on a small screen.
- **Full** — wider keys with more room for labels. Always scrollable. Good for live performance and screencasts.

Switching modes doesn't change which notes are visible, only how they're laid out.

---

## Mapping modes — picking a key layout

The **Mapping** dropdown picks which set of computer-key bindings is active.

### Simple mode

The default. Two-octave beginner mapping (covered in [Playing notes](#computer-keyboard)). Octave shift = `Z` / `X`. No conflicts, easy to learn.

### Extended mode

Adds a third row beneath the Simple layout. The lower QWERTY row plus the number row gives you a third octave below middle C:

| Key | Note | | Key | Note |
|---|---|---|---|---|
| `Z` | C3  | | `B` | G3 |
| `2` | C#3 | | `6` | G#3 |
| `X` | D3  | | `N` | A3 |
| `3` | D#3 | | `7` | A#3 |
| `C` | E3  | | `M` | B3 |
| `V` | F3  | | | |
| `5` | F#3 | | | |

The Simple mapping for C4–F5 stays the same. Octave shift moves to `[` / `]` because Z and X are now note keys.

Use Extended when you want to play left-hand bass parts without shifting octaves mid-phrase.

### Custom mode

Build your own layout from scratch.

1. Switch **Mapping → Custom**.
2. In the **Keyboard mapping** panel on the right, click **Edit by clicking piano keys**.
3. Click any piano key — the panel will say *Press a computer key to bind it to [Note]*.
4. Press the computer key you want. The binding is saved instantly.
5. Repeat for every note you want bound. Press `Esc` while a binding is pending to cancel.

Other controls in the panel:
- **Seed from Simple** — copy the Simple mapping into your custom map as a starting point.
- **Clear all** — wipe every binding.
- The **×** next to a binding removes that one binding.

If two notes share a computer key, the panel shows a yellow warning. The binding closest to the top of the list (lowest pitch) wins, but the warning is there so you know to fix it.

Your custom map is stored in your browser's local storage and survives reloads. Switch back to Simple or Extended any time without losing it.

---

## Sound design — making it sound the way you want

The **Synth controls** panel (left side of the main area) shapes the sound.

### Waveform

Picks the basic timbre of the oscillator:
- **Sine** — pure, flute-like. The fewest harmonics.
- **Triangle** — soft, a little brighter than sine.
- **Square** — hollow, video-game-y. Lots of odd harmonics.
- **Sawtooth** *(default)* — bright, buzzy. The classic synth-lead sound, all harmonics.

Changing the waveform updates currently-held notes in real time, so you can sweep through sounds while playing a sustained chord.

### ADSR envelope

ADSR is the universal language for shaping how a note evolves. Four sliders:

- **Attack** — how long it takes to reach full volume after you press the key. Short = punchy, long = swelling pad.
- **Decay** — how long it takes to settle from peak down to the sustain level.
- **Sustain** — the volume held while the key is still pressed (0 = silent, 1 = full).
- **Release** — how long it takes to fade out after you let go.

Try this: set **Attack ≈ 0.8s**, **Sustain ≈ 0.6**, **Release ≈ 1.5s**, waveform **Triangle**. Hold a chord — it now swells in and lingers after you release.

ADSR changes apply to the *next* note you play. Notes already in flight keep the envelope they were started with — that's deliberate; rewriting an envelope mid-flight produces clicks.

### Master volume

The slider sets the overall output level. It applies smoothly so you can ride it during a performance without zipper noise.

---

## The mini keyboard navigator

Below the synth controls is a tiny strip showing the **full 88-key piano**. The currently visible range is highlighted in purple.

Click anywhere on the strip to **jump the visible range** so the click point becomes the new starting C. (Has no effect when the visible range is already the full 88 keys.)

Active notes also light up here, so you can see which keys are sounding even when you've zoomed out.

---

## Labels — what's written on each key

The **Labels** dropdown controls what's printed on each piano key:

- **Note + Key** *(default)* — note name on white keys, computer-key letters where applicable.
- **Note only** — just C4, D4, etc. Useful for memorising note positions.
- **Key only** — just A, S, D, etc. Useful when you've internalised the note names.
- **Off** — clean piano, no labels.

Labels follow the active mapping mode and the octave shift. Shift up by one and the **A** label moves from C4 to C5.

---

## Panic — stopping every note instantly

If anything ever sounds stuck — a note that won't release, a click jammed somewhere — hit the red **Panic · stop all notes** button at the bottom of the Synth controls panel. It fades every active voice in 40 ms and clears the held-key tracker.

You can also lose focus on the browser tab; Synth Studio listens for `blur` events and flushes held notes. So clicking away or alt-tabbing is safe.

---

## What's saved between visits

Stored in your browser's `localStorage`:

- Range, view mode, mapping mode, label mode, octave shift — under `synth-studio.preferences`
- Custom keyboard map — under `synth-studio.custom-keymap`

Nothing is sent off your machine. To reset everything, clear site storage in your browser's developer tools.

---

## Troubleshooting

**No sound when I press keys.**
Click anywhere on the page first. Browsers block audio until you've interacted. After that, audio stays unlocked for the session.

**The browser plays sound but the piano doesn't react.**
Make sure the browser tab has focus. Click the Synth Studio page (anywhere not on a control) and try again. Modifier keys (`Cmd`, `Ctrl`, `Alt`) are deliberately ignored to avoid hijacking system shortcuts — `Ctrl+A` won't play C4.

**Some keys don't play in Extended mode.**
Z and X are notes in Extended mode, not octave shift. Use `[` and `]` instead. The control bar's octave −/+ buttons always work.

**A note got stuck.**
Press the red **Panic** button at the bottom of the Synth controls panel. If that doesn't help, refresh the page (your settings persist).

**My custom mapping vanished.**
Make sure you didn't switch back to Simple or Extended — the Custom map is still there, just inactive. Switch **Mapping → Custom** and your bindings reappear. If they're really gone, you might have private-browsing mode (which doesn't persist localStorage) or you cleared site data.

**Audio is glitchy / clicky.**
You probably have very short attack/release values plus a heavy waveform. Try `Attack ≥ 0.01s` and `Release ≥ 0.05s`, or switch to Sine. Or close other tabs that are heavy on audio.

---

## FAQ

**Is anything sent to a server?**
No. Synth Studio is a static page — no backend, no analytics, no telemetry. Everything you do happens in your browser tab.

**Can I record what I play?**
Not in this version. Recording, playback, score display, and a transport bar are on the roadmap. Track them in the repo's issues if you want to nudge.

**Can I use a real MIDI keyboard?**
Not yet. Web MIDI support would be a nice next addition.

**Does it work on phones / tablets?**
The audio engine works fine on mobile browsers. The on-screen piano is touchable; the computer-keyboard mapping obviously doesn't apply unless you have a physical keyboard attached. Desktop is the primary supported platform.

**How do I host my own copy?**
Run `npm run build` and serve the `dist/` folder from any static host. The build is configured for `https://beatle099.github.io/synth-studio/` — to host elsewhere, edit `vite.config.ts` and change the `base` path.
