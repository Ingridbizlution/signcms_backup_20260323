import { useState, useRef } from "react";
import {
  Image,
  Film,
  Upload,
  Trash2,
  Search,
  Grid3X3,
  List,
  Eye,
  FileImage,
  FileVideo,
  X,
  Clock,
  HardDrive,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface MediaItem {
  id: number;
  name: string;
  type: "image" | "video";
  url: string;
  thumbnail: string;
  size: string;
  dimensions: string;
  uploadedAt: string;
  duration?: string;
}

const initialMedia: MediaItem[] = [
  {
    id: 1,
    name: "春季促銷橫幅.jpg",
    type: "image",
    url: "",
    thumbnail: "",
    size: "2.4 MB",
    dimensions: "1920×1080",
    uploadedAt: "2026-03-20",
  },
  {
    id: 2,
    name: "新品上市動畫.mp4",
    type: "video",
    url: "",
    thumbnail: "",
    size: "18.6 MB",
    dimensions: "1920×1080",
    uploadedAt: "2026-03-19",
    duration: "0:30",
  },
  {
    id: 3,
    name: "品牌Logo動態.mp4",
    type: "video",
    url: "",
    thumbnail: "",
    size: "5.2 MB",
    dimensions: "1920×1080",
    uploadedAt: "2026-03-18",
    duration: "0:10",
  },
  {
    id: 4,
    name: "夏季活動海報.png",
    type: "image",
    url: "",
    thumbnail: "",
    size: "3.1 MB",
    dimensions: "1080×1920",
    uploadedAt: "2026-03-17",
  },
  {
    id: 5,
    name: "會員日廣告.jpg",
    type: "image",
    url: "",
    thumbnail: "",
    size: "1.8 MB",
    dimensions: "3840×2160",
    uploadedAt: "2026-03-16",
  },
  {
    id: 6,
    name: "美食推薦輪播.mp4",
    type: "video",
    url: "",
    thumbnail: "",
    size: "24.1 MB",
    dimensions: "1920×1080",
    uploadedAt: "2026-03-15",
    duration: "0:45",
  },
];

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = media.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error(`不支援的檔案格式：${file.name}`);
        return;
      }

      const newItem: MediaItem = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: isVideo ? "video" : "image",
        url: URL.createObjectURL(file),
        thumbnail: isImage ? URL.createObjectURL(file) : "",
        size: formatFileSize(file.size),
        dimensions: "讀取中...",
        uploadedAt: new Date().toISOString().split("T")[0],
        duration: isVideo ? "--:--" : undefined,
      };

      // Read dimensions
      if (isImage) {
        const img = new window.Image();
        img.onload = () => {
          setMedia((prev) =>
            prev.map((m) =>
              m.id === newItem.id
                ? { ...m, dimensions: `${img.naturalWidth}×${img.naturalHeight}` }
                : m
            )
          );
        };
        img.src = newItem.url;
      } else if (isVideo) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          const mins = Math.floor(video.duration / 60);
          const secs = Math.floor(video.duration % 60);
          setMedia((prev) =>
            prev.map((m) =>
              m.id === newItem.id
                ? {
                    ...m,
                    dimensions: `${video.videoWidth}×${video.videoHeight}`,
                    duration: `${mins}:${secs.toString().padStart(2, "0")}`,
                  }
                : m
            )
          );
        };
        video.src = newItem.url;
      }

      setMedia((prev) => [newItem, ...prev]);
      toast.success(`已上傳：${file.name}`);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      const item = media.find((m) => m.id === deleteId);
      setMedia((prev) => prev.filter((m) => m.id !== deleteId));
      toast.success(`已刪除：${item?.name}`);
      setDeleteId(null);
    }
  };

  const imageCount = media.filter((m) => m.type === "image").length;
  const videoCount = media.filter((m) => m.type === "video").length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">廣告素材庫</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理所有廣告圖片與影片素材 · {imageCount} 張圖片 · {videoCount} 部影片
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" />
            上傳素材
          </Button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋素材名稱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有類型</SelectItem>
            <SelectItem value="image">圖片</SelectItem>
            <SelectItem value="video">影片</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>沒有找到符合條件的素材</p>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <Card
              key={item.id}
              className={`overflow-hidden hover-lift shadow-sm group cursor-pointer opacity-0 animate-scale-in stagger-${Math.min(i + 1, 8)}`}
              onClick={() => setPreviewItem(item)}
            >
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {item.url && item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {item.type === "image" ? (
                      <FileImage className="w-10 h-10 text-muted-foreground/40" />
                    ) : (
                      <FileVideo className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </>
                )}
                {item.type === "video" && item.duration && (
                  <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {item.duration}
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5"
                >
                  {item.type === "image" ? "圖片" : "影片"}
                </Badge>
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-6 h-6 text-background drop-shadow-lg" />
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{item.size}</span>
                  <span>·</span>
                  <span>{item.dimensions}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="grid gap-2">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="p-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setPreviewItem(item)}
            >
              <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                {item.url && item.type === "image" ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : item.type === "image" ? (
                  <FileImage className="w-5 h-5 text-muted-foreground/50" />
                ) : (
                  <FileVideo className="w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {item.type === "image" ? "圖片" : "影片"}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {item.size}
                  </span>
                  <span>{item.dimensions}</span>
                  {item.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </span>
                  )}
                  <span>{item.uploadedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewItem(item);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(item.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate pr-6">
              {previewItem?.type === "image" ? (
                <FileImage className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <FileVideo className="w-5 h-5 text-primary shrink-0" />
              )}
              <span className="truncate">{previewItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {previewItem?.url && previewItem.type === "image" ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="w-full h-full object-contain"
                />
              ) : previewItem?.url && previewItem.type === "video" ? (
                <video
                  src={previewItem.url}
                  controls
                  className="w-full h-full"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  {previewItem?.type === "image" ? (
                    <FileImage className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  ) : (
                    <FileVideo className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  )}
                  <p className="text-sm">預覽不可用（範例素材）</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">類型</p>
                <p className="font-medium text-foreground">
                  {previewItem?.type === "image" ? "圖片" : "影片"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">檔案大小</p>
                <p className="font-medium text-foreground">{previewItem?.size}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">解析度</p>
                <p className="font-medium text-foreground">{previewItem?.dimensions}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  {previewItem?.type === "video" ? "時長" : "上傳日期"}
                </p>
                <p className="font-medium text-foreground">
                  {previewItem?.type === "video"
                    ? previewItem?.duration
                    : previewItem?.uploadedAt}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (previewItem) {
                    setDeleteId(previewItem.id);
                    setPreviewItem(null);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                刪除素材
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個素材嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後將無法復原，使用此素材的播放清單也會受到影響。
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
