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

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }

  function fadeVolume(
    audio: HTMLAudioElement,
    from: number,
    to: number,
    duration = 1800
  ) {
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    audio.volume = from;

    const timer = window.setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      audio.volume = from + (to - from) * progress;

      if (currentStep >= steps) {
        audio.volume = to;
        window.clearInterval(timer);
      }
    }, stepTime);
  }

  function stopSounds() {
    clearFadeTimer();

    if (noiseRef.current) {
      fadeVolume(noiseRef.current, noiseRef.current.volume, 0, 1200);
      setTimeout(() => {
        noiseRef.current?.pause();
        noiseRef.current = null;
      }, 1300);
    }

    if (musicRef.current) {
      fadeVolume(musicRef.current, musicRef.current.volume, 0, 1200);
      setTimeout(() => {
        musicRef.current?.pause();
        musicRef.current = null;
      }, 1300);
    }

    setIsPlaying(false);
  }

  async function startSounds(scene: SoundType) {
    stopSounds();

    const noise = new Audio(noiseFiles[scene]);
    noise.loop = true;
    noise.volume = 0;

    const music = new Audio(musicFiles[scene]);
    music.loop = false;
    music.volume = 0;

    noiseRef.current = noise;
    musicRef.current = music;

    try {
      await noise.play();
      fadeVolume(noise, 0, noiseVolume, 1800);
    } catch (error) {
      console.error("Noise play failed:", error);
    }

    try {
      await music.play();
      fadeVolume(music, 0, musicVolume, 2200);
    } catch (error) {
      console.error("Music play failed:", error);
    }

    clearFadeTimer();

    fadeTimerRef.current = window.setInterval(() => {
      const currentMusic = musicRef.current;
      if (!currentMusic || !currentMusic.duration) return;

      const secondsLeft = currentMusic.duration - currentMusic.currentTime;

      if (secondsLeft <= 8) {
        const nextMusic = new Audio(musicFiles[scene]);
        nextMusic.loop = false;
        nextMusic.volume = 0;

        musicRef.current = nextMusic;

        nextMusic.play().then(() => {
          fadeVolume(currentMusic, currentMusic.volume, 0, 8000);
          fadeVolume(nextMusic, 0, musicVolume, 8000);

          setTimeout(() => {
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
    if (noiseRef.current) noiseRef.current.volume = volume;
  }

  function setMusicVolume(volume: number) {
    setMusicVolumeState(volume);
    if (musicRef.current) musicRef.current.volume = volume;
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