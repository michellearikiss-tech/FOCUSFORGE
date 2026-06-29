"use client";

import { createContext, useContext, useRef, useState, ReactNode } from "react";

type SoundType = "library" | "rain" | "forest" | "stars";

type AudioContextType = {
  currentScene: SoundType | null;
  isPlaying: boolean;
  noiseVolume: number;
  musicVolume: number;
  startSounds: (scene: SoundType) => Promise<void>;
  setNoiseVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  stopSounds: () => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);

  const noiseRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const [currentScene, setCurrentScene] = useState<SoundType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noiseVolume, setNoiseVolumeState] = useState(0.35);
  const [musicVolume, setMusicVolumeState] = useState(0.25);

  const noiseFiles: Record<SoundType, string> = {
    library: "/audio/library-noise.mp3",
    rain: "/audio/rain-noise.mp3",
    forest: "/audio/forest-noise.mp3",
    stars: "/audio/stars-noise.mp3",
  };

  const musicFiles: Record<SoundType, string> = {
    library: "/audio/library-music.mp3",
    rain: "/audio/rain-music.mp3",
    forest: "/audio/rain-ambience1.mp3",
    stars: "/audio/stars-music.mp3",
  };

  function getAudioContext() {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      audioContextRef.current = new AudioContextClass();
    }

    return audioContextRef.current;
  }

  async function resumeAudioContext() {
    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }

  function connectAudio(audio: HTMLAudioElement, type: "noise" | "music") {
    const context = getAudioContext();
    const gain = context.createGain();

    gain.gain.value = 0;

    const source = context.createMediaElementSource(audio);
    source.connect(gain);
    gain.connect(context.destination);

    audio.volume = 1;

    if (type === "noise") {
      noiseSourceRef.current = source;
      noiseGainRef.current = gain;
    } else {
      musicSourceRef.current = source;
      musicGainRef.current = gain;
    }

    return gain;
  }

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function fadeGain(gain: GainNode | null, from: number, to: number, duration = 1800) {
    if (!gain) return;

    const context = getAudioContext();
    const now = context.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(from, now);
    gain.gain.linearRampToValueAtTime(to, now + duration / 1000);
  }

  function stopSounds() {
    clearFadeTimer();

    const currentNoise = noiseRef.current;
    const currentMusic = musicRef.current;

    fadeGain(noiseGainRef.current, noiseGainRef.current?.gain.value || 0, 0, 1200);
    fadeGain(musicGainRef.current, musicGainRef.current?.gain.value || 0, 0, 1200);

    window.setTimeout(() => {
      currentNoise?.pause();
      currentMusic?.pause();

      noiseRef.current = null;
      musicRef.current = null;
      noiseSourceRef.current = null;
      musicSourceRef.current = null;
      noiseGainRef.current = null;
      musicGainRef.current = null;
    }, 1300);

    setIsPlaying(false);
  }

  async function startSounds(scene: SoundType) {
    stopSounds();

    const context = await resumeAudioContext();

    const noise = new Audio(noiseFiles[scene]);
    noise.loop = true;
    noise.crossOrigin = "anonymous";

    const music = new Audio(musicFiles[scene]);
    music.loop = false;
    music.crossOrigin = "anonymous";

    noiseRef.current = noise;
    musicRef.current = music;

    const noiseGain = connectAudio(noise, "noise");
    const musicGain = connectAudio(music, "music");

    try {
      await noise.play();
      fadeGain(noiseGain, 0, noiseVolume, 1800);
    } catch (error) {
      console.error("Noise play failed:", error);
    }

    try {
      await music.play();
      fadeGain(musicGain, 0, musicVolume, 2200);
    } catch (error) {
      console.error("Music play failed:", error);
    }

    clearFadeTimer();

    fadeTimerRef.current = window.setInterval(() => {
      const currentMusic = musicRef.current;
      const currentGain = musicGainRef.current;

      if (!currentMusic || !currentGain || !currentMusic.duration) return;

      const secondsLeft = currentMusic.duration - currentMusic.currentTime;

      if (secondsLeft <= 8) {
        const nextMusic = new Audio(musicFiles[scene]);
        nextMusic.loop = false;
        nextMusic.crossOrigin = "anonymous";

        const nextGain = context.createGain();
        nextGain.gain.value = 0;

        const nextSource = context.createMediaElementSource(nextMusic);
        nextSource.connect(nextGain);
        nextGain.connect(context.destination);

        nextMusic.volume = 1;

        musicRef.current = nextMusic;
        musicSourceRef.current = nextSource;
        musicGainRef.current = nextGain;

        nextMusic.play().then(() => {
          fadeGain(currentGain, currentGain.gain.value, 0, 8000);
          fadeGain(nextGain, 0, musicVolume, 8000);

          window.setTimeout(() => {
            currentMusic.pause();
          }, 8200);
        });

        clearFadeTimer();

        fadeTimerRef.current = window.setInterval(() => {
          const activeMusic = musicRef.current;
          if (!activeMusic || !activeMusic.duration) return;

          const left = activeMusic.duration - activeMusic.currentTime;

          if (left <= 8) {
            startSounds(scene);
          }
        }, 1000);
      }
    }, 1000);

    setCurrentScene(scene);
    setIsPlaying(true);
  }

  function setNoiseVolume(volume: number) {
    setNoiseVolumeState(volume);

    if (noiseGainRef.current) {
      const context = getAudioContext();
      noiseGainRef.current.gain.cancelScheduledValues(context.currentTime);
      noiseGainRef.current.gain.setValueAtTime(volume, context.currentTime);
    }

    if (noiseRef.current) {
      noiseRef.current.volume = 1;
    }
  }

  function setMusicVolume(volume: number) {
    setMusicVolumeState(volume);

    if (musicGainRef.current) {
      const context = getAudioContext();
      musicGainRef.current.gain.cancelScheduledValues(context.currentTime);
      musicGainRef.current.gain.setValueAtTime(volume, context.currentTime);
    }

    if (musicRef.current) {
      musicRef.current.volume = 1;
    }
  }

  return (
    <AudioContext.Provider
      value={{
        currentScene,
        isPlaying,
        noiseVolume,
        musicVolume,
        startSounds,
        setNoiseVolume,
        setMusicVolume,
        stopSounds,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error("useAudio must be inside AudioProvider");
  }

  return context;
}