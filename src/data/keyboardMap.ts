import type {
  KeyMapping,
  KeyboardMappingMode,
  KeyboardRange,
} from './types';

export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTE_NAMES: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const SEMITONE_OF: Record<NoteName, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

/** MIDI note number for a noteId like "C4" (60) or "F#5" (78). */
export function noteToMidi(noteId: string): number {
  const m = noteId.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) throw new Error(`Invalid note id: ${noteId}`);
  return (parseInt(m[2], 10) + 1) * 12 + SEMITONE_OF[m[1] as NoteName];
}

export function midiToNote(midi: number): string {
  const oct = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  return `${name}${oct}`;
}

export function isBlack(noteId: string): boolean {
  return noteId.includes('#');
}

const FULL_PIANO_START = 21; // A0
const FULL_PIANO_END = 108;  // C8

/** [start, end] MIDI note numbers for a range, inclusive. */
export function rangeMidi(range: KeyboardRange): { start: number; end: number } {
  if (isFullPiano(range)) return { start: FULL_PIANO_START, end: FULL_PIANO_END };
  const start = noteToMidi(range.startNote);
  const end = start + range.octaveCount * 12 - 1;
  return { start, end };
}

export function isFullPiano(range: KeyboardRange): boolean {
  return range.startNote.startsWith('A0') || range.octaveCount >= 7;
}

/** All noteIds in the visible range, low → high. */
export function rangeNotes(range: KeyboardRange): string[] {
  const { start, end } = rangeMidi(range);
  const out: string[] = [];
  for (let m = start; m <= end; m++) out.push(midiToNote(m));
  return out;
}

// ---------- Range presets ----------

export interface RangePreset {
  id: string;
  label: string;
  range: KeyboardRange;
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: '1',    label: '1 octave  · C4–B4',  range: { startNote: 'C4', startOctave: 4, octaveCount: 1 } },
  { id: '2',    label: '2 octaves · C4–B5',  range: { startNote: 'C4', startOctave: 4, octaveCount: 2 } },
  { id: '3',    label: '3 octaves · C3–B5',  range: { startNote: 'C3', startOctave: 3, octaveCount: 3 } },
  { id: '4',    label: '4 octaves · C2–B5',  range: { startNote: 'C2', startOctave: 2, octaveCount: 4 } },
  { id: 'full', label: 'Full 88-key · A0–C8', range: { startNote: 'A0', startOctave: 0, octaveCount: 7 } },
];

export function presetForRange(range: KeyboardRange): RangePreset | undefined {
  return RANGE_PRESETS.find(
    (p) =>
      p.range.startNote === range.startNote &&
      p.range.octaveCount === range.octaveCount,
  );
}

/** Shift the start of a range by `delta` octaves while keeping its size. */
export function shiftRangeOctave(range: KeyboardRange, delta: number): KeyboardRange {
  if (isFullPiano(range)) return range; // full piano has nothing to shift
  const newOct = Math.max(0, Math.min(7, range.startOctave + delta));
  return {
    startNote: `C${newOct}`,
    startOctave: newOct,
    octaveCount: range.octaveCount,
  };
}

// ---------- Mapping definitions ----------

function mk(key: string, note: string): KeyMapping {
  return { computerKey: key, note, midi: noteToMidi(note) };
}

/**
 * Simple Mode — 2-octave beginner mapping (C4–F5).
 * Octave shift uses Z (down) and X (up).
 */
export const SIMPLE_MAP: KeyMapping[] = [
  mk('a', 'C4'),  mk('w', 'C#4'), mk('s', 'D4'),  mk('e', 'D#4'),
  mk('d', 'E4'),  mk('f', 'F4'),  mk('t', 'F#4'), mk('g', 'G4'),
  mk('y', 'G#4'), mk('h', 'A4'),  mk('u', 'A#4'), mk('j', 'B4'),
  mk('k', 'C5'),  mk('o', 'C#5'), mk('l', 'D5'),  mk('p', 'D#5'),
  mk(';', 'E5'),  mk("'", 'F5'),
];

/**
 * Extended Mode — 3-row mapping covering C3–F5 with no key conflicts.
 * Lower row Z–M = C3–B3 with the number row 2/3/5/6/7 supplying the sharps.
 * Middle row reuses Simple's mapping for C4–B4 + C5–F5.
 * Octave shift uses [ (down) and ] (up) in this mode because Z/X are taken.
 */
export const EXTENDED_MAP: KeyMapping[] = [
  // Lower octave C3–B3
  mk('z', 'C3'), mk('2', 'C#3'),
  mk('x', 'D3'), mk('3', 'D#3'),
  mk('c', 'E3'),
  mk('v', 'F3'), mk('5', 'F#3'),
  mk('b', 'G3'), mk('6', 'G#3'),
  mk('n', 'A3'), mk('7', 'A#3'),
  mk('m', 'B3'),
  // Middle octave C4–B4
  mk('a', 'C4'),  mk('w', 'C#4'), mk('s', 'D4'),  mk('e', 'D#4'),
  mk('d', 'E4'),  mk('f', 'F4'),  mk('t', 'F#4'), mk('g', 'G4'),
  mk('y', 'G#4'), mk('h', 'A4'),  mk('u', 'A#4'), mk('j', 'B4'),
  // Upper extension C5–F5
  mk('k', 'C5'),  mk('o', 'C#5'), mk('l', 'D5'),  mk('p', 'D#5'),
  mk(';', 'E5'),  mk("'", 'F5'),
];

// ---------- Custom map storage ----------

const CUSTOM_MAP_KEY = 'synth-studio.custom-keymap';

export function loadCustomMap(): KeyMapping[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MAP_KEY);
    if (!raw) return [...SIMPLE_MAP];
    const parsed = JSON.parse(raw) as KeyMapping[];
    // Defensive: ensure midi is recomputed from note in case the format ever drifts.
    return parsed.map((m) => ({ ...m, midi: noteToMidi(m.note) }));
  } catch {
    return [...SIMPLE_MAP];
  }
}

export function saveCustomMap(map: KeyMapping[]): void {
  localStorage.setItem(CUSTOM_MAP_KEY, JSON.stringify(map));
}

export function clearCustomMap(): void {
  localStorage.removeItem(CUSTOM_MAP_KEY);
}

// ---------- Lookups ----------

export function mappingForMode(
  mode: KeyboardMappingMode,
  customMap: KeyMapping[],
): KeyMapping[] {
  if (mode === 'simple') return SIMPLE_MAP;
  if (mode === 'extended') return EXTENDED_MAP;
  return customMap;
}

export function lookupKey(
  key: string,
  mappings: KeyMapping[],
): KeyMapping | undefined {
  const lower = key.toLowerCase();
  return mappings.find((m) => m.computerKey === lower);
}

/** Apply the global octave shift to a mapping and return the sounding noteId. */
export function resolveNote(mapping: KeyMapping, octaveShift: number): string {
  return midiToNote(mapping.midi + octaveShift * 12);
}

/**
 * Find the keyboard label that currently sounds the given piano note.
 * Honours both the active mappings and the global octave shift.
 */
export function labelForNote(
  noteId: string,
  octaveShift: number,
  mappings: KeyMapping[],
): string | undefined {
  const targetMidi = noteToMidi(noteId);
  const sourceMidi = targetMidi - octaveShift * 12;
  const mapping = mappings.find((m) => m.midi === sourceMidi);
  if (!mapping) return undefined;
  return mapping.computerKey === ' ' ? '␣' : mapping.computerKey.toUpperCase();
}

/** Return any duplicate computer-key bindings within a mapping. */
export function findDuplicateKeys(mappings: KeyMapping[]): string[] {
  const seen = new Map<string, number>();
  for (const m of mappings) seen.set(m.computerKey, (seen.get(m.computerKey) ?? 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

/**
 * Octave-shift hot-keys per mapping mode. Simple mode reserves Z/X; extended
 * mode uses Z/X as note keys, so it falls back to bracket keys.
 */
export function octaveShiftKeysFor(mode: KeyboardMappingMode): { down: string; up: string } {
  if (mode === 'simple') return { down: 'z', up: 'x' };
  return { down: '[', up: ']' };
}
