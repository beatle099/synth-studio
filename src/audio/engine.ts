import * as Tone from 'tone';

export type InstrumentId = 'synth' | 'guitar' | 'bass' | 'vocal' | 'drums';

export type DrumHit = 'kick' | 'snare' | 'hihat' | 'tom' | 'clap';

export const PITCHED_INSTRUMENTS: InstrumentId[] = ['synth', 'guitar', 'bass', 'vocal'];
export const DRUM_HITS: DrumHit[] = ['kick', 'snare', 'hihat', 'tom', 'clap'];

type Voice = Tone.PolySynth | Tone.Sampler;

class AudioEngine {
  private master = new Tone.Gain(0.8).toDestination();
  private synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
  }).connect(this.master);

  private samplers = new Map<InstrumentId, Tone.Sampler>();
  private drums = {
    kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6 }).connect(this.master),
    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(this.master),
    hihat: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.master),
    tom: new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4 }).connect(this.master),
    clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(this.master),
  };

  private current: InstrumentId = 'synth';
  private started = false;

  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.started = true;
  }

  isStarted(): boolean {
    return this.started;
  }

  setInstrument(id: InstrumentId): void {
    this.current = id;
  }

  getInstrument(): InstrumentId {
    return this.current;
  }

  setMasterVolume(v: number): void {
    this.master.gain.rampTo(v, 0.05);
  }

  setBPM(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  /** Returns the active voice for a pitched instrument: a loaded sampler if available, else the default synth. */
  private pitchedVoice(id: InstrumentId): Voice {
    const sampler = this.samplers.get(id);
    if (sampler && sampler.loaded) return sampler;
    return this.synth;
  }

  triggerAttack(note: string, time?: Tone.Unit.Time, velocity = 0.8): void {
    if (this.current === 'drums') return;
    this.pitchedVoice(this.current).triggerAttack(note, time, velocity);
  }

  triggerRelease(note: string, time?: Tone.Unit.Time): void {
    if (this.current === 'drums') return;
    this.pitchedVoice(this.current).triggerRelease(note, time);
  }

  triggerNote(note: string, duration: Tone.Unit.Time = '8n', time?: Tone.Unit.Time, velocity = 0.8): void {
    if (this.current === 'drums') return;
    this.pitchedVoice(this.current).triggerAttackRelease(note, duration, time, velocity);
  }

  triggerNoteWithInstrument(instrument: InstrumentId, note: string, duration: Tone.Unit.Time = '8n', time?: Tone.Unit.Time, velocity = 0.8): void {
    if (instrument === 'drums') return;
    this.pitchedVoice(instrument).triggerAttackRelease(note, duration, time, velocity);
  }

  triggerDrum(hit: DrumHit, time?: Tone.Unit.Time, velocity = 0.9): void {
    const t = time ?? Tone.now();
    switch (hit) {
      case 'kick': this.drums.kick.triggerAttackRelease('C2', '8n', t, velocity); break;
      case 'snare': this.drums.snare.triggerAttackRelease('16n', t, velocity); break;
      case 'hihat': this.drums.hihat.triggerAttackRelease('C5', '32n', t, velocity * 0.6); break;
      case 'tom': this.drums.tom.triggerAttackRelease('A2', '8n', t, velocity); break;
      case 'clap': this.drums.clap.triggerAttackRelease('16n', t, velocity); break;
    }
  }

  /** Load one or more samples into a sampler keyed by instrument. Notes is a map like { C4: url }. */
  async loadSamples(instrument: InstrumentId, notes: Record<string, string>): Promise<void> {
    if (instrument === 'drums') throw new Error('Use loadDrumSample for drums');
    // Dispose previous
    this.samplers.get(instrument)?.dispose();
    return new Promise((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: notes,
        release: 0.6,
        onload: () => resolve(),
        onerror: (err) => reject(err),
      }).connect(this.master);
      this.samplers.set(instrument, sampler);
    });
  }

  hasSamples(instrument: InstrumentId): boolean {
    const s = this.samplers.get(instrument);
    return !!s && s.loaded;
  }

  clearSamples(instrument: InstrumentId): void {
    const s = this.samplers.get(instrument);
    if (s) {
      s.dispose();
      this.samplers.delete(instrument);
    }
  }
}

export const engine = new AudioEngine();
