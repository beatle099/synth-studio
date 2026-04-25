import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { engine, DRUM_HITS, type DrumHit, type InstrumentId } from '../audio/engine';

export const STEPS = 16;
export const SEQ_PITCHES = ['C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];

interface SequencerProps {
  pitchInstrument: InstrumentId;
  setPitchInstrument: (i: InstrumentId) => void;
  bpm: number;
  setBpm: (n: number) => void;
}

function emptyGrid(rows: number) {
  return Array.from({ length: rows }, () => Array<boolean>(STEPS).fill(false));
}

export function Sequencer({ pitchInstrument, setPitchInstrument, bpm, setBpm }: SequencerProps) {
  const [pitchGrid, setPitchGrid] = useState<boolean[][]>(() => emptyGrid(SEQ_PITCHES.length));
  const [drumGrid, setDrumGrid] = useState<boolean[][]>(() => emptyGrid(DRUM_HITS.length));
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const pitchGridRef = useRef(pitchGrid);
  const drumGridRef = useRef(drumGrid);
  const instrumentRef = useRef(pitchInstrument);
  pitchGridRef.current = pitchGrid;
  drumGridRef.current = drumGrid;
  instrumentRef.current = pitchInstrument;

  const seqRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    engine.setBPM(bpm);
  }, [bpm]);

  const togglePitch = (row: number, step: number) => {
    setPitchGrid((g) => g.map((r, i) => i === row ? r.map((v, j) => j === step ? !v : v) : r));
  };
  const toggleDrum = (row: number, step: number) => {
    setDrumGrid((g) => g.map((r, i) => i === row ? r.map((v, j) => j === step ? !v : v) : r));
  };

  const clearAll = () => {
    setPitchGrid(emptyGrid(SEQ_PITCHES.length));
    setDrumGrid(emptyGrid(DRUM_HITS.length));
  };

  const play = async () => {
    await engine.start();
    if (seqRef.current) {
      seqRef.current.dispose();
    }
    const steps = Array.from({ length: STEPS }, (_, i) => i);
    const seq = new Tone.Sequence((time, step) => {
      // Pitched
      const inst = instrumentRef.current;
      pitchGridRef.current.forEach((row, rowIdx) => {
        if (row[step]) {
          const note = SEQ_PITCHES[rowIdx];
          engine.triggerNoteWithInstrument(inst, note, '16n', time, 0.8);
        }
      });
      // Drums
      drumGridRef.current.forEach((row, rowIdx) => {
        if (row[step]) {
          engine.triggerDrum(DRUM_HITS[rowIdx] as DrumHit, time, 0.9);
        }
      });
      Tone.getDraw().schedule(() => setCurrentStep(step), time);
    }, steps, '16n');
    seq.start(0);
    seqRef.current = seq;
    Tone.getTransport().start();
    setPlaying(true);
  };

  const stop = () => {
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    seqRef.current?.dispose();
    seqRef.current = null;
    setPlaying(false);
    setCurrentStep(-1);
  };

  useEffect(() => () => { seqRef.current?.dispose(); }, []);

  return (
    <section className="card">
      <header className="card-header">
        <h2>Score · Step Sequencer</h2>
        <div className="row gap">
          <label className="row gap small">
            BPM
            <input
              type="number"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
              style={{ width: 64 }}
            />
          </label>
          <label className="row gap small">
            Pitched track
            <select value={pitchInstrument} onChange={(e) => setPitchInstrument(e.target.value as InstrumentId)}>
              <option value="synth">Synth</option>
              <option value="guitar">Guitar</option>
              <option value="bass">Bass</option>
              <option value="vocal">Vocal</option>
            </select>
          </label>
          {playing
            ? <button className="btn danger" onClick={stop}>Stop</button>
            : <button className="btn primary" onClick={play}>Play</button>}
          <button className="btn" onClick={clearAll}>Clear</button>
        </div>
      </header>

      <div className="grid-wrap">
        <table className="grid">
          <tbody>
            {SEQ_PITCHES.map((note, rowIdx) => (
              <tr key={note}>
                <th className="row-label">{note}</th>
                {pitchGrid[rowIdx].map((on, step) => (
                  <td key={step}
                      className={`cell pitch ${on ? 'on' : ''} ${currentStep === step ? 'cursor' : ''} ${step % 4 === 0 ? 'beat' : ''}`}
                      onClick={() => togglePitch(rowIdx, step)} />
                ))}
              </tr>
            ))}
            <tr><td colSpan={STEPS + 1} className="grid-divider" /></tr>
            {DRUM_HITS.map((d, rowIdx) => (
              <tr key={d}>
                <th className="row-label drum">{d}</th>
                {drumGrid[rowIdx].map((on, step) => (
                  <td key={step}
                      className={`cell drum ${on ? 'on' : ''} ${currentStep === step ? 'cursor' : ''} ${step % 4 === 0 ? 'beat' : ''}`}
                      onClick={() => toggleDrum(rowIdx, step)} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
