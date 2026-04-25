import type {
  KeyboardMappingMode,
  KeyboardRange,
  KeyboardViewMode,
  LabelMode,
} from './types';

const KEY = 'synth-studio.preferences';

export interface Preferences {
  range: KeyboardRange;
  viewMode: KeyboardViewMode;
  mappingMode: KeyboardMappingMode;
  labelMode: LabelMode;
  octaveShift: number;
}

const DEFAULT_PREFS: Preferences = {
  range: { startNote: 'C4', startOctave: 4, octaveCount: 2 },
  viewMode: 'fit-to-screen',
  mappingMode: 'simple',
  labelMode: 'all',
  octaveShift: 0,
};

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      range: { ...DEFAULT_PREFS.range, ...parsed.range },
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePreferences(p: Preferences): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}
