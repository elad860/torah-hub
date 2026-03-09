import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FileText, BookOpen, Download, X } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MergedArticle {
  key: string;
  title: string;
  category: string;
  hebrew_year: string | null;
  links: string[];
}

const hebrewYearToNumber = (year: string | null): number => {
  if (!year) return 0;
  return year.charCodeAt(year.length - 1) * 1000 + year.charCodeAt(year.length - 2);
};

const Articles = () => {
  const { data: articles, isLoading } = useArticles();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<MergedArticle | null>(null);

  const merged = useMemo<MergedArticle[]>(() => {
    if (!articles) return [];
    const map = new Map<string, MergedArticle>();

    for (const article of articles) {
      const key = `${article.title}||${article.hebrew_year ?? ""}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        if (article.download_url && !existing.links.includes(article.download_url)) {
          existing.links.push(article.download_url);
        }
      } else {
        map.set(key, {
          key,
          title: article.title,
          category: article.category,
          hebrew_year: article.hebrew_year,
          links: article.download_url ? [article.download_url] : [],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const yearDiff = hebrewYearToNumber(b.hebrew_year) - hebrewYearToNumber(a.hebrew_year);
      if (yearDiff !== 0) return yearDiff;
      return a.title.localeCompare(b.title, "he");
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
            <Button size="sm" variant={selectedYear === "all" ? "default" : "outline"} onClick={() => setSelectedYear("all")} className="text-xs">
              הכל
            </Button>
            {years.map((y) => (
              <Button key={y} size="sm" variant={selectedYear === y ? "default" : "outline"} onClick={() => setSelectedYear(y)} className="text-xs">
                {y}
              </Button>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl h-32 animate-pulse bg-white/10" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((article) => (
              <button
                key={article.key}
                onClick={() => setSelectedArticle(article)}
                className="group relative rounded-xl border border-gold/20 overflow-hidden transition-all duration-300 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 hover:scale-[1.02] text-right cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, hsl(35 30% 15% / 0.9), hsl(30 20% 12% / 0.95))',
                }}
              >
                {/* Parchment texture */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-gold/40 text-gold text-xs bg-gold/5">
                      {article.category}
                    </Badge>
                    {article.hebrew_year && (
                      <span className="text-xs text-gold/70 font-medium">{article.hebrew_year}</span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-gold transition-colors">
                    {article.title}
                  </h3>
                  {article.links.length > 0 && (
                    <p className="text-white/40 text-xs mt-3">
                      {article.links.length} {article.links.length === 1 ? "מסמך זמין" : "מסמכים זמינים"}
                    </p>
                  )}
                </div>
              </button>
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

      {/* Download Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-md border-gold/30 p-0 overflow-hidden" style={{
          background: 'linear-gradient(135deg, hsl(35 30% 13%), hsl(30 20% 10%))',
        }}>
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-to-l from-gold/80 via-gold to-gold/80" />

          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-white text-xl font-bold text-right leading-relaxed">
                {selectedArticle?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="border-gold/40 text-gold text-xs bg-gold/5">
                  {selectedArticle?.category}
                </Badge>
                {selectedArticle?.hebrew_year && (
                  <span className="text-xs text-gold/70 font-medium">{selectedArticle.hebrew_year}</span>
                )}
              </div>
            </DialogHeader>

            {selectedArticle && selectedArticle.links.length > 0 ? (
              <div className="space-y-3">
                <p className="text-white/50 text-sm mb-4">בחרו מסמך להורדה:</p>
                {selectedArticle.links.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                      <Download className="w-5 h-5 text-gold" />
                    </div>
                    <div className="text-right flex-1">
                      <p className="text-white font-medium text-sm group-hover:text-gold transition-colors">
                        {selectedArticle.links.length === 1 ? "הורדת המאמר" : `מסמך ${idx + 1}`}
                      </p>
                      <p className="text-white/30 text-xs truncate max-w-[200px]" dir="ltr">
                        {url.includes("drive.google") ? "Google Drive" : "PDF"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">אין קישורים זמינים להורדה</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Articles;
