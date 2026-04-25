import { useCallback, useEffect, useState } from 'react';
import { engine, type InstrumentId, type DrumHit } from './audio/engine';
import { useRecorder } from './audio/recorder';
import { Keyboard } from './components/Keyboard';
import { InstrumentPanel } from './components/InstrumentPanel';
import { DrumPad } from './components/DrumPad';
import { Sequencer } from './components/Sequencer';
import { RecorderPanel } from './components/RecorderPanel';
import { SampleBrowser } from './components/SampleBrowser';
import './styles.css';

export default function App() {
  const [instrument, setInstrument] = useState<InstrumentId>('synth');
  const [baseOctave, setBaseOctave] = useState(3);
  const [volume, setVolume] = useState(0.8);
  const [bpm, setBpm] = useState(110);
  const recorder = useRecorder();

  useEffect(() => {
    engine.setInstrument(instrument);
  }, [instrument]);

  useEffect(() => {
    engine.setMasterVolume(volume);
  }, [volume]);

  const onAttack = useCallback((note: string) => {
    void engine.start().then(() => engine.triggerAttack(note));
    recorder.recordAttack(note, instrument);
  }, [instrument, recorder]);

  const onRelease = useCallback((note: string) => {
    engine.triggerRelease(note);
    recorder.recordRelease(note, instrument);
  }, [instrument, recorder]);

  const onDrum = useCallback((hit: DrumHit) => {
    void engine.start().then(() => engine.triggerDrum(hit));
    recorder.recordDrum(hit);
  }, [recorder]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Synth Studio</h1>
        <span className="muted small">browser-only DAW · keyboard, samplers, step sequencer, recorder</span>
      </header>

      <main className="grid-layout">
        <InstrumentPanel
          instrument={instrument}
          setInstrument={setInstrument}
          volume={volume}
          setVolume={setVolume}
        />
        <DrumPad onHit={onDrum} />
        <RecorderPanel recorder={recorder} />
        <Sequencer
          pitchInstrument={instrument === 'drums' ? 'synth' : instrument}
          setPitchInstrument={setInstrument}
          bpm={bpm}
          setBpm={setBpm}
        />
        <SampleBrowser pitchInstrument={instrument} />
      </main>

      <footer className="kb-dock">
        <Keyboard
          onAttack={onAttack}
          onRelease={onRelease}
          baseOctave={baseOctave}
          setBaseOctave={setBaseOctave}
        />
      </footer>
    </div>
  );
}
