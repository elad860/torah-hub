import { useState, useRef, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Send, Sparkles, Loader2, FileText, Play, Bot, User, BookOpen, Mic, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AI_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`;

const HEBREW_LETTERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳", "י״א", "י״ב", "י״ג", "י״ד", "ט״ו", "ט״ז", "י״ז", "י״ח", "י״ט", "כ׳"];

const toHebrewLabel = (idx: number, total: number): string => {
  if (total === 1) return "הורדת המאמר";
  return `חלק ${HEBREW_LETTERS[idx] ?? idx + 1}`;
};

export interface ResultItem {
  type: "lesson" | "article" | "podcast";
  id: string;
  title: string;
  category?: string;
  series?: string;
  youtube_url?: string;
  download_url?: string;
  all_urls?: string[];
  audio_url?: string;
  spotify_url?: string;
  hebrew_year?: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  results?: ResultItem[];
}

// Suggested questions
function getDynamicSuggestions(): string[] {
  const month = new Date().getMonth();
  const base = [
    "מה הרב אומר על אמונה?",
    "מאמרים לפרשת השבוע",
    "שיעורים על שלום בית",
    "הקלטות על כעס וסבלנות",
  ];
  if (month >= 2 && month <= 3) base.push("שיעורים על פסח");
  else if (month >= 8 && month <= 9) base.push("שיעורים על תשובה");
  else if (month === 11 || month === 0) base.push("שיעורים על חנוכה");
  return base.slice(0, 5);
}

// ─── Article Modal ────────────────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: ResultItem; onClose: () => void }) {
  const links = article.all_urls?.length ? article.all_urls : article.download_url ? [article.download_url] : [];
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl border-gold/30 p-0"
        style={{
          background: "linear-gradient(135deg, hsl(35 30% 13%), hsl(30 20% 10%))",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
          overflow: "hidden",
        }}
      >
        <div className="h-1 w-full bg-gradient-to-l from-gold/80 via-gold to-gold/80 flex-shrink-0" />
        <div className="p-6 pb-4 flex-shrink-0 border-b border-gold/10">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold text-right leading-relaxed pr-6">
              {article.title}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              {article.category && (
                <Badge variant="outline" className="border-gold/40 text-gold text-xs bg-gold/5">
                  {article.category}
                </Badge>
              )}
              {article.hebrew_year && (
                <span className="text-xs text-gold/70 font-medium">{article.hebrew_year}</span>
              )}
            </div>
          </DialogHeader>
          {links.length > 0 && (
            <p className="text-muted-foreground text-sm mt-3">{links.length} מסמכים זמינים להורדה</p>
          )}
        </div>
        {links.length > 0 ? (
          <div className="articles-modal-scroll" style={{ overflowY: "auto", flex: "1 1 0%", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            <div className="p-6 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {links.map((url, idx) => {
                const label = toHebrewLabel(idx, links.length);
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
                    <span className="text-foreground font-semibold text-sm group-hover:text-gold transition-colors leading-tight">{label}</span>
                    <span className="text-muted-foreground text-[11px]" dir="ltr">{fileType}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gold/80 group-hover:text-gold transition-colors">
                      <Download className="w-3.5 h-3.5" />הורדה
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">אין קישורים זמינים להורדה</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ item, onClick }: { item: ResultItem; onClick: () => void }) {
  const isLesson = item.type === "lesson";
  const isPodcast = item.type === "podcast";
  const isArticle = item.type === "article";

  const handleClick = () => {
    if (isLesson && item.youtube_url) {
      window.open(item.youtube_url, "_blank", "noopener noreferrer");
    } else if (isPodcast) {
      const url = item.audio_url || item.spotify_url;
      if (url) window.open(url, "_blank", "noopener noreferrer");
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex items-center gap-3 w-full text-right rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] p-3"
      style={{
        background: isLesson
          ? "linear-gradient(135deg, hsl(0 40% 14% / 0.9), hsl(0 30% 11% / 0.95))"
          : isPodcast
          ? "linear-gradient(145deg, hsl(250 20% 14% / 0.9), hsl(240 15% 11% / 0.95))"
          : "linear-gradient(135deg, hsl(35 30% 15% / 0.9), hsl(30 20% 12% / 0.95))",
        borderColor: isLesson
          ? "hsl(0 60% 40% / 0.3)"
          : isPodcast
          ? "hsl(var(--gold) / 0.25)"
          : "hsl(var(--gold) / 0.3)",
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          background: isLesson ? "hsl(0 60% 30% / 0.3)" : "hsl(var(--gold) / 0.15)",
        }}
      >
        {isLesson && <Play className="w-5 h-5 text-red-400 group-hover:text-red-300" />}
        {isPodcast && <Mic className="w-5 h-5 text-gold group-hover:text-gold/80" />}
        {isArticle && <BookOpen className="w-5 h-5 text-gold group-hover:text-gold/80" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-gold transition-colors text-right">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 justify-end flex-wrap">
          {item.category && (
            <span className="text-[11px] text-muted-foreground">{item.category}</span>
          )}
          {item.hebrew_year && (
            <span className="text-[11px] text-gold/60">{item.hebrew_year}</span>
          )}
          {item.series && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">{item.series}</span>
          )}
        </div>
      </div>

      {/* Action badge */}
      <Badge
        variant="outline"
        className="flex-shrink-0 text-[10px] border-gold/20"
        style={{ color: "hsl(var(--gold) / 0.7)" }}
      >
        {isLesson ? "וידאו" : isPodcast ? "שמע" : "מאמר"}
      </Badge>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 group-hover:text-gold/50 transition-colors" />
    </button>
  );
}

// ─── Results Grid in chat bubble ──────────────────────────────────────────────
function ResultsGrid({ results, onArticleOpen }: { results: ResultItem[]; onArticleOpen: (item: ResultItem) => void }) {
  if (!results.length) return null;
  const lessons = results.filter((r) => r.type === "lesson");
  const articles = results.filter((r) => r.type === "article");
  const podcasts = results.filter((r) => r.type === "podcast");

  return (
    <div className="mt-3 space-y-3" dir="rtl">
      {lessons.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Play className="w-3 h-3 text-red-400" /> שיעורי וידאו ({lessons.length})
          </p>
          <div className="space-y-1.5">
            {lessons.map((item) => (
              <ResultCard key={item.id} item={item} onClick={() => {}} />
            ))}
          </div>
        </div>
      )}
      {articles.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-gold" /> מאמרים ({articles.length})
          </p>
          <div className="space-y-1.5">
            {articles.map((item) => (
              <ResultCard key={item.id} item={item} onClick={() => onArticleOpen(item)} />
            ))}
          </div>
        </div>
      )}
      {podcasts.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Mic className="w-3 h-3 text-gold" /> הקלטות ({podcasts.length})
          </p>
          <div className="space-y-1.5">
            {podcasts.map((item) => (
              <ResultCard key={item.id} item={item} onClick={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openArticle, setOpenArticle] = useState<ResultItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = useMemo(() => getDynamicSuggestions(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;

    const userMsg: Message = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantText = "";
    let structuredResults: ResultItem[] = [];
    let assistantAdded = false;

    try {
      const resp = await fetch(AI_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query: q }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "assistant", content: errData.error || "שגיאה בחיפוש, נסה שוב" }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          // Check for our custom [RESULTS] event
          if (jsonStr.startsWith("[RESULTS]")) {
            try {
              structuredResults = JSON.parse(jsonStr.slice(9));
            } catch { /* ignore */ }
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            // Error from edge function
            if (parsed.error) {
              setMessages((prev) => [...prev, { role: "assistant", content: parsed.error, results: structuredResults }]);
              assistantAdded = true;
              break;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantText, results: structuredResults } : m
                  );
                }
                assistantAdded = true;
                return [...prev, { role: "assistant", content: assistantText, results: structuredResults }];
              });
            }
          } catch {
            // partial JSON
          }
        }
      }

      // Ensure assistant message exists even if only results, no text
      if (!assistantAdded && structuredResults.length > 0 && !assistantText) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", results: structuredResults },
        ]);
      }
    } catch (e) {
      console.error("AI search error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "שגיאה בחיפוש, נסה שוב" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Article modal from chat */}
      {openArticle && <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />}

      <div className="flex flex-col ai-assistant-height">
        {/* ── Header ── */}
        <div className="border-b border-gold/20 bg-black/40 backdrop-blur-md px-4 py-3 text-center flex-shrink-0">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Sparkles className="w-5 h-5 text-gold" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground ai-assistant-font">עוזר AI חכם</h1>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm">
            חיפוש חכם בכלל תוכן הרב · שיעורים · מאמרים · הקלטות
          </p>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 ai-chat-scroll" dir="rtl">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-90 px-4">
              {/* Hero icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full ai-welcome-orb flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gold" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-gold" />
                </div>
              </div>

              <div>
                <p className="text-foreground font-bold text-lg md:text-xl mb-1 ai-assistant-font">שלום! איך אפשר לעזור?</p>
                <p className="text-muted-foreground text-sm max-w-md">
                  אני מחפש בכל השיעורים, המאמרים וההקלטות של הרב אורן נזרית
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 mt-1 max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="ai-suggestion-chip"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 md:gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === "user" ? "ai-user-avatar" : "ai-bot-avatar"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-gold" />
                ) : (
                  <Bot className="w-4 h-4 text-gold" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" ? "ai-user-bubble" : "ai-bot-bubble"
                }`}
              >
                {msg.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.results && msg.results.length > 0 && (
                  <ResultsGrid results={msg.results} onArticleOpen={setOpenArticle} />
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full ai-bot-avatar flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-gold" />
              </div>
              <div className="ai-bot-bubble rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span className="text-sm text-muted-foreground">מחפש...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className="border-t border-gold/20 bg-black/40 backdrop-blur-md p-3 md:p-4 flex-shrink-0">
          {/* Suggestion chips above input (when chat started) */}
          {messages.length > 0 && (
            <div className="max-w-3xl mx-auto flex gap-2 flex-wrap mb-2 justify-end" dir="rtl">
              {suggestions.slice(0, 3).map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="ai-suggestion-chip text-[11px] py-1">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="max-w-3xl mx-auto flex gap-2 md:gap-3 items-end" dir="rtl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="שאל שאלה על שיעורי הרב..."
              className="ai-input"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-gold hover:bg-gold/80 text-black h-11 w-11 md:h-12 md:w-12 rounded-xl p-0 flex-shrink-0 shadow-gold"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistant;
