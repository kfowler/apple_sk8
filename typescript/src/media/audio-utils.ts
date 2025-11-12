/**
 * Audio Utilities - Advanced audio features using Web Audio API
 *
 * Provides audio context management, sound loading, volume control,
 * fading, and optional 3D positioning.
 */

/**
 * Shared audio context for all audio operations
 */
let audioContext: AudioContext | null = null;

/**
 * Get or create the shared audio context
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      throw error;
    }
  }
  return audioContext;
}

/**
 * Resume audio context (required by browsers after user interaction)
 */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Get audio context state
 */
export function getAudioContextState(): AudioContextState {
  return getAudioContext().state;
}

/**
 * Close the audio context
 */
export async function closeAudioContext(): Promise<void> {
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }
}

/**
 * Audio buffer cache
 */
const audioBufferCache = new Map<string, AudioBuffer>();

/**
 * Load audio from URL
 */
export async function loadAudio(url: string, useCache: boolean = true): Promise<AudioBuffer> {
  // Check cache first
  if (useCache && audioBufferCache.has(url)) {
    return audioBufferCache.get(url)!;
  }

  const ctx = getAudioContext();

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Add to cache
    if (useCache) {
      audioBufferCache.set(url, audioBuffer);
    }

    return audioBuffer;
  } catch (error) {
    console.error(`Failed to load audio from ${url}:`, error);
    throw error;
  }
}

/**
 * Preload multiple audio files
 */
export async function preloadAudio(
  urls: string[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, AudioBuffer>> {
  const results = new Map<string, AudioBuffer>();
  let loaded = 0;

  for (const url of urls) {
    try {
      const buffer = await loadAudio(url);
      results.set(url, buffer);
      loaded++;

      if (onProgress) {
        onProgress(loaded, urls.length);
      }
    } catch (error) {
      console.error(`Failed to preload ${url}:`, error);
    }
  }

  return results;
}

/**
 * Clear audio cache
 */
export function clearAudioCache(): void {
  audioBufferCache.clear();
}

/**
 * Remove audio from cache
 */
export function removeFromCache(url: string): boolean {
  return audioBufferCache.delete(url);
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return audioBufferCache.size;
}

/**
 * Create a simple audio player with gain control
 */
export interface AudioPlayer {
  source: AudioBufferSourceNode;
  gain: GainNode;
  play(offset?: number): void;
  stop(): void;
  setVolume(volume: number): void;
  fadeVolume(targetVolume: number, duration: number): void;
}

/**
 * Play audio buffer with volume control
 */
export function playAudioBuffer(
  buffer: AudioBuffer,
  options?: {
    volume?: number;
    loop?: boolean;
    playbackRate?: number;
    onEnded?: () => void;
  }
): AudioPlayer {
  const ctx = getAudioContext();

  // Resume context if needed
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();

  source.buffer = buffer;
  source.loop = options?.loop ?? false;
  source.playbackRate.value = options?.playbackRate ?? 1.0;

  gain.gain.value = options?.volume ?? 1.0;

  source.connect(gain);
  gain.connect(ctx.destination);

  if (options?.onEnded) {
    source.onended = options.onEnded;
  }

  const player: AudioPlayer = {
    source,
    gain,

    play(offset: number = 0) {
      source.start(0, offset);
    },

    stop() {
      try {
        source.stop();
      } catch (error) {
        // Already stopped
      }
    },

    setVolume(volume: number) {
      gain.gain.value = Math.max(0, Math.min(1, volume));
    },

    fadeVolume(targetVolume: number, duration: number) {
      const currentTime = ctx.currentTime;
      gain.gain.cancelScheduledValues(currentTime);
      gain.gain.setValueAtTime(gain.gain.value, currentTime);
      gain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, targetVolume)),
        currentTime + duration
      );
    },
  };

  // Auto-play
  player.play();

  return player;
}

/**
 * Volume fading utilities
 */
export class VolumeController {
  private gainNode: GainNode;

  constructor(gainNode: GainNode) {
    this.gainNode = gainNode;
  }

  /**
   * Fade in from 0 to target volume
   */
  fadeIn(targetVolume: number, duration: number): void {
    const ctx = getAudioContext();
    const currentTime = ctx.currentTime;

    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(0, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);
  }

  /**
   * Fade out from current to 0
   */
  fadeOut(duration: number): void {
    const ctx = getAudioContext();
    const currentTime = ctx.currentTime;

    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
  }

  /**
   * Crossfade between two gain nodes
   */
  static crossfade(fadeOut: GainNode, fadeIn: GainNode, duration: number): void {
    const ctx = getAudioContext();
    const currentTime = ctx.currentTime;

    // Fade out
    fadeOut.gain.cancelScheduledValues(currentTime);
    fadeOut.gain.setValueAtTime(fadeOut.gain.value, currentTime);
    fadeOut.gain.linearRampToValueAtTime(0, currentTime + duration);

    // Fade in
    fadeIn.gain.cancelScheduledValues(currentTime);
    fadeIn.gain.setValueAtTime(0, currentTime);
    fadeIn.gain.linearRampToValueAtTime(1, currentTime + duration);
  }
}

/**
 * 3D Audio positioning (optional advanced feature)
 */
export interface Audio3DOptions {
  position?: { x: number; y: number; z: number };
  orientation?: { x: number; y: number; z: number };
  refDistance?: number;
  maxDistance?: number;
  rolloffFactor?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
}

/**
 * Create a 3D audio source
 */
export function create3DAudioSource(
  buffer: AudioBuffer,
  options: Audio3DOptions = {}
): {
  source: AudioBufferSourceNode;
  panner: PannerNode;
  play(): void;
  stop(): void;
  setPosition(x: number, y: number, z: number): void;
} {
  const ctx = getAudioContext();

  const source = ctx.createBufferSource();
  const panner = ctx.createPanner();

  source.buffer = buffer;

  // Configure panner
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';

  if (options.position) {
    panner.positionX.value = options.position.x;
    panner.positionY.value = options.position.y;
    panner.positionZ.value = options.position.z;
  }

  if (options.orientation) {
    panner.orientationX.value = options.orientation.x;
    panner.orientationY.value = options.orientation.y;
    panner.orientationZ.value = options.orientation.z;
  }

  if (options.refDistance !== undefined) {
    panner.refDistance = options.refDistance;
  }

  if (options.maxDistance !== undefined) {
    panner.maxDistance = options.maxDistance;
  }

  if (options.rolloffFactor !== undefined) {
    panner.rolloffFactor = options.rolloffFactor;
  }

  source.connect(panner);
  panner.connect(ctx.destination);

  return {
    source,
    panner,

    play() {
      source.start(0);
    },

    stop() {
      try {
        source.stop();
      } catch (error) {
        // Already stopped
      }
    },

    setPosition(x: number, y: number, z: number) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    },
  };
}

/**
 * Set listener position and orientation for 3D audio
 */
export function setListenerPosition(
  position: { x: number; y: number; z: number },
  orientation?: { forward: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }
): void {
  const ctx = getAudioContext();
  const listener = ctx.listener;

  listener.positionX.value = position.x;
  listener.positionY.value = position.y;
  listener.positionZ.value = position.z;

  if (orientation) {
    listener.forwardX.value = orientation.forward.x;
    listener.forwardY.value = orientation.forward.y;
    listener.forwardZ.value = orientation.forward.z;
    listener.upX.value = orientation.up.x;
    listener.upY.value = orientation.up.y;
    listener.upZ.value = orientation.up.z;
  }
}

/**
 * Audio analyzer for visualization
 */
export function createAudioAnalyzer(
  sourceNode: AudioNode,
  fftSize: number = 2048
): {
  analyzer: AnalyserNode;
  getFrequencyData(): Uint8Array;
  getTimeDomainData(): Uint8Array;
  getAverageFrequency(): number;
} {
  const ctx = getAudioContext();
  const analyzer = ctx.createAnalyser();

  analyzer.fftSize = fftSize;
  sourceNode.connect(analyzer);

  const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
  const timeDomainData = new Uint8Array(analyzer.frequencyBinCount);

  return {
    analyzer,

    getFrequencyData() {
      analyzer.getByteFrequencyData(frequencyData);
      return frequencyData;
    },

    getTimeDomainData() {
      analyzer.getByteTimeDomainData(timeDomainData);
      return timeDomainData;
    },

    getAverageFrequency() {
      analyzer.getByteFrequencyData(frequencyData);
      const sum = frequencyData.reduce((a, b) => a + b, 0);
      return sum / frequencyData.length;
    },
  };
}

/**
 * Simple beep generator (useful for sound effects)
 */
export function playBeep(
  frequency: number = 440,
  duration: number = 0.2,
  volume: number = 0.3
): void {
  const ctx = getAudioContext();

  // Resume context if needed
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  gain.gain.value = volume;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * Play a sequence of tones
 */
export function playToneSequence(
  notes: { frequency: number; duration: number; volume?: number }[]
): void {
  const ctx = getAudioContext();

  // Resume context if needed
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  let currentTime = ctx.currentTime;

  for (const note of notes) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = note.frequency;

    gain.gain.value = note.volume ?? 0.3;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + note.duration);

    currentTime += note.duration;
  }
}
