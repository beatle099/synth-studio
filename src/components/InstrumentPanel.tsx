import { engine, type InstrumentId } from '../audio/engine';

interface Props {
  instrument: InstrumentId;
  setInstrument: (id: InstrumentId) => void;
  volume: number;
  setVolume: (v: number) => void;
}

const PITCHED: { id: InstrumentId; label: string; hint: string }[] = [
  { id: 'synth', label: 'Synth', hint: 'sawtooth lead' },
  { id: 'guitar', label: 'Guitar', hint: 'load a sample' },
  { id: 'bass', label: 'Bass', hint: 'load a sample' },
  { id: 'vocal', label: 'Vocal', hint: 'load a sample' },
];

export function InstrumentPanel({ instrument, setInstrument, volume, setVolume }: Props) {
  return (
    <section className="card">
      <header className="card-header">
        <h2>Keyboard Instrument</h2>
        <label className="row gap small">
          Master
          <input
            type="range" min={0} max={1} step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </label>
      </header>
      <div className="instrument-grid">
        {PITCHED.map((p) => {
          const loaded = p.id !== 'synth' && engine.hasSamples(p.id);
          return (
            <button
              key={p.id}
              className={`pill ${instrument === p.id ? 'active' : ''}`}
              onClick={() => setInstrument(p.id)}
            >
              <b>{p.label}</b>
              <span className="muted small">{loaded ? 'sample loaded' : p.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
