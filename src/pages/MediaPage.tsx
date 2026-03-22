import { useState, useRef } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Image, Film, Upload, Trash2, Search, Grid3X3, List, Eye, FileImage, FileVideo, X, Clock, HardDrive,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface MediaItem {
  id: number; name: string; type: "image" | "video"; url: string; thumbnail: string;
  size: string; dimensions: string; uploadedAt: string; duration?: string;
}

const initialMedia: MediaItem[] = [
  { id: 1, name: "春季促銷橫幅.jpg", type: "image", url: "", thumbnail: "", size: "2.4 MB", dimensions: "1920×1080", uploadedAt: "2026-03-20" },
  { id: 2, name: "新品上市動畫.mp4", type: "video", url: "", thumbnail: "", size: "18.6 MB", dimensions: "1920×1080", uploadedAt: "2026-03-19", duration: "0:30" },
  { id: 3, name: "品牌Logo動態.mp4", type: "video", url: "", thumbnail: "", size: "5.2 MB", dimensions: "1920×1080", uploadedAt: "2026-03-18", duration: "0:10" },
  { id: 4, name: "夏季活動海報.png", type: "image", url: "", thumbnail: "", size: "3.1 MB", dimensions: "1080×1920", uploadedAt: "2026-03-17" },
  { id: 5, name: "會員日廣告.jpg", type: "image", url: "", thumbnail: "", size: "1.8 MB", dimensions: "3840×2160", uploadedAt: "2026-03-16" },
  { id: 6, name: "美食推薦輪播.mp4", type: "video", url: "", thumbnail: "", size: "24.1 MB", dimensions: "1920×1080", uploadedAt: "2026-03-15", duration: "0:45" },
];

export default function MediaPage() {
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
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
      if (!isVideo && !isImage) { toast.error(`${t("mediaUnsupported")}：${file.name}`); return; }
      const newItem: MediaItem = {
        id: Date.now() + Math.random(), name: file.name, type: isVideo ? "video" : "image",
        url: URL.createObjectURL(file), thumbnail: isImage ? URL.createObjectURL(file) : "",
        size: formatFileSize(file.size), dimensions: t("mediaReading"), uploadedAt: new Date().toISOString().split("T")[0],
        duration: isVideo ? "--:--" : undefined,
      };
      if (isImage) {
        const img = new window.Image();
        img.onload = () => { setMedia((prev) => prev.map((m) => m.id === newItem.id ? { ...m, dimensions: `${img.naturalWidth}×${img.naturalHeight}` } : m)); };
        img.src = newItem.url;
      } else if (isVideo) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          const mins = Math.floor(video.duration / 60);
          const secs = Math.floor(video.duration % 60);
          setMedia((prev) => prev.map((m) => m.id === newItem.id ? { ...m, dimensions: `${video.videoWidth}×${video.videoHeight}`, duration: `${mins}:${secs.toString().padStart(2, "0")}` } : m));
        };
        video.src = newItem.url;
      }
      setMedia((prev) => [newItem, ...prev]);
      toast.success(`${t("mediaUploaded")}：${file.name}`);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      const item = media.find((m) => m.id === deleteId);
      setMedia((prev) => prev.filter((m) => m.id !== deleteId));
      toast.success(`${t("mediaDeleted")}：${item?.name}`);
      setDeleteId(null);
    }
  };

  const imageCount = media.filter((m) => m.type === "image").length;
  const videoCount = media.filter((m) => m.type === "video").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("mediaTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("mediaSubtitle")} · {imageCount} {t("mediaImages")} · {videoCount} {t("mediaVideos")}
          </p>
        </div>
        {isAdmin && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" />
              {t("mediaUpload")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("mediaSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            <SelectItem value="image">{t("image")}</SelectItem>
            <SelectItem value="video">{t("video")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}><Grid3X3 className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{t("mediaNoResult")}</p>
        </Card>
      )}

      {viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <Card key={item.id} className={`overflow-hidden hover-lift shadow-sm group cursor-pointer opacity-0 animate-scale-in stagger-${Math.min(i + 1, 8)}`} onClick={() => setPreviewItem(item)}>
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {item.url && item.type === "image" ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : item.type === "image" ? (
                  <FileImage className="w-10 h-10 text-muted-foreground/40" />
                ) : (
                  <FileVideo className="w-10 h-10 text-muted-foreground/40" />
                )}
                {item.type === "video" && item.duration && (
                  <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] font-medium px-1.5 py-0.5 rounded">{item.duration}</span>
                )}
                <Badge variant="secondary" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
                  {item.type === "image" ? t("image") : t("video")}
                </Badge>
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-6 h-6 text-background drop-shadow-lg" />
                </div>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{item.size}</span><span>·</span><span>{item.dimensions}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "list" && filtered.length > 0 && (
        <div className="grid gap-2">
          {filtered.map((item) => (
            <Card key={item.id} className="p-3 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewItem(item)}>
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
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{item.type === "image" ? t("image") : t("video")}</Badge>
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{item.size}</span>
                  <span>{item.dimensions}</span>
                  {item.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>}
                  <span>{item.uploadedAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}><Eye className="w-4 h-4" /></Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate pr-6">
              {previewItem?.type === "image" ? <FileImage className="w-5 h-5 text-primary shrink-0" /> : <FileVideo className="w-5 h-5 text-primary shrink-0" />}
              <span className="truncate">{previewItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {previewItem?.url && previewItem.type === "image" ? (
                <img src={previewItem.url} alt={previewItem.name} className="w-full h-full object-contain" />
              ) : previewItem?.url && previewItem.type === "video" ? (
                <video src={previewItem.url} controls className="w-full h-full" />
              ) : (
                <div className="text-center text-muted-foreground">
                  {previewItem?.type === "image" ? <FileImage className="w-16 h-16 mx-auto mb-2 opacity-30" /> : <FileVideo className="w-16 h-16 mx-auto mb-2 opacity-30" />}
                  <p className="text-sm">{t("mediaPreviewUnavailable")}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t("mediaType")}</p>
                <p className="font-medium text-foreground">{previewItem?.type === "image" ? t("image") : t("video")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t("mediaFileSize")}</p>
                <p className="font-medium text-foreground">{previewItem?.size}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t("mediaResolution")}</p>
                <p className="font-medium text-foreground">{previewItem?.dimensions}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{previewItem?.type === "video" ? t("mediaDuration") : t("mediaUploadDate")}</p>
                <p className="font-medium text-foreground">{previewItem?.type === "video" ? previewItem?.duration : previewItem?.uploadedAt}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="destructive" size="sm" className="gap-2" onClick={() => { if (previewItem) { setDeleteId(previewItem.id); setPreviewItem(null); } }}>
                <Trash2 className="w-4 h-4" />
                {t("mediaDeleteItem")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mediaDeleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mediaDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("confirmDelete")}</AlertDialogAction>
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
