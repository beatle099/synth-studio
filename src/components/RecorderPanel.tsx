import type { RecorderHandle } from '../audio/recorder';

interface Props {
  recorder: RecorderHandle;
}

export function RecorderPanel({ recorder }: Props) {
  const seconds = (recorder.durationMs / 1000).toFixed(2);
  return (
    <section className="card">
      <header className="card-header">
        <h2>Live Recorder</h2>
        <div className="row gap">
          {recorder.isRecording
            ? <button className="btn danger" onClick={recorder.stopRecording}>Stop</button>
            : <button className="btn primary" onClick={recorder.startRecording}>Record</button>}
          {recorder.isPlaying
            ? <button className="btn" onClick={recorder.stopPlayback}>Stop Playback</button>
            : <button className="btn" disabled={recorder.durationMs === 0} onClick={recorder.play}>Play</button>}
          <button className="btn" disabled={recorder.durationMs === 0} onClick={recorder.clear}>Clear</button>
        </div>
      </header>
      <div className="row gap small">
        <span className={`dot ${recorder.isRecording ? 'rec' : ''}`} />
        <span>{recorder.isRecording ? 'Recording…' : recorder.durationMs > 0 ? `Clip ready · ${seconds}s` : 'No clip'}</span>
      </div>
      <p className="muted small">
        Plays back with the instrument that was selected at the moment each note was struck.
      </p>
    </section>
  );
}
