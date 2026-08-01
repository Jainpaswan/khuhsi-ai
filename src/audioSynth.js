// Web Audio Synthesizer for Khushi's Memory Keeper
// Provides ambient soothing birthday music and soft SFX (candle blow, confetti, clicks)

class BirthdayAudioSynth {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.currentNoteIndex = 0;

    // Soft gentle lullaby / birthday chords (frequencies in Hz)
    // C4, E4, G4, A4, F4, G4, E4, C4 melody notes
    this.melodyNotes = [
      261.63, 261.63, 293.66, 261.63, 349.23, 329.63, // Happy Birthday line 1
      261.63, 261.63, 293.66, 261.63, 392.00, 349.23, // Happy Birthday line 2
      261.63, 261.63, 523.25, 440.00, 349.23, 329.63, 293.66, // Dear Khushi
      466.16, 466.16, 440.00, 349.23, 392.00, 349.23  // Happy Birthday to you
    ];
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, duration = 0.5, type = 'sine', gainVal = 0.08) {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, this.audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  playButtonClick() {
    this.playTone(523.25, 0.08, 'sine', 0.05);
  }

  playConfettiPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      // Noise burst + rising sine
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playCandleBlowSFX() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      // Gentle wind/whoosh sound created via filtered noise
      const bufferSize = this.audioCtx.sampleRate * 0.6;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      filter.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.6);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.6);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      whiteNoise.start();
      whiteNoise.stop(this.audioCtx.currentTime + 0.6);
    } catch (e) {}
  }

  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playCollect(type = 'cake') {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const freqs = type === 'star' ? [523.25, 659.25, 783.99, 1046.50] :
                    type === 'gift' ? [440, 554.37, 659.25] :
                    type === 'balloon' ? [587.33, 783.99] : [523.25, 659.25];
      freqs.forEach((f, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.08, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch (e) {}
  }

  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playMeow() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.4);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  playLevelComplete() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const fanFare = [392.00, 523.25, 659.25, 783.99, 1046.50];
      fanFare.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.1, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.3);
      });
    } catch (e) {}
  }

  playVictorySong() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    // Play upbeat full Happy Birthday tune
    const melody = [
      { note: 261.63, duration: 0.3 }, { note: 261.63, duration: 0.3 }, { note: 293.66, duration: 0.6 },
      { note: 261.63, duration: 0.6 }, { note: 349.23, duration: 0.6 }, { note: 329.63, duration: 1.0 },
      { note: 261.63, duration: 0.3 }, { note: 261.63, duration: 0.3 }, { note: 293.66, duration: 0.6 },
      { note: 261.63, duration: 0.6 }, { note: 392.00, duration: 0.6 }, { note: 349.23, duration: 1.0 },
      { note: 261.63, duration: 0.3 }, { note: 261.63, duration: 0.3 }, { note: 523.25, duration: 0.6 },
      { note: 440.00, duration: 0.6 }, { note: 349.23, duration: 0.6 }, { note: 329.63, duration: 0.6 },
      { note: 293.66, duration: 0.8 },
      { note: 466.16, duration: 0.3 }, { note: 466.16, duration: 0.3 }, { note: 440.00, duration: 0.6 },
      { note: 349.23, duration: 0.6 }, { note: 392.00, duration: 0.6 }, { note: 349.23, duration: 1.2 }
    ];

    let t = this.audioCtx.currentTime;
    melody.forEach(item => {
      this.playTone(item.note, item.duration, 'sine', 0.09);
      t += item.duration * 0.85;
    });
  }

  startAmbientMusic() {
    this.isPlayingMusic = true;
    this.init();
    this.scheduleNextMelodyNote();
  }

  scheduleNextMelodyNote() {
    if (!this.isPlayingMusic || this.isMuted) return;

    const note = this.melodyNotes[this.currentNoteIndex];
    this.playTone(note, 0.7, 'sine', 0.04);
    
    // Play warm background chord pad occasionally
    if (this.currentNoteIndex % 4 === 0) {
      this.playTone(note / 2, 1.2, 'triangle', 0.02);
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melodyNotes.length;

    this.musicTimer = setTimeout(() => {
      this.scheduleNextMelodyNote();
    }, 600);
  }

  stopAmbientMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientMusic();
    } else {
      this.startAmbientMusic();
    }
    return this.isMuted;
  }
}

export const audioSynth = new BirthdayAudioSynth();

