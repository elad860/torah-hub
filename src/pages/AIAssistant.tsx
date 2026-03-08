import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Send, Sparkles, Loader2, FileText, Play, ExternalLink, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const AI_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-search`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
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
    // Convert URLs in text to clickable links
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        const isPdf = part.includes("drive.google") || part.includes(".pdf");
        const isAudio = part.includes("audio") || part.includes(".mp3") || part.includes("soundcloud");
        const isYoutube = part.includes("youtube.com") || part.includes("youtu.be");
        
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 rounded-lg bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-colors text-sm break-all"
          >
            {isPdf && <FileText className="w-3.5 h-3.5 flex-shrink-0" />}
            {isAudio && <Play className="w-3.5 h-3.5 flex-shrink-0" />}
            {isYoutube && <Play className="w-3.5 h-3.5 flex-shrink-0" />}
            {!isPdf && !isAudio && !isYoutube && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="truncate max-w-[250px]">{isPdf ? "פתח מאמר" : isAudio ? "האזן להקלטה" : isYoutube ? "צפה בשיעור" : "פתח קישור"}</span>
          </a>
        );
      }
      // Preserve newlines
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
        <div className="border-b border-gold/20 bg-black/30 backdrop-blur-sm px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-gold" />
            <h1 className="text-2xl font-bold text-foreground">עוזר AI חכם</h1>
          </div>
          <p className="text-muted-foreground text-sm">שאל שאלה על שיעורי הרב ומצא תוכן רלוונטי</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6" dir="rtl">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
              <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-gold" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg mb-2">שלום! איך אפשר לעזור?</p>
                <p className="text-muted-foreground text-sm max-w-md">
                  אני יכול לחפש שיעורים, מאמרים והקלטות מתוך כל התוכן של הרב אורן נזרית
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["מה יש על פרשת השבוע?", "שיעורים על אמונה", "מאמרים על כעס"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="px-4 py-2 rounded-full border border-gold/20 text-sm text-gold/80 hover:bg-gold/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" 
                  ? "bg-gold/20 border border-gold/30" 
                  : "bg-primary/20 border border-primary/30"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4 text-gold" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gold/15 border border-gold/20 text-foreground"
                  : "bg-card/60 border border-border/50 text-foreground"
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card/60 border border-border/50 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gold/20 bg-black/30 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-end" dir="rtl">
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
              className="flex-1 bg-card/40 border border-gold/20 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-gold/40 resize-none text-sm min-h-[48px] max-h-[120px]"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gold hover:bg-gold/80 text-black h-12 w-12 rounded-xl p-0 flex-shrink-0"
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
