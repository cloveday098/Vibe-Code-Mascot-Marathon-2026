// Original synthesized sound effects + tiny chiptune sequencer (WebAudio, no asset files).
export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
    this.song = null;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.18;
    this.musicGain.connect(this.master);
    const len = this.ctx.sampleRate * 1.0;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    return this.muted;
  }

  tone(freq, dur, type = 'square', vol = 0.15, slideTo = null, delay = 0, dest = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.3, cutoff = 1200, delay = 0, type = 'lowpass') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump': this.tone(300, 0.16, 'square', 0.09, 640); break;
      case 'land': this.noise(0.06, 0.12, 500); break;
      case 'punch': this.noise(0.08, 0.35, 900); this.tone(140, 0.08, 'sine', 0.2, 60); break;
      case 'hit': this.noise(0.1, 0.4, 2000); this.tone(220, 0.1, 'square', 0.1, 90); break;
      case 'ray': this.tone(1400, 0.18, 'sawtooth', 0.08, 180); this.tone(900, 0.12, 'sine', 0.08, 2400); break;
      case 'empty': this.tone(120, 0.06, 'square', 0.1); this.tone(100, 0.06, 'square', 0.1, null, 0.08); break;
      case 'reload': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.08, 'square', 0.07, null, i * 0.05)); break;
      case 'sword': this.noise(0.18, 0.25, 4000, 0, 'highpass'); this.tone(900, 0.15, 'sine', 0.05, 1800); break;
      case 'fire': this.noise(0.4, 0.35, 700); this.tone(200, 0.3, 'sawtooth', 0.08, 60); break;
      case 'boom': this.noise(0.6, 0.5, 400); this.tone(90, 0.5, 'sine', 0.3, 30); break;
      case 'laser': this.tone(1800, 0.09, 'sawtooth', 0.04, 1700); break;
      case 'force': this.tone(80, 0.6, 'sine', 0.35, 40); this.tone(400, 0.5, 'triangle', 0.1, 100); this.noise(0.5, 0.2, 300); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.07); this.tone(1319, 0.18, 'square', 0.07, null, 0.07); break;
      case 'power': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.12, 'square', 0.08, null, i * 0.07)); break;
      case 'hurt': this.tone(400, 0.25, 'square', 0.12, 120); break;
      case 'die': [440, 392, 349, 294, 220].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.15, null, i * 0.15)); break;
      case 'quack': this.tone(520, 0.12, 'sawtooth', 0.12, 330); this.tone(480, 0.1, 'sawtooth', 0.1, 300, 0.13); break;
      case 'honk': this.tone(300, 0.4, 'sawtooth', 0.18, 200); this.tone(310, 0.4, 'square', 0.08, 210); break;
      case 'thunder': this.noise(1.4, 0.55, 260); this.noise(0.15, 0.4, 3000, 0, 'highpass'); break;
      case 'warn': this.tone(880, 0.08, 'square', 0.05); break;
      case 'checkpoint': [523, 784, 1046].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.12, null, i * 0.09)); break;
      case 'win': [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.2, 'square', 0.09, null, i * 0.13)); break;
      case 'splash': this.noise(0.5, 0.4, 1500); break;
      case 'crate': this.noise(0.15, 0.4, 1200); this.tone(160, 0.1, 'square', 0.1, 80); break;
      case 'oof': this.tone(260, 0.16, 'sawtooth', 0.12, 120); this.noise(0.08, 0.2, 700); break;
      case 'grumble': this.tone(140, 0.25, 'sawtooth', 0.06, 110); this.tone(150, 0.2, 'square', 0.03, 100, 0.12); break;
      case 'stomp': this.tone(600, 0.1, 'square', 0.1, 200); this.noise(0.08, 0.2, 800); break;
    }
  }

  // ---- music -------------------------------------------------------------
  startMusic(kind) {
    this.stopMusic();
    if (!this.ctx) return;
    const songs = {
      campus: { bpm: 140, bass: [48, 48, 55, 55, 53, 53, 55, 50], lead: [72, 0, 76, 79, 0, 76, 74, 0, 72, 74, 76, 0, 79, 0, 81, 79] },
      storm: { bpm: 150, bass: [45, 45, 48, 48, 43, 43, 50, 47], lead: [69, 0, 72, 0, 76, 74, 72, 0, 69, 0, 71, 72, 74, 0, 71, 0] },
      gauntlet: { bpm: 165, bass: [50, 50, 53, 55, 50, 50, 57, 55], lead: [74, 77, 0, 74, 81, 0, 79, 77, 74, 0, 77, 79, 81, 84, 0, 81] },
      boss: { bpm: 172, bass: [40, 40, 43, 40, 46, 45, 43, 41], lead: [64, 0, 67, 64, 70, 0, 69, 67, 64, 0, 63, 64, 67, 0, 70, 71] },
      victory: { bpm: 120, bass: [48, 53, 55, 48, 48, 53, 55, 60], lead: [72, 76, 79, 84, 79, 76, 72, 0, 74, 77, 81, 86, 81, 77, 74, 0] },
    };
    this.song = songs[kind] || songs.campus;
    this.step = 0;
    const stepDur = 60 / this.song.bpm / 2;
    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) { this.step++; return; }
      const s = this.song;
      if (this.step % 2 === 0) {
        const b = s.bass[(this.step / 2) % s.bass.length];
        this.tone(midi(b), stepDur * 1.8, 'triangle', 0.5, null, 0, this.musicGain);
      }
      const l = s.lead[this.step % s.lead.length];
      if (l) this.tone(midi(l), stepDur * 0.9, 'square', 0.18, null, 0, this.musicGain);
      if (this.step % 4 === 2) this.noiseMusic(0.05);
      this.step++;
    }, stepDur * 1000);
  }

  noiseMusic(dur) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t); src.stop(t + dur + 0.01);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
