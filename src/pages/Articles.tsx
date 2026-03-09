import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { FileText, BookOpen, Download } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const HEBREW_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳", "י״א", "י״ב", "י״ג", "י״ד", "ט״ו", "ט״ז", "י״ז", "י״ח", "י״ט", "כ׳"];

const toHebrewLabel = (idx: number, total: number): string => {
  if (total === 1) return "הורדת המאמר";
  return `חלק ${HEBREW_LETTERS[idx] ?? idx + 1}`;
};

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
        <DialogContent
          className="max-w-2xl border-gold/30 p-0"
          style={{
            background: 'linear-gradient(135deg, hsl(35 30% 13%), hsl(30 20% 10%))',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden',
          }}
        >
          {/* Decorative top bar */}
          <div className="h-1 w-full bg-gradient-to-l from-gold/80 via-gold to-gold/80 flex-shrink-0" />

          {/* Fixed header — never scrolls */}
          <div className="p-6 pb-4 flex-shrink-0 border-b border-gold/10">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold text-right leading-relaxed pr-6">
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
            {selectedArticle && selectedArticle.links.length > 0 && (
              <p className="text-white/50 text-sm mt-3">
                {selectedArticle.links.length} מסמכים זמינים להורדה
              </p>
            )}
          </div>

          {/* Scrollable body */}
          {selectedArticle && selectedArticle.links.length > 0 ? (
            <div
              className="articles-modal-scroll"
              style={{
                overflowY: 'auto',
                flex: '1 1 0%',
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="p-6 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedArticle.links.map((url, idx) => {
                  const hebrewPart = toHebrewLabel(idx, selectedArticle!.links.length);
                  const fileType = url.includes("drive.google") ? "Google Drive" : "PDF";
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 p-4 text-center hover:bg-gold/15 hover:border-gold/40 hover:scale-[1.03] transition-all duration-200"
                    >
                      <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <FileText className="w-6 h-6 text-gold" />
                      </div>
                      <span className="text-white font-semibold text-sm group-hover:text-gold transition-colors leading-tight">
                        {hebrewPart}
                      </span>
                      <span className="text-white/30 text-[11px]" dir="ltr">{fileType}</span>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold/80 group-hover:text-gold transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        הורדה
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 flex-shrink-0">
              <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">אין קישורים זמינים להורדה</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Articles;
