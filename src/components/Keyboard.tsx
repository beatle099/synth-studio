import { useEffect, useMemo, useState } from 'react';

interface KeyboardProps {
  onAttack: (note: string) => void;
  onRelease: (note: string) => void;
  baseOctave: number;
  setBaseOctave: (o: number) => void;
}

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const BLACK_OFFSETS: Record<string, string | null> = {
  C: 'C#', D: 'D#', E: null, F: 'F#', G: 'G#', A: 'A#', B: null,
};

// Computer-keyboard mapping for two octaves starting from baseOctave.
// Lower row (a..k) = first octave, upper row (q..i) = sharps for first octave,
// and we extend: k l ; ' = next-octave white keys; o p [ = next-octave sharps.
const KEY_MAP: Array<{ key: string; offset: number; sharp: boolean }> = [
  { key: 'a', offset: 0, sharp: false }, // C
  { key: 'w', offset: 1, sharp: true },  // C#
  { key: 's', offset: 2, sharp: false }, // D
  { key: 'e', offset: 3, sharp: true },  // D#
  { key: 'd', offset: 4, sharp: false }, // E
  { key: 'f', offset: 5, sharp: false }, // F
  { key: 't', offset: 6, sharp: true },  // F#
  { key: 'g', offset: 7, sharp: false }, // G
  { key: 'y', offset: 8, sharp: true },  // G#
  { key: 'h', offset: 9, sharp: false }, // A
  { key: 'u', offset: 10, sharp: true }, // A#
  { key: 'j', offset: 11, sharp: false },// B
  { key: 'k', offset: 12, sharp: false },// C+1
  { key: 'o', offset: 13, sharp: true }, // C#+1
  { key: 'l', offset: 14, sharp: false },// D+1
  { key: 'p', offset: 15, sharp: true }, // D#+1
  { key: ';', offset: 16, sharp: false },// E+1
  { key: "'", offset: 17, sharp: false },// F+1
];

function offsetToNote(offset: number, baseOctave: number): string {
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const oct = baseOctave + Math.floor(offset / 12);
  const pc = chromatic[((offset % 12) + 12) % 12];
  return `${pc}${oct}`;
}

export function Keyboard({ onAttack, onRelease, baseOctave, setBaseOctave }: KeyboardProps) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const whiteKeys = useMemo(() => {
    const out: Array<{ note: string; sharpAfter: string | null }> = [];
    for (let oct = baseOctave; oct < baseOctave + 2; oct++) {
      for (const w of WHITE_NOTES) {
        const sharp = BLACK_OFFSETS[w];
        out.push({ note: `${w}${oct}`, sharpAfter: sharp ? `${sharp}${oct}` : null });
      }
    }
    return out;
  }, [baseOctave]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { setBaseOctave(Math.max(0, baseOctave - 1)); return; }
      if (k === 'x') { setBaseOctave(Math.min(7, baseOctave + 1)); return; }
      const map = KEY_MAP.find((m) => m.key === k);
      if (!map) return;
      const note = offsetToNote(map.offset, baseOctave);
      setActive((prev) => {
        if (prev.has(note)) return prev;
        const next = new Set(prev);
        next.add(note);
        return next;
      });
      onAttack(note);
    };
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const map = KEY_MAP.find((m) => m.key === k);
      if (!map) return;
      const note = offsetToNote(map.offset, baseOctave);
      setActive((prev) => {
        if (!prev.has(note)) return prev;
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
      onRelease(note);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [baseOctave, onAttack, onRelease, setBaseOctave]);

  const press = (note: string) => {
    setActive((p) => new Set(p).add(note));
    onAttack(note);
  };
  const release = (note: string) => {
    setActive((p) => { const n = new Set(p); n.delete(note); return n; });
    onRelease(note);
  };

  return (
    <div className="keyboard-wrap">
      <div className="keyboard">
        {whiteKeys.map(({ note, sharpAfter }) => (
          <div key={note} className="key-slot">
            <button
              className={`white-key ${active.has(note) ? 'active' : ''}`}
              onMouseDown={() => press(note)}
              onMouseUp={() => release(note)}
              onMouseLeave={() => active.has(note) && release(note)}
            >
              <span className="key-label">{note}</span>
            </button>
            {sharpAfter && (
              <button
                className={`black-key ${active.has(sharpAfter) ? 'active' : ''}`}
                onMouseDown={(e) => { e.stopPropagation(); press(sharpAfter); }}
                onMouseUp={(e) => { e.stopPropagation(); release(sharpAfter); }}
                onMouseLeave={() => active.has(sharpAfter) && release(sharpAfter)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="keyboard-hint">
        Computer keys: <code>a w s e d f t g y h u j</code> (lower octave) · <code>k o l p ; '</code> (upper) · <code>z</code>/<code>x</code> octave −/+
      </div>
    </div>
  );
}
