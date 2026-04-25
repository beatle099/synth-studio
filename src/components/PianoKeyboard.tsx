import { PIANO_RANGE, isBlack, labelForPianoNote } from '../data/keyboardMap';

interface PianoKeyboardProps {
  /** Set of currently sounding note ids (e.g. "C4", "F#5"). */
  activeNotes: ReadonlySet<string>;
  /** Current global octave shift; used to display the matching key label. */
  octaveShift: number;
  /** Mouse press = note on. */
  onAttack: (noteId: string) => void;
  /** Mouse release / leave = note off. */
  onRelease: (noteId: string) => void;
}

export function PianoKeyboard({
  activeNotes,
  octaveShift,
  onAttack,
  onRelease,
}: PianoKeyboardProps) {
  const whites = PIANO_RANGE.filter((p) => !isBlack(p.noteName));

  return (
    <div className="piano" role="group" aria-label="On-screen piano keyboard">
      {whites.map(({ noteName, octave }) => {
        const noteId = `${noteName}${octave}`;
        const sharpName = `${noteName}#`;
        const sharpId = `${sharpName}${octave}`;
        const hasSharp = noteName !== 'E' && noteName !== 'B';

        const whiteLabel = labelForPianoNote(noteId, octaveShift);
        const blackLabel = hasSharp ? labelForPianoNote(sharpId, octaveShift) : undefined;

        return (
          <div key={noteId} className="key-slot">
            <button
              type="button"
              className={`key white ${activeNotes.has(noteId) ? 'active' : ''}`}
              onMouseDown={() => onAttack(noteId)}
              onMouseUp={() => onRelease(noteId)}
              onMouseLeave={() => activeNotes.has(noteId) && onRelease(noteId)}
              aria-label={`Piano key ${noteId}`}
              aria-pressed={activeNotes.has(noteId)}
            >
              <span className="key-note">{noteId}</span>
              {whiteLabel && <span className="key-label">{whiteLabel}</span>}
            </button>

            {hasSharp && (
              <button
                type="button"
                className={`key black ${activeNotes.has(sharpId) ? 'active' : ''}`}
                onMouseDown={(e) => { e.stopPropagation(); onAttack(sharpId); }}
                onMouseUp={(e) => { e.stopPropagation(); onRelease(sharpId); }}
                onMouseLeave={() => activeNotes.has(sharpId) && onRelease(sharpId)}
                aria-label={`Piano key ${sharpId}`}
                aria-pressed={activeNotes.has(sharpId)}
              >
                {blackLabel && <span className="key-label">{blackLabel}</span>}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
