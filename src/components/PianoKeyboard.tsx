import { forwardRef, useMemo } from 'react';
import {
  isBlack,
  labelForNote,
  rangeNotes,
} from '../data/keyboardMap';
import type {
  KeyMapping,
  KeyboardRange,
  KeyboardViewMode,
  LabelMode,
} from '../data/types';

interface PianoKeyboardProps {
  range: KeyboardRange;
  viewMode: KeyboardViewMode;
  labelMode: LabelMode;
  mappings: KeyMapping[];
  octaveShift: number;
  activeNotes: ReadonlySet<string>;
  /** When true, clicking a key invokes onPianoKeyClick instead of onAttack/onRelease. */
  editMode?: boolean;
  /** Note id awaiting a key assignment in edit mode (highlights the target). */
  awaitingNote?: string | null;
  onAttack: (noteId: string) => void;
  onRelease: (noteId: string) => void;
  onPianoKeyClick?: (noteId: string) => void;
}

/**
 * A grid-based renderer for the piano. White keys are placed in the grid in
 * order; each black key is rendered as an absolutely-positioned child of the
 * white-key slot that immediately follows it (which keeps the offset correct
 * regardless of view mode or width).
 */
export const PianoKeyboard = forwardRef<HTMLDivElement, PianoKeyboardProps>(
  function PianoKeyboard(
    {
      range,
      viewMode,
      labelMode,
      mappings,
      octaveShift,
      activeNotes,
      editMode = false,
      awaitingNote = null,
      onAttack,
      onRelease,
      onPianoKeyClick,
    },
    ref,
  ) {
    const notes = useMemo(() => rangeNotes(range), [range]);
    const showNote = labelMode === 'all' || labelMode === 'note';
    const showKey = labelMode === 'all' || labelMode === 'key';

    // Walk in order; each white key owns the *previous* black key (if any),
    // rendered as an absolutely-positioned child to its left.
    const items: Array<{ white: string; precedingBlack: string | null }> = [];
    let pendingBlack: string | null = null;
    for (const id of notes) {
      if (isBlack(id)) {
        pendingBlack = id;
        continue;
      }
      items.push({ white: id, precedingBlack: pendingBlack });
      pendingBlack = null;
    }

    const handlePress = (noteId: string) => {
      if (editMode) {
        onPianoKeyClick?.(noteId);
        return;
      }
      onAttack(noteId);
    };
    const handleRelease = (noteId: string) => {
      if (editMode) return;
      onRelease(noteId);
    };

    return (
      <div
        ref={ref}
        className={`piano-wrap view-${viewMode} ${editMode ? 'edit-mode' : ''}`}
      >
        <div className="piano">
          {items.map(({ white, precedingBlack }, idx) => {
            const whiteActive = activeNotes.has(white);
            const whiteAwaiting = editMode && awaitingNote === white;
            const blackActive = precedingBlack ? activeNotes.has(precedingBlack) : false;
            const blackAwaiting = editMode && precedingBlack && awaitingNote === precedingBlack;

            const whiteLabel = labelForNote(white, octaveShift, mappings);
            const blackLabel = precedingBlack
              ? labelForNote(precedingBlack, octaveShift, mappings)
              : undefined;

            const isOctaveStart = white.startsWith('C') && !white.includes('#');

            return (
              <div key={white} className={`key-slot ${isOctaveStart && idx > 0 ? 'octave-start' : ''}`}>
                {precedingBlack && (
                  <button
                    type="button"
                    className={`key black ${blackActive ? 'active' : ''} ${blackAwaiting ? 'awaiting' : ''}`}
                    onMouseDown={(e) => { e.stopPropagation(); handlePress(precedingBlack); }}
                    onMouseUp={(e) => { e.stopPropagation(); handleRelease(precedingBlack); }}
                    onMouseLeave={() => activeNotes.has(precedingBlack) && handleRelease(precedingBlack)}
                    aria-label={`Piano key ${precedingBlack}`}
                    aria-pressed={blackActive}
                    title={precedingBlack}
                  >
                    {showKey && blackLabel && <span className="key-label">{blackLabel}</span>}
                  </button>
                )}
                <button
                  type="button"
                  className={`key white ${whiteActive ? 'active' : ''} ${whiteAwaiting ? 'awaiting' : ''}`}
                  onMouseDown={() => handlePress(white)}
                  onMouseUp={() => handleRelease(white)}
                  onMouseLeave={() => whiteActive && handleRelease(white)}
                  aria-label={`Piano key ${white}`}
                  aria-pressed={whiteActive}
                  title={white}
                >
                  {showNote && <span className="key-note">{white}</span>}
                  {showKey && whiteLabel && <span className="key-label">{whiteLabel}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
