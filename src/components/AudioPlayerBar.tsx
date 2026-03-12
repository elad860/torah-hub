import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { useAudioPlayerStore } from "@/stores/audioPlayerStore";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function AudioPlayerBar() {
  const { currentTrack, isPlaying, pause, resume, stop } = useAudioPlayerStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);

  // Sync play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  // Load new track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => pause());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    }
  }, []);

  const onSeek = useCallback((val: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = val[0];
      setProgress(val[0]);
    }
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onTimeUpdate}
        onEnded={() => pause()}
      />
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 border-t border-gold/30",
          "bg-[hsl(var(--navy-deep))]/95 backdrop-blur-md text-primary-foreground",
          "px-3 py-2 md:px-6 md:py-3"
        )}
        style={{ background: "linear-gradient(180deg, hsl(240 10% 12% / 0.97), hsl(240 10% 8% / 0.99))" }}
      >
        <div className="container mx-auto flex items-center gap-3 md:gap-5 max-w-5xl">
          {/* Play/Pause */}
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold hover:bg-gold/30 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Title + Seek */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-white text-xs md:text-sm font-semibold truncate leading-tight">
              {currentTrack.title}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs text-gold/60 w-8 text-center flex-shrink-0">{fmt(progress)}</span>
              <Slider
                value={[progress]}
                max={duration || 100}
                step={1}
                onValueChange={onSeek}
                className="flex-1 [&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-gold [&_[role=slider]]:bg-gold [&_.relative]:bg-white/15 [&_[data-orientation=horizontal]>.absolute]:bg-gold"
              />
              <span className="text-[10px] md:text-xs text-gold/60 w-8 text-center flex-shrink-0">{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume - desktop only */}
          <div className="hidden md:flex items-center gap-2 w-28 flex-shrink-0">
            <button onClick={() => setMuted(!muted)} className="text-gold/70 hover:text-gold">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <Slider
              value={[muted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(v) => { setVolume(v[0]); setMuted(false); }}
              className="flex-1 [&_[data-orientation=horizontal]]:h-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-gold [&_[role=slider]]:bg-gold [&_.relative]:bg-white/15 [&_[data-orientation=horizontal]>.absolute]:bg-gold"
            />
          </div>

          {/* Close */}
          <button
            onClick={stop}
            className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
