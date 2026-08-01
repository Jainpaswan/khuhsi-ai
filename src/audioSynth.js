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
