import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Mic, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePodcasts } from "@/hooks/usePodcasts";

const Podcasts = () => {
  const { data: podcasts, isLoading, error } = usePodcasts();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const years = useMemo(() => {
    if (!podcasts) return [];
    const set = new Set(podcasts.map((p) => p.hebrew_year).filter(Boolean) as string[]);
    return Array.from(set).sort().reverse();
  }, [podcasts]);

  const filtered = useMemo(() => {
    if (!podcasts) return [];
    if (selectedYear === "all") return podcasts;
    return podcasts.filter((p) => p.hebrew_year === selectedYear);
  }, [podcasts, selectedYear]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">הקלטות</h1>
          <p className="text-muted-foreground text-lg">הקלטות שמע של שיעורי הרב להאזנה</p>
        </div>

        {/* Year Filter */}
        {years.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              size="sm"
              variant={selectedYear === "all" ? "default" : "outline"}
              onClick={() => setSelectedYear("all")}
              className="text-xs"
            >
              הכל
            </Button>
            {years.map((y) => (
              <Button
                key={y}
                size="sm"
                variant={selectedYear === y ? "default" : "outline"}
                onClick={() => setSelectedYear(y)}
                className="text-xs"
              >
                {y}
              </Button>
            ))}
          </div>
        )}

        {/* Recordings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-lg h-28 animate-pulse bg-white/10" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-white/70">אירעה שגיאה בטעינת ההקלטות</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((podcast) => (
              <div
                key={podcast.id}
                className="group relative rounded-lg border border-gold/15 overflow-hidden transition-all duration-300 hover:border-gold/40 hover:shadow-md hover:shadow-gold/10"
                style={{
                  background: 'linear-gradient(145deg, hsl(250 15% 14% / 0.9), hsl(240 10% 11% / 0.95))',
                }}
              >
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%239C92AC' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  }}
                />

                <div className="relative p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 flex-1">
                      {podcast.title}
                    </h3>
                    {podcast.hebrew_year && (
                      <span className="text-[10px] text-gold/60 mr-2 whitespace-nowrap">{podcast.hebrew_year}</span>
                    )}
                  </div>

                  {podcast.description && (
                    <p className="text-white/40 text-xs line-clamp-1 mb-3">
                      {podcast.description}
                    </p>
                  )}

                  {podcast.audio_url ? (
                    <a href={podcast.audio_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full gap-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 text-xs font-semibold h-8">
                        <Play className="w-3 h-3" />
                        האזן
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" className="w-full gap-2 opacity-30 cursor-not-allowed bg-white/5 text-white/40 border border-white/10 text-xs h-8" disabled>
                      <Volume2 className="w-3 h-3" />
                      לא זמין
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-gold/20 max-w-md mx-auto">
            <Mic className="w-12 h-12 mx-auto mb-4 text-gold/50" />
            <p className="text-white/70 text-lg">ההקלטות יעלו בקרוב...</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Podcasts;
