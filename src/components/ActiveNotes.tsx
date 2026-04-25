interface Props {
  notes: ReadonlySet<string>;
}

/**
 * Render the currently-sounding notes as ordered pitch chips.
 * Order is by pitch ascending so chords look stable as they arpeggiate.
 */
export function ActiveNotes({ notes }: Props) {
  const sorted = [...notes].sort((a, b) => compareNotes(a, b));
  return (
    <section className="active-notes" aria-live="polite" aria-label="Active notes">
      <span className="control-label">Active notes</span>
      {sorted.length === 0
        ? <span className="muted small">— silent —</span>
        : (
          <ul className="chip-list">
            {sorted.map((n) => <li key={n} className="chip">{n}</li>)}
          </ul>
        )}
    </section>
  );
}

function compareNotes(a: string, b: string): number {
  const re = /^([A-G]#?)(-?\d+)$/;
  const ma = a.match(re);
  const mb = b.match(re);
  if (!ma || !mb) return a.localeCompare(b);
  const order: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
    'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  const sa = parseInt(ma[2], 10) * 12 + order[ma[1]];
  const sb = parseInt(mb[2], 10) * 12 + order[mb[1]];
  return sa - sb;
}
