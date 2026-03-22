import { useState } from "react";
import { Monitor, Plus, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Screen {
  id: number;
  name: string;
  branch: string;
  location: string;
  resolution: string;
  online: boolean;
}

const branches = ["台北信義店", "台中逢甲店", "高雄巨蛋店", "新竹竹北店", "台南永康店"];

const initialScreens: Screen[] = [
  { id: 1, name: "1F 入口大螢幕", branch: "台北信義店", location: "一樓入口右側", resolution: "1920×1080", online: true },
  { id: 2, name: "B1 美食街看板", branch: "台北信義店", location: "地下一樓手扶梯旁", resolution: "1920×1080", online: true },
  { id: 3, name: "門口大螢幕", branch: "台中逢甲店", location: "店門口正上方", resolution: "3840×2160", online: false },
  { id: 4, name: "結帳區看板", branch: "高雄巨蛋店", location: "結帳櫃台後方", resolution: "1920×1080", online: true },
  { id: 5, name: "大廳迎賓螢幕", branch: "新竹竹北店", location: "大廳入口", resolution: "1920×1080", online: true },
  { id: 6, name: "門口直立看板", branch: "台南永康店", location: "門口左側", resolution: "1080×1920", online: false },
];

const emptyForm = { name: "", branch: "", location: "", resolution: "1920×1080" };

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>(initialScreens);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = screens.filter((s) => {
    const matchSearch = s.name.includes(search) || s.branch.includes(search) || s.location.includes(search);
    const matchBranch = branchFilter === "all" || s.branch === branchFilter;
    return matchSearch && matchBranch;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (screen: Screen) => {
    setEditingId(screen.id);
    setForm({ name: screen.name, branch: screen.branch, location: screen.location, resolution: screen.resolution });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.branch) {
      toast.error("請填寫螢幕名稱和所屬分店");
      return;
    }
    if (editingId !== null) {
      setScreens((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...form } : s))
      );
      toast.success("螢幕已更新");
    } else {
      const newScreen: Screen = {
        id: Date.now(),
        ...form,
        online: false,
      };
      setScreens((prev) => [...prev, newScreen]);
      toast.success("螢幕已新增");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      setScreens((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("螢幕已刪除");
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">螢幕管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有分店的電子看板設備</p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start">
          <Plus className="w-4 h-4" />
          新增螢幕
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋螢幕名稱、分店..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有分店" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有分店</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Screen list */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>沒有找到符合條件的螢幕</p>
          </Card>
        )}
        {filtered.map((screen) => (
          <Card key={screen.id} className="p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Monitor className="w-6 h-6 text-muted-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-foreground truncate">{screen.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  screen.online
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${screen.online ? "bg-success" : "bg-destructive"}`} />
                  {screen.online ? "在線" : "離線"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{screen.branch}</span>
                <span>{screen.location}</span>
                <span>{screen.resolution}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(screen)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(screen.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯螢幕" : "新增螢幕"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>螢幕名稱 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：1F 入口大螢幕" />
            </div>
            <div className="space-y-2">
              <Label>所屬分店 *</Label>
              <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇分店" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>安裝位置</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="例如：一樓入口右側" />
            </div>
            <div className="space-y-2">
              <Label>螢幕解析度</Label>
              <Select value={form.resolution} onValueChange={(v) => setForm({ ...form, resolution: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920×1080">1920×1080 (FHD)</SelectItem>
                  <SelectItem value="3840×2160">3840×2160 (4K)</SelectItem>
                  <SelectItem value="1080×1920">1080×1920 (直立 FHD)</SelectItem>
                  <SelectItem value="2160×3840">2160×3840 (直立 4K)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSave}>{editingId ? "儲存變更" : "新增螢幕"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這台螢幕嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後將無法復原，相關的播放排程也會一併移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
