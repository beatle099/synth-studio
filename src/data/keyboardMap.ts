export interface KeyMapping {
  /** Computer-keyboard key, lowercase. */
  key: string;
  /** Display label shown on the piano key. */
  label: string;
  /** Base note name without octave: 'C', 'C#', 'D', etc. */
  noteName: NoteName;
  /** Octave at zero shift. The lower row plays octave 4, the upper row plays octave 5. */
  baseOctave: number;
}

export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Map of computer-keyboard keys to piano notes.
 * The lower row covers a full octave starting at C4; the upper row continues
 * through C5..F5 so users have access to the top of the second octave.
 *
 * The actual sounding note is `noteName + (baseOctave + octaveShift)`.
 */
export const KEYBOARD_MAP: KeyMapping[] = [
  // Lower octave
  { key: 'a', label: 'A', noteName: 'C',  baseOctave: 4 },
  { key: 'w', label: 'W', noteName: 'C#', baseOctave: 4 },
  { key: 's', label: 'S', noteName: 'D',  baseOctave: 4 },
  { key: 'e', label: 'E', noteName: 'D#', baseOctave: 4 },
  { key: 'd', label: 'D', noteName: 'E',  baseOctave: 4 },
  { key: 'f', label: 'F', noteName: 'F',  baseOctave: 4 },
  { key: 't', label: 'T', noteName: 'F#', baseOctave: 4 },
  { key: 'g', label: 'G', noteName: 'G',  baseOctave: 4 },
  { key: 'y', label: 'Y', noteName: 'G#', baseOctave: 4 },
  { key: 'h', label: 'H', noteName: 'A',  baseOctave: 4 },
  { key: 'u', label: 'U', noteName: 'A#', baseOctave: 4 },
  { key: 'j', label: 'J', noteName: 'B',  baseOctave: 4 },
  // Upper octave
  { key: 'k', label: 'K', noteName: 'C',  baseOctave: 5 },
  { key: 'o', label: 'O', noteName: 'C#', baseOctave: 5 },
  { key: 'l', label: 'L', noteName: 'D',  baseOctave: 5 },
  { key: 'p', label: 'P', noteName: 'D#', baseOctave: 5 },
  { key: ';', label: ';', noteName: 'E',  baseOctave: 5 },
  { key: "'", label: "'", noteName: 'F',  baseOctave: 5 },
];

/**
 * Build the lookup table once. Keys arrive from KeyboardEvent in lower case.
 */
const KEY_INDEX: Map<string, KeyMapping> = new Map(KEYBOARD_MAP.map((m) => [m.key, m]));

export function lookupKey(key: string): KeyMapping | undefined {
  return KEY_INDEX.get(key.toLowerCase());
}

/**
 * Resolve a `KeyMapping` and the global `octaveShift` to a note id like "C4".
 */
export function resolveNote(mapping: KeyMapping, octaveShift: number): string {
  return `${mapping.noteName}${mapping.baseOctave + octaveShift}`;
}

/**
 * The fixed two octaves (C4–B5) rendered on screen.
 * The displayed labels follow the active octave shift via lookupLabelForNote.
 */
export const PIANO_RANGE: { noteName: NoteName; octave: number }[] = (() => {
  const out: { noteName: NoteName; octave: number }[] = [];
  for (const oct of [4, 5]) {
    for (const n of NOTE_NAMES) out.push({ noteName: n, octave: oct });
  }
  return out;
})();

export function isBlack(noteName: NoteName): boolean {
  return noteName.endsWith('#');
}

/**
 * Given a piano note id (e.g. "D5") and the current octave shift,
 * return the keyboard label that would currently sound that note, if any.
 * This lets the keyboard show shifted labels.
 */
export function labelForPianoNote(pianoNoteId: string, octaveShift: number): string | undefined {
  const m = pianoNoteId.match(/^([A-G]#?)(\d)$/);
  if (!m) return undefined;
  const [, name, octStr] = m;
  const targetOct = parseInt(octStr, 10);
  const sourceOct = targetOct - octaveShift;
  const mapping = KEYBOARD_MAP.find((k) => k.noteName === name && k.baseOctave === sourceOct);
  return mapping?.label;
}
