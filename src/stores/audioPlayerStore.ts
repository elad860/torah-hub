import { create } from "zustand";

interface AudioPlayerState {
  currentTrack: { id: string; title: string; audioUrl: string } | null;
  isPlaying: boolean;
  play: (track: { id: string; title: string; audioUrl: string }) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  stop: () => set({ currentTrack: null, isPlaying: false }),
}));
