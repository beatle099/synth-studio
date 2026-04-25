import { useState } from 'react';
import {
  engine,
  MIXER_CHANNELS,
  DEFAULT_CHANNEL_STATE,
  type InstrumentId,
  type ChannelState,
} from '../audio/engine';

const LABELS: Record<InstrumentId, string> = {
  synth: 'Synth',
  guitar: 'Guitar',
  bass: 'Bass',
  vocal: 'Vocal',
  drums: 'Drums',
};

function init(): Record<InstrumentId, ChannelState> {
  return MIXER_CHANNELS.reduce((acc, id) => {
    acc[id] = { ...DEFAULT_CHANNEL_STATE };
    return acc;
  }, {} as Record<InstrumentId, ChannelState>);
}

export function Mixer() {
  const [state, setState] = useState<Record<InstrumentId, ChannelState>>(init);

  const update = (id: InstrumentId, patch: Partial<ChannelState>) => {
    setState((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      if (patch.volumeDb !== undefined) engine.setChannelVolume(id, patch.volumeDb);
      if (patch.pan !== undefined) engine.setChannelPan(id, patch.pan);
      if (patch.mute !== undefined) engine.setChannelMute(id, patch.mute);
      if (patch.solo !== undefined) engine.setChannelSolo(id, patch.solo);
      return next;
    });
  };

  const reset = () => {
    MIXER_CHANNELS.forEach((id) => {
      engine.setChannelVolume(id, 0);
      engine.setChannelPan(id, 0);
      engine.setChannelMute(id, false);
      engine.setChannelSolo(id, false);
    });
    setState(init());
  };

  return (
    <section className="card">
      <header className="card-header">
        <h2>Mixer</h2>
        <button className="btn small" onClick={reset}>Reset</button>
      </header>
      <div className="mixer-grid">
        {MIXER_CHANNELS.map((id) => {
          const c = state[id];
          return (
            <div key={id} className={`channel ${c.solo ? 'solo' : ''} ${c.mute ? 'mute' : ''}`}>
              <div className="channel-name">{LABELS[id]}</div>

              <div className="row gap small">
                <button
                  className={`btn small ${c.mute ? 'danger' : ''}`}
                  onClick={() => update(id, { mute: !c.mute })}
                >M</button>
                <button
                  className={`btn small ${c.solo ? 'primary' : ''}`}
                  onClick={() => update(id, { solo: !c.solo })}
                >S</button>
              </div>

              <label className="channel-knob">
                <span className="muted small">pan {c.pan === 0 ? 'C' : c.pan < 0 ? `${Math.round(c.pan * 100)}L` : `${Math.round(c.pan * 100)}R`}</span>
                <input
                  type="range" min={-1} max={1} step={0.01}
                  value={c.pan}
                  onChange={(e) => update(id, { pan: parseFloat(e.target.value) })}
                />
              </label>

              <div className="fader">
                <input
                  type="range"
                  className="fader-input"
                  min={-60} max={6} step={0.5}
                  value={c.volumeDb}
                  onChange={(e) => update(id, { volumeDb: parseFloat(e.target.value) })}
                />
                <span className="fader-readout small muted">
                  {c.volumeDb <= -60 ? '−∞' : `${c.volumeDb > 0 ? '+' : ''}${c.volumeDb.toFixed(1)}`} dB
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
