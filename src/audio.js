export class AudioSystem {
  constructor(trackUrl) {
    this.trackUrl = trackUrl;
    this.ctx = null;
    this.el = null;

    this.gainNode = null;
    this.lowPass = null;
    this.lowShelf = null;
    this.highShelf = null;

    this.started = false;
    this.targetVolume = 0.5;
    this.currentVolume = 0.25;
    this.targetBass = 0.5;
    this.currentBass = 0.5;
    this.targetTone = 0;
    this.currentTone = 0;
  }

  ensureStarted() {
    if (this.started) {
      if (this.ctx?.state === 'suspended') this.ctx.resume();
      return;
    }

    this.ctx = new AudioContext();

    this.el = new Audio(this.trackUrl);
    this.el.crossOrigin = 'anonymous';
    this.el.loop = true;
    this.el.preload = 'auto';

    const src = this.ctx.createMediaElementSource(this.el);
    this.gainNode = this.ctx.createGain();
    this.lowPass = this.ctx.createBiquadFilter();
    this.lowShelf = this.ctx.createBiquadFilter();
    this.highShelf = this.ctx.createBiquadFilter();

    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.value = 1600;
    this.lowPass.Q.value = 0.8;

    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 180;
    this.lowShelf.gain.value = 2;

    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 2300;
    this.highShelf.gain.value = 0;

    this.gainNode.gain.value = this.currentVolume;

    src.connect(this.lowShelf);
    this.lowShelf.connect(this.lowPass);
    this.lowPass.connect(this.highShelf);
    this.highShelf.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.el.play().catch(() => undefined);
    this.started = true;
  }

  setVolume(v) {
    this.targetVolume = Math.min(1, Math.max(0, v));
  }

  setBassIntensity(v) {
    this.targetBass = Math.min(1, Math.max(0, v));
  }

  setTone(v) {
    this.targetTone = Math.min(1, Math.max(-1, v));
  }

  update(dt) {
    if (!this.started || !this.gainNode || !this.lowPass || !this.lowShelf || !this.highShelf) {
      return;
    }

    const t = Math.min(1, dt * 6);

    this.currentVolume += (this.targetVolume - this.currentVolume) * t;
    this.currentBass += (this.targetBass - this.currentBass) * t;
    this.currentTone += (this.targetTone - this.currentTone) * t;

    this.gainNode.gain.value = this.currentVolume;

    const cutoff = 700 + this.currentBass * 2200;
    this.lowPass.frequency.value = cutoff;
    this.lowShelf.gain.value = this.currentBass * 8;
    this.highShelf.gain.value = this.currentTone * 8;
  }
}
