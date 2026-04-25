import { useEffect } from 'react';
import { DRUM_HITS, type DrumHit } from '../audio/engine';

interface Props {
  onHit: (hit: DrumHit) => void;
}

const KEY_TO_HIT: Record<string, DrumHit> = {
  '1': 'kick', '2': 'snare', '3': 'hihat', '4': 'tom', '5': 'clap',
};

export function DrumPad({ onHit }: Props) {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const hit = KEY_TO_HIT[e.key];
      if (hit) onHit(hit);
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onHit]);

  return (
    <section className="card">
      <header className="card-header">
        <h2>Drum Pads</h2>
        <span className="muted small">keys <code>1</code>–<code>5</code></span>
      </header>
      <div className="drum-grid">
        {DRUM_HITS.map((h, i) => (
          <button key={h} className="drum-pad" onMouseDown={() => onHit(h)}>
            <b>{h}</b>
            <span className="muted small">{i + 1}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
