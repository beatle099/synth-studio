import * as Tone from 'tone';

export type InstrumentId = 'synth' | 'guitar' | 'bass' | 'vocal' | 'drums';

export type DrumHit = 'kick' | 'snare' | 'hihat' | 'tom' | 'clap';

export const PITCHED_INSTRUMENTS: Exclude<InstrumentId, 'drums'>[] = ['synth', 'guitar', 'bass', 'vocal'];
export const MIXER_CHANNELS: InstrumentId[] = ['synth', 'guitar', 'bass', 'vocal', 'drums'];
export const DRUM_HITS: DrumHit[] = ['kick', 'snare', 'hihat', 'tom', 'clap'];

type PitchedId = Exclude<InstrumentId, 'drums'>;

export interface ChannelState {
  volumeDb: number;  // -60 .. 6
  pan: number;       // -1 .. 1
  mute: boolean;
  solo: boolean;
}

export const DEFAULT_CHANNEL_STATE: ChannelState = {
  volumeDb: 0,
  pan: 0,
  mute: false,
  solo: false,
};

// Voice presets per pitched instrument. Typed loosely because Tone's PolySynth
// constructor overload that accepts (VoiceCtor, options) isn't visible to
// TypeScript's ConstructorParameters helper.
const SYNTH_PRESETS: Record<PitchedId, object> = {
  synth: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
  },
  guitar: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0.0, release: 0.4 },
  },
  bass: {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.6, release: 0.5 },
  },
  vocal: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.6 },
  },
};

function makePoly(preset: object): Tone.PolySynth {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (Tone.PolySynth as any)(Tone.Synth, preset);
}

class AudioEngine {
  private master = new Tone.Gain(0.8).toDestination();
  private channels: Record<InstrumentId, Tone.Channel>;
  private synths: Record<PitchedId, Tone.PolySynth>;
  private samplers = new Map<PitchedId, Tone.Sampler>();
  private drums: {
    kick: Tone.MembraneSynth;
    snare: Tone.NoiseSynth;
    hihat: Tone.MetalSynth;
    tom: Tone.MembraneSynth;
    clap: Tone.NoiseSynth;
  };

  private current: InstrumentId = 'synth';
  private started = false;

  constructor() {
    const mk = () => new Tone.Channel({ volume: 0, pan: 0 }).connect(this.master);
    this.channels = {
      synth: mk(),
      guitar: mk(),
      bass: mk(),
      vocal: mk(),
      drums: mk(),
    };

    this.synths = {
      synth: makePoly(SYNTH_PRESETS.synth).connect(this.channels.synth),
      guitar: makePoly(SYNTH_PRESETS.guitar).connect(this.channels.guitar),
      bass: makePoly(SYNTH_PRESETS.bass).connect(this.channels.bass),
      vocal: makePoly(SYNTH_PRESETS.vocal).connect(this.channels.vocal),
    };

    this.drums = {
      kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 6 }).connect(this.channels.drums),
      snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(this.channels.drums),
      hihat: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.channels.drums),
      tom: new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 4 }).connect(this.channels.drums),
      clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 } }).connect(this.channels.drums),
    };
  }

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

  // ---------- Mixer ----------

  setChannelVolume(id: InstrumentId, db: number): void {
    this.channels[id].volume.rampTo(db, 0.05);
  }
  setChannelPan(id: InstrumentId, pan: number): void {
    this.channels[id].pan.rampTo(pan, 0.05);
  }
  setChannelMute(id: InstrumentId, mute: boolean): void {
    this.channels[id].mute = mute;
  }
  setChannelSolo(id: InstrumentId, solo: boolean): void {
    this.channels[id].solo = solo;
  }

  // ---------- Voices ----------

  /** Active pitched voice: a loaded sampler if available, else this instrument's default synth. */
  private pitchedVoice(id: PitchedId): Tone.PolySynth | Tone.Sampler {
    const sampler = this.samplers.get(id);
    if (sampler && sampler.loaded) return sampler;
    return this.synths[id];
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

  /** Load samples for a pitched instrument. The sampler routes through that instrument's mixer channel. */
  async loadSamples(instrument: InstrumentId, notes: Record<string, string>): Promise<void> {
    if (instrument === 'drums') throw new Error('Drum sampling is not supported yet');
    const id = instrument as PitchedId;
    this.samplers.get(id)?.dispose();
    const channel = this.channels[id];
    return new Promise((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: notes,
        release: 0.6,
        onload: () => resolve(),
        onerror: (err) => reject(err),
      }).connect(channel);
      this.samplers.set(id, sampler);
    });
  }

  hasSamples(instrument: InstrumentId): boolean {
    if (instrument === 'drums') return false;
    const s = this.samplers.get(instrument as PitchedId);
    return !!s && s.loaded;
  }

  clearSamples(instrument: InstrumentId): void {
    if (instrument === 'drums') return;
    const id = instrument as PitchedId;
    const s = this.samplers.get(id);
    if (s) {
      s.dispose();
      this.samplers.delete(id);
    }
  }
}

export const engine = new AudioEngine();
