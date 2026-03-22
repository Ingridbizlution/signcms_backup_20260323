import { useEffect, useMemo, useRef, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Trash2,
  Search,
  Grid3X3,
  List,
  Eye,
  FileImage,
  FileVideo,
  Clock,
  HardDrive,
  Loader2,
  FolderOpen,
  Pencil,
  Plus,
  Settings2,
  Code2,
  Calendar,
  Globe,
  Type,
  CloudSun,
  QrCode,
  Timer,
  Youtube,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Switch } from "@/components/ui/switch";
import { DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type MediaType = "image" | "video" | "widget";

interface MediaItemRow {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnail?: string | null;
  size: string;
  dimensions: string;
  duration?: string | null;
  created_at: string;
  design_project_id?: string | null;
}

interface ProjectItem {
  id: string;
  name: string;
}

const NONE_PROJECT_VALUE = "__none__";

type WidgetSubType = "date" | "clock" | "webpage" | "marquee" | "qrcode" | "countdown" | "youtube" | "weather";
type WidgetAnimation = "none" | "fadeIn" | "slideUp" | "bounce" | "zoomIn" | "flipIn";

interface WidgetConfig {
  widgetType: WidgetSubType;
  url?: string;
  text?: string;
  speed?: "slow" | "normal" | "fast";
  format?: "12" | "24";
  clockStyle?: "digital" | "analog";
  showDate?: boolean;
  timezone?: string;
  bgColor?: string;
  textColor?: string;
  qrcodeContent?: string;
  targetDate?: string;
  countdownTitle?: string;
  youtubeUrl?: string;
  city?: string;
  fontSize?: "small" | "medium" | "large" | "xlarge";
  qrcodeSize?: number;
  animation?: WidgetAnimation;
}

const WIDGET_ICONS: Record<WidgetSubType, any> = {
  date: Calendar, clock: Clock, webpage: Globe, marquee: Type, qrcode: QrCode, countdown: Timer, youtube: Youtube, weather: CloudSun,
};

const TIMEZONE_OPTIONS = [
  { value: "Asia/Taipei", label: "Asia/Taipei (UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (UTC+11)" },
];

const defaultWidgetForm: {
  name: string; widgetType: WidgetSubType; url: string; text: string;
  speed: "slow" | "normal" | "fast"; format: "12" | "24";
  clockStyle: "digital" | "analog"; showDate: boolean; timezone: string;
  bgColor: string; textColor: string; qrcodeContent: string; targetDate: string;
  countdownTitle: string; youtubeUrl: string; city: string;
  fontSize: "small" | "medium" | "large" | "xlarge"; qrcodeSize: number;
  animation: WidgetAnimation; projectId: string;
} = {
  name: "",
  widgetType: "clock",
  url: "",
  text: "",
  speed: "normal",
  format: "24",
  clockStyle: "digital",
  showDate: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  bgColor: "#1a1a2e",
  textColor: "#ffffff",
  qrcodeContent: "",
  targetDate: "",
  countdownTitle: "",
  youtubeUrl: "",
  city: "",
  fontSize: "medium",
  qrcodeSize: 128,
  animation: "none",
  projectId: NONE_PROJECT_VALUE,
};

function parseWidgetConfig(url: string): WidgetConfig | null {
  if (!url?.startsWith("widget://")) return null;
  try { return JSON.parse(url.replace("widget://", "")); } catch { return null; }
}

// ── Widget Preview (lightweight) ───────────────────────────────────
function WidgetPreviewCard({ config }: { config: WidgetConfig }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (config.widgetType === "clock" || config.widgetType === "date" || config.widgetType === "countdown") {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [config.widgetType]);

  const bg = config.bgColor || "#1a1a2e";
  const fg = config.textColor || "#ffffff";
  const fontSize = config.fontSize || "medium";
  const ZONE_FS: Record<string, Record<string, string>> = {
    small: { time: "text-base", title: "text-xs", countdown: "text-base", marquee: "text-xs" },
    medium: { time: "text-2xl", title: "text-[10px]", countdown: "text-lg", marquee: "text-sm" },
    large: { time: "text-3xl", title: "text-sm", countdown: "text-2xl", marquee: "text-lg" },
    xlarge: { time: "text-4xl", title: "text-base", countdown: "text-3xl", marquee: "text-xl" },
  };
  const zfs = ZONE_FS[fontSize] || ZONE_FS.medium;

  if (config.widgetType === "clock") {
    const tz = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (config.clockStyle === "analog") {
      const hParts = now.toLocaleString("en-US", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: tz }).split(":");
      const h = parseInt(hParts[0]), m = parseInt(hParts[1]), s = parseInt(hParts[2]);
      const hDeg = (h % 12) * 30 + m * 0.5, mDeg = m * 6, sDeg = s * 6;
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
          <svg viewBox="0 0 200 200" className="w-[70%] max-w-[160px]">
            <circle cx="100" cy="100" r="96" fill="none" stroke={fg} strokeWidth="2" opacity="0.15" />
            {[...Array(12)].map((_, i) => {
              const num = i === 0 ? 12 : i;
              const angle = (i * 30 - 90) * Math.PI / 180;
              return <text key={i} x={100 + 78 * Math.cos(angle)} y={100 + 78 * Math.sin(angle)} textAnchor="middle" dominantBaseline="central" fill={fg} fontSize="14" fontWeight="600" opacity="0.8">{num}</text>;
            })}
            <polygon points={`${100 + 45 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 + 45 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 + 5 * Math.cos(hDeg * Math.PI / 180)},${100 + 5 * Math.sin(hDeg * Math.PI / 180)} ${100 - 10 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 - 10 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 - 5 * Math.cos(hDeg * Math.PI / 180)},${100 - 5 * Math.sin(hDeg * Math.PI / 180)}`} fill={fg} opacity="0.9" />
            <polygon points={`${100 + 65 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 + 65 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 + 4 * Math.cos(mDeg * Math.PI / 180)},${100 + 4 * Math.sin(mDeg * Math.PI / 180)} ${100 - 12 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 - 12 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 - 4 * Math.cos(mDeg * Math.PI / 180)},${100 - 4 * Math.sin(mDeg * Math.PI / 180)}`} fill={fg} opacity="0.85" />
            <line x1={100 - 18 * Math.cos((sDeg - 90) * Math.PI / 180)} y1={100 - 18 * Math.sin((sDeg - 90) * Math.PI / 180)} x2={100 + 72 * Math.cos((sDeg - 90) * Math.PI / 180)} y2={100 + 72 * Math.sin((sDeg - 90) * Math.PI / 180)} stroke="hsl(0 70% 55%)" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill={fg} />
          </svg>
        </div>
      );
    }
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: config.format === "12", timeZone: tz };
    const timeStr = now.toLocaleTimeString("en-US", opts);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: bg, color: fg }}>
        <span className={`${zfs.time} font-mono font-bold tracking-wider`}>{timeStr}</span>
        {config.showDate && <span className="text-[10px] opacity-60">{now.toLocaleDateString("zh-TW", { month: "short", day: "numeric", timeZone: tz })}</span>}
      </div>
    );
  }

  if (config.widgetType === "date") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: bg, color: fg }}>
        <span className="text-sm font-medium opacity-70">{now.toLocaleDateString("zh-TW", { weekday: "long" })}</span>
        <span className="text-xl font-bold">{now.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
    );
  }

  if (config.widgetType === "marquee" && config.text) {
    return (
      <div className="w-full h-full flex items-center overflow-hidden" style={{ background: bg, color: fg }}>
        <div className={`animate-marquee whitespace-nowrap ${zfs.marquee} font-medium`}>{config.text}</div>
      </div>
    );
  }

  if (config.widgetType === "webpage") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: bg, color: fg }}>
        <Globe className="w-6 h-6 opacity-50" />
        <span className="text-[10px] opacity-60 truncate max-w-[80%]">{config.url || "URL"}</span>
      </div>
    );
  }

  if (config.widgetType === "qrcode") {
    const qrSize = config.qrcodeSize ? Math.min(config.qrcodeSize, 120) : 80;
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
        <QRCodeSVG value={config.qrcodeContent || "https://example.com"} size={qrSize} bgColor={bg} fgColor={fg} level="M" />
      </div>
    );
  }

  if (config.widgetType === "countdown") {
    const target = config.targetDate ? new Date(config.targetDate).getTime() : Date.now() + 86400000;
    const diff = Math.max(0, target - now.getTime());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: bg, color: fg }}>
        {config.countdownTitle && <span className={`${zfs.title} font-bold opacity-70`}>{config.countdownTitle}</span>}
        <div className="flex gap-2">
          {[days, hours, mins, secs].map((v, i) => (
            <span key={i} className={`${zfs.countdown} font-mono font-bold`}>{String(v).padStart(2, "0")}</span>
          ))}
        </div>
      </div>
    );
  }

  if (config.widgetType === "youtube") {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: bg, color: fg }}>
        <Youtube className="w-8 h-8 opacity-50" />
      </div>
    );
  }

  if (config.widgetType === "weather") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: bg, color: fg }}>
        <CloudSun className="w-8 h-8 opacity-50" />
        <span className="text-[10px] font-medium">{config.city || "City"}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: bg, color: fg }}>
      <Code2 className="w-6 h-6 opacity-50" />
    </div>
  );
}

const getPreviewIcon = (type: MediaType) => {
  if (type === "image") return <FileImage className="w-10 h-10 text-muted-foreground" />;
  if (type === "video") return <FileVideo className="w-10 h-10 text-muted-foreground" />;
  return <FolderOpen className="w-10 h-10 text-muted-foreground" />;
};

const getTypeBadgeVariant = (type: MediaType) => (type === "widget" ? "default" : "secondary");

const MediaPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [media, setMedia] = useState<MediaItemRow[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [previewItem, setPreviewItem] = useState<MediaItemRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [updatingProjectItemId, setUpdatingProjectItemId] = useState<string | null>(null);
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const [widgetForm, setWidgetForm] = useState(defaultWidgetForm);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("media_items")
      .select("id, name, type, url, thumbnail, size, dimensions, duration, created_at, design_project_id")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setMedia((data || []) as MediaItemRow[]);
    }

    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data, error } = await (supabase as any)
      .from("design_projects")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast.error(error.message);
      return;
    }

    setProjects((data || []) as ProjectItem[]);
  };

  useEffect(() => {
    fetchMedia();
    fetchProjects();
  }, []);

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesProject =
        projectFilter === "all" ||
        (projectFilter === "none" ? !item.design_project_id : item.design_project_id === projectFilter);

      return matchesSearch && matchesType && matchesProject;
    });
  }, [media, projectFilter, search, typeFilter]);

  const stats = useMemo(() => {
    const images = media.filter((item) => item.type === "image").length;
    const videos = media.filter((item) => item.type === "video").length;
    const widgets = media.filter((item) => item.type === "widget").length;
    return { images, videos, widgets };
  }, [media]);

  const projectNameMap = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]));
  }, [projects]);

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return t("mediaNoProject");
    return projectNameMap.get(projectId) || t("mediaNoProject");
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error(t("mediaUnsupported"));
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let dimensions = "-";
      let duration: string | null = null;

      if (isImage) {
        dimensions = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(`${img.width}×${img.height}`);
          img.onerror = () => resolve("-");
          img.src = base64;
        });
      }

      if (isVideo) {
        const videoMeta = await new Promise<{ dimensions: string; duration: string | null }>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            const totalSeconds = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            resolve({
              dimensions: `${video.videoWidth}×${video.videoHeight}`,
              duration: `${minutes}:${String(seconds).padStart(2, "0")}`,
            });
          };
          video.onerror = () => resolve({ dimensions: "-", duration: null });
          video.src = base64;
        });
        dimensions = videoMeta.dimensions;
        duration = videoMeta.duration;
      }

      const { error } = await (supabase as any).from("media_items").insert({
        name: file.name,
        type: isImage ? "image" : "video",
        url: base64,
        thumbnail: isImage ? base64 : null,
        size: formatFileSize(file.size),
        dimensions,
        duration,
        uploaded_by: user?.id,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`${t("mediaUploaded")}：${file.name}`);
        fetchMedia();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("mediaUnsupported"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const item = media.find((entry) => entry.id === deleteId);
    const { error } = await (supabase as any).from("media_items").delete().eq("id", deleteId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${t("mediaDeleted")}：${item?.name || ""}`);
      setDeleteId(null);
      if (previewItem?.id === deleteId) setPreviewItem(null);
      fetchMedia();
    }
  };

  const handleChangeProject = async (itemId: string, newProjectId: string | null) => {
    setUpdatingProjectItemId(itemId);
    const { error } = await (supabase as any)
      .from("media_items")
      .update({ design_project_id: newProjectId })
      .eq("id", itemId);

    if (error) {
      toast.error(error.message);
    } else {
      setMedia((current) => current.map((item) => (item.id === itemId ? { ...item, design_project_id: newProjectId } : item)));
      setPreviewItem((current) => (current && current.id === itemId ? { ...current, design_project_id: newProjectId } : current));
      toast.success(t("save"));
    }
    setUpdatingProjectItemId(null);
  };

  const handleCreateProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;

    const { error } = await (supabase as any).from("design_projects").insert({
      name,
      created_by: user?.id,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("mediaProjectCreated"));
      setNewProjectName("");
      fetchProjects();
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    const name = editProjectName.trim();
    if (!name) return;

    const { error } = await (supabase as any)
      .from("design_projects")
      .update({ name })
      .eq("id", editingProject.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("mediaProjectUpdated"));
      setEditingProject(null);
      setEditProjectName("");
      fetchProjects();
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;

    const { error: updateError } = await (supabase as any)
      .from("media_items")
      .update({ design_project_id: null })
      .eq("design_project_id", deleteProjectId);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    const { error } = await (supabase as any).from("design_projects").delete().eq("id", deleteProjectId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("mediaProjectDeleted"));
      setDeleteProjectId(null);
      fetchProjects();
      fetchMedia();
    }
  };

  const handleCreateWidget = async () => {
    if (!widgetForm.name.trim()) { toast.error(t("widgetFillRequired")); return; }
    const config: WidgetConfig = {
      widgetType: widgetForm.widgetType, url: widgetForm.url, text: widgetForm.text,
      speed: widgetForm.speed, format: widgetForm.format, clockStyle: widgetForm.clockStyle,
      showDate: widgetForm.showDate, timezone: widgetForm.timezone, bgColor: widgetForm.bgColor,
      textColor: widgetForm.textColor, qrcodeContent: widgetForm.qrcodeContent,
      targetDate: widgetForm.targetDate, countdownTitle: widgetForm.countdownTitle,
      youtubeUrl: widgetForm.youtubeUrl, city: widgetForm.city, fontSize: widgetForm.fontSize,
      qrcodeSize: widgetForm.qrcodeSize, animation: widgetForm.animation,
    };
    const { error } = await (supabase as any).from("media_items").insert({
      name: widgetForm.name.trim(), type: "widget",
      url: "widget://" + JSON.stringify(config),
      thumbnail: "", size: "-", dimensions: "auto",
      uploaded_by: user?.id,
      design_project_id: widgetForm.projectId !== NONE_PROJECT_VALUE ? widgetForm.projectId : null,
    });
    if (error) { toast.error(error.message); } else {
      toast.success(t("widgetCreated"));
      setWidgetDialogOpen(false);
      setWidgetForm({ ...defaultWidgetForm });
      fetchMedia();
    }
  };

  const renderProjectSelect = (item: MediaItemRow, compact = false) => {
    if (!isAdmin) {
      return (
        <span className={`flex items-center ${compact ? "gap-1" : "gap-0.5"}`}>
          <FolderOpen className="w-3 h-3 shrink-0" />
          <span className="truncate">{getProjectName(item.design_project_id)}</span>
        </span>
      );
    }

    return (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Select
          value={item.design_project_id || NONE_PROJECT_VALUE}
          onValueChange={(value) => handleChangeProject(item.id, value === NONE_PROJECT_VALUE ? null : value)}
          disabled={updatingProjectItemId === item.id}
        >
          <SelectTrigger
            className={`border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0 focus:ring-offset-0 ${
              compact ? "h-6 gap-1 text-xs text-muted-foreground hover:text-foreground" : "h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="w-3 h-3 shrink-0" />
            <SelectValue placeholder={t("mediaNoProject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_PROJECT_VALUE}>{t("mediaNoProject")}</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("mediaTitle")}</h1>
          <p className="text-muted-foreground">{t("mediaSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => setProjectDialogOpen(true)}>
              <Settings2 className="w-4 h-4" />
              {t("mediaManageProjects")}
            </Button>
          )}
          {isAdmin && <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} />}
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => setWidgetDialogOpen(true)}>
              <Code2 className="w-4 h-4" />
              {t("mediaAddWidget")}
            </Button>
          )}
          {isAdmin && (
            <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {t("mediaUpload")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{stats.images}</div>
          <div className="text-xl font-semibold text-foreground">{t("mediaImages")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{stats.videos}</div>
          <div className="text-xl font-semibold text-foreground">{t("mediaVideos")}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{stats.widgets}</div>
          <div className="text-xl font-semibold text-foreground">{t("mediaWidgets")}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("mediaSearchPlaceholder")} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="image">{t("image")}</SelectItem>
                <SelectItem value="video">{t("video")}</SelectItem>
                <SelectItem value="widget">{t("widget")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <FolderOpen className="mr-1.5 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("mediaAllProjects")}</SelectItem>
                <SelectItem value="none">{t("mediaNoProject")}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {loading || roleLoading ? (
        <Card className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{t("mediaReading")}</span>
        </Card>
      ) : filteredMedia.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">{t("mediaNoResult")}</Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative">
                {item.type === "widget" ? (
                  (() => { const c = parseWidgetConfig(item.url); return c ? <WidgetPreviewCard config={c} /> : <Code2 className="w-10 h-10 text-muted-foreground" />; })()
                ) : item.type === "image" && item.url ? (
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  getPreviewIcon(item.type)
                )}
                {item.type === "video" && item.duration && (
                  <span className="absolute bottom-2 right-2 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] text-background">
                    {item.duration}
                  </span>
                )}
                <Badge variant={getTypeBadgeVariant(item.type)} className="absolute left-2 top-2 text-[10px]">
                  {item.type === "image" ? t("image") : item.type === "video" ? t("video") : t("widget")}
                </Badge>
              </div>

              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{item.size}</span>
                  {item.type !== "widget" && (
                    <>
                      <span>·</span>
                      <span>{item.dimensions}</span>
                    </>
                  )}
                  <span>·</span>
                  <div className="min-w-0 flex-1">{renderProjectSelect(item)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="flex cursor-pointer items-center gap-4 p-3" onClick={() => setPreviewItem(item)}>
              <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {item.type === "widget" ? (
                  (() => { const c = parseWidgetConfig(item.url); return c ? <WidgetPreviewCard config={c} /> : <Code2 className="w-6 h-6 text-muted-foreground" />; })()
                ) : item.type === "image" && item.url ? (
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  getPreviewIcon(item.type)
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant={item.type === "widget" ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                    {item.type === "image" ? t("image") : item.type === "video" ? t("video") : t("widget")}
                  </Badge>
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{item.size}</span>
                  {item.type !== "widget" && <span>{item.dimensions}</span>}
                  {item.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>}
                  <span>{item.created_at?.split("T")[0]}</span>
                  <div className="min-w-[140px]">{renderProjectSelect(item, true)}</div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setPreviewItem(item); }}>
                  <Eye className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
            <DialogDescription className="sr-only">素材預覽視窗</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              {previewItem?.type === "widget" ? (
                (() => { const c = parseWidgetConfig(previewItem.url); return c ? <WidgetPreviewCard config={c} /> : <Code2 className="w-16 h-16 opacity-30" />; })()
              ) : previewItem?.type === "image" && previewItem.url ? (
                <img src={previewItem.url} alt={previewItem.name} className="h-full w-full object-contain" />
              ) : previewItem?.type === "video" && previewItem.url ? (
                <video src={previewItem.url} controls className="h-full w-full" />
              ) : previewItem ? (
                getPreviewIcon(previewItem.type)
              ) : null}
            </div>
            {previewItem && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("mediaType")}</p>
                  <p className="font-medium text-foreground">{previewItem.type === "image" ? t("image") : previewItem.type === "video" ? t("video") : t("widget")}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("mediaFileSize")}</p>
                  <p className="font-medium text-foreground">{previewItem.size}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("mediaResolution")}</p>
                  <p className="font-medium text-foreground">{previewItem.dimensions}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("mediaProjectGroup")}</p>
                  <p className="font-medium text-foreground">{getProjectName(previewItem.design_project_id)}</p>
                </div>
              </div>
            )}
            {isAdmin && previewItem && (
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => { setDeleteId(previewItem.id); setPreviewItem(null); }}>
                  <Trash2 className="w-4 h-4" />
                  {t("mediaDeleteItem")}
                </Button>
              </div>
            )}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-primary" />{t("mediaManageProjects")}</DialogTitle>
            <DialogDescription className="sr-only">管理設計專案</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t("mediaProjectNamePlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              />
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} size="icon" className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
              {projects.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">{t("mediaNoProject")}</p>
              )}
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 group">
                  {editingProject?.id === project.id ? (
                    <div className="flex flex-1 gap-2">
                      <Input
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateProject();
                          if (e.key === "Escape") {
                            setEditingProject(null);
                            setEditProjectName("");
                          }
                        }}
                        className="h-8"
                        autoFocus
                      />
                      <Button size="sm" className="h-8" onClick={handleUpdateProject} disabled={!editProjectName.trim()}>{t("save")}</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => { setEditingProject(null); setEditProjectName(""); }}>{t("cancel")}</Button>
                    </div>
                  ) : (
                    <>
                      <FolderOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm text-foreground">{project.name}</span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {media.filter((item) => item.design_project_id === project.id).length}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => { setEditingProject(project); setEditProjectName(project.name); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => setDeleteProjectId(project.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteProjectId !== null} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mediaDeleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mediaProjectDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Widget Creation Dialog */}
      <Dialog open={widgetDialogOpen} onOpenChange={setWidgetDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" />{t("mediaAddWidget")}</DialogTitle>
            <DialogDescription className="sr-only">{t("mediaAddWidget")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1 min-h-0">
            <div className="space-y-2">
              <Label>{t("widgetName")} *</Label>
              <Input value={widgetForm.name} onChange={(e) => setWidgetForm({ ...widgetForm, name: e.target.value })} placeholder={t("widgetNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("mediaProjectGroup")}</Label>
              <Select value={widgetForm.projectId} onValueChange={(v) => setWidgetForm({ ...widgetForm, projectId: v })}>
                <SelectTrigger><FolderOpen className="w-4 h-4 mr-1.5 text-muted-foreground" /><SelectValue placeholder={t("mediaNoProject")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_PROJECT_VALUE}>{t("mediaNoProject")}</SelectItem>
                  {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("widgetType")}</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["clock", "date", "webpage", "marquee", "qrcode", "countdown", "youtube", "weather"] as WidgetSubType[]).map((wt) => {
                  const Icon = WIDGET_ICONS[wt];
                  const labels: Record<WidgetSubType, string> = { date: t("widgetDate"), clock: t("widgetClock"), webpage: t("widgetWebpage"), marquee: t("widgetMarquee"), qrcode: t("widgetQrcode"), countdown: t("widgetCountdown"), youtube: t("widgetYoutube"), weather: t("widgetWeather") };
                  return (
                    <button key={wt} type="button" onClick={() => setWidgetForm({ ...widgetForm, widgetType: wt })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${widgetForm.widgetType === wt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <Icon className={`w-6 h-6 ${widgetForm.widgetType === wt ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium">{labels[wt]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {widgetForm.widgetType === "clock" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("widgetClockStyle")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setWidgetForm({ ...widgetForm, clockStyle: "digital" })}
                      className={`p-2.5 rounded-lg border-2 text-sm ${widgetForm.clockStyle === "digital" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"}`}>{t("widgetDigital")}</button>
                    <button type="button" onClick={() => setWidgetForm({ ...widgetForm, clockStyle: "analog" })}
                      className={`p-2.5 rounded-lg border-2 text-sm ${widgetForm.clockStyle === "analog" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"}`}>{t("widgetAnalog")}</button>
                  </div>
                </div>
                {widgetForm.clockStyle === "digital" && (
                  <div className="space-y-2">
                    <Label>{t("widgetFormat")}</Label>
                    <Select value={widgetForm.format} onValueChange={(v) => setWidgetForm({ ...widgetForm, format: v as "12" | "24" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">{t("widgetFormat24")}</SelectItem>
                        <SelectItem value="12">{t("widgetFormat12")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>{t("widgetShowDate")}</Label>
                  <Switch checked={widgetForm.showDate} onCheckedChange={(v) => setWidgetForm({ ...widgetForm, showDate: v })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("widgetTimezone")}</Label>
                  <Select value={widgetForm.timezone} onValueChange={(v) => setWidgetForm({ ...widgetForm, timezone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TIMEZONE_OPTIONS.map((tz) => (<SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {widgetForm.widgetType === "webpage" && (
              <div className="space-y-2"><Label>{t("widgetUrl")}</Label><Input value={widgetForm.url} onChange={(e) => setWidgetForm({ ...widgetForm, url: e.target.value })} placeholder={t("widgetUrlPlaceholder")} /></div>
            )}

            {widgetForm.widgetType === "marquee" && (
              <>
                <div className="space-y-2"><Label>{t("widgetText")}</Label><Input value={widgetForm.text} onChange={(e) => setWidgetForm({ ...widgetForm, text: e.target.value })} placeholder={t("widgetTextPlaceholder")} /></div>
                <div className="space-y-2">
                  <Label>{t("widgetSpeed")}</Label>
                  <Select value={widgetForm.speed} onValueChange={(v) => setWidgetForm({ ...widgetForm, speed: v as "slow" | "normal" | "fast" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">{t("widgetSpeedSlow")}</SelectItem>
                      <SelectItem value="normal">{t("widgetSpeedNormal")}</SelectItem>
                      <SelectItem value="fast">{t("widgetSpeedFast")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {widgetForm.widgetType === "qrcode" && (
              <div className="space-y-2"><Label>{t("widgetQrcodeContent")}</Label><Input value={widgetForm.qrcodeContent} onChange={(e) => setWidgetForm({ ...widgetForm, qrcodeContent: e.target.value })} placeholder={t("widgetQrcodePlaceholder")} /></div>
            )}

            {widgetForm.widgetType === "countdown" && (
              <>
                <div className="space-y-2"><Label>{t("widgetCountdownTitle")}</Label><Input value={widgetForm.countdownTitle} onChange={(e) => setWidgetForm({ ...widgetForm, countdownTitle: e.target.value })} placeholder={t("widgetCountdownTitlePlaceholder")} /></div>
                <div className="space-y-2"><Label>{t("widgetTargetDate")}</Label><Input type="datetime-local" value={widgetForm.targetDate} onChange={(e) => setWidgetForm({ ...widgetForm, targetDate: e.target.value })} /></div>
              </>
            )}

            {widgetForm.widgetType === "youtube" && (
              <div className="space-y-2"><Label>{t("widgetYoutubeUrl")}</Label><Input value={widgetForm.youtubeUrl} onChange={(e) => setWidgetForm({ ...widgetForm, youtubeUrl: e.target.value })} placeholder={t("widgetYoutubeUrlPlaceholder")} /></div>
            )}

            {widgetForm.widgetType === "weather" && (
              <div className="space-y-2"><Label>{t("widgetCity")}</Label><Input value={widgetForm.city} onChange={(e) => setWidgetForm({ ...widgetForm, city: e.target.value })} placeholder={t("widgetCityPlaceholder")} /></div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("widgetBgColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={widgetForm.bgColor} onChange={(e) => setWidgetForm({ ...widgetForm, bgColor: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={widgetForm.bgColor} onChange={(e) => setWidgetForm({ ...widgetForm, bgColor: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("widgetTextColor")}</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={widgetForm.textColor} onChange={(e) => setWidgetForm({ ...widgetForm, textColor: e.target.value })} className="w-8 h-8 rounded border border-border cursor-pointer" />
                  <Input value={widgetForm.textColor} onChange={(e) => setWidgetForm({ ...widgetForm, textColor: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>{t("widgetLivePreview")}</Label>
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted/30">
                <WidgetPreviewCard config={{
                  widgetType: widgetForm.widgetType, url: widgetForm.url, text: widgetForm.text,
                  speed: widgetForm.speed, format: widgetForm.format, clockStyle: widgetForm.clockStyle,
                  showDate: widgetForm.showDate, timezone: widgetForm.timezone, bgColor: widgetForm.bgColor,
                  textColor: widgetForm.textColor, qrcodeContent: widgetForm.qrcodeContent,
                  targetDate: widgetForm.targetDate, countdownTitle: widgetForm.countdownTitle,
                  youtubeUrl: widgetForm.youtubeUrl, city: widgetForm.city, fontSize: widgetForm.fontSize,
                  qrcodeSize: widgetForm.qrcodeSize, animation: widgetForm.animation,
                }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={handleCreateWidget} className="gap-2"><Plus className="w-4 h-4" />{t("mediaAddWidget")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPage;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
