import { useState, useRef, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Send, Sparkles, Loader2, FileText, Play, ExternalLink, Bot, User, BookOpen, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AI_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Dynamic suggestions based on current Hebrew month/parasha cycle
function getDynamicSuggestions(): string[] {
  const month = new Date().getMonth(); // 0-11
  const base = [
    "מה יש על פרשת השבוע?",
    "שיעורים על אמונה וביטחון",
  ];
  // Seasonal suggestions
  if (month >= 2 && month <= 3) base.push("שיעורים על פסח והגדה");
  else if (month >= 8 && month <= 9) base.push("שיעורים על תשובה וסליחות");
  else if (month === 11 || month === 0) base.push("שיעורים על חנוכה ואמונה");
  else base.push("מאמרים על שלום בית");
  
  base.push("הקלטות על כעס וסבלנות");
  return base;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch {
            // partial JSON
          }
        }
      }
    } catch (e) {
      console.error("AI search error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "שגיאה בחיפוש, נסה שוב" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s),"]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        const isPdf = part.includes("drive.google") || part.includes(".pdf");
        const isAudio = part.includes("audio") || part.includes(".mp3") || part.includes("soundcloud");
        const isYoutube = part.includes("youtube.com") || part.includes("youtu.be");

        // Render as rich card
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 my-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={
              isPdf
                ? { background: "linear-gradient(135deg, hsl(35 30% 15% / 0.9), hsl(30 20% 12% / 0.95))", borderColor: "hsl(39 50% 56% / 0.3)" }
                : isAudio
                ? { background: "linear-gradient(145deg, hsl(250 15% 14% / 0.9), hsl(240 10% 11% / 0.95))", borderColor: "hsl(39 50% 56% / 0.3)" }
                : isYoutube
                ? { background: "linear-gradient(135deg, hsl(0 60% 15% / 0.9), hsl(0 40% 12% / 0.95))", borderColor: "hsl(0 60% 40% / 0.3)" }
                : { background: "hsl(var(--card) / 0.5)", borderColor: "hsl(var(--border) / 0.5)" }
            }
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPdf ? "bg-gold/20" : isAudio ? "bg-gold/20" : isYoutube ? "bg-red-500/20" : "bg-primary/20"
            }`}>
              {isPdf && <BookOpen className="w-5 h-5 text-gold" />}
              {isAudio && <Mic className="w-5 h-5 text-gold" />}
              {isYoutube && <Play className="w-5 h-5 text-red-400" />}
              {!isPdf && !isAudio && !isYoutube && <ExternalLink className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {isPdf ? "📄 מאמר להורדה" : isAudio ? "🎧 הקלטה להאזנה" : isYoutube ? "🎬 שיעור וידאו" : "🔗 קישור"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{part}</p>
            </div>
            <Badge variant="outline" className="border-gold/30 text-gold text-[10px] flex-shrink-0">
              {isPdf ? "PDF" : isAudio ? "שמע" : isYoutube ? "וידאו" : "קישור"}
            </Badge>
          </a>
        );
      }
      return part.split("\n").map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
        {/* Header */}
        <div className="border-b border-gold/20 bg-black/30 backdrop-blur-sm px-4 py-3 md:py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-gold" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">עוזר AI חכם</h1>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm">חפש בתוך 6,270 שיעורים · 412 מאמרים · 4,673 הקלטות</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6" dir="rtl">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 md:gap-4 opacity-70">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-gold" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-base md:text-lg mb-1">שלום! איך אפשר לעזור?</p>
                <p className="text-muted-foreground text-xs md:text-sm max-w-sm md:max-w-md px-4">
                  אני מחפש בכל השיעורים, המאמרים וההקלטות של הרב אורן נזרית
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-3 md:px-4 py-2 rounded-full border border-gold/20 text-xs md:text-sm text-gold/80 hover:bg-gold/10 active:bg-gold/20 transition-colors"
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
              className={`flex gap-2 md:gap-3 mb-3 md:mb-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-gold/20 border border-gold/30"
                  : "bg-primary/20 border border-primary/30"
              }`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold" /> : <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />}
              </div>
              <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 ${
                msg.role === "user"
                  ? "bg-gold/15 border border-gold/20 text-foreground"
                  : "bg-card/60 border border-border/50 text-foreground"
              }`}>
                <div className="text-sm leading-relaxed">
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 md:gap-3 mb-4">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              </div>
              <div className="bg-card/60 border border-border/50 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gold/20 bg-black/30 backdrop-blur-sm p-3 md:p-4">
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
              className="flex-1 bg-card/40 border border-gold/20 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-gold/40 resize-none text-sm min-h-[44px] md:min-h-[48px] max-h-[100px]"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="bg-gold hover:bg-gold/80 text-black h-11 w-11 md:h-12 md:w-12 rounded-xl p-0 flex-shrink-0"
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
