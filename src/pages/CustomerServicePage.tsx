import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send, Search, MoreVertical, Phone, Video, Bot, User,
  Circle, Paperclip, Mic, ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: "waiting" | "active" | "resolved";
  channel: "ai" | "human";
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: "1", name: "王小明", avatar: "王", lastMessage: "請問螢幕無法顯示要怎麼處理？", time: "2 分鐘前", unread: 3, status: "waiting", channel: "human" },
  { id: "2", name: "李美玲", avatar: "李", lastMessage: "我想了解排程功能", time: "5 分鐘前", unread: 1, status: "active", channel: "ai" },
  { id: "3", name: "張大華", avatar: "張", lastMessage: "帳號無法登入", time: "12 分鐘前", unread: 0, status: "active", channel: "human" },
  { id: "4", name: "陳小芳", avatar: "陳", lastMessage: "感謝您的協助！", time: "30 分鐘前", unread: 0, status: "resolved", channel: "ai" },
  { id: "5", name: "林志豪", avatar: "林", lastMessage: "素材上傳失敗", time: "1 小時前", unread: 2, status: "waiting", channel: "human" },
];

interface ChatMessage {
  id: string;
  sender: "customer" | "agent" | "ai";
  content: string;
  time: string;
}

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1-1", sender: "customer", content: "你好，我的螢幕突然無法顯示內容了", time: "14:32" },
    { id: "1-2", sender: "ai", content: "您好！我是 AI 智慧助手。請問您的螢幕型號是？目前螢幕是否有電源指示燈亮起？", time: "14:32" },
    { id: "1-3", sender: "customer", content: "有亮燈，但畫面是黑的，型號是 BZ-55Pro", time: "14:33" },
    { id: "1-4", sender: "ai", content: "根據您的描述，可能是 HDMI 訊號問題。建議您：\n1. 檢查 HDMI 線是否鬆脫\n2. 嘗試更換 HDMI 埠\n3. 重新啟動播放器", time: "14:33" },
    { id: "1-5", sender: "customer", content: "我試過了，還是不行，可以轉接真人客服嗎？", time: "14:35" },
    { id: "1-6", sender: "agent", content: "您好，我是客服人員小陳。我來為您進一步排查問題，請問您的播放器型號是什麼？", time: "14:36" },
  ],
  "2": [
    { id: "2-1", sender: "customer", content: "請問排程功能怎麼使用？", time: "15:01" },
    { id: "2-2", sender: "ai", content: "您好！排程功能可以在「播放清單排程」頁面設定。您可以：\n1. 選擇播放清單\n2. 設定播放時段與日期\n3. 指定目標螢幕\n\n需要我為您詳細說明哪個步驟嗎？", time: "15:01" },
  ],
  "3": [
    { id: "3-1", sender: "customer", content: "帳號無法登入，一直顯示密碼錯誤", time: "14:50" },
    { id: "3-2", sender: "agent", content: "您好，請問您使用的是哪個帳號？我先幫您確認帳號狀態。", time: "14:51" },
    { id: "3-3", sender: "customer", content: "我的帳號是 store_taipei01@company.com", time: "14:52" },
  ],
  "4": [
    { id: "4-1", sender: "customer", content: "之前的問題已經解決了，謝謝！", time: "14:20" },
    { id: "4-2", sender: "ai", content: "很高興能幫到您！如果之後有任何問題，歡迎隨時聯繫我們 😊", time: "14:20" },
    { id: "4-3", sender: "customer", content: "感謝您的協助！", time: "14:21" },
  ],
  "5": [
    { id: "5-1", sender: "customer", content: "我上傳素材一直失敗，檔案大小是 15MB", time: "13:45" },
    { id: "5-2", sender: "ai", content: "目前系統支援的單檔上傳上限為 20MB，15MB 應在範圍內。請問您上傳的是什麼格式的檔案？是否有顯示錯誤訊息？", time: "13:45" },
  ],
};

const now = () => new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });

const statusConfig = {
  waiting: { label: "等待中", color: "bg-warning text-warning-foreground" },
  active: { label: "對話中", color: "bg-success text-success-foreground" },
  resolved: { label: "已解決", color: "bg-muted text-muted-foreground" },
};

const CustomerServicePage = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("1");
  const [inputText, setInputText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentMessages = messagesMap[selectedCustomer] || [];

  const selected = MOCK_CUSTOMERS.find((c) => c.id === selectedCustomer);
  const filtered = MOCK_CUSTOMERS.filter((c) =>
    c.name.includes(searchText) || c.lastMessage.includes(searchText)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages.length, selectedCustomer]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    const agentMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "agent",
      content: inputText,
      time: now(),
    };
    setMessagesMap((prev) => ({
      ...prev,
      [selectedCustomer]: [...(prev[selectedCustomer] || []), agentMsg],
    }));
    setInputText("");
  }, [inputText, selectedCustomer]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">即時客戶服務中心</h1>
            <p className="text-sm text-muted-foreground">管理所有客戶對話，支援 AI 與真人客服切換</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="border-success text-success">
              <Circle className="h-2 w-2 fill-current mr-1" /> 線上
            </Badge>
            <Badge variant="secondary">{MOCK_CUSTOMERS.filter((c) => c.status === "waiting").length} 等待中</Badge>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex min-h-0">
          {/* Customer list */}
          <div className="w-80 border-r border-border flex flex-col bg-card/50">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋客戶..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 h-9 text-sm bg-muted/50 border-0"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {filtered.map((c) => {
                const st = statusConfig[c.status];
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-accent/50 transition-colors",
                      selectedCustomer === c.id && "bg-accent"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {c.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                          c.status === "active" ? "bg-success" : c.status === "waiting" ? "bg-warning" : "bg-muted-foreground/50"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", st.color)}>
                          {st.label}
                        </Badge>
                        {c.channel === "ai" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            <Bot className="h-2.5 w-2.5 mr-0.5" /> AI
                          </Badge>
                        )}
                        {c.unread > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold h-4 min-w-4 rounded-full flex items-center justify-center px-1">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selected ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{selected.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{selected.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selected.channel === "ai" ? "AI 智慧助手對話中" : "真人客服對話中"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto" ref={scrollRef}>
                    {currentMessages.map((msg) => {
                      const isCustomer = msg.sender === "customer";
                      const isAI = msg.sender === "ai";
                      return (
                        <div key={msg.id} className={cn("flex gap-2", isCustomer ? "justify-end" : "justify-start")}>
                          {!isCustomer && (
                            <Avatar className="h-7 w-7 mt-1">
                              <AvatarFallback className={cn("text-xs", isAI ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground")}>
                                {isAI ? <Bot className="h-3.5 w-3.5" /> : "客"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            isCustomer
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : isAI
                                ? "bg-primary/10 text-foreground rounded-bl-md border border-primary/20"
                                : "bg-muted text-foreground rounded-bl-md"
                          )}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className={cn("text-[10px] mt-1", isCustomer ? "text-primary-foreground/70" : "text-muted-foreground")}>{msg.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Input area */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2 max-w-3xl mx-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" title="上傳附件或照片">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" title="上傳圖片">
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="輸入訊息..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 h-10 bg-muted/50"
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" title="語音轉文字">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                請選擇一個客戶開始對話
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerServicePage;
