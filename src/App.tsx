import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { synthEngine, type ADSR, type Waveform } from './audio/synthEngine';
import {
  loadCustomMap,
  saveCustomMap,
  clearCustomMap,
  lookupKey,
  mappingForMode,
  midiToNote,
  octaveShiftKeysFor,
  rangeMidi,
  resolveNote,
  shiftRangeOctave,
  SIMPLE_MAP,
} from './data/keyboardMap';
import { loadPreferences, savePreferences } from './data/preferences';
import type {
  KeyMapping,
  KeyboardMappingMode,
  KeyboardRange,
  KeyboardViewMode,
  LabelMode,
} from './data/types';
import { PianoKeyboard } from './components/PianoKeyboard';
import { SynthControls } from './components/SynthControls';
import { ActiveNotes } from './components/ActiveNotes';
import { KeyboardControlBar } from './components/KeyboardControlBar';
import { MiniKeyboard } from './components/MiniKeyboard';
import { KeyMappingSettings } from './components/KeyMappingSettings';
import './styles.css';

export default function App() {
  // Persisted preferences.
  const [{ range, viewMode, mappingMode, labelMode, octaveShift }, setPrefs] = useState(loadPreferences);
  const [customMap, setCustomMapState] = useState<KeyMapping[]>(loadCustomMap);

  // Synth state.
  const [waveform, setWaveformState] = useState<Waveform>('sawtooth');
  const [volume, setVolumeState] = useState(0.4);
  const [adsr, setAdsrState] = useState<ADSR>(synthEngine.getADSR());
  const [activeNotes, setActiveNotes] = useState<Set<string>>(() => new Set());

  // Custom-mapping edit flow.
  const [editMode, setEditMode] = useState(false);
  const [awaitingNote, setAwaitingNote] = useState<string | null>(null);

  const heldKeysRef = useRef<Map<string, string>>(new Map());
  const octaveShiftRef = useRef(octaveShift);
  const mappingsRef = useRef<KeyMapping[]>(SIMPLE_MAP);
  const editModeRef = useRef(editMode);

  const activeMappings = useMemo(
    () => mappingForMode(mappingMode, customMap),
    [mappingMode, customMap],
  );

  const pianoRef = useRef<HTMLDivElement | null>(null);

  // Mirror state into refs that the global key handlers read.
  useEffect(() => { octaveShiftRef.current = octaveShift; }, [octaveShift]);
  useEffect(() => { mappingsRef.current = activeMappings; }, [activeMappings]);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);

  // Persist preferences whenever they change.
  useEffect(() => {
    savePreferences({ range, viewMode, mappingMode, labelMode, octaveShift });
  }, [range, viewMode, mappingMode, labelMode, octaveShift]);

  const updatePref = useCallback(
    <K extends 'range' | 'viewMode' | 'mappingMode' | 'labelMode' | 'octaveShift'>(
      key: K,
      value: { range: KeyboardRange; viewMode: KeyboardViewMode; mappingMode: KeyboardMappingMode; labelMode: LabelMode; octaveShift: number }[K],
    ) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

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

  // Custom mapping persistence.
  const setCustomMap = useCallback((map: KeyMapping[]) => {
    setCustomMapState(map);
    saveCustomMap(map);
  }, []);

  const resetCustomMap = useCallback(() => {
    clearCustomMap();
    setCustomMapState([...SIMPLE_MAP]);
  }, []);

  // Octave-shift hot keys depend on the active mapping mode.
  const shiftKeys = useMemo(() => octaveShiftKeysFor(mappingMode), [mappingMode]);

  // Global keyboard handlers — note play / release + octave shift hot-keys.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // While editing custom mapping, KeyMappingSettings owns key capture.
      if (editModeRef.current) return;

      const key = e.key.toLowerCase();

      if (key === shiftKeys.down) {
        if (e.repeat) return;
        setPrefs((prev) => ({ ...prev, octaveShift: Math.max(-3, prev.octaveShift - 1) }));
        e.preventDefault();
        return;
      }
      if (key === shiftKeys.up) {
        if (e.repeat) return;
        setPrefs((prev) => ({ ...prev, octaveShift: Math.min(3, prev.octaveShift + 1) }));
        e.preventDefault();
        return;
      }

      const mapping = lookupKey(key, mappingsRef.current);
      if (!mapping) return;
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
  }, [playNote, stopNote, shiftKeys.down, shiftKeys.up]);

  const setRange = (next: KeyboardRange) => updatePref('range', next);
  const setOctaveShift = (n: number) => updatePref('octaveShift', n);

  // Handler for mini-keyboard click: jump the visible range so it starts at the clicked octave.
  const onJumpTo = (startMidi: number) => {
    if (range.octaveCount >= 7) return; // full piano: nothing to scroll
    const startOct = Math.floor(startMidi / 12) - 1;
    const clamped = Math.max(0, Math.min(8 - range.octaveCount, startOct));
    setRange({
      ...range,
      startNote: `C${clamped}`,
      startOctave: clamped,
    });
  };

  // Click-on-piano in edit mode arms a note for key capture.
  const onPianoKeyClick = useCallback((noteId: string) => {
    if (!editMode) return;
    setAwaitingNote(noteId);
  }, [editMode]);

  // Visual indicator: the currently-visible MIDI window (for the active-notes summary).
  const visible = rangeMidi(range);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Synth Studio</h1>
          <p className="muted small">
            Browser-only synthesizer · play with your computer keyboard or click the keys
          </p>
        </div>
        <div className="row gap">
          <span className="badge">
            Visible {midiToNote(visible.start)}–{midiToNote(visible.end)}
          </span>
          <span className="badge">
            Octave shift {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
          </span>
        </div>
      </header>

      <KeyboardControlBar
        range={range}
        setRange={setRange}
        octaveShift={octaveShift}
        setOctaveShift={setOctaveShift}
        viewMode={viewMode}
        setViewMode={(v) => updatePref('viewMode', v)}
        labelMode={labelMode}
        setLabelMode={(l) => updatePref('labelMode', l)}
        mappingMode={mappingMode}
        setMappingMode={(m) => updatePref('mappingMode', m)}
      />

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
          shiftKeys={shiftKeys}
          onPanic={panic}
          onShiftRangeOctave={(delta) => setRange(shiftRangeOctave(range, delta))}
        />

        <div className="side-stack">
          <ActiveNotes notes={activeNotes} />
          <KeyMappingSettings
            mappingMode={mappingMode}
            customMap={customMap}
            setCustomMap={setCustomMap}
            editMode={editMode}
            setEditMode={setEditMode}
            awaitingNote={awaitingNote}
            setAwaitingNote={setAwaitingNote}
            resetCustomMap={resetCustomMap}
          />
        </div>
      </main>

      <section className="mini-section">
        <MiniKeyboard
          visibleRange={range}
          octaveShift={octaveShift}
          activeNotes={activeNotes}
          onJumpTo={onJumpTo}
        />
      </section>

      <footer className="piano-dock">
        <PianoKeyboard
          ref={pianoRef}
          range={range}
          viewMode={viewMode}
          labelMode={labelMode}
          mappings={activeMappings}
          octaveShift={octaveShift}
          activeNotes={activeNotes}
          editMode={editMode}
          awaitingNote={awaitingNote}
          onAttack={playNote}
          onRelease={stopNote}
          onPianoKeyClick={onPianoKeyClick}
        />
      </footer>
    </div>
  );
}

