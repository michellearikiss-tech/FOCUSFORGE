"use client";

import { createContext, useContext, useRef, useState, ReactNode } from "react";

type SoundType = "library" | "rain" | "forest" | "stars";

type AudioContextType = {
  currentScene: SoundType | null;
  isPlaying: boolean;
  noiseVolume: number;
  changeNoise: (scene: SoundType) => void;
  setNoiseVolume: (volume: number) => void;
  stopNoise: () => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentScene, setCurrentScene] = useState<SoundType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noiseVolumeState, setNoiseVolumeState] = useState(0.35);

  const files: Record<SoundType, string> = {
    library: "/audio/library-noise.mp3",
    rain: "/audio/rain-noise.mp3",
    forest: "/audio/forest-noise.mp3",
    stars: "/audio/stars-noise.mp3",
  };

  function changeNoise(scene: SoundType) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(files[scene]);
    audio.loop = true;
    audio.volume = noiseVolumeState;

    audio
      .play()
      .then(() => {
        setCurrentScene(scene);
        setIsPlaying(true);
      })
      .catch(() => {
        setCurrentScene(scene);
        setIsPlaying(false);
      });

    audioRef.current = audio;
  }

  function setNoiseVolume(volume: number) {
    setNoiseVolumeState(volume);

    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }

  function stopNoise() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(false);
  }

  return (
    <AudioContext.Provider
      value={{
        currentScene,
        isPlaying,
        noiseVolume: noiseVolumeState,
        changeNoise,
        setNoiseVolume,
        stopNoise,
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