export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface ADSR {
  /** Time in seconds from gate-on to peak. */
  attack: number;
  /** Time in seconds from peak down to sustain level. */
  decay: number;
  /** Sustain level in 0..1. */
  sustain: number;
  /** Time in seconds from gate-off to silence. */
  release: number;
}

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

const A4_HZ = 440;

/**
 * Convert a note id like "C4" or "F#5" to a frequency in Hz using equal temperament.
 * A4 = 440 Hz.
 */
export function noteToFrequency(noteId: string): number {
  const match = noteId.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error(`Invalid note id: ${noteId}`);
  const [, name, octStr] = match;
  const octave = parseInt(octStr, 10);
  const semitoneFromC: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
    'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
  };
  const semitonesFromA4 = (octave - 4) * 12 + (semitoneFromC[name] - 9);
  return A4_HZ * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * A small polyphonic synthesizer built directly on the Web Audio API.
 *
 * Lifecycle:
 *   - The AudioContext is constructed lazily on the first call to `start()`,
 *     which must happen inside a user-gesture handler to satisfy the browser
 *     autoplay policy.
 *   - One `Voice` (oscillator + per-voice gain) is created per held note and
 *     torn down when the release envelope completes.
 */
export class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private voices = new Map<string, Voice>();

  private waveform: Waveform = 'sawtooth';
  private masterVolume = 0.4;
  private adsr: ADSR = { attack: 0.02, decay: 0.15, sustain: 0.7, release: 0.25 };

  /** Initialise the audio graph. Idempotent. Must be invoked from a user gesture. */
  async start(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    const ctx = new Ctor();
    if (ctx.state === 'suspended') await ctx.resume();
    const master = ctx.createGain();
    master.gain.value = this.masterVolume;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.masterGain = master;
  }

  isReady(): boolean {
    return this.ctx !== null;
  }

  setWaveform(w: Waveform): void {
    this.waveform = w;
    // Update existing voices so a waveform change is heard immediately on held notes.
    for (const voice of this.voices.values()) voice.oscillator.type = w;
  }

  setMasterVolume(v: number): void {
    this.masterVolume = v;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    }
  }

  setADSR(patch: Partial<ADSR>): void {
    this.adsr = { ...this.adsr, ...patch };
  }

  getADSR(): ADSR {
    return { ...this.adsr };
  }

  /** Begin playing a note. No-op if the same note id is already sounding. */
  noteOn(noteId: string): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.voices.has(noteId)) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(noteToFrequency(noteId), now);

    const gain = ctx.createGain();
    const { attack, decay, sustain } = this.adsr;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + Math.max(attack, 0.001));
    gain.gain.linearRampToValueAtTime(sustain, now + Math.max(attack, 0.001) + Math.max(decay, 0.001));

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);

    this.voices.set(noteId, { oscillator: osc, gain });
  }

  /** Release a note using the release-envelope. Cleans up nodes once silence is reached. */
  noteOff(noteId: string): void {
    if (!this.ctx) return;
    const voice = this.voices.get(noteId);
    if (!voice) return;
    this.voices.delete(noteId);

    const now = this.ctx.currentTime;
    const release = Math.max(this.adsr.release, 0.005);

    voice.gain.gain.cancelScheduledValues(now);
    // Hold the current value so we ramp from wherever we are.
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + release);
    voice.oscillator.stop(now + release + 0.02);
    voice.oscillator.onended = () => {
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    };
  }

  /** Force-stop every active voice with a fast fade-out. */
  panic(): void {
    if (!this.ctx) {
      this.voices.clear();
      return;
    }
    const now = this.ctx.currentTime;
    const fade = 0.04;
    for (const voice of this.voices.values()) {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.linearRampToValueAtTime(0, now + fade);
      voice.oscillator.stop(now + fade + 0.01);
      voice.oscillator.onended = () => {
        voice.oscillator.disconnect();
        voice.gain.disconnect();
      };
    }
    this.voices.clear();
  }
}

export const synthEngine = new SynthEngine();
