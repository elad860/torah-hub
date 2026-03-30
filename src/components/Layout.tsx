import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AudioPlayerBar } from "./AudioPlayerBar";
import { useAudioPlayerStore } from "@/stores/audioPlayerStore";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const hasTrack = useAudioPlayerStore((s) => !!s.currentTrack);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Background Image */}
      <div 
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('/images/rabbi-background.png')`,
          backgroundAttachment: 'fixed'
        }}
      />
      {/* Dark Overlay for Readability */}
      <div className="fixed inset-0 -z-10 bg-black/70" />
      
      <Header />
      <main className={`flex-1 relative ${hasTrack ? "pb-20 md:pb-[4.5rem]" : ""}`}>{children}</main>
      <Footer />
      <AudioPlayerBar />
    </div>
  );
}
