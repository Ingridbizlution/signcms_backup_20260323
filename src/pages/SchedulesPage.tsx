import { useState } from "react";
import {
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Play,
  Clock,
  Monitor,
  FileImage,
  FileVideo,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

interface PlaylistItem {
  id: number;
  mediaName: string;
  mediaType: "image" | "video";
  duration: number; // seconds
}

interface Schedule {
  id: number;
  name: string;
  screen: string;
  startTime: string;
  endTime: string;
  days: string[];
  enabled: boolean;
  items: PlaylistItem[];
}

const allDays = ["一", "二", "三", "四", "五", "六", "日"];
const screens = [
  "台北信義店 - 1F 入口大螢幕",
  "台北信義店 - B1 美食街看板",
  "台中逢甲店 - 門口大螢幕",
  "高雄巨蛋店 - 結帳區看板",
  "新竹竹北店 - 大廳迎賓螢幕",
  "台南永康店 - 門口直立看板",
];

const availableMedia = [
  { name: "春季促銷橫幅.jpg", type: "image" as const },
  { name: "新品上市動畫.mp4", type: "video" as const },
  { name: "品牌Logo動態.mp4", type: "video" as const },
  { name: "夏季活動海報.png", type: "image" as const },
  { name: "會員日廣告.jpg", type: "image" as const },
  { name: "美食推薦輪播.mp4", type: "video" as const },
];

const initialSchedules: Schedule[] = [
  {
    id: 1,
    name: "早班輪播",
    screen: "台北信義店 - 1F 入口大螢幕",
    startTime: "09:00",
    endTime: "12:00",
    days: ["一", "二", "三", "四", "五"],
    enabled: true,
    items: [
      { id: 1, mediaName: "春季促銷橫幅.jpg", mediaType: "image", duration: 10 },
      { id: 2, mediaName: "新品上市動畫.mp4", mediaType: "video", duration: 30 },
      { id: 3, mediaName: "會員日廣告.jpg", mediaType: "image", duration: 8 },
    ],
  },
  {
    id: 2,
    name: "午間特惠",
    screen: "台中逢甲店 - 門口大螢幕",
    startTime: "11:30",
    endTime: "14:00",
    days: ["一", "二", "三", "四", "五", "六", "日"],
    enabled: true,
    items: [
      { id: 4, mediaName: "美食推薦輪播.mp4", mediaType: "video", duration: 45 },
      { id: 5, mediaName: "夏季活動海報.png", mediaType: "image", duration: 15 },
    ],
  },
  {
    id: 3,
    name: "週末全天",
    screen: "高雄巨蛋店 - 結帳區看板",
    startTime: "10:00",
    endTime: "22:00",
    days: ["六", "日"],
    enabled: false,
    items: [
      { id: 6, mediaName: "品牌Logo動態.mp4", mediaType: "video", duration: 10 },
      { id: 7, mediaName: "春季促銷橫幅.jpg", mediaType: "image", duration: 12 },
    ],
  },
];

const emptyForm = {
  name: "",
  screen: "",
  startTime: "09:00",
  endTime: "18:00",
  days: ["一", "二", "三", "四", "五"] as string[],
  items: [] as PlaylistItem[],
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      screen: s.screen,
      startTime: s.startTime,
      endTime: s.endTime,
      days: [...s.days],
      items: s.items.map((i) => ({ ...i })),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.screen) {
      toast.error("請填寫排程名稱和指定螢幕");
      return;
    }
    if (form.items.length === 0) {
      toast.error("請至少加入一個素材");
      return;
    }
    if (editingId !== null) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, ...form, enabled: s.enabled } : s
        )
      );
      toast.success("排程已更新");
    } else {
      setSchedules((prev) => [
        ...prev,
        { id: Date.now(), ...form, enabled: true },
      ]);
      toast.success("排程已新增");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      setSchedules((prev) => prev.filter((s) => s.id !== deleteId));
      toast.success("排程已刪除");
      setDeleteId(null);
    }
  };

  const toggleEnabled = (id: number) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const addMediaToForm = (media: { name: string; type: "image" | "video" }) => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now() + Math.random(),
          mediaName: media.name,
          mediaType: media.type,
          duration: media.type === "video" ? 30 : 10,
        },
      ],
    }));
  };

  const removeItemFromForm = (itemId: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
  };

  const updateItemDuration = (itemId: number, duration: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId ? { ...i, duration: Math.max(1, duration) } : i
      ),
    }));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...form.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setForm((prev) => ({ ...prev, items: newItems }));
  };

  // Drag handlers for form items
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...form.items];
    const [dragged] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, dragged);
    setForm((prev) => ({ ...prev, items: newItems }));
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const totalDuration = (items: PlaylistItem[]) =>
    items.reduce((sum, i) => sum + i.duration, 0);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}分${s > 0 ? `${s}秒` : ""}` : `${s}秒`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">播放清單排程</h1>
          <p className="text-sm text-muted-foreground mt-1">
            設定各螢幕的播放內容與時段
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start">
          <Plus className="w-4 h-4" />
          新增排程
        </Button>
      </div>

      {schedules.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>尚未建立任何排程</p>
        </Card>
      )}

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card
            key={schedule.id}
            className={`shadow-sm hover:shadow-md transition-shadow ${
              !schedule.enabled ? "opacity-60" : ""
            }`}
          >
            <div className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <CalendarClock className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">
                    {schedule.name}
                  </h3>
                  <Badge
                    variant={schedule.enabled ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {schedule.enabled ? "啟用中" : "已停用"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {schedule.screen}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {schedule.items.length} 個素材 ·{" "}
                    {formatDuration(totalDuration(schedule.items))}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {allDays.map((day) => (
                    <span
                      key={day}
                      className={`w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center ${
                        schedule.days.includes(day)
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground/40"
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={() => toggleEnabled(schedule.id)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setExpandedId(
                      expandedId === schedule.id ? null : schedule.id
                    )
                  }
                >
                  {expandedId === schedule.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(schedule)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(schedule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Expanded playlist */}
            {expandedId === schedule.id && (
              <div className="border-t border-border px-4 py-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  播放順序
                </p>
                <div className="space-y-1.5">
                  {schedule.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-card rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground text-xs w-5 text-center">
                        {index + 1}
                      </span>
                      {item.mediaType === "image" ? (
                        <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 truncate text-foreground">
                        {item.mediaName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.duration}秒
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "編輯排程" : "新增排程"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>排程名稱 *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如：早班輪播"
              />
            </div>

            <div className="space-y-2">
              <Label>指定螢幕 *</Label>
              <Select
                value={form.screen}
                onValueChange={(v) => setForm({ ...form, screen: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇螢幕" />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>開始時間</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>結束時間</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>播放日</Label>
              <div className="flex gap-2">
                {allDays.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      form.days.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>播放清單</Label>
                <span className="text-xs text-muted-foreground">
                  {form.items.length} 個素材 ·{" "}
                  {formatDuration(totalDuration(form.items))}
                </span>
              </div>

              {/* Playlist items - draggable */}
              <div className="space-y-1.5 min-h-[40px]">
                {form.items.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4 bg-muted/50 rounded-lg">
                    從下方選擇素材加入清單
                  </div>
                )}
                {form.items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5 text-sm group transition-colors ${
                      dragIndex === index ? "opacity-50 border-primary" : ""
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab shrink-0" />
                    <span className="text-muted-foreground text-xs w-4 text-center shrink-0">
                      {index + 1}
                    </span>
                    {item.mediaType === "image" ? (
                      <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate text-foreground text-xs">
                      {item.mediaName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min={1}
                        value={item.duration}
                        onChange={(e) =>
                          updateItemDuration(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-14 h-7 text-xs text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">秒</span>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === form.items.length - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                      onClick={() => removeItemFromForm(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Available media */}
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  點擊加入素材
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableMedia.map((media) => (
                    <button
                      key={media.name}
                      type="button"
                      onClick={() => addMediaToForm(media)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-left transition-colors"
                    >
                      {media.type === "image" ? (
                        <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <FileVideo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate text-xs text-foreground">
                        {media.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSave}>
              {editingId ? "儲存變更" : "新增排程"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個排程嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後將無法復原，該螢幕的播放內容將會停止。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
