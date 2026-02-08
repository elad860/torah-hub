import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useLessons, useCategories, usePlaylists } from "@/hooks/useLessons";
import { cn } from "@/lib/utils";

const LessonsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const playlistParam = searchParams.get("playlist");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(playlistParam);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: lessons, isLoading } = useLessons();
  const { data: categories } = useCategories();
  const { data: playlists } = usePlaylists();

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];

    return lessons.filter((lesson) => {
      const matchesSearch =
        searchQuery === "" ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || lesson.category === selectedCategory;

      const matchesPlaylist =
        !selectedPlaylist || lesson.playlist_id === selectedPlaylist;

      const lessonDate = new Date(lesson.published_at || lesson.created_at);
      const matchesDateFrom = !dateFrom || lessonDate >= dateFrom;
      const matchesDateTo = !dateTo || lessonDate <= new Date(dateTo.getTime() + 86400000);

      return matchesSearch && matchesCategory && matchesPlaylist && matchesDateFrom && matchesDateTo;
    });
  }, [lessons, searchQuery, selectedCategory, selectedPlaylist, dateFrom, dateTo]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (selectedPlaylist) params.playlist = selectedPlaylist;
    setSearchParams(params);
  };

  const handlePlaylistChange = (playlistId: string | null) => {
    setSelectedPlaylist(playlistId);
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (playlistId) params.playlist = playlistId;
    setSearchParams(params);
  };

  const clearAll = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedPlaylist(null);
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedPlaylist || dateFrom || dateTo;

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              ספריית <span className="text-gold">השיעורים</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              מאות שיעורי וידאו בנושאים מגוונים מערוץ היוטיוב של הרב
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-background border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4 space-y-3">
          {/* Row 1: Search + Date */}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חיפוש שיעורים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 text-sm"
              />
            </div>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 text-xs", dateFrom && "border-gold text-gold")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateFrom ? dateFrom.toLocaleDateString("he-IL") : "מתאריך"}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 text-xs", dateTo && "border-gold text-gold")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateTo ? dateTo.toLocaleDateString("he-IL") : "עד תאריך"}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground text-xs gap-1">
                <X className="w-3.5 h-3.5" />
                נקה הכל
              </Button>
            )}
          </div>

          {/* Row 2: Category + Playlist filters */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Categories */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={selectedCategory === null ? "gold" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => handleCategoryChange(null)}
              >
                הכל
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "gold" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Playlists dropdown */}
            {playlists && playlists.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedPlaylist ? "gold" : "outline"}
                    size="sm"
                    className="text-xs h-7 gap-1"
                  >
                    {selectedPlaylist
                      ? playlists.find((p) => p.id === selectedPlaylist)?.name || "פלייליסט"
                      : "נושא (פלייליסט)"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 max-h-64 overflow-y-auto" align="start">
                  <button
                    className="w-full text-right px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                    onClick={() => handlePlaylistChange(null)}
                  >
                    הכל
                  </button>
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      className={cn(
                        "w-full text-right px-3 py-2 text-sm rounded hover:bg-muted transition-colors",
                        selectedPlaylist === playlist.id && "bg-gold/10 text-gold font-medium"
                      )}
                      onClick={() => handlePlaylistChange(playlist.id)}
                    >
                      {playlist.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </section>

      {/* Lessons Grid */}
      <section className="py-8 md:py-12 bg-background min-h-[60vh]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden shadow-card">
                  <div className="aspect-video bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLessons.length > 0 ? (
            <>
              <p className="text-muted-foreground mb-6 text-sm">
                נמצאו {filteredLessons.length} שיעורים
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLessons.map((lesson) => (
                  <VideoCard
                    key={lesson.id}
                    id={lesson.id}
                    title={lesson.title}
                    youtubeUrl={lesson.youtube_url}
                    category={lesson.category}
                    description={lesson.description || undefined}
                    createdAt={lesson.published_at || lesson.created_at}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                לא נמצאו שיעורים
              </h2>
              <p className="text-muted-foreground mb-6">
                נסו לחפש מילים אחרות או לבחור קטגוריה אחרת
              </p>
              <Button variant="outline" onClick={clearAll}>
                נקה חיפוש וסינון
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default LessonsPage;
