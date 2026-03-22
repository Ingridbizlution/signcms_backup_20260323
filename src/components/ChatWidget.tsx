import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle, X, Send, Mic, Paperclip, Bot, User, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { streamKnowledgeChat } from "@/lib/knowledgeChat";
import { toast } from "sonner";

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
  const [streaming, setStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "0", role: "assistant", content: "您好！我是 AI 智慧助手 🤖\n有任何問題都可以詢問我，也可以切換到真人客服。", time: now() },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: input, time: now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    if (!isAI) {
      // Human agent mock reply
      setTimeout(() => {
        setMessages((p) => [
          ...p,
          { id: (Date.now() + 1).toString(), role: "assistant", content: "客服人員正在處理您的請求，請稍候片刻。", time: now() },
        ]);
      }, 800);
      return;
    }

    // AI streaming response
    setStreaming(true);
    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    const aiMessages = updatedMessages
      .filter((m) => m.id !== "0")
      .map((m) => ({ role: m.role, content: m.content }));

    await streamKnowledgeChat({
      messages: aiMessages,
      onDelta: (chunk) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: assistantId, role: "assistant", content: assistantContent, time: now() }];
        });
      },
      onDone: () => setStreaming(false),
      onError: (msg) => {
        toast.error(msg);
        setStreaming(false);
      },
    });
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              {isAI ? <Bot className="h-5 w-5 text-primary-foreground" /> : <User className="h-5 w-5 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-primary-foreground">
                {isAI ? "AI 智慧助手" : "真人客服"}
              </h4>
              <p className="text-xs text-primary-foreground/70">
                {isAI ? "根據知識庫智慧回答" : "隨時為您服務"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
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
            {streaming && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-7 w-7 mt-1 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" title={t("tipUploadAttachment")}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="輸入訊息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 h-9 text-sm bg-muted/50 border-0"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={streaming}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" title={t("tipVoiceToText")}>
                <Mic className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={streaming} title={t("tipSendMessage")}>
                {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
