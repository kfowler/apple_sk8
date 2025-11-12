/**
 * Sound - Audio playback actor using Web Audio API
 *
 * Provides audio playback with volume control, looping, and playback rate adjustment.
 * Can work as a non-visual actor or with optional visual representation.
 */

import { SK8Object } from '../core/SK8Object.js';
import { SK8CustomEvent } from '../events/SK8Event.js';

/**
 * Sound state enumeration
 */
export enum SoundState {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * SK8Sound - Audio playback actor
 */
export class SK8Sound extends SK8Object {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioUrl: string | null = null;
  private state: SoundState = SoundState.IDLE;
  private _volume: number = 1.0;
  private _loop: boolean = false;
  private _playbackRate: number = 1.0;
  private startTime: number = 0;
  private pauseTime: number = 0;

  // Use shared audio context
  private static sharedContext: AudioContext | null = null;

  constructor(parent?: SK8Object, name?: string) {
    super(parent, name || 'Sound');

    // Get or create shared audio context
    if (!SK8Sound.sharedContext) {
      try {
        SK8Sound.sharedContext = new AudioContext();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
      }
    }

    this.audioContext = SK8Sound.sharedContext;

    // Define properties
    this.defineProperty('src', {
      getter: () => this.getSource(),
      setter: (value: string) => this.setSource(value),
    });

    this.defineProperty('volume', {
      getter: () => this.getVolume(),
      setter: (value: number) => this.setVolume(value),
    });

    this.defineProperty('loop', {
      getter: () => this.getLoop(),
      setter: (value: boolean) => this.setLoop(value),
    });

    this.defineProperty('playbackRate', {
      getter: () => this.getPlaybackRate(),
      setter: (value: number) => this.setPlaybackRate(value),
    });

    this.defineProperty('state', {
      getter: () => this.getState(),
    });

    this.defineProperty('duration', {
      getter: () => this.getDuration(),
    });

    this.defineProperty('currentTime', {
      getter: () => this.getCurrentTime(),
    });
  }

  /**
   * Source management
   */
  getSource(): string | null {
    return this.audioUrl;
  }

  async setSource(url: string): Promise<void> {
    this.audioUrl = url;
    this.state = SoundState.LOADING;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      if (!this.audioContext) {
        throw new Error('AudioContext not available');
      }

      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.state = SoundState.LOADED;

      if (this.hasHandler('loaded')) {
        this.callHandler('loaded');
      }

      this.dispatchCustomEvent('soundLoaded', { url, duration: this.audioBuffer.duration });
    } catch (error) {
      this.state = SoundState.ERROR;
      console.error('Failed to load audio:', error);

      if (this.hasHandler('error')) {
        this.callHandler('error', error);
      }

      this.dispatchCustomEvent('soundError', { url, error });
    }
  }

  /**
   * Playback controls
   */
  play(startOffset: number = 0): void {
    if (!this.audioContext || !this.audioBuffer) {
      console.warn('Cannot play: audio not loaded');
      return;
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Stop any currently playing sound
    this.stop();

    // Create new source and gain nodes
    this.sourceNode = this.audioContext.createBufferSource();
    this.gainNode = this.audioContext.createGain();

    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this._loop;
    this.sourceNode.playbackRate.value = this._playbackRate;

    this.gainNode.gain.value = this._volume;

    // Connect nodes
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Set up ended callback
    this.sourceNode.onended = () => {
      if (this.state === SoundState.PLAYING && !this._loop) {
        this.state = SoundState.STOPPED;

        if (this.hasHandler('ended')) {
          this.callHandler('ended');
        }

        this.dispatchCustomEvent('soundEnded', {});
      }
    };

    // Start playback
    this.sourceNode.start(0, startOffset);
    this.startTime = this.audioContext.currentTime - startOffset;
    this.pauseTime = 0;
    this.state = SoundState.PLAYING;

    if (this.hasHandler('play')) {
      this.callHandler('play');
    }

    this.dispatchCustomEvent('soundPlay', {});
  }

  pause(): void {
    if (this.state !== SoundState.PLAYING || !this.sourceNode || !this.audioContext) {
      return;
    }

    // Calculate pause time
    this.pauseTime = this.audioContext.currentTime - this.startTime;

    // Stop the source
    this.sourceNode.stop();
    this.sourceNode = null;

    this.state = SoundState.PAUSED;

    if (this.hasHandler('pause')) {
      this.callHandler('pause');
    }

    this.dispatchCustomEvent('soundPause', {});
  }

  resume(): void {
    if (this.state !== SoundState.PAUSED) {
      return;
    }

    this.play(this.pauseTime);
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // Already stopped
      }
      this.sourceNode = null;
    }

    this.startTime = 0;
    this.pauseTime = 0;

    if (this.state === SoundState.PLAYING || this.state === SoundState.PAUSED) {
      this.state = SoundState.STOPPED;

      if (this.hasHandler('stop')) {
        this.callHandler('stop');
      }

      this.dispatchCustomEvent('soundStop', {});
    }
  }

  /**
   * State queries
   */
  getState(): SoundState {
    return this.state;
  }

  isPlaying(): boolean {
    return this.state === SoundState.PLAYING;
  }

  isPaused(): boolean {
    return this.state === SoundState.PAUSED;
  }

  isLoaded(): boolean {
    return this.state === SoundState.LOADED || this.state === SoundState.PLAYING || this.state === SoundState.PAUSED;
  }

  /**
   * Volume control (0.0 to 1.0)
   */
  getVolume(): number {
    return this._volume;
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));

    if (this.gainNode) {
      this.gainNode.gain.value = this._volume;
    }
  }

  /**
   * Fade volume over time
   */
  fadeVolume(targetVolume: number, duration: number): void {
    if (!this.gainNode || !this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(this._volume, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, targetVolume)),
      currentTime + duration
    );

    this._volume = targetVolume;
  }

  /**
   * Loop control
   */
  getLoop(): boolean {
    return this._loop;
  }

  setLoop(loop: boolean): void {
    this._loop = loop;

    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }

  /**
   * Playback rate (0.25 to 4.0)
   */
  getPlaybackRate(): number {
    return this._playbackRate;
  }

  setPlaybackRate(rate: number): void {
    this._playbackRate = Math.max(0.25, Math.min(4, rate));

    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = this._playbackRate;
    }
  }

  /**
   * Duration and time
   */
  getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;

    if (this.state === SoundState.PLAYING) {
      return this.audioContext.currentTime - this.startTime;
    } else if (this.state === SoundState.PAUSED) {
      return this.pauseTime;
    }

    return 0;
  }

  /**
   * Helper to dispatch custom events
   */
  private dispatchCustomEvent(type: string, detail: any): void {
    // Create a simple event object that mimics SK8CustomEvent
    // If this sound is part of an actor hierarchy, we could dispatch through the parent
    // For now, just call handlers
    void new SK8CustomEvent(type, { detail });
  }

  /**
   * Static method to resume audio context (needed for user interaction)
   */
  static async resumeContext(): Promise<void> {
    if (SK8Sound.sharedContext && SK8Sound.sharedContext.state === 'suspended') {
      await SK8Sound.sharedContext.resume();
    }
  }

  /**
   * Static method to get audio context state
   */
  static getContextState(): AudioContextState | null {
    return SK8Sound.sharedContext?.state || null;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.audioBuffer = null;
    this.gainNode = null;
  }
}

/**
 * SoundManager - Manages multiple sounds and provides pooling
 */
export class SoundManager {
  private static sounds = new Map<string, SK8Sound>();
  private static soundCache = new Map<string, AudioBuffer>();

  /**
   * Create or get a sound by name
   */
  static getSound(name: string): SK8Sound | undefined {
    return this.sounds.get(name);
  }

  /**
   * Register a sound
   */
  static registerSound(name: string, sound: SK8Sound): void {
    this.sounds.set(name, sound);
  }

  /**
   * Unregister a sound
   */
  static unregisterSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.dispose();
      this.sounds.delete(name);
    }
  }

  /**
   * Create a new sound from URL
   */
  static async createSound(name: string, url: string): Promise<SK8Sound> {
    const sound = new SK8Sound();
    await sound.setSource(url);
    this.registerSound(name, sound);
    return sound;
  }

  /**
   * Play a sound by name
   */
  static play(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Stop a sound by name
   */
  static stop(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Stop all sounds
   */
  static stopAll(): void {
    this.sounds.forEach((sound) => sound.stop());
  }

  /**
   * Set volume for all sounds
   */
  static setMasterVolume(volume: number): void {
    this.sounds.forEach((sound) => sound.setVolume(volume));
  }

  /**
   * Clear all sounds
   */
  static clear(): void {
    this.sounds.forEach((sound) => sound.dispose());
    this.sounds.clear();
    this.soundCache.clear();
  }
}

/**
 * Helper function to create a sound
 */
export async function createSound(
  url: string,
  options?: {
    volume?: number;
    loop?: boolean;
    playbackRate?: number;
    autoplay?: boolean;
  }
): Promise<SK8Sound> {
  const sound = new SK8Sound();
  await sound.setSource(url);

  if (options?.volume !== undefined) {
    sound.setVolume(options.volume);
  }

  if (options?.loop !== undefined) {
    sound.setLoop(options.loop);
  }

  if (options?.playbackRate !== undefined) {
    sound.setPlaybackRate(options.playbackRate);
  }

  if (options?.autoplay) {
    sound.play();
  }

  return sound;
}
