import type { ADSR, Waveform } from '../audio/synthEngine';

interface Props {
  waveform: Waveform;
  setWaveform: (w: Waveform) => void;
  volume: number;
  setVolume: (v: number) => void;
  adsr: ADSR;
  setADSR: (patch: Partial<ADSR>) => void;
  octaveShift: number;
  setOctaveShift: (n: number) => void;
  onPanic: () => void;
}

const WAVEFORMS: Waveform[] = ['sine', 'square', 'sawtooth', 'triangle'];

export function SynthControls({
  waveform,
  setWaveform,
  volume,
  setVolume,
  adsr,
  setADSR,
  octaveShift,
  setOctaveShift,
  onPanic,
}: Props) {
  return (
    <section className="controls" aria-label="Synth controls">
      <div className="control-group">
        <label className="control-label">Waveform</label>
        <div className="segmented">
          {WAVEFORMS.map((w) => (
            <button
              key={w}
              type="button"
              className={`seg ${waveform === w ? 'active' : ''}`}
              onClick={() => setWaveform(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">
          Master volume <span className="value">{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range" min={0} max={1} step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>

      <div className="control-group adsr">
        <label className="control-label">ADSR envelope</label>
        <div className="adsr-grid">
          {(['attack', 'decay', 'release'] as const).map((k) => (
            <label key={k} className="adsr-slider">
              <span className="capitalize">{k}</span>
              <input
                type="range" min={0} max={2} step={0.01}
                value={adsr[k]}
                onChange={(e) => setADSR({ [k]: parseFloat(e.target.value) })}
              />
              <span className="value">{adsr[k].toFixed(2)}s</span>
            </label>
          ))}
          <label className="adsr-slider">
            <span>Sustain</span>
            <input
              type="range" min={0} max={1} step={0.01}
              value={adsr.sustain}
              onChange={(e) => setADSR({ sustain: parseFloat(e.target.value) })}
            />
            <span className="value">{adsr.sustain.toFixed(2)}</span>
          </label>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">
          Octave shift <span className="value">{octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
        </label>
        <div className="row gap">
          <button type="button" className="btn" onClick={() => setOctaveShift(Math.max(-3, octaveShift - 1))}>
            Z · −
          </button>
          <button type="button" className="btn" onClick={() => setOctaveShift(0)}>Reset</button>
          <button type="button" className="btn" onClick={() => setOctaveShift(Math.min(3, octaveShift + 1))}>
            X · +
          </button>
        </div>
      </div>

      <div className="control-group">
        <button type="button" className="btn panic" onClick={onPanic}>
          Panic · stop all notes
        </button>
      </div>
    </section>
  );
}
