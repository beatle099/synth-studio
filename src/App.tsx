import { useCallback, useEffect, useRef, useState } from 'react';
import { synthEngine, type ADSR, type Waveform } from './audio/synthEngine';
import { lookupKey, resolveNote } from './data/keyboardMap';
import { PianoKeyboard } from './components/PianoKeyboard';
import { SynthControls } from './components/SynthControls';
import { ActiveNotes } from './components/ActiveNotes';
import './styles.css';

const OCTAVE_DOWN_KEY = 'z';
const OCTAVE_UP_KEY = 'x';

export default function App() {
  const [waveform, setWaveformState] = useState<Waveform>('sawtooth');
  const [volume, setVolumeState] = useState(0.4);
  const [adsr, setAdsrState] = useState<ADSR>(synthEngine.getADSR());
  const [octaveShift, setOctaveShift] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(() => new Set());

  // Tracks which physical computer keys are currently held down. Used to
  // suppress repeat keydown events without relying on KeyboardEvent.repeat,
  // and to release the right note even after octaveShift changes.
  const heldKeysRef = useRef<Map<string, string>>(new Map());
  const octaveShiftRef = useRef(octaveShift);
  useEffect(() => { octaveShiftRef.current = octaveShift; }, [octaveShift]);

  const ensureStarted = useCallback(async () => {
    if (!synthEngine.isReady()) await synthEngine.start();
  }, []);

  const playNote = useCallback((noteId: string) => {
    void ensureStarted().then(() => {
      synthEngine.noteOn(noteId);
      setActiveNotes((prev) => {
        if (prev.has(noteId)) return prev;
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });
    });
  }, [ensureStarted]);

  const stopNote = useCallback((noteId: string) => {
    synthEngine.noteOff(noteId);
    setActiveNotes((prev) => {
      if (!prev.has(noteId)) return prev;
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  }, []);

  const panic = useCallback(() => {
    synthEngine.panic();
    heldKeysRef.current.clear();
    setActiveNotes(new Set());
  }, []);

  // Apply control state to the engine.
  useEffect(() => { synthEngine.setWaveform(waveform); }, [waveform]);
  useEffect(() => { synthEngine.setMasterVolume(volume); }, [volume]);
  useEffect(() => { synthEngine.setADSR(adsr); }, [adsr]);

  // Global keyboard handlers.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === OCTAVE_DOWN_KEY) {
        if (e.repeat) return;
        setOctaveShift((s) => Math.max(-3, s - 1));
        e.preventDefault();
        return;
      }
      if (key === OCTAVE_UP_KEY) {
        if (e.repeat) return;
        setOctaveShift((s) => Math.min(3, s + 1));
        e.preventDefault();
        return;
      }

      const mapping = lookupKey(key);
      if (!mapping) return;
      // Suppress retrigger while the same physical key is still held.
      if (heldKeysRef.current.has(key)) return;

      const noteId = resolveNote(mapping, octaveShiftRef.current);
      heldKeysRef.current.set(key, noteId);
      playNote(noteId);
      e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const noteId = heldKeysRef.current.get(key);
      if (!noteId) return;
      heldKeysRef.current.delete(key);
      stopNote(noteId);
    };

    // If the window loses focus we may miss keyup events; flush any held notes.
    const onBlur = () => {
      if (heldKeysRef.current.size === 0) return;
      for (const noteId of heldKeysRef.current.values()) synthEngine.noteOff(noteId);
      heldKeysRef.current.clear();
      setActiveNotes(new Set());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [playNote, stopNote]);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Synth Studio</h1>
          <p className="muted small">Browser-only synthesizer · play with your computer keyboard or click the keys</p>
        </div>
        <span className="badge">Octave shift {octaveShift > 0 ? `+${octaveShift}` : octaveShift}</span>
      </header>

      <main className="main">
        <SynthControls
          waveform={waveform}
          setWaveform={setWaveformState}
          volume={volume}
          setVolume={setVolumeState}
          adsr={adsr}
          setADSR={(patch) => setAdsrState((prev) => ({ ...prev, ...patch }))}
          octaveShift={octaveShift}
          setOctaveShift={setOctaveShift}
          onPanic={panic}
        />

        <ActiveNotes notes={activeNotes} />
      </main>

      <footer className="piano-dock">
        <PianoKeyboard
          activeNotes={activeNotes}
          octaveShift={octaveShift}
          onAttack={playNote}
          onRelease={stopNote}
        />
      </footer>
    </div>
  );
}
