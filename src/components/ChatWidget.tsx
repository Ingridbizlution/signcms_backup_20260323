import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle, X, Send, Mic, Paperclip, Bot, User, Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const now = () => new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [isAI, setIsAI] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "0", role: "assistant", content: "您好！我是 AI 智慧助手 🤖\n有任何問題都可以詢問我，也可以切換到真人客服。", time: now() },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: input, time: now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");

    // Mock reply
    setTimeout(() => {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isAI
            ? "感謝您的提問！我正在查詢相關知識庫資料，請稍候..."
            : "客服人員正在處理您的請求，請稍候片刻。",
          time: now(),
        },
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              {isAI ? <Bot className="h-5 w-5 text-primary-foreground" /> : <User className="h-5 w-5 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">
                {isAI ? "AI 智慧助手" : "真人客服"}
              </h4>
              <p className="text-xs text-white/70">隨時為您服務</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* AI / Human toggle */}
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> AI 智慧助手
            </span>
            <Switch checked={!isAI} onCheckedChange={(v) => setIsAI(!v)} />
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              聯繫真人客服 <User className="h-3.5 w-3.5" />
            </span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <Avatar className="h-7 w-7 mt-1 shrink-0">
                    <AvatarFallback className="bg-primary/15 text-primary">
                      {isAI ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground")}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" title="上傳附件或照片">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="輸入訊息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 h-9 text-sm bg-muted/50 border-0"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" title="語音轉文字">
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
