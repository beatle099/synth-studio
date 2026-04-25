import { RANGE_PRESETS, isFullPiano, presetForRange } from '../data/keyboardMap';
import type {
  KeyboardMappingMode,
  KeyboardRange,
  KeyboardViewMode,
  LabelMode,
} from '../data/types';

interface Props {
  range: KeyboardRange;
  setRange: (r: KeyboardRange) => void;
  octaveShift: number;
  setOctaveShift: (n: number) => void;
  viewMode: KeyboardViewMode;
  setViewMode: (v: KeyboardViewMode) => void;
  labelMode: LabelMode;
  setLabelMode: (l: LabelMode) => void;
  mappingMode: KeyboardMappingMode;
  setMappingMode: (m: KeyboardMappingMode) => void;
}

const VIEW_MODES: { id: KeyboardViewMode; label: string }[] = [
  { id: 'compact',       label: 'Compact' },
  { id: 'fit-to-screen', label: 'Fit' },
  { id: 'scrollable',    label: 'Scroll' },
  { id: 'full',          label: 'Full' },
];

const LABEL_MODES: { id: LabelMode; label: string }[] = [
  { id: 'all', label: 'Note + Key' },
  { id: 'note', label: 'Note only' },
  { id: 'key', label: 'Key only' },
  { id: 'none', label: 'Off' },
];

const MAPPING_MODES: { id: KeyboardMappingMode; label: string }[] = [
  { id: 'simple',   label: 'Simple (2-oct)' },
  { id: 'extended', label: 'Extended (3-row)' },
  { id: 'custom',   label: 'Custom' },
];

export function KeyboardControlBar({
  range,
  setRange,
  octaveShift,
  setOctaveShift,
  viewMode,
  setViewMode,
  labelMode,
  setLabelMode,
  mappingMode,
  setMappingMode,
}: Props) {
  const preset = presetForRange(range);
  const fullPiano = isFullPiano(range);

  return (
    <div className="control-bar" role="region" aria-label="Keyboard controls">
      <label className="bar-field">
        <span className="bar-label">Range</span>
        <select
          value={preset?.id ?? '2'}
          onChange={(e) => {
            const next = RANGE_PRESETS.find((p) => p.id === e.target.value);
            if (next) setRange(next.range);
          }}
        >
          {RANGE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </label>

      <div className="bar-field">
        <span className="bar-label">Octave shift</span>
        <div className="row gap small">
          <button className="btn small" onClick={() => setOctaveShift(Math.max(-3, octaveShift - 1))} title="Octave down">− oct</button>
          <span className="badge mono">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
          <button className="btn small" onClick={() => setOctaveShift(Math.min(3, octaveShift + 1))} title="Octave up">+ oct</button>
          <button className="btn small ghost" onClick={() => setOctaveShift(0)} title="Reset">Reset</button>
        </div>
      </div>

      {!fullPiano && (
        <div className="bar-field">
          <span className="bar-label">Start octave</span>
          <div className="row gap small">
            <button
              className="btn small"
              onClick={() => setRange({ ...range, startOctave: Math.max(0, range.startOctave - 1), startNote: `C${Math.max(0, range.startOctave - 1)}` })}
              disabled={range.startOctave <= 0}
            >−</button>
            <span className="badge mono">C{range.startOctave}</span>
            <button
              className="btn small"
              onClick={() => setRange({ ...range, startOctave: Math.min(7, range.startOctave + 1), startNote: `C${Math.min(7, range.startOctave + 1)}` })}
              disabled={range.startOctave + range.octaveCount >= 8}
            >+</button>
          </div>
        </div>
      )}

      <label className="bar-field">
        <span className="bar-label">View</span>
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value as KeyboardViewMode)}>
          {VIEW_MODES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </label>

      <label className="bar-field">
        <span className="bar-label">Labels</span>
        <select value={labelMode} onChange={(e) => setLabelMode(e.target.value as LabelMode)}>
          {LABEL_MODES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </label>

      <label className="bar-field">
        <span className="bar-label">Mapping</span>
        <select value={mappingMode} onChange={(e) => setMappingMode(e.target.value as KeyboardMappingMode)}>
          {MAPPING_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
    </div>
  );
}
