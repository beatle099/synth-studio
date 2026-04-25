import { useEffect, useMemo } from 'react';
import {
  SIMPLE_MAP,
  findDuplicateKeys,
  noteToMidi,
} from '../data/keyboardMap';
import type { KeyMapping, KeyboardMappingMode } from '../data/types';

interface Props {
  mappingMode: KeyboardMappingMode;
  customMap: KeyMapping[];
  setCustomMap: (m: KeyMapping[]) => void;
  /** True while the user is in piano-click capture flow. App owns this state. */
  editMode: boolean;
  setEditMode: (b: boolean) => void;
  /** The note awaiting a key assignment, or null. App owns this state. */
  awaitingNote: string | null;
  setAwaitingNote: (n: string | null) => void;
  resetCustomMap: () => void;
}

/**
 * Custom mapping panel. The "edit" toggle is shared with the PianoKeyboard
 * (App owns the flag) so clicking a piano key in edit mode arms a key-capture
 * for that note here.
 */
export function KeyMappingSettings({
  mappingMode,
  customMap,
  setCustomMap,
  editMode,
  setEditMode,
  awaitingNote,
  setAwaitingNote,
  resetCustomMap,
}: Props) {
  const warning = useMemo(() => {
    const dups = findDuplicateKeys(customMap);
    if (dups.length === 0) return null;
    return `Duplicate key${dups.length > 1 ? 's' : ''}: ${dups
      .map((d) => d.toUpperCase())
      .join(', ')} — only the first match wins.`;
  }, [customMap]);

  // Capture a key for the currently-awaiting note.
  useEffect(() => {
    if (!editMode || !awaitingNote) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAwaitingNote(null);
        return;
      }
      // Ignore modifier-only events.
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      e.preventDefault();
      const ck = e.key.toLowerCase();
      const next = customMap.filter((m) => m.note !== awaitingNote);
      next.push({ computerKey: ck, note: awaitingNote, midi: noteToMidi(awaitingNote) });
      next.sort((a, b) => a.midi - b.midi);
      setCustomMap(next);
      setAwaitingNote(null);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [editMode, awaitingNote, customMap, setCustomMap, setAwaitingNote]);

  const removeBinding = (note: string) => {
    setCustomMap(customMap.filter((m) => m.note !== note));
  };

  const seedFromSimple = () => {
    setCustomMap([...SIMPLE_MAP]);
  };

  const sorted = [...customMap].sort((a, b) => a.midi - b.midi);

  return (
    <section className="card mapping-panel" aria-label="Custom keyboard mapping">
      <header className="card-header">
        <h2>Keyboard mapping</h2>
        <span className="muted small">{mappingMode === 'custom' ? 'Custom mode active' : 'Switch Mapping → Custom to use these'}</span>
      </header>

      <div className="row gap small">
        <button
          className={`btn small ${editMode ? 'primary' : ''}`}
          onClick={() => {
            const next = !editMode;
            setEditMode(next);
            if (!next) setAwaitingNote(null);
          }}
        >
          {editMode ? 'Stop editing' : 'Edit by clicking piano keys'}
        </button>
        <button className="btn small" onClick={seedFromSimple}>Seed from Simple</button>
        <button className="btn small ghost" onClick={resetCustomMap}>Clear all</button>
      </div>

      {editMode && (
        <p className="muted small">
          {awaitingNote
            ? <>Press a computer key to bind it to <b>{awaitingNote}</b>. <kbd>Esc</kbd> cancels.</>
            : <>Click any piano key to start binding. Bindings save automatically.</>}
        </p>
      )}

      {warning && <div className="warning small">{warning}</div>}

      {sorted.length === 0
        ? <p className="muted small">No custom bindings yet.</p>
        : (
          <ul className="mapping-list">
            {sorted.map((m) => (
              <li key={m.note} className="mapping-row">
                <span className="mono">{m.note}</span>
                <span className="muted">←</span>
                <span className="mapping-key">{m.computerKey === ' ' ? '␣' : m.computerKey.toUpperCase()}</span>
                <button className="btn small ghost" onClick={() => removeBinding(m.note)} aria-label={`Remove ${m.note}`}>×</button>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
