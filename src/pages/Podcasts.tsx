import { Layout } from "@/components/Layout";
import { Headphones, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { usePodcasts } from "@/hooks/usePodcasts";
import rabbiBanner from "@/assets/rabbi-banner.png";

const Podcasts = () => {
  const { data: podcasts, isLoading, error } = usePodcasts();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold animate-fade-up overflow-hidden">
              <img src={rabbiBanner} alt="הרב אורן נזרית" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4 animate-fade-up">
              <Headphones className="w-8 h-8 text-gold" />
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                הפודקאסט של <span className="text-gold">הרב אורן נזרית</span>
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/80 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              שיעורי הרב זמינים להאזנה גם בספוטיפיי
            </p>
            
            {/* Spotify Channel Button - Placeholder */}
            <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="gold" size="xl" className="gap-2" disabled>
                <ExternalLink className="w-5 h-5" />
                לערוץ הספוטיפיי המלא (בקרוב)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Podcasts Grid */}
      <section className="py-12 md:py-16 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
              פרקים אחרונים
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/10 rounded-xl h-80 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-white/70">אירעה שגיאה בטעינת הפודקאסטים</p>
              </div>
            ) : podcasts && podcasts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {podcasts.map((podcast) => (
                  <div key={podcast.id} className="space-y-3">
                    <SpotifyEmbed 
                      spotifyUrl={podcast.spotify_url} 
                      title={podcast.title} 
                    />
                    <div className="px-2">
                      <h3 className="text-white font-semibold">{podcast.title}</h3>
                      {podcast.description && (
                        <p className="text-white/60 text-sm mt-1">{podcast.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-gold/20">
                <Headphones className="w-16 h-16 mx-auto mb-4 text-gold/50" />
                <p className="text-white/70 text-lg">הפודקאסטים יעלו בקרוב...</p>
                <p className="text-white/50 mt-2">עקבו אחרינו בספוטיפיי לעדכונים</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-bold text-white mb-4">איך להאזין?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/80">
              <div className="bg-white/10 rounded-xl p-6 border border-gold/20">
                <div className="text-3xl mb-3">📱</div>
                <h4 className="font-semibold mb-2">אפליקציית ספוטיפיי</h4>
                <p className="text-sm text-white/60">הורידו את האפליקציה והאזינו בכל מקום</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 border border-gold/20">
                <div className="text-3xl mb-3">🎧</div>
                <h4 className="font-semibold mb-2">האזנה אופליין</h4>
                <p className="text-sm text-white/60">הורידו פרקים להאזנה ללא אינטרנט</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 border border-gold/20">
                <div className="text-3xl mb-3">🔔</div>
                <h4 className="font-semibold mb-2">התראות</h4>
                <p className="text-sm text-white/60">עקבו וקבלו עדכון על פרקים חדשים</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Podcasts;
