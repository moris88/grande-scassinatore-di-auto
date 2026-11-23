import { AmbientAudio, type AmbientLevels } from "./ambientAudio";

export type SoundEvent =
  | "shot"
  | "explosion"
  | "crash"
  | "punch"
  | "horn"
  | "success"
  | "fail"
  | StepSurface;

/** Passi del giocatore: il suono cambia con la superficie */
export type StepSurface = "stepAsphalt" | "stepStone" | "stepGrass" | "stepGravel" | "stepIndoor";

export interface AudioState {
  /** Velocità dell'auto del giocatore, null se a piedi */
  carSpeed: number | null;
  /** 0..1: quanto è vicina la sirena più vicina */
  siren: number;
  time: number;
  ambient: AmbientLevels;
}

const SILENCE: AmbientLevels = { traffic: 0, nature: 0, people: 0 };

/** Passi: filtro, frequenza, durata e volume del rumore per ogni superficie */
const STEPS: Record<StepSurface, [BiquadFilterType, number, number, number]> = {
  stepAsphalt: ["bandpass", 1400, 0.05, 0.14],
  stepStone: ["highpass", 2600, 0.04, 0.12],
  stepGrass: ["lowpass", 500, 0.09, 0.1],
  stepGravel: ["bandpass", 3200, 0.1, 0.12],
  stepIndoor: ["bandpass", 900, 0.16, 0.12],
};

/** Effetti sonori sintetizzati con WebAudio, nessun file esterno */
export class GameAudio {
  private ctx = new AudioContext();
  private master = this.ctx.createGain();
  private engine = this.ctx.createOscillator();
  private engineGain = this.ctx.createGain();
  private siren = this.ctx.createOscillator();
  private sirenGain = this.ctx.createGain();
  private noise: AudioBuffer;
  private ambient: AmbientAudio;
  private lastTime = 0;
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
    this.ambient = new AmbientAudio(this.ctx, this.master, this.noise);
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
    this.ambient.update(a.ambient, Math.min(0.1, Math.max(0, a.time - this.lastTime)));
    this.lastTime = a.time;
  }

  /** Silenzia i suoni continui (pausa, smontaggio) */
  quiet(): void {
    this.update({ carSpeed: null, siren: 0, time: this.lastTime, ambient: SILENCE });
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
    else if (e in STEPS) {
      const [type, freq, dur, vol] = STEPS[e as StepSurface];
      this.burst(dur, type, freq, vol);
    } else if (e === "success") this.notes([523, 659, 784, 1047], 0.12);
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
