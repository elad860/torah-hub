import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Play, Volume2, Search, Filter, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePodcasts } from "@/hooks/usePodcasts";
import { FilterDrawer } from "@/components/FilterDrawer";

const Podcasts = () => {
  const { data: podcasts, isLoading, error } = usePodcasts();
  const { data: podcasts, isLoading, error } = usePodcasts();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const years = useMemo(() => {
    if (!podcasts) return [];
    const set = new Set(podcasts.map((p) => p.hebrew_year).filter(Boolean) as string[]);
    return Array.from(set).sort().reverse();
  }, [podcasts]);

  const filtered = useMemo(() => {
    if (!podcasts) return [];
    let result = podcasts;
    if (selectedYear !== "all") {
      result = result.filter((p) => p.hebrew_year === selectedYear);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [podcasts, selectedYear, searchQuery]);

  const hasActiveFilters = searchQuery || selectedYear !== "all";
  const activeFilterCount = selectedYear !== "all" ? 1 : 0;

  const clearAll = () => {
    setSearchQuery("");
    setSelectedYear("all");
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              ספריית <span className="text-gold">ההקלטות</span>
            </h1>
            <p className="text-muted-foreground text-sm">הקלטות שמע של שיעורי הרב להאזנה</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-background/80 border-b border-border sticky top-16 md:top-20 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 space-y-3">
          {/* Search + mobile filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 md:w-80 md:flex-none">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חיפוש הקלטות..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 text-sm"
              />
            </div>
            <FilterDrawer
              categories={[]}
              selectedCategory={null}
              onCategoryChange={() => {}}
              years={years}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              activeCount={activeFilterCount}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground text-xs gap-1 hidden md:flex">
                <X className="w-3.5 h-3.5" />
                נקה הכל
              </Button>
            )}
          </div>

          {/* Hebrew year filter chips - desktop */}
          {years.length > 0 && (
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground flex-shrink-0">שנה:</span>
              <Button
                variant={selectedYear === "all" ? "gold" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedYear("all")}
              >
                הכל
              </Button>
              {years.map((y) => (
                <Button
                  key={y}
                  variant={selectedYear === y ? "gold" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedYear(y)}
                >
                  {y}
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recordings Grid */}
      <section className="py-8 md:py-12 min-h-[60vh]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-lg h-28 animate-pulse bg-muted/20" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">אירעה שגיאה בטעינת ההקלטות</p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((podcast) => (
                <div
                  key={podcast.id}
                  className="group relative rounded-lg border border-gold/15 overflow-hidden transition-all duration-300 hover:border-gold/40 hover:shadow-md hover:shadow-gold/10"
                  style={{
                    background: "linear-gradient(145deg, hsl(250 15% 14% / 0.9), hsl(240 10% 11% / 0.95))",
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
                      <p className="text-white/60 text-xs line-clamp-1 mb-3">
                        {podcast.description}
                      </p>
                    )}
                    {podcast.audio_url ? (() => {
                      const isCurrentTrack = currentTrack?.id === podcast.id;
                      const isCurrentPlaying = isCurrentTrack && isPlaying;
                      return (
                        <Button
                          size="sm"
                          className="w-full gap-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 text-xs font-semibold h-10"
                          onClick={() => {
                            if (isCurrentTrack) {
                              isPlaying ? pause() : resume();
                            } else {
                              play({ id: podcast.id, title: podcast.title, audioUrl: podcast.audio_url! });
                            }
                          }}
                        >
                          {isCurrentPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isCurrentPlaying ? "השהה" : isCurrentTrack ? "המשך" : "האזן"}
                        </Button>
                      );
                    })() : (
                      <Button size="sm" className="w-full gap-2 opacity-30 cursor-not-allowed bg-muted/10 text-muted-foreground border border-muted/20 text-xs h-10" disabled>
                        <Volume2 className="w-3 h-3" />
                        לא זמין
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">לא נמצאו הקלטות</h2>
              <p className="text-muted-foreground mb-6">נסו לחפש מילים אחרות או לבחור שנה אחרת</p>
              <Button variant="outline" onClick={clearAll}>נקה חיפוש וסינון</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Podcasts;
