import { useCallback, useRef, useState } from 'react';
import * as Tone from 'tone';
import { engine, type DrumHit, type InstrumentId } from './engine';

export type RecEvent =
  | { kind: 'attack'; t: number; note: string; instrument: InstrumentId }
  | { kind: 'release'; t: number; note: string; instrument: InstrumentId }
  | { kind: 'drum'; t: number; hit: DrumHit };

export interface RecorderHandle {
  isRecording: boolean;
  isPlaying: boolean;
  hasClip: boolean;
  durationMs: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  play: () => Promise<void>;
  stopPlayback: () => void;
  clear: () => void;
  recordAttack: (note: string, instrument: InstrumentId) => void;
  recordRelease: (note: string, instrument: InstrumentId) => void;
  recordDrum: (hit: DrumHit) => void;
}

export function useRecorder(): RecorderHandle {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const eventsRef = useRef<RecEvent[]>([]);
  const startedAtRef = useRef(0);
  const playbackTimeoutsRef = useRef<number[]>([]);

  const startRecording = useCallback(async () => {
    await engine.start();
    eventsRef.current = [];
    startedAtRef.current = performance.now();
    setIsRecording(true);
    setDurationMs(0);
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    setDurationMs(performance.now() - startedAtRef.current);
    setIsRecording(false);
  }, [isRecording]);

  const recordAttack = useCallback((note: string, instrument: InstrumentId) => {
    if (!isRecording) return;
    eventsRef.current.push({ kind: 'attack', t: performance.now() - startedAtRef.current, note, instrument });
  }, [isRecording]);

  const recordRelease = useCallback((note: string, instrument: InstrumentId) => {
    if (!isRecording) return;
    eventsRef.current.push({ kind: 'release', t: performance.now() - startedAtRef.current, note, instrument });
  }, [isRecording]);

  const recordDrum = useCallback((hit: DrumHit) => {
    if (!isRecording) return;
    eventsRef.current.push({ kind: 'drum', t: performance.now() - startedAtRef.current, hit });
  }, [isRecording]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    playbackTimeoutsRef.current = [];
    // Release any held notes from the synth voices to avoid stuck tones.
    Tone.getTransport().cancel();
    setIsPlaying(false);
  }, []);

  const play = useCallback(async () => {
    if (eventsRef.current.length === 0) return;
    await engine.start();
    setIsPlaying(true);
    const events = eventsRef.current;
    const ids = events.map((e) =>
      window.setTimeout(() => {
        if (e.kind === 'attack') {
          // Use instrument captured at record time to keep timbre consistent.
          const prev = engine.getInstrument();
          engine.setInstrument(e.instrument);
          engine.triggerAttack(e.note);
          engine.setInstrument(prev);
        } else if (e.kind === 'release') {
          const prev = engine.getInstrument();
          engine.setInstrument(e.instrument);
          engine.triggerRelease(e.note);
          engine.setInstrument(prev);
        } else if (e.kind === 'drum') {
          engine.triggerDrum(e.hit);
        }
      }, e.t),
    );
    playbackTimeoutsRef.current = ids;
    const last = events[events.length - 1].t;
    const endId = window.setTimeout(() => setIsPlaying(false), last + 800);
    playbackTimeoutsRef.current.push(endId);
  }, []);

  const clear = useCallback(() => {
    eventsRef.current = [];
    setDurationMs(0);
  }, []);

  return {
    isRecording,
    isPlaying,
    hasClip: eventsRef.current.length > 0,
    durationMs,
    startRecording,
    stopRecording,
    play,
    stopPlayback,
    clear,
    recordAttack,
    recordRelease,
    recordDrum,
  };
}
