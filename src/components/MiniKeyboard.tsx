import { useMemo } from 'react';
import { isBlack, midiToNote, rangeMidi } from '../data/keyboardMap';
import type { KeyboardRange } from '../data/types';

interface Props {
  visibleRange: KeyboardRange;
  /** Global octave shift; used to compute the played-range overlay. */
  octaveShift: number;
  activeNotes: ReadonlySet<string>;
  /** Click handler — receives the new visible range starting note's MIDI. */
  onJumpTo: (startMidi: number) => void;
}

/**
 * Always shows the full 88-key piano (A0–C8). The currently visible range is
 * rendered as a coloured band; clicking anywhere on the strip recentres the
 * visible range so the click point becomes the start of the visible window.
 */
export function MiniKeyboard({ visibleRange, octaveShift, activeNotes, onJumpTo }: Props) {
  const notes = useMemo(() => {
    const out: { id: string; midi: number; black: boolean }[] = [];
    for (let m = 21; m <= 108; m++) {
      const id = midiToNote(m);
      out.push({ id, midi: m, black: isBlack(id) });
    }
    return out;
  }, []);

  const whiteCount = notes.filter((n) => !n.black).length;
  const visible = rangeMidi(visibleRange);

  // Build a stripe per white key; black keys are inserted as overlays.
  const whites = notes.filter((n) => !n.black);
  const blacks = notes.filter((n) => n.black);

  const whiteWidth = `${100 / whiteCount}%`;

  // Compute visible-range overlay extents in white-key index space.
  const firstWhiteIdx = whites.findIndex((w) => w.midi >= visible.start);
  const lastWhiteIdx = (() => {
    for (let i = whites.length - 1; i >= 0; i--) {
      if (whites[i].midi <= visible.end) return i;
    }
    return whites.length - 1;
  })();

  const overlayLeft = `${(firstWhiteIdx / whiteCount) * 100}%`;
  const overlayRight = `${((whiteCount - lastWhiteIdx - 1) / whiteCount) * 100}%`;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const whiteIdx = Math.floor(ratio * whiteCount);
    const target = whites[Math.min(Math.max(whiteIdx, 0), whiteCount - 1)];
    onJumpTo(target.midi);
  };

  return (
    <div className="mini-keyboard" role="img" aria-label="Mini keyboard navigator">
      <div className="mini-meta">
        <span className="muted small">Full A0–C8 · click to jump</span>
        <span className="muted small">
          Visible {midiToNote(visible.start)}–{midiToNote(visible.end)} · shift {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
        </span>
      </div>
      <div className="mini-strip" onClick={handleClick} role="button" tabIndex={0}>
        <div className="mini-whites">
          {whites.map((n) => (
            <div
              key={n.id}
              className={`mini-w ${activeNotes.has(n.id) ? 'active' : ''}`}
              style={{ width: whiteWidth }}
            />
          ))}
        </div>
        <div className="mini-blacks">
          {blacks.map((n) => {
            // Position based on the white that immediately precedes this black key.
            const precedingWhiteIdx = whites.findIndex((w) => w.midi > n.midi) - 1;
            const left = `${((precedingWhiteIdx + 0.7) / whiteCount) * 100}%`;
            return (
              <div
                key={n.id}
                className={`mini-b ${activeNotes.has(n.id) ? 'active' : ''}`}
                style={{ left, width: `${(0.6 / whiteCount) * 100}%` }}
              />
            );
          })}
        </div>
        <div
          className="mini-overlay"
          style={{ left: overlayLeft, right: overlayRight }}
          aria-hidden
        />
      </div>
    </div>
  );
}
