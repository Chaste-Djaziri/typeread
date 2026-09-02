// Web Audio API Mechanical Keyboard Sound Synthesizer
// Provides instantaneous, zero-latency tactile audio feedback without external audio file dependencies.

class MechanicalSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.35;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public playKey(key: string, isError: boolean = false) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, now);
    masterGain.connect(ctx.destination);

    if (isError) {
      // Soft dull error thud
      this.playErrorSound(ctx, masterGain, now);
      return;
    }

    if (key === " " || key === "Space") {
      this.playSpaceSound(ctx, masterGain, now);
    } else if (key === "Enter") {
      this.playEnterSound(ctx, masterGain, now);
    } else if (key === "Backspace") {
      this.playBackspaceSound(ctx, masterGain, now);
    } else {
      this.playRegularKeySound(ctx, masterGain, now);
    }
  }

  // Crisp mechanical click with micro-pitch jitter
  private playRegularKeySound(ctx: AudioContext, dest: AudioNode, now: number) {
    const jitter = 0.95 + Math.random() * 0.1;

    // High frequency click transient (switch actuation)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1400 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(320 * jitter, now + 0.025);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.04);

    // Mechanical bottom-out thock (noise burst through bandpass)
    this.playNoiseThock(ctx, dest, now, 850 * jitter, 0.04, 0.25);
  }

  // Deeper, heavier spacebar thock
  private playSpaceSound(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.07);

    this.playNoiseThock(ctx, dest, now, 520, 0.06, 0.35);
  }

  // Solid enter key click
  private playEnterSound(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.06);

    this.playNoiseThock(ctx, dest, now, 700, 0.05, 0.3);
  }

  // Sharp backspace
  private playBackspaceSound(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.03);

    this.playNoiseThock(ctx, dest, now, 1100, 0.03, 0.2);
  }

  // Soft error tone
  private playErrorSound(ctx: AudioContext, dest: AudioNode, now: number) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.08);

    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Filtered white noise for keycap bottoming out
  private playNoiseThock(
    ctx: AudioContext,
    dest: AudioNode,
    now: number,
    filterFreq: number,
    duration: number,
    vol: number
  ) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    if (bufferSize <= 0) return;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(now);
    noise.stop(now + duration);
  }
}

export const soundEngine = new MechanicalSoundEngine();
