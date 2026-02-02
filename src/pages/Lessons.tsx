import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLessons, useCategories } from "@/hooks/useLessons";
import { cn } from "@/lib/utils";

const LessonsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);

  const { data: lessons, isLoading } = useLessons();
  const { data: categories } = useCategories();

  // Filter lessons based on search and category
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];

    return lessons.filter((lesson) => {
      const matchesSearch =
        searchQuery === "" ||
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || lesson.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [lessons, searchQuery, selectedCategory]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

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
              מאות שיעורי וידאו בנושאים מגוונים
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-background border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="חיפוש שיעורים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Button
                variant={selectedCategory === null ? "gold" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(null)}
              >
                הכל
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "gold" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </Button>
              ))}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCategoryChange(null)}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                  נקה סינון
                </Button>
              )}
            </div>
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
              <p className="text-muted-foreground mb-6">
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
                    createdAt={lesson.created_at}
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
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                handleCategoryChange(null);
              }}>
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
