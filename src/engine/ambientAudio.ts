/** Livelli dei suoni ambientali (0..1), calcolati dal gioco ogni frame */
export interface AmbientLevels {
  /** Quanto traffico c'è attorno al giocatore */
  traffic: number;
  /** Quanto verde (parchi) c'è attorno: uccellini */
  nature: number;
  /** Quanti pedoni camminano vicino: passi lontani, cani */
  people: number;
}

/** Probabilità al secondo (a livello 1) degli eventi casuali */
const BIRD_RATE = 1.2;
const STEP_RATE = 5;
const DOG_RATE = 0.06;
const HORN_RATE = 0.12;

/** Suoni d'ambiente della città: brusio continuo del traffico più eventi casuali */
export class AmbientAudio {
  private rumble: AudioBufferSourceNode;
  private rumbleGain: GainNode;

  constructor(
    private ctx: AudioContext,
    private out: AudioNode,
    private noise: AudioBuffer,
  ) {
    this.rumble = ctx.createBufferSource();
    this.rumble.buffer = noise;
    this.rumble.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0;
    this.rumble.connect(lp).connect(this.rumbleGain).connect(out);
    this.rumble.start();
  }

  update(a: AmbientLevels, dt: number): void {
    this.rumbleGain.gain.setTargetAtTime(a.traffic * 0.25, this.ctx.currentTime, 0.3);
    if (Math.random() < a.nature * BIRD_RATE * dt) this.bird();
    if (Math.random() < a.people * STEP_RATE * dt) this.tick(2200, 0.03, 0.04);
    if (Math.random() < a.people * DOG_RATE * dt) this.tone([340, 290], 0.09, "square", 0.05);
    if (Math.random() < a.traffic * HORN_RATE * dt) this.tone([370, 370], 0.15, "sawtooth", 0.025);
  }

  /** Cinguettio: due fischi rapidi che salgono */
  private bird(): void {
    const t = this.ctx.currentTime;
    const base = 2500 + Math.random() * 1500;
    for (let i = 0; i < 2; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(base, t + i * 0.12);
      o.frequency.exponentialRampToValueAtTime(base * 1.4, t + i * 0.12 + 0.08);
      g.gain.setValueAtTime(0.035, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.09);
      o.connect(g).connect(this.out);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.1);
    }
  }

  /** Scatto di rumore filtrato (passi lontani) */
  private tick(freq: number, dur: number, vol: number): void {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur);
  }

  /** Sequenza di toni brevi (abbaio, clacson lontano) */
  private tone(freqs: number[], step: number, type: OscillatorType, vol: number): void {
    const t = this.ctx.currentTime;
    freqs.forEach((fr, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = fr;
      g.gain.setValueAtTime(vol, t + i * step * 1.4);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * step * 1.4 + step);
      o.connect(g).connect(this.out);
      o.start(t + i * step * 1.4);
      o.stop(t + i * step * 1.4 + step);
    });
  }
}
