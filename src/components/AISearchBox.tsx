import { useState, useRef } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AI_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`;

export function AISearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setAnswer("");
  };

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setAnswer("");

    try {
      const resp = await fetch(AI_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        setAnswer(errData.error || "שגיאה בחיפוש, נסה שוב");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnswer = "";

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
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullAnswer += content;
              setAnswer(fullAnswer);
            }
          } catch {
            // partial JSON, wait for more
          }
        }
      }
    } catch (e) {
      console.error("AI search error:", e);
      setAnswer("שגיאה בחיפוש, נסה שוב");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        variant="outline"
        size="sm"
        className="gap-2 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">חיפוש AI</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-2xl bg-background border border-gold/20 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-gold/10">
          <Sparkles className="w-5 h-5 text-gold flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="שאל שאלה... (למשל: תביא לי חומר על פרשת פקודי)"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            dir="rtl"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            size="sm"
            className="bg-gold hover:bg-gold/80 text-black"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Answer */}
        {(answer || isLoading) && (
          <div className="p-4 max-h-[60vh] overflow-y-auto" dir="rtl">
            {isLoading && !answer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>מחפש...</span>
              </div>
            )}
            {answer && (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                {answer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
