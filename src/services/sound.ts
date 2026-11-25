/**
 * Real Web Audio API sound synthesizer:
 * - Pomodoro completion chime
 * - Focus ambient soundscapes (Soft Rain, Brown Noise, Deep Space Drone)
 */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCompletionChime(): void {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.72);
    });
  } catch {
    // Ignore autoplay blocks
  }
}

export type AmbientSoundType = 'off' | 'rain' | 'brown-noise' | 'cosmic-drone';

class AmbientPlayer {
  private nodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;
  private activeType: AmbientSoundType = 'off';

  start(type: AmbientSoundType, volume = 0.25) {
    this.stop();
    if (type === 'off') return;
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    this.masterGain = gain;
    this.activeType = type;

    if (type === 'brown-noise' || type === 'rain') {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown-noise') {
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.2;
        } else {
          // Pink/rain-textured noise
          data[i] = (lastOut + 0.08 * white) / 1.08;
          lastOut = data[i];
          data[i] *= 1.8;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = type === 'rain' ? 950 : 320;
      filter.Q.value = type === 'rain' ? 0.6 : 0.9;

      source.connect(filter);
      filter.connect(gain);
      source.start();
      this.nodes = [source, filter];
    } else if (type === 'cosmic-drone') {
      const freqs = [110, 164.81, 220.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const subGain = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        subGain.gain.value = i === 0 ? 0.25 : 0.08;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 340;
        osc.connect(filter);
        filter.connect(subGain);
        subGain.connect(gain);
        osc.start();
        this.nodes.push(osc, filter, subGain);
      });
    }
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  stop() {
    for (const node of this.nodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignore
      }
    }
    this.nodes = [];
    this.masterGain = null;
    this.activeType = 'off';
  }

  getActive(): AmbientSoundType {
    return this.activeType;
  }
}

export const ambientPlayer = new AmbientPlayer();
