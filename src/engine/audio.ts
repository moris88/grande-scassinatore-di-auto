export type SoundEvent = "shot" | "explosion" | "crash" | "punch" | "horn" | "success" | "fail";

export interface AudioState {
  /** Velocità dell'auto del giocatore, null se a piedi */
  carSpeed: number | null;
  /** 0..1: quanto è vicina la sirena più vicina */
  siren: number;
  time: number;
}

/** Effetti sonori sintetizzati con WebAudio, nessun file esterno */
export class GameAudio {
  private ctx = new AudioContext();
  private master = this.ctx.createGain();
  private engine = this.ctx.createOscillator();
  private engineGain = this.ctx.createGain();
  private siren = this.ctx.createOscillator();
  private sirenGain = this.ctx.createGain();
  private noise: AudioBuffer;
  muted = false;

  constructor() {
    this.master.gain.value = 0.3;
    this.master.connect(this.ctx.destination);

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    this.engine.type = "sawtooth";
    this.engine.connect(lp).connect(this.engineGain).connect(this.master);
    this.engineGain.gain.value = 0;
    this.engine.start();

    this.siren.type = "square";
    this.siren.connect(this.sirenGain).connect(this.master);
    this.sirenGain.gain.value = 0;
    this.siren.start();

    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  /** I browser sbloccano l'audio solo dopo un gesto dell'utente */
  resume(): void {
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime, 0.05);
  }

  /** Suoni continui: motore e sirena */
  update(a: AudioState): void {
    const t = this.ctx.currentTime;
    const speed = Math.abs(a.carSpeed ?? 0);
    this.engineGain.gain.setTargetAtTime(a.carSpeed === null ? 0 : 0.12, t, 0.1);
    this.engine.frequency.setTargetAtTime(45 + speed * 0.45, t, 0.08);
    this.sirenGain.gain.setTargetAtTime(a.siren * 0.06, t, 0.1);
    this.siren.frequency.setTargetAtTime(a.time % 1 < 0.5 ? 660 : 880, t, 0.02);
  }

  /** Silenzia i suoni continui (pausa, smontaggio) */
  quiet(): void {
    this.update({ carSpeed: null, siren: 0, time: 0 });
  }

  close(): void {
    void this.ctx.close();
  }

  play(e: SoundEvent): void {
    if (e === "shot") this.burst(0.08, "bandpass", 1800, 0.5);
    else if (e === "explosion") this.burst(0.9, "lowpass", 350, 1);
    else if (e === "crash") this.burst(0.18, "lowpass", 900, 0.6);
    else if (e === "punch") this.burst(0.06, "lowpass", 600, 0.5);
    else if (e === "horn") this.notes([311, 262], 0.35);
    else if (e === "success") this.notes([523, 659, 784, 1047], 0.12);
    else this.notes([392, 330, 262], 0.2);
  }

  private burst(dur: number, type: BiquadFilterType, freq: number, vol: number): void {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  private notes(freqs: number[], step: number): void {
    const t = this.ctx.currentTime;
    freqs.forEach((fr, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "square";
      o.frequency.value = fr;
      g.gain.setValueAtTime(0.12, t + i * step);
      g.gain.exponentialRampToValueAtTime(0.001, t + (i + 1) * step);
      o.connect(g).connect(this.master);
      o.start(t + i * step);
      o.stop(t + (i + 1) * step);
    });
  }
}
