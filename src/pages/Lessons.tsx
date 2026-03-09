import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilteredLessons, useCategories } from "@/hooks/useLessons";
import { FilterDrawer } from "@/components/FilterDrawer";
import { CHUMASH_PARASHOT, CHUMASH_NAMES } from "@/lib/parasha-data";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 48;

// Get unique hebrew years from lessons
function useHebrewYears() {
  return useQuery({
    queryKey: ["lesson-hebrew-years"],
    queryFn: async () => {
      // Lessons don't have hebrew_year column, so we'll compute from published_at
      // For now return empty - we need a different approach
      return [] as string[];
    },
  });
}

const LessonsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedChumash, setSelectedChumash] = useState<string | null>(null);
  const [selectedParasha, setSelectedParasha] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Build search term: if parasha is selected, search by it
  const effectiveSearch = selectedParasha
    ? selectedParasha
    : searchQuery;

  const { data, isLoading } = useFilteredLessons({
    category: selectedCategory,
    search: effectiveSearch,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: categories } = useCategories();

  const lessons = data?.lessons || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const isParshatShavua = selectedCategory === "פרשת השבוע";

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedChumash(null);
    setSelectedParasha(null);
    setPage(0);
    const params: Record<string, string> = {};
    if (category) params.category = category;
    setSearchParams(params);
  };

  const handleChumashChange = (chumash: string | null) => {
    setSelectedChumash(chumash);
    setSelectedParasha(null);
    setPage(0);
  };

  const handleParashaChange = (parasha: string | null) => {
    setSelectedParasha(parasha);
    setPage(0);
  };

  const clearAll = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedChumash(null);
    setSelectedParasha(null);
    setPage(0);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedParasha;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedParasha ? 1 : 0);

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              ספריית <span className="text-gold">השיעורים</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 bg-background/80 border-b border-border sticky top-16 md:top-20 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 space-y-3">
          {/* Search + mobile filter button */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 md:w-80 md:flex-none">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חיפוש שיעורים..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                className="pr-9 h-9 text-sm"
              />
            </div>
            <FilterDrawer
              categories={categories || []}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              years={[]}
              selectedYear="all"
              onYearChange={() => {}}
              activeCount={activeFilterCount}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground text-xs gap-1 hidden md:flex">
                <X className="w-3.5 h-3.5" />
                נקה הכל
              </Button>
            )}
          </div>

          {/* Category filters - desktop */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">
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

          {/* Hierarchical Chumash → Parasha filter (when פרשת השבוע is selected) */}
          {isParshatShavua && (
            <div className="space-y-2">
              {/* Chumash selection */}
              <div className="flex items-center gap-2 flex-wrap">
                <BookOpen className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="text-xs text-gold flex-shrink-0 font-medium">חומש:</span>
                <Button
                  variant={selectedChumash === null ? "gold" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleChumashChange(null)}
                >
                  הכל
                </Button>
                {CHUMASH_NAMES.map((chumash) => (
                  <Button
                    key={chumash}
                    variant={selectedChumash === chumash ? "gold" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleChumashChange(chumash)}
                  >
                    {chumash}
                  </Button>
                ))}
              </div>

              {/* Parasha selection (only when chumash is selected) */}
              {selectedChumash && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground flex-shrink-0 mr-5">פרשה:</span>
                  <Button
                    variant={selectedParasha === null ? "gold" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleParashaChange(null)}
                  >
                    כל הפרשות
                  </Button>
                  {CHUMASH_PARASHOT[selectedChumash]?.map((parasha) => (
                    <Button
                      key={parasha}
                      variant={selectedParasha === parasha ? "gold" : "outline"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleParashaChange(parasha)}
                    >
                      {parasha}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Lessons Grid */}
      <section className="py-8 md:py-12 min-h-[60vh]">
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
          ) : lessons.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lessons.map((lesson) => (
                  <VideoCard
                    key={lesson.id}
                    id={lesson.id}
                    title={lesson.title}
                    youtubeUrl={lesson.youtube_url}
                    category={lesson.category}
                    createdAt={lesson.published_at || lesson.created_at}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                    הקודם
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    הבא
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">לא נמצאו שיעורים</h2>
              <p className="text-muted-foreground mb-6">נסו לחפש מילים אחרות או לבחור קטגוריה אחרת</p>
              <Button variant="outline" onClick={clearAll}>נקה חיפוש וסינון</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default LessonsPage;
