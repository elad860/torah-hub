import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FileText, ExternalLink, BookOpen } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Merged article: one card per unique title+year, with all download links
interface MergedArticle {
  key: string;
  title: string;
  category: string;
  hebrew_year: string | null;
  created_at: string;
  links: { url: string; label: string }[];
}

const HEBREW_YEAR_ORDER: Record<string, number> = {};
const hebrewYearToNumber = (year: string | null): number => {
  if (!year) return 0;
  if (HEBREW_YEAR_ORDER[year] !== undefined) return HEBREW_YEAR_ORDER[year];
  // Convert Hebrew year string to sortable number using char codes sum as fallback
  // Primary: extract the last two chars which encode the year uniquely
  return year.charCodeAt(year.length - 1) * 1000 + year.charCodeAt(year.length - 2);
};

const Articles = () => {
  const { data: articles, isLoading } = useArticles();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Deduplicate: group by title+hebrew_year, collect all download_urls
  const merged = useMemo<MergedArticle[]>(() => {
    if (!articles) return [];

    const map = new Map<string, MergedArticle>();

    for (const article of articles) {
      const key = `${article.title}||${article.hebrew_year ?? ""}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        if (article.download_url && !existing.links.some(l => l.url === article.download_url)) {
          existing.links.push({ url: article.download_url, label: `קישור ${existing.links.length + 1}` });
        }
      } else {
        map.set(key, {
          key,
          title: article.title,
          category: article.category,
          hebrew_year: article.hebrew_year,
          created_at: article.created_at,
          links: article.download_url ? [{ url: article.download_url, label: "לצפייה במאמר" }] : [],
        });
      }
    }

    // Sort newest Hebrew year first, then by created_at descending within same year
    return Array.from(map.values()).sort((a, b) => {
      const yearDiff = hebrewYearToNumber(b.hebrew_year) - hebrewYearToNumber(a.hebrew_year);
      if (yearDiff !== 0) return yearDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [articles]);

  const years = useMemo(() => {
    const set = new Set(merged.map((a) => a.hebrew_year).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => hebrewYearToNumber(b) - hebrewYearToNumber(a));
  }, [merged]);

  const filtered = useMemo(() => {
    if (selectedYear === "all") return merged;
    return merged.filter((a) => a.hebrew_year === selectedYear);
  }, [merged, selectedYear]);

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
                key={article.key}
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
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg leading-tight mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="flex-1" />

                  {/* Download buttons — one per unique link */}
                  <div className="mt-4 flex flex-col gap-2">
                    {article.links.length > 0 ? (
                      article.links.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="block">
                          <Button className="w-full gap-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 font-semibold">
                            <ExternalLink className="w-4 h-4" />
                            {article.links.length > 1 ? `קישור ${idx + 1}` : "לצפייה במאמר"}
                          </Button>
                        </a>
                      ))
                    ) : (
                      <Button className="w-full gap-2 opacity-40 cursor-not-allowed bg-white/5 text-white/40 border border-white/10" disabled>
                        <FileText className="w-4 h-4" />
                        קישור לא זמין
                      </Button>
                    )}
                  </div>
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
