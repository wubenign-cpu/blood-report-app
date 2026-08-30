// Web Audio API로 만드는 간단한 효과음 모음입니다.
// 외부 음원 파일 없이 브라우저에서 즉석으로 소리를 합성합니다.
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setEnabled(value) {
    this.enabled = value;
  }

  tone({ freq, duration = 0.12, type = "sine", gain = 0.18, delay = 0, endFreq }) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, startAt + duration);
    }

    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    osc.connect(gainNode).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  playKeyTick() {
    this.tone({ freq: 720, duration: 0.035, type: "square", gain: 0.05 });
  }

  playCorrect() {
    this.tone({ freq: 660, duration: 0.09, type: "triangle", gain: 0.2 });
    this.tone({ freq: 990, duration: 0.14, type: "triangle", gain: 0.18, delay: 0.06 });
  }

  playCombo(streak) {
    const base = 520 + Math.min(streak, 12) * 40;
    this.tone({ freq: base, duration: 0.1, type: "square", gain: 0.15 });
    this.tone({ freq: base * 1.5, duration: 0.14, type: "square", gain: 0.13, delay: 0.07 });
  }

  playWrong() {
    this.tone({ freq: 220, endFreq: 140, duration: 0.18, type: "sawtooth", gain: 0.15 });
  }

  playMiss() {
    this.tone({ freq: 180, endFreq: 90, duration: 0.28, type: "sawtooth", gain: 0.18 });
  }

  playSelect() {
    this.tone({ freq: 500, duration: 0.06, type: "sine", gain: 0.15 });
  }

  playStart() {
    [523, 659, 784, 1047].forEach((freq, i) =>
      this.tone({ freq, duration: 0.12, type: "triangle", gain: 0.18, delay: i * 0.09 })
    );
  }

  playGameOver() {
    [523, 466, 392, 330].forEach((freq, i) =>
      this.tone({ freq, duration: 0.22, type: "sawtooth", gain: 0.15, delay: i * 0.16 })
    );
  }

  playLevelUp() {
    [659, 784, 988, 1318].forEach((freq, i) =>
      this.tone({ freq, duration: 0.1, type: "square", gain: 0.16, delay: i * 0.07 })
    );
  }
}

export const sound = new SoundManager();
