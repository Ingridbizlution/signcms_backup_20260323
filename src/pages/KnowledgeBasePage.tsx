import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Plus, Search, Upload, Brain, Building2, Store,
  FileText, Trash2, Edit2, FolderOpen, ChevronRight, Sparkles, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeItems, KnowledgeItem } from "@/hooks/useKnowledgeItems";
import { KnowledgeFilePanel } from "@/components/knowledge/KnowledgeFilePanel";

const CATEGORIES = [
  {
    id: "hq",
    name: "總部專區",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    subCategories: ["品牌視覺規範", "發佈流程 SOP", "行銷策略", "人事制度"],
  },
  {
    id: "store",
    name: "門市專區",
    icon: Store,
    color: "from-emerald-500 to-teal-600",
    subCategories: ["螢幕報修流程", "店鋪清潔規範", "客戶接待流程", "庫存管理"],
  },
];

const KnowledgeBasePage = () => {
  const { items, loading, addItem, deleteItem, syncAll, refetch } = useKnowledgeItems();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [fileItem, setFileItem] = useState<KnowledgeItem | null>(null);
  const [newItem, setNewItem] = useState({ title: "", description: "", category: "", subCategory: "" });

  const filtered = items.filter((item) => {
    const matchSearch = item.title.includes(search) || item.description.includes(search);
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!newItem.title || !newItem.category) return;
    await addItem(newItem);
    setNewItem({ title: "", description: "", category: "", subCategory: "" });
    setAddOpen(false);
  };

  const selectedCategory = CATEGORIES.find((c) => c.id === newItem.category);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">組織架構知識庫</h1>
              <p className="text-sm text-muted-foreground">管理組織知識文件，讓 AI 助手學習並回答客戶問題</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={syncAll} className="gap-2">
              <Brain className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
              同步至 AI 學習
            </Button>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              新增知識點
            </Button>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat.id);
            const syncedCount = catItems.filter((i) => i.synced).length;
            return (
              <Card
                key={cat.id}
                className={cn(
                  "cursor-pointer hover-lift border-border/50",
                  activeCategory === cat.id && "ring-2 ring-primary"
                )}
                onClick={() => setActiveCategory(activeCategory === cat.id ? "all" : cat.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center", cat.color)}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                      <CardDescription>{catItems.length} 個知識點</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {syncedCount}/{catItems.length} 已同步
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subCategories.map((sub) => (
                      <Badge key={sub} variant="secondary" className="text-xs">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {sub}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search + list */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋知識點..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                {CATEGORIES.map((c) => (
                  <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((item) => {
                const cat = CATEGORIES.find((c) => c.id === item.category);
                return (
                  <Card key={item.id} className="hover-lift">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", cat?.color || "from-gray-400 to-gray-500")}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                          {item.synced ? (
                            <Badge variant="outline" className="text-[10px] border-success/30 text-success shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> 已同步
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-warning/30 text-warning shrink-0">
                              待同步
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span>{cat?.name}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{item.sub_category}</span>
                          <span className="ml-2">{item.file_count} 個檔案</span>
                          <span>更新於 {item.updated_at?.slice(0, 10)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="上傳文件" onClick={() => setFileItem(item)}>
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="編輯">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="刪除" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>尚無知識點</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增知識點</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">標題</label>
              <Input value={newItem.title} onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))} placeholder="例如：螢幕安裝指南" />
            </div>
            <div>
              <label className="text-sm font-medium">說明</label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} placeholder="簡要描述此知識點的內容" />
            </div>
            <div>
              <label className="text-sm font-medium">所屬分類</label>
              <Select value={newItem.category} onValueChange={(v) => setNewItem((p) => ({ ...p, category: v, subCategory: "" }))}>
                <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategory && (
              <div>
                <label className="text-sm font-medium">子分類</label>
                <Select value={newItem.subCategory} onValueChange={(v) => setNewItem((p) => ({ ...p, subCategory: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇子分類" /></SelectTrigger>
                  <SelectContent>
                    {selectedCategory.subCategories.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={!newItem.title || !newItem.category}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File management dialog */}
      <Dialog open={!!fileItem} onOpenChange={(open) => { if (!open) { setFileItem(null); refetch(); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>檔案管理</DialogTitle>
          </DialogHeader>
          {fileItem && (
            <KnowledgeFilePanel
              knowledgeItemId={fileItem.id}
              itemTitle={fileItem.title}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default KnowledgeBasePage;
