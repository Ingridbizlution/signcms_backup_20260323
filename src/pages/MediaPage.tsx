import { useState, useEffect, useRef } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Image, Upload, Trash2, Search, Grid3X3, List, Eye, FileImage, FileVideo, Clock, HardDrive, Loader2,
  Code2, Calendar, Globe, Type, Plus, CloudSun, QrCode, Timer, Youtube,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type WidgetSubType = "date" | "clock" | "webpage" | "marquee" | "qrcode" | "countdown" | "youtube" | "weather";

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
}

interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "widget";
  url: string;
  thumbnail: string;
  size: string;
  dimensions: string;
  duration?: string;
  created_at: string;
}

function parseWidgetConfig(url: string): WidgetConfig | null {
  try {
    if (url.startsWith("{")) return JSON.parse(url);
  } catch {}
  return null;
}

const WIDGET_ICONS: Record<WidgetSubType, typeof Calendar> = {
  date: Calendar,
  clock: Clock,
  webpage: Globe,
  marquee: Type,
  qrcode: QrCode,
  countdown: Timer,
  youtube: Youtube,
  weather: CloudSun,
};

const TIMEZONE_OPTIONS = [
  { value: "Asia/Taipei", label: "🇹🇼 台北 (UTC+8)" },
  { value: "Asia/Tokyo", label: "🇯🇵 東京 (UTC+9)" },
  { value: "Asia/Shanghai", label: "🇨🇳 上海 (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "🇭🇰 香港 (UTC+8)" },
  { value: "Asia/Singapore", label: "🇸🇬 新加坡 (UTC+8)" },
  { value: "Asia/Seoul", label: "🇰🇷 首爾 (UTC+9)" },
  { value: "Asia/Bangkok", label: "🇹🇭 曼谷 (UTC+7)" },
  { value: "Asia/Kolkata", label: "🇮🇳 孟買 (UTC+5:30)" },
  { value: "Asia/Dubai", label: "🇦🇪 杜拜 (UTC+4)" },
  { value: "Europe/London", label: "🇬🇧 倫敦 (UTC+0/+1)" },
  { value: "Europe/Paris", label: "🇫🇷 巴黎 (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "🇩🇪 柏林 (UTC+1/+2)" },
  { value: "America/New_York", label: "🇺🇸 紐約 (UTC-5/-4)" },
  { value: "America/Chicago", label: "🇺🇸 芝加哥 (UTC-6/-5)" },
  { value: "America/Los_Angeles", label: "🇺🇸 洛杉磯 (UTC-8/-7)" },
  { value: "Pacific/Auckland", label: "🇳🇿 奧克蘭 (UTC+12/+13)" },
  { value: "Australia/Sydney", label: "🇦🇺 雪梨 (UTC+10/+11)" },
];

function WidgetPreviewCard({ config }: { config: WidgetConfig }) {
  const { t } = useLanguage();
  const Icon = WIDGET_ICONS[config.widgetType] || Code2;
  const labels: Record<WidgetSubType, string> = {
    date: t("widgetDate"), clock: t("widgetClock"), webpage: t("widgetWebpage"), marquee: t("widgetMarquee"),
    qrcode: t("widgetQrcode"), countdown: t("widgetCountdown"), youtube: t("widgetYoutube"), weather: t("widgetWeather"),
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ background: config.bgColor || "hsl(var(--muted))", color: config.textColor || "hsl(var(--foreground))" }}
    >
      <Icon className="w-8 h-8 opacity-60" />
      <span className="text-xs font-medium">{labels[config.widgetType]}</span>
      {config.widgetType === "marquee" && config.text && (
        <span className="text-[10px] opacity-60 truncate max-w-[80%]">{config.text}</span>
      )}
      {config.widgetType === "webpage" && config.url && (
        <span className="text-[10px] opacity-60 truncate max-w-[80%]">{config.url}</span>
      )}
    </div>
  );
}

function WidgetLivePreview({ config }: { config: WidgetConfig }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (config.widgetType === "clock" || config.widgetType === "date") {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [config.widgetType]);

  const bg = config.bgColor || "#1a1a2e";
  const fg = config.textColor || "#ffffff";

  if (config.widgetType === "clock") {
    const tz = config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: config.format === "12", timeZone: tz };
    const timeStr = now.toLocaleTimeString("en-US", opts);

    if (config.clockStyle === "analog") {
      const hParts = now.toLocaleString("en-US", { hour: "numeric", minute: "numeric", second: "numeric", hour12: false, timeZone: tz }).split(":");
      const h = parseInt(hParts[0]), m = parseInt(hParts[1]), s = parseInt(hParts[2]);
      const hDeg = (h % 12) * 30 + m * 0.5;
      const mDeg = m * 6;
      const sDeg = s * 6;
      const dateStr = config.showDate ? now.toLocaleDateString("zh-TW", { month: "short", day: "numeric", timeZone: tz }) : "";
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg" style={{ background: bg, color: fg }}>
          <svg viewBox="0 0 200 200" className="w-[55%] max-w-[170px]">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="96" fill="none" stroke={fg} strokeWidth="2" opacity="0.15" />
            <circle cx="100" cy="100" r="93" fill="none" stroke={fg} strokeWidth="1" opacity="0.08" />
            {/* Hour numbers */}
            {[...Array(12)].map((_, i) => {
              const num = i === 0 ? 12 : i;
              const angle = (i * 30 - 90) * Math.PI / 180;
              const tx = 100 + 78 * Math.cos(angle);
              const ty = 100 + 78 * Math.sin(angle);
              return <text key={i} x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fill={fg} fontSize="14" fontWeight="600" opacity="0.8">{num}</text>;
            })}
            {/* Minute ticks */}
            {[...Array(60)].map((_, i) => {
              const angle = (i * 6 - 90) * Math.PI / 180;
              const isHour = i % 5 === 0;
              const r1 = isHour ? 86 : 89;
              const r2 = 92;
              return <line key={i} x1={100 + r1 * Math.cos(angle)} y1={100 + r1 * Math.sin(angle)} x2={100 + r2 * Math.cos(angle)} y2={100 + r2 * Math.sin(angle)} stroke={fg} strokeWidth={isHour ? 2 : 0.8} opacity={isHour ? 0.6 : 0.3} />;
            })}
            {/* Date window */}
            {config.showDate && (
              <>
                <rect x="120" y="92" width="30" height="16" rx="3" fill={fg} opacity="0.15" stroke={fg} strokeWidth="0.5" />
                <text x="135" y="101" textAnchor="middle" dominantBaseline="central" fill={fg} fontSize="8" fontWeight="500" opacity="0.7">{dateStr}</text>
              </>
            )}
            {/* Hour hand - tapered */}
            <polygon points={`${100 + 45 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 + 45 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 + 5 * Math.cos((hDeg) * Math.PI / 180)},${100 + 5 * Math.sin((hDeg) * Math.PI / 180)} ${100 - 10 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 - 10 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 - 5 * Math.cos((hDeg) * Math.PI / 180)},${100 - 5 * Math.sin((hDeg) * Math.PI / 180)}`} fill={fg} opacity="0.9" />
            {/* Minute hand - tapered */}
            <polygon points={`${100 + 65 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 + 65 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 + 4 * Math.cos((mDeg) * Math.PI / 180)},${100 + 4 * Math.sin((mDeg) * Math.PI / 180)} ${100 - 12 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 - 12 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 - 4 * Math.cos((mDeg) * Math.PI / 180)},${100 - 4 * Math.sin((mDeg) * Math.PI / 180)}`} fill={fg} opacity="0.85" />
            {/* Second hand */}
            <line x1={100 - 18 * Math.cos((sDeg - 90) * Math.PI / 180)} y1={100 - 18 * Math.sin((sDeg - 90) * Math.PI / 180)} x2={100 + 72 * Math.cos((sDeg - 90) * Math.PI / 180)} y2={100 + 72 * Math.sin((sDeg - 90) * Math.PI / 180)} stroke="hsl(0 70% 55%)" strokeWidth="1.2" strokeLinecap="round" />
            {/* Center cap */}
            <circle cx="100" cy="100" r="5" fill={fg} />
            <circle cx="100" cy="100" r="2.5" fill="hsl(0 70% 55%)" />
          </svg>
          {config.timezone && <span className="text-[10px] opacity-50">{config.timezone}</span>}
        </div>
      );
    }

    const dateStr = config.showDate ? now.toLocaleDateString("zh-TW", { year: "numeric", month: "short", day: "numeric", weekday: "short", timeZone: tz }) : "";
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg" style={{ background: bg, color: fg }}>
        <span className="text-4xl font-mono font-bold tracking-wider">{timeStr}</span>
        {config.showDate && <span className="text-sm opacity-60">{dateStr}</span>}
        {config.timezone && <span className="text-xs opacity-40">{config.timezone}</span>}
      </div>
    );
  }

  if (config.widgetType === "date") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg" style={{ background: bg, color: fg }}>
        <span className="text-lg font-medium opacity-70">{now.toLocaleDateString("zh-TW", { weekday: "long" })}</span>
        <span className="text-3xl font-bold">{now.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>
    );
  }

  if (config.widgetType === "webpage") {
    return (
      <div className="w-full h-full rounded-lg overflow-hidden relative" style={{ background: bg }}>
        {config.url ? (
          <iframe src={config.url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="webpage widget" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: fg }}>
            <Globe className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>
    );
  }

  if (config.widgetType === "marquee") {
    const speed = config.speed === "slow" ? "30s" : config.speed === "fast" ? "8s" : "15s";
    return (
      <div className="w-full h-full flex items-center overflow-hidden rounded-lg" style={{ background: bg, color: fg }}>
        <div className="whitespace-nowrap animate-marquee text-2xl font-bold" style={{ animationDuration: speed }}>
          {config.text || "Marquee Text"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{config.text || "Marquee Text"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>
    );
  }

  if (config.widgetType === "qrcode") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg" style={{ background: bg, color: fg }}>
        <QRCodeSVG value={config.qrcodeContent || "https://example.com"} size={140} bgColor={bg} fgColor={fg} level="M" />
        {config.qrcodeContent && <span className="text-[10px] opacity-50 truncate max-w-[80%]">{config.qrcodeContent}</span>}
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
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 rounded-lg" style={{ background: bg, color: fg }}>
        {config.countdownTitle && <span className="text-lg font-bold opacity-80">{config.countdownTitle}</span>}
        <div className="flex gap-4">
          {[{ v: days, l: "天" }, { v: hours, l: "時" }, { v: mins, l: "分" }, { v: secs, l: "秒" }].map(({ v, l }) => (
            <div key={l} className="flex flex-col items-center">
              <span className="text-4xl font-mono font-bold">{String(v).padStart(2, "0")}</span>
              <span className="text-xs opacity-50">{l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (config.widgetType === "youtube") {
    const videoId = extractYoutubeId(config.youtubeUrl || "");
    return (
      <div className="w-full h-full rounded-lg overflow-hidden" style={{ background: bg }}>
        {videoId ? (
          <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen title="YouTube" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: fg }}>
            <Youtube className="w-10 h-10 opacity-30" />
          </div>
        )}
      </div>
    );
  }

  if (config.widgetType === "weather") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg" style={{ background: bg, color: fg }}>
        <CloudSun className="w-16 h-16 opacity-60" />
        <span className="text-lg font-bold">{config.city || "City"}</span>
        <WeatherDisplay city={config.city || "Taipei"} fg={fg} />
      </div>
    );
  }

  return null;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function WeatherDisplay({ city, fg }: { city: string; fg: string }) {
  const [weather, setWeather] = useState<{ temp: string; desc: string } | null>(null);

  useEffect(() => {
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t|%C&lang=zh`)
      .then(r => r.text())
      .then(text => {
        const [temp, desc] = text.split("|");
        setWeather({ temp: temp?.trim() || "--", desc: desc?.trim() || "" });
      })
      .catch(() => setWeather({ temp: "--", desc: "" }));
  }, [city]);

  if (!weather) return <span className="text-xs opacity-40">Loading...</span>;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-3xl font-bold">{weather.temp}</span>
      <span className="text-sm opacity-60">{weather.desc}</span>
    </div>
  );
}

export default function MediaPage() {
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Widget form state
  const defaultWidgetForm = {
    name: "",
    widgetType: "clock" as WidgetSubType,
    url: "",
    text: "歡迎光臨！今日特惠中",
    speed: "normal" as "slow" | "normal" | "fast",
    format: "24" as "12" | "24",
    clockStyle: "digital" as "digital" | "analog",
    showDate: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bgColor: "#1a1a2e",
    textColor: "#ffffff",
    qrcodeContent: "",
    targetDate: "",
    countdownTitle: "",
    youtubeUrl: "",
    city: "Taipei",
  };
  const [widgetForm, setWidgetForm] = useState(defaultWidgetForm);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("media_items")
      .select("id, name, type, url, thumbnail, size, dimensions, duration, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setMedia(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, []);

  const filtered = media.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) { toast.error(`${t("mediaUnsupported")}：${file.name}`); continue; }

      let dimensions = "";
      let duration: string | undefined;

      if (isImage) {
        dimensions = await new Promise<string>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve(`${img.naturalWidth}×${img.naturalHeight}`);
          img.onerror = () => resolve("");
          img.src = URL.createObjectURL(file);
        });
      } else {
        const result = await new Promise<{ dimensions: string; duration: string }>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            const mins = Math.floor(video.duration / 60);
            const secs = Math.floor(video.duration % 60);
            resolve({
              dimensions: `${video.videoWidth}×${video.videoHeight}`,
              duration: `${mins}:${secs.toString().padStart(2, "0")}`,
            });
          };
          video.onerror = () => resolve({ dimensions: "", duration: "" });
          video.src = URL.createObjectURL(file);
        });
        dimensions = result.dimensions;
        duration = result.duration;
      }

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const { error } = await (supabase as any).from("media_items").insert({
        name: file.name,
        type: isVideo ? "video" : "image",
        url: dataUrl,
        thumbnail: isImage ? dataUrl : "",
        size: formatFileSize(file.size),
        dimensions,
        duration,
        uploaded_by: user?.id,
      });

      if (error) toast.error(error.message);
      else toast.success(`${t("mediaUploaded")}：${file.name}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchMedia();
  };

  const handleDelete = async () => {
    if (deleteId) {
      const item = media.find((m) => m.id === deleteId);
      const { error } = await (supabase as any).from("media_items").delete().eq("id", deleteId);
      if (error) toast.error(error.message);
      else { toast.success(`${t("mediaDeleted")}：${item?.name}`); fetchMedia(); }
      setDeleteId(null);
    }
  };

  const handleCreateWidget = async () => {
    if (!widgetForm.name.trim()) { toast.error(t("widgetFillRequired")); return; }

    const config: WidgetConfig = {
      widgetType: widgetForm.widgetType,
      bgColor: widgetForm.bgColor,
      textColor: widgetForm.textColor,
    };
    if (widgetForm.widgetType === "webpage") config.url = widgetForm.url;
    if (widgetForm.widgetType === "marquee") { config.text = widgetForm.text; config.speed = widgetForm.speed; }
    if (widgetForm.widgetType === "clock") { config.format = widgetForm.format; config.clockStyle = widgetForm.clockStyle; config.timezone = widgetForm.timezone; config.showDate = widgetForm.showDate; }
    if (widgetForm.widgetType === "qrcode") config.qrcodeContent = widgetForm.qrcodeContent;
    if (widgetForm.widgetType === "countdown") { config.targetDate = widgetForm.targetDate; config.countdownTitle = widgetForm.countdownTitle; }
    if (widgetForm.widgetType === "youtube") config.youtubeUrl = widgetForm.youtubeUrl;
    if (widgetForm.widgetType === "weather") config.city = widgetForm.city;

    const { error } = await (supabase as any).from("media_items").insert({
      name: widgetForm.name,
      type: "widget",
      url: JSON.stringify(config),
      thumbnail: "",
      size: "Widget",
      dimensions: "auto",
      uploaded_by: user?.id,
    });

    if (error) toast.error(error.message);
    else {
      toast.success(t("widgetCreated"));
      setWidgetDialogOpen(false);
      setWidgetForm({ ...defaultWidgetForm });
      fetchMedia();
    }
  };

  const imageCount = media.filter((m) => m.type === "image").length;
  const videoCount = media.filter((m) => m.type === "video").length;
  const widgetCount = media.filter((m) => m.type === "widget").length;

  const getItemIcon = (item: MediaItem) => {
    if (item.type === "widget") {
      const config = parseWidgetConfig(item.url);
      if (config) {
        const Icon = WIDGET_ICONS[config.widgetType] || Code2;
        return <Icon className="w-10 h-10 text-primary/40" />;
      }
      return <Code2 className="w-10 h-10 text-primary/40" />;
    }
    if (item.type === "video") return <FileVideo className="w-10 h-10 text-muted-foreground/40" />;
    return <FileImage className="w-10 h-10 text-muted-foreground/40" />;
  };

  const getSmallItemIcon = (item: MediaItem) => {
    if (item.type === "widget") {
      const config = parseWidgetConfig(item.url);
      if (config) {
        const Icon = WIDGET_ICONS[config.widgetType] || Code2;
        return <Icon className="w-5 h-5 text-primary/50" />;
      }
      return <Code2 className="w-5 h-5 text-primary/50" />;
    }
    if (item.type === "video") return <FileVideo className="w-5 h-5 text-muted-foreground/50" />;
    return <FileImage className="w-5 h-5 text-muted-foreground/50" />;
  };

  const getTypeBadge = (item: MediaItem) => {
    if (item.type === "widget") {
      const config = parseWidgetConfig(item.url);
      const subLabel = config ? { date: t("widgetDate"), clock: t("widgetClock"), webpage: t("widgetWebpage"), marquee: t("widgetMarquee"), qrcode: t("widgetQrcode"), countdown: t("widgetCountdown"), youtube: t("widgetYoutube"), weather: t("widgetWeather") }[config.widgetType] : t("widget");
      return subLabel;
    }
    return item.type === "image" ? t("image") : t("video");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("mediaTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("mediaSubtitle")} · {imageCount} {t("mediaImages")} · {videoCount} {t("mediaVideos")} · {widgetCount} {t("mediaWidgets")}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setWidgetDialogOpen(true)} className="gap-2">
              <Code2 className="w-4 h-4" />
              {t("mediaAddWidget")}
            </Button>
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
            <SelectItem value="widget">{t("widget")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button variant={viewMode === "grid" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}><Grid3X3 className="w-4 h-4" /></Button>
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
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
                  <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                    {item.type === "widget" ? (
                      (() => { const c = parseWidgetConfig(item.url); return c ? <WidgetPreviewCard config={c} /> : getItemIcon(item); })()
                    ) : item.url && item.type === "image" ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      getItemIcon(item)
                    )}
                    {item.type === "video" && item.duration && (
                      <span className="absolute bottom-2 right-2 bg-foreground/80 text-background text-[10px] font-medium px-1.5 py-0.5 rounded">{item.duration}</span>
                    )}
                    <Badge variant={item.type === "widget" ? "default" : "secondary"} className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
                      {getTypeBadge(item)}
                    </Badge>
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="w-6 h-6 text-background drop-shadow-lg" />
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{item.size}</span>
                      {item.type !== "widget" && <><span>·</span><span>{item.dimensions}</span></>}
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
                  <div className="w-16 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.type === "widget" ? (
                      (() => { const c = parseWidgetConfig(item.url); return c ? <WidgetPreviewCard config={c} /> : getSmallItemIcon(item); })()
                    ) : item.url && item.type === "image" ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      getSmallItemIcon(item)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <Badge variant={item.type === "widget" ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4">{getTypeBadge(item)}</Badge>
                      <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{item.size}</span>
                      {item.type !== "widget" && <span>{item.dimensions}</span>}
                      {item.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration}</span>}
                      <span>{item.created_at?.split("T")[0]}</span>
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
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate pr-6">
              {previewItem?.type === "widget" ? <Code2 className="w-5 h-5 text-primary shrink-0" /> : previewItem?.type === "image" ? <FileImage className="w-5 h-5 text-primary shrink-0" /> : <FileVideo className="w-5 h-5 text-primary shrink-0" />}
              <span className="truncate">{previewItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {previewItem?.type === "widget" ? (
                (() => { const c = parseWidgetConfig(previewItem.url); return c ? <WidgetLivePreview config={c} /> : <Code2 className="w-16 h-16 opacity-30" />; })()
              ) : previewItem?.url && previewItem.type === "image" ? (
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
                <p className="font-medium text-foreground">{previewItem ? getTypeBadge(previewItem) : ""}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{t("mediaFileSize")}</p>
                <p className="font-medium text-foreground">{previewItem?.size}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{previewItem?.type === "widget" ? t("widgetType") : t("mediaResolution")}</p>
                <p className="font-medium text-foreground">{previewItem?.type === "widget" ? t("widget") : previewItem?.dimensions}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">{previewItem?.type === "video" ? t("mediaDuration") : t("mediaUploadDate")}</p>
                <p className="font-medium text-foreground">{previewItem?.type === "video" ? previewItem?.duration : previewItem?.created_at?.split("T")[0]}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex justify-end">
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => { if (previewItem) { setDeleteId(previewItem.id); setPreviewItem(null); } }}>
                  <Trash2 className="w-4 h-4" />
                  {t("mediaDeleteItem")}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Creation Dialog */}
      <Dialog open={widgetDialogOpen} onOpenChange={setWidgetDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" />{t("mediaAddWidget")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("widgetName")} *</Label>
              <Input value={widgetForm.name} onChange={(e) => setWidgetForm({ ...widgetForm, name: e.target.value })} placeholder={t("widgetNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("widgetType")}</Label>
              <div className="grid grid-cols-4 gap-2">
                {(["clock", "date", "webpage", "marquee", "qrcode", "countdown", "youtube", "weather"] as WidgetSubType[]).map((wt) => {
                  const Icon = WIDGET_ICONS[wt];
                  const labels: Record<WidgetSubType, string> = { date: t("widgetDate"), clock: t("widgetClock"), webpage: t("widgetWebpage"), marquee: t("widgetMarquee"), qrcode: t("widgetQrcode"), countdown: t("widgetCountdown"), youtube: t("widgetYoutube"), weather: t("widgetWeather") };
                  const descs: Record<WidgetSubType, string> = { date: t("widgetDateDesc"), clock: t("widgetClockDesc"), webpage: t("widgetWebpageDesc"), marquee: t("widgetMarqueeDesc"), qrcode: t("widgetQrcodeDesc"), countdown: t("widgetCountdownDesc"), youtube: t("widgetYoutubeDesc"), weather: t("widgetWeatherDesc") };
                  return (
                    <button key={wt} type="button" onClick={() => setWidgetForm({ ...widgetForm, widgetType: wt })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                        widgetForm.widgetType === wt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}>
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
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-all text-sm ${widgetForm.clockStyle === "digital" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"}`}>
                      {t("widgetDigital")}
                    </button>
                    <button type="button" onClick={() => setWidgetForm({ ...widgetForm, clockStyle: "analog" })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-all text-sm ${widgetForm.clockStyle === "analog" ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/40"}`}>
                      {t("widgetAnalog")}
                    </button>
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
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {widgetForm.widgetType === "webpage" && (
              <div className="space-y-2">
                <Label>{t("widgetUrl")}</Label>
                <Input value={widgetForm.url} onChange={(e) => setWidgetForm({ ...widgetForm, url: e.target.value })} placeholder={t("widgetUrlPlaceholder")} />
              </div>
            )}

            {widgetForm.widgetType === "marquee" && (
              <>
                <div className="space-y-2">
                  <Label>{t("widgetText")}</Label>
                  <Input value={widgetForm.text} onChange={(e) => setWidgetForm({ ...widgetForm, text: e.target.value })} placeholder={t("widgetTextPlaceholder")} />
                </div>
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
              <div className="space-y-2">
                <Label>{t("widgetQrcodeContent")}</Label>
                <Input value={widgetForm.qrcodeContent || ""} onChange={(e) => setWidgetForm({ ...widgetForm, qrcodeContent: e.target.value })} placeholder={t("widgetQrcodePlaceholder")} />
              </div>
            )}

            {widgetForm.widgetType === "countdown" && (
              <>
                <div className="space-y-2">
                  <Label>{t("widgetCountdownTitle")}</Label>
                  <Input value={widgetForm.countdownTitle || ""} onChange={(e) => setWidgetForm({ ...widgetForm, countdownTitle: e.target.value })} placeholder={t("widgetCountdownTitlePlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("widgetTargetDate")}</Label>
                  <Input type="datetime-local" value={widgetForm.targetDate || ""} onChange={(e) => setWidgetForm({ ...widgetForm, targetDate: e.target.value })} />
                </div>
              </>
            )}

            {widgetForm.widgetType === "youtube" && (
              <div className="space-y-2">
                <Label>{t("widgetYoutubeUrl")}</Label>
                <Input value={widgetForm.youtubeUrl || ""} onChange={(e) => setWidgetForm({ ...widgetForm, youtubeUrl: e.target.value })} placeholder={t("widgetYoutubeUrlPlaceholder")} />
              </div>
            )}

            {widgetForm.widgetType === "weather" && (
              <div className="space-y-2">
                <Label>{t("widgetCity")}</Label>
                <Input value={widgetForm.city || ""} onChange={(e) => setWidgetForm({ ...widgetForm, city: e.target.value })} placeholder={t("widgetCityPlaceholder")} />
              </div>
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
              <Label>{t("mediaPreviewUnavailable").replace("（範例素材）", "").replace("(sample)", "Preview")}</Label>
              <div className="aspect-video rounded-lg overflow-hidden border border-border">
                <WidgetLivePreview config={{
                  widgetType: widgetForm.widgetType,
                  url: widgetForm.url,
                  text: widgetForm.text,
                  speed: widgetForm.speed,
                  format: widgetForm.format,
                  clockStyle: widgetForm.clockStyle,
                  showDate: widgetForm.showDate,
                  timezone: widgetForm.timezone,
                  bgColor: widgetForm.bgColor,
                  textColor: widgetForm.textColor,
                  qrcodeContent: widgetForm.qrcodeContent,
                  targetDate: widgetForm.targetDate,
                  countdownTitle: widgetForm.countdownTitle,
                  youtubeUrl: widgetForm.youtubeUrl,
                  city: widgetForm.city,
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
