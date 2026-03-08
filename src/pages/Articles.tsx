import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FileText, ExternalLink, BookOpen } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Articles = () => {
  const { data: articles, isLoading } = useArticles();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const years = useMemo(() => {
    if (!articles) return [];
    const set = new Set(articles.map((a) => a.hebrew_year).filter(Boolean) as string[]);
    return Array.from(set).sort().reverse();
  }, [articles]);

  const filtered = useMemo(() => {
    if (!articles) return [];
    if (selectedYear === "all") return articles;
    return articles.filter((a) => a.hebrew_year === selectedYear);
  }, [articles, selectedYear]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">מאמרים</h1>
          <p className="text-muted-foreground text-lg">מאמרי הגות ופרשת שבוע לקריאה והורדה</p>
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

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl h-48 animate-pulse bg-white/10" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="group relative rounded-xl border border-gold/20 overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10"
                style={{
                  background: 'linear-gradient(135deg, hsl(35 30% 15% / 0.9), hsl(30 20% 12% / 0.95))',
                }}
              >
                {/* Parchment texture overlay */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />

                <div className="relative p-5 flex flex-col h-full min-h-[200px]">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-gold/40 text-gold text-xs bg-gold/5">
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {article.hebrew_year && (
                        <span className="text-xs text-gold/70 font-medium">{article.hebrew_year}</span>
                      )}
                      <span className="text-xs text-white/40">
                        {new Date(article.created_at).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex-1" />

                  {article.download_url ? (
                    <a href={article.download_url} target="_blank" rel="noopener noreferrer" className="block mt-4">
                      <Button className="w-full gap-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 font-semibold">
                        <ExternalLink className="w-4 h-4" />
                        לצפייה במאמר
                      </Button>
                    </a>
                  ) : (
                    <div className="mt-4">
                      <Button className="w-full gap-2 opacity-40 cursor-not-allowed bg-white/5 text-white/40 border border-white/10" disabled>
                        <FileText className="w-4 h-4" />
                        קישור לא זמין
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 shadow-card border border-gold/20 max-w-md mx-auto">
              <FileText className="w-12 h-12 text-gold mx-auto mb-4" />
              <p className="text-foreground text-lg">בקרוב יעלו כאן מאמרי הגות ופרשת שבוע של הרב.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Articles;
