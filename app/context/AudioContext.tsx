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

const FocusAudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const webAudioRef = useRef<AudioContext | null>(null);

  const noiseRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const noiseGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);

  const noiseSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const loopTimerRef = useRef<number | null>(null);

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

  function getWebAudio() {
    if (!webAudioRef.current) {
      const AudioClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      webAudioRef.current = new AudioClass();
    }

    return webAudioRef.current;
  }

  async function unlockAudio() {
    const context = getWebAudio();

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }

  function clearLoopTimer() {
    if (loopTimerRef.current) {
      window.clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }

  function cleanupAudio() {
    clearLoopTimer();

    noiseRef.current?.pause();
    musicRef.current?.pause();

    noiseRef.current = null;
    musicRef.current = null;

    noiseSourceRef.current?.disconnect();
    musicSourceRef.current?.disconnect();

    noiseGainRef.current?.disconnect();
    musicGainRef.current?.disconnect();

    noiseSourceRef.current = null;
    musicSourceRef.current = null;
    noiseGainRef.current = null;
    musicGainRef.current = null;
  }

  function connectWithGain(audio: HTMLAudioElement, type: "noise" | "music") {
    const context = getWebAudio();

    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();

    gain.gain.value = type === "noise" ? noiseVolume : musicVolume;

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

  async function startSounds(scene: SoundType) {
    cleanupAudio();

    await unlockAudio();

    const noise = new Audio(noiseFiles[scene]);
    noise.loop = true;
    noise.preload = "auto";
    noise.volume = 1;

    const music = new Audio(musicFiles[scene]);
    music.loop = true;
    music.preload = "auto";
    music.volume = 1;

    noiseRef.current = noise;
    musicRef.current = music;

    connectWithGain(noise, "noise");
    connectWithGain(music, "music");

    try {
      await noise.play();
    } catch (error) {
      console.error("Noise play failed:", error);
    }

    try {
      await music.play();
    } catch (error) {
      console.error("Music play failed:", error);
    }

    setCurrentScene(scene);
    setIsPlaying(true);
  }

  function stopSounds() {
    cleanupAudio();
    setIsPlaying(false);
  }

  function setNoiseVolume(volume: number) {
    setNoiseVolumeState(volume);

    const context = getWebAudio();

    if (noiseGainRef.current) {
      noiseGainRef.current.gain.cancelScheduledValues(context.currentTime);
      noiseGainRef.current.gain.setValueAtTime(volume, context.currentTime);
    }
  }

  function setMusicVolume(volume: number) {
    setMusicVolumeState(volume);

    const context = getWebAudio();

    if (musicGainRef.current) {
      musicGainRef.current.gain.cancelScheduledValues(context.currentTime);
      musicGainRef.current.gain.setValueAtTime(volume, context.currentTime);
    }
  }

  return (
    <FocusAudioContext.Provider
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
    </FocusAudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(FocusAudioContext);

  if (!context) {
    throw new Error("useAudio must be inside AudioProvider");
  }

  return context;
}