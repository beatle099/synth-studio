/**
 * Public types for the keyboard system.
 *
 * `KeyboardRange` describes the visible piano range. For numeric octave
 * presets (1–4 octaves) `startNote` is `C{startOctave}` and the range spans
 * `octaveCount` octaves. The full-piano preset uses `startNote = "A0"` and
 * spans 88 semitones (A0–C8) regardless of `octaveCount`.
 */
export type KeyboardRange = {
  startNote: string;
  startOctave: number;
  octaveCount: number;
};

export type KeyboardViewMode =
  | 'compact'
  | 'scrollable'
  | 'fit-to-screen'
  | 'full';

export type KeyboardMappingMode = 'simple' | 'extended' | 'custom';

export type KeyMapping = {
  computerKey: string;
  note: string;
  midi: number;
};

export type LabelMode = 'all' | 'note' | 'key' | 'none';
