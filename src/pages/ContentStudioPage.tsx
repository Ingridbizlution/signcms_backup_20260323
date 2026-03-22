import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Monitor, Smartphone, LayoutGrid, Columns2, Rows2, Square,
  Type, ImageIcon, Film, Palette, Upload, Trash2, ChevronRight,
  Utensils, PartyPopper, ShoppingBag, Sun, Gift, Coffee,
  X, Plus, AlignLeft, AlignCenter, AlignRight, Minus,
  Save, FolderOpen, FilePlus, ChevronLeft, ChevronRightIcon, Play, Pause,
  Layers, Code2, Clock, Calendar, Globe, CloudSun, QrCode, Timer, Youtube, Move, Maximize2, Lock, Unlock, Check,
  Search, ArrowUpDown, ArrowDownAZ, ArrowUpAZ
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";

// ── Types ──────────────────────────────────────────────────────────
type AspectRatio = "16:9" | "9:16";

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
  duration?: number; // seconds for carousel auto-advance
}

type CarouselTransition = "fade" | "slide" | "zoom" | "none";

interface ZoneContent {
  type: "text" | "media" | "color" | "widget";
  value: string;
  bgColor?: string;
  fontSize?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  mediaItems?: MediaItem[];
  carouselInterval?: number; // seconds
  carouselTransition?: CarouselTransition;
  widgetId?: string;
  widgetName?: string;
  widgetConfig?: any;
}

interface Zone {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  content?: ZoneContent;
}

interface OverlayBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  opacity: number; // 0-100
  zIndex: number;
  locked?: boolean;
  content?: ZoneContent;
}

interface DesignProject {
  id: string;
  name: string;
  aspect: AspectRatio;
  zones: Zone[];
  overlays?: OverlayBlock[];
  created_at: string;
  updated_at: string;
}

interface LayoutPreset {
  id: string;
  nameKey: string;
  icon: React.ReactNode;
  zones: Omit<Zone, "content">[];
}

interface TemplateItem {
  id: string;
  nameKey: string;
  icon: React.ReactNode;
  color: string;
  zones: Zone[];
  aspect: AspectRatio;
}

// ── Layout presets ─────────────────────────────────────────────────
const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: "full", nameKey: "studioLayoutFull", icon: <Square className="w-4 h-4" />, zones: [{ id: "z1", x: 0, y: 0, w: 100, h: 100, label: "A" }] },
  { id: "lr", nameKey: "studioLayoutLR", icon: <Columns2 className="w-4 h-4" />, zones: [{ id: "z1", x: 0, y: 0, w: 50, h: 100, label: "A" }, { id: "z2", x: 50, y: 0, w: 50, h: 100, label: "B" }] },
  { id: "tb", nameKey: "studioLayoutTB", icon: <Rows2 className="w-4 h-4" />, zones: [{ id: "z1", x: 0, y: 0, w: 100, h: 75, label: "A" }, { id: "z2", x: 0, y: 75, w: 100, h: 25, label: "B" }] },
  { id: "grid", nameKey: "studioLayoutGrid", icon: <LayoutGrid className="w-4 h-4" />, zones: [{ id: "z1", x: 0, y: 0, w: 50, h: 50, label: "A" }, { id: "z2", x: 50, y: 0, w: 50, h: 50, label: "B" }, { id: "z3", x: 0, y: 50, w: 50, h: 50, label: "C" }, { id: "z4", x: 50, y: 50, w: 50, h: 50, label: "D" }] },
];

// ── Template library ───────────────────────────────────────────────
const TEMPLATES: TemplateItem[] = [
  { id: "t-food", nameKey: "studioTplFood", icon: <Utensils className="w-5 h-5" />, color: "hsl(15 80% 55%)", aspect: "16:9", zones: [
    { id: "z1", x: 0, y: 0, w: 60, h: 100, label: "A", content: { type: "color", value: "", bgColor: "hsl(15 80% 55%)" } },
    { id: "z2", x: 60, y: 0, w: 40, h: 60, label: "B", content: { type: "text", value: "🍕 今日特餐 50% OFF", fontSize: 28, textColor: "hsl(0 0% 100%)", bgColor: "hsl(15 70% 45%)" } },
    { id: "z3", x: 60, y: 60, w: 40, h: 40, label: "C", content: { type: "text", value: "限時優惠", fontSize: 20, textColor: "hsl(0 0% 100%)", bgColor: "hsl(15 60% 35%)" } },
  ]},
  { id: "t-holiday", nameKey: "studioTplHoliday", icon: <PartyPopper className="w-5 h-5" />, color: "hsl(340 75% 55%)", aspect: "16:9", zones: [
    { id: "z1", x: 0, y: 0, w: 100, h: 70, label: "A", content: { type: "text", value: "🎉 新年快樂！", fontSize: 48, textColor: "hsl(45 100% 60%)", bgColor: "hsl(340 75% 50%)" } },
    { id: "z2", x: 0, y: 70, w: 100, h: 30, label: "B", content: { type: "text", value: "全館消費滿千送百 🧧", fontSize: 22, textColor: "hsl(0 0% 100%)", bgColor: "hsl(340 65% 40%)" } },
  ]},
  { id: "t-newproduct", nameKey: "studioTplNew", icon: <ShoppingBag className="w-5 h-5" />, color: "hsl(210 80% 55%)", aspect: "9:16", zones: [
    { id: "z1", x: 0, y: 0, w: 100, h: 55, label: "A", content: { type: "color", value: "", bgColor: "hsl(210 80% 55%)" } },
    { id: "z2", x: 0, y: 55, w: 100, h: 25, label: "B", content: { type: "text", value: "✨ 新品上市", fontSize: 36, textColor: "hsl(0 0% 100%)", bgColor: "hsl(210 70% 45%)" } },
    { id: "z3", x: 0, y: 80, w: 100, h: 20, label: "C", content: { type: "text", value: "即日起限量發售", fontSize: 18, textColor: "hsl(210 20% 90%)", bgColor: "hsl(210 60% 35%)" } },
  ]},
  { id: "t-summer", nameKey: "studioTplSummer", icon: <Sun className="w-5 h-5" />, color: "hsl(38 90% 55%)", aspect: "16:9", zones: [
    { id: "z1", x: 0, y: 0, w: 100, h: 100, label: "A", content: { type: "text", value: "☀️ 夏日祭典\n冰品買一送一", fontSize: 40, textColor: "hsl(0 0% 100%)", bgColor: "hsl(38 85% 50%)" } },
  ]},
  { id: "t-gift", nameKey: "studioTplGift", icon: <Gift className="w-5 h-5" />, color: "hsl(280 60% 55%)", aspect: "16:9", zones: [
    { id: "z1", x: 0, y: 0, w: 50, h: 100, label: "A", content: { type: "color", value: "", bgColor: "hsl(280 60% 50%)" } },
    { id: "z2", x: 50, y: 0, w: 50, h: 100, label: "B", content: { type: "text", value: "🎁 禮品卡\n滿額贈送", fontSize: 32, textColor: "hsl(0 0% 100%)", bgColor: "hsl(280 50% 40%)" } },
  ]},
  { id: "t-coffee", nameKey: "studioTplCoffee", icon: <Coffee className="w-5 h-5" />, color: "hsl(25 60% 40%)", aspect: "9:16", zones: [
    { id: "z1", x: 0, y: 0, w: 100, h: 40, label: "A", content: { type: "text", value: "☕", fontSize: 72, textColor: "hsl(25 30% 90%)", bgColor: "hsl(25 50% 30%)" } },
    { id: "z2", x: 0, y: 40, w: 100, h: 35, label: "B", content: { type: "text", value: "手沖咖啡\n第二杯半價", fontSize: 28, textColor: "hsl(0 0% 100%)", bgColor: "hsl(25 55% 35%)" } },
    { id: "z3", x: 0, y: 75, w: 100, h: 25, label: "C", content: { type: "text", value: "每日 14:00-17:00", fontSize: 18, textColor: "hsl(25 20% 80%)", bgColor: "hsl(25 40% 25%)" } },
  ]},
];

// ── Carousel Preview ───────────────────────────────────────────────
function CarouselPreview({ items, transition = "fade" }: { items: MediaItem[]; transition?: CarouselTransition }) {
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;
    const currentDuration = (items[idx]?.duration || 5) * 1000;
    const timer = setTimeout(() => {
      setPrevIdx(idx);
      setAnimating(true);
      setIdx((i) => (i + 1) % items.length);
      setTimeout(() => setAnimating(false), 600);
    }, currentDuration);
    return () => clearTimeout(timer);
  }, [items.length, idx, items]);

  if (items.length === 0) return null;

  const renderItem = (item: MediaItem) => {
    if (item.type === "image" && (item.url.startsWith("data:") || item.url.startsWith("http"))) {
      return <img src={item.url} alt={item.name} className="w-full h-full object-cover" />;
    }
    const Icon = item.type === "image" ? ImageIcon : Film;
    return (
      <div className="flex flex-col items-center gap-1 text-muted-foreground">
        <Icon className="w-8 h-8 opacity-50" />
        <span className="text-[10px] opacity-60 truncate max-w-[80%]">{item.name}</span>
      </div>
    );
  };

  const getTransitionStyle = (isCurrent: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    };
    if (transition === "fade") {
      return { ...base, opacity: isCurrent ? 1 : 0 };
    }
    if (transition === "slide") {
      return {
        ...base,
        opacity: isCurrent ? 1 : 0,
        transform: isCurrent ? "translateX(0)" : (animating ? "translateX(-100%)" : "translateX(100%)"),
      };
    }
    if (transition === "zoom") {
      return {
        ...base,
        opacity: isCurrent ? 1 : 0,
        transform: isCurrent ? "scale(1)" : "scale(1.15)",
      };
    }
    // none
    return { ...base, opacity: isCurrent ? 1 : 0, transition: "none" };
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {items.map((item, i) => (
        <div key={item.id + i} style={getTransitionStyle(i === idx)}>
          {renderItem(item)}
        </div>
      ))}
      {items.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {items.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === idx ? "bg-white scale-125" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Zone Editor ────────────────────────────────────────────────────
function ZoneEditor({ zone, onUpdate, onClose, dbMedia, dbWidgets, isEmbedded }: {
  zone: Zone;
  onUpdate: (content: ZoneContent) => void;
  onClose: () => void;
  dbMedia: { id: string; name: string; type: string; url: string; thumbnail: string; duration: string | null; created_at?: string }[];
  dbWidgets: { id: string; name: string; url: string; created_at?: string }[];
  isEmbedded?: boolean;
}) {
  const { t } = useLanguage();
  const content: ZoneContent = zone.content || { type: "color", value: "", bgColor: "hsl(var(--muted))" };
  const mediaItems = content.mediaItems || [];
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [selectedPickerIds, setSelectedPickerIds] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerFilter, setPickerFilter] = useState<"all" | "image" | "video" | "widget">("all");
  const [pickerSort, setPickerSort] = useState<"name-asc" | "name-desc" | "newest" | "oldest">("name-asc");

  const pickerItems = useMemo(() => {
    const items: { id: string; kind: "media" | "widget"; name: string; type?: string; icon: React.ReactNode; raw: any; createdAt?: string }[] = [];
    dbMedia.forEach((m) => {
      items.push({
        id: `media-${m.id}`, kind: "media", name: m.name, type: m.type,
        icon: m.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" /> : <Film className="w-3.5 h-3.5 text-primary shrink-0" />,
        raw: m, createdAt: m.created_at,
      });
    });
    dbWidgets.forEach((w) => {
      let config: any = null;
      try { if (w.url.startsWith("{")) config = JSON.parse(w.url); } catch {}
      const WidgetIcon = config?.widgetType === "clock" ? Clock : config?.widgetType === "date" ? Calendar : config?.widgetType === "webpage" ? Globe : Code2;
      items.push({
        id: `widget-${w.id}`, kind: "widget", name: w.name,
        icon: <WidgetIcon className="w-3.5 h-3.5 text-accent-foreground shrink-0" />,
        raw: { ...w, config }, createdAt: w.created_at,
      });
    });
    return items;
  }, [dbMedia, dbWidgets]);

  const filteredPickerItems = useMemo(() => {
    let filtered = pickerItems;
    if (pickerFilter === "image") filtered = filtered.filter((i) => i.kind === "media" && i.type === "image");
    else if (pickerFilter === "video") filtered = filtered.filter((i) => i.kind === "media" && i.type === "video");
    else if (pickerFilter === "widget") filtered = filtered.filter((i) => i.kind === "widget");
    if (pickerSearch.trim()) {
      const q = pickerSearch.trim().toLowerCase();
      filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
    }
    filtered = [...filtered].sort((a, b) => {
      if (pickerSort === "name-asc") return a.name.localeCompare(b.name);
      if (pickerSort === "name-desc") return b.name.localeCompare(a.name);
      if (pickerSort === "newest") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
    return filtered;
  }, [pickerItems, pickerFilter, pickerSearch, pickerSort]);

  const togglePickerItem = (id: string) => {
    setSelectedPickerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmPickerSelection = () => {
    let updatedContent = { ...content };
    let updatedMediaItems = [...mediaItems];
    let lastWidget: { id: string; name: string; config: any } | null = null;

    const selectedArray = Array.from(selectedPickerIds);
    selectedArray.forEach((pickerId) => {
      const item = pickerItems.find((p) => p.id === pickerId);
      if (!item) return;
      if (item.kind === "media") {
        const m = item.raw;
        const dur = m.type === "video" && m.duration ? parseFloat(m.duration) || 10 : 5;
        updatedMediaItems.push({ id: m.id, type: m.type as "image" | "video", url: m.thumbnail || m.url, name: m.name, duration: dur });
      } else {
        const w = item.raw;
        lastWidget = { id: w.id, name: w.name, config: w.config };
      }
    });

    // Apply media additions
    if (updatedMediaItems.length > mediaItems.length) {
      updatedContent = { ...updatedContent, type: "media", mediaItems: updatedMediaItems };
    }

    // Apply widget (widget takes priority if only widget selected, otherwise both are kept)
    if (lastWidget) {
      if (updatedMediaItems.length === 0 || updatedMediaItems.length === mediaItems.length) {
        // Only widget(s) selected, no new media
        updatedContent = { ...updatedContent, type: "widget", widgetId: lastWidget.id, widgetName: lastWidget.name, widgetConfig: lastWidget.config };
      } else {
        // Both media and widget selected — keep media type but also store widget info
        updatedContent = { ...updatedContent, widgetId: lastWidget.id, widgetName: lastWidget.name, widgetConfig: lastWidget.config };
      }
    }

    onUpdate(updatedContent);
    setSelectedPickerIds(new Set());
    setShowContentPicker(false);
    setPickerSearch("");
    setPickerFilter("all");
  };

  const addMedia = (m: typeof dbMedia[0]) => {
    const dur = m.type === "video" && m.duration ? parseFloat(m.duration) || 10 : 5;
    const newItem: MediaItem = { id: m.id, type: m.type as "image" | "video", url: m.thumbnail || m.url, name: m.name, duration: dur };
    onUpdate({ ...content, type: "media", mediaItems: [...mediaItems, newItem] });
  };

  const removeMedia = (id: string) => {
    const updated = mediaItems.filter((m) => m.id !== id);
    onUpdate({ ...content, mediaItems: updated, type: updated.length > 0 ? "media" : "color" });
  };

  const innerContent = (
      <div className="space-y-3">
        {/* Unified content section: Media & Widgets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> {t("studioContentPicker")}</label>
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setShowContentPicker(!showContentPicker); setSelectedPickerIds(new Set()); setPickerSearch(""); setPickerFilter("all"); }}>
              <Plus className="w-3 h-3" /> {t("studioAddContent")}
            </Button>
          </div>

          {/* Currently added media items */}
          {mediaItems.length > 0 && (
            <div className="space-y-1 mb-2">
              {mediaItems.map((m, i) => (
                <div key={m.id + i} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50 text-xs">
                  {m.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="truncate flex-1 text-foreground">{m.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {m.type === "video" ? (
                      <span className="text-[10px] text-muted-foreground">{m.duration || 10}s</span>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                          const updated = [...mediaItems];
                          updated[i] = { ...m, duration: Math.max(1, (m.duration || 5) - 1) };
                          onUpdate({ ...content, mediaItems: updated });
                        }}><Minus className="w-2.5 h-2.5" /></Button>
                        <span className="text-[10px] font-medium text-foreground w-5 text-center">{m.duration || 5}s</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => {
                          const updated = [...mediaItems];
                          updated[i] = { ...m, duration: Math.min(60, (m.duration || 5) + 1) };
                          onUpdate({ ...content, mediaItems: updated });
                        }}><Plus className="w-2.5 h-2.5" /></Button>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeMedia(m.id)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}

          {/* Currently added widget */}
          {content.type === "widget" && content.widgetName && (
            <div className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50 text-xs mb-2">
              <Code2 className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
              <span className="truncate flex-1 text-foreground">{content.widgetName}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => onUpdate({ ...content, type: "color", widgetId: undefined, widgetName: undefined, widgetConfig: undefined })}><X className="w-3 h-3" /></Button>
            </div>
          )}

          {/* Carousel transition options */}
          {mediaItems.length > 1 && (
            <div className="space-y-2 mt-1">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">{t("studioTransition")}</label>
                <div className="flex gap-1">
                  {([
                    { val: "fade" as CarouselTransition, label: t("studioTransFade") },
                    { val: "slide" as CarouselTransition, label: t("studioTransSlide") },
                    { val: "zoom" as CarouselTransition, label: t("studioTransZoom") },
                    { val: "none" as CarouselTransition, label: t("studioTransNone") },
                  ]).map(({ val, label }) => (
                    <Button key={val} variant={(content.carouselTransition || "fade") === val ? "default" : "outline"} size="sm" className="h-6 text-[10px] flex-1 px-1"
                      onClick={() => onUpdate({ ...content, carouselTransition: val })}>{label}</Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Unified multi-select picker */}
          {showContentPicker && (
            <div className="mt-2 border border-border rounded-md p-2 bg-card space-y-1.5">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  className="h-7 text-[11px] pl-7 pr-2"
                  placeholder={t("pickerSearchPlaceholder")}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                />
              </div>
              {/* Filter & Sort row */}
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5 flex-1">
                  {(["all", "image", "video", "widget"] as const).map((f) => (
                    <Button key={f} variant={pickerFilter === f ? "default" : "ghost"} size="sm"
                      className="h-5 text-[9px] px-1.5 flex-1"
                      onClick={() => setPickerFilter(f)}>
                      {t(`pickerFilter_${f}`)}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" title={t("pickerSort")}
                  onClick={() => {
                    const order: Array<typeof pickerSort> = ["name-asc", "name-desc", "newest", "oldest"];
                    setPickerSort(order[(order.indexOf(pickerSort) + 1) % order.length]);
                  }}>
                  {pickerSort === "name-asc" ? <ArrowDownAZ className="w-3 h-3" /> :
                   pickerSort === "name-desc" ? <ArrowUpAZ className="w-3 h-3" /> :
                   <ArrowUpDown className="w-3 h-3" />}
                </Button>
              </div>
              {/* Sort indicator */}
              <p className="text-[9px] text-muted-foreground">{t(`pickerSort_${pickerSort}`)}</p>
              {/* Items list */}
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {filteredPickerItems.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2">{t("mediaNoResult")}</p>
                ) : (
                  filteredPickerItems.map((item) => {
                    const isSelected = selectedPickerIds.has(item.id);
                    return (
                      <button key={item.id} className={`w-full flex items-center gap-2 p-1.5 rounded text-left text-xs transition-colors ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"}`}
                        onClick={() => togglePickerItem(item.id)}>
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {item.icon}
                        <span className="truncate text-foreground flex-1">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">{item.kind === "media" ? (item.type === "image" ? "IMG" : "VID") : "Widget"}</Badge>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="text-[10px] text-muted-foreground">
                  {t("studioSelectedCount").replace("{count}", String(selectedPickerIds.size))}
                </span>
                <Button size="sm" className="h-6 text-[10px] gap-1" disabled={selectedPickerIds.size === 0} onClick={confirmPickerSelection}>
                  <Check className="w-3 h-3" /> {t("studioConfirmAdd")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Text input */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("studioText")}</label>
          <Input placeholder={t("studioTextPlaceholder")} value={content.type === "text" ? content.value : ""} className="h-8 text-xs"
            onChange={(e) => onUpdate({ ...content, type: "text", value: e.target.value })} />
        </div>
        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{t("studioFontSize")}</label>
            <span className="text-xs font-medium text-foreground">{content.fontSize || 24}px</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdate({ ...content, fontSize: Math.max(12, (content.fontSize || 24) - 2) })}><Minus className="w-3 h-3" /></Button>
            <Slider value={[content.fontSize || 24]} min={12} max={72} step={2} onValueChange={([v]) => onUpdate({ ...content, fontSize: v })} className="flex-1" />
            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdate({ ...content, fontSize: Math.min(72, (content.fontSize || 24) + 2) })}><Plus className="w-3 h-3" /></Button>
          </div>
        </div>
        {/* Text align */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t("studioTextAlign")}</label>
          <div className="flex gap-1">
            {([{ val: "left" as const, icon: <AlignLeft className="w-3.5 h-3.5" /> }, { val: "center" as const, icon: <AlignCenter className="w-3.5 h-3.5" /> }, { val: "right" as const, icon: <AlignRight className="w-3.5 h-3.5" /> }]).map(({ val, icon }) => (
              <Button key={val} variant={(content.textAlign || "center") === val ? "default" : "outline"} size="sm" className="h-7 w-9 px-0" onClick={() => onUpdate({ ...content, textAlign: val })}>{icon}</Button>
            ))}
          </div>
        </div>
        {/* BG color */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("studioBgColor")}</label>
          <div className="flex gap-1.5 flex-wrap">
            <button className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform relative overflow-hidden" onClick={() => onUpdate({ ...content, bgColor: "transparent" })}
              style={{ background: "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)", backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px" }}>
              {(content.bgColor === "transparent" || !content.bgColor) && <div className="absolute inset-0 ring-2 ring-primary rounded-md" />}
            </button>
            {["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(220 14% 20%)", "hsl(0 0% 100%)", "hsl(280 60% 50%)", "hsl(190 70% 45%)"].map((c) => (
              <button key={c} className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform" style={{ background: c }} onClick={() => onUpdate({ ...content, bgColor: c })} />
            ))}
          </div>
        </div>
      </div>
  );

  if (isEmbedded) return innerContent;

  return (
    <Card className="absolute z-50 p-4 w-80 shadow-xl border border-border animate-scale-in max-h-[90%] overflow-y-auto" style={{ top: 8, right: 8 }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{t("studioEditZone")} {zone.label}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>
      {innerContent}
    </Card>
  );
}

// ── Animation wrapper for zone widgets ─────────────────────────────
const ZONE_ANIMATION_CSS: Record<string, string> = {
  none: "",
  fadeIn: "animate-[widgetFadeIn_0.8s_ease-out_both]",
  slideUp: "animate-[widgetSlideUp_0.6s_ease-out_both]",
  bounce: "animate-[widgetBounce_0.8s_ease-out_both]",
  zoomIn: "animate-[widgetZoomIn_0.5s_ease-out_both]",
  flipIn: "animate-[widgetFlipIn_0.7s_ease-out_both]",
};

function ZoneAnimatedWrapper({ animation, children }: { animation?: string; children: React.ReactNode }) {
  const anim = animation || "none";
  if (anim === "none") return <>{children}</>;
  return <div className={`w-full h-full ${ZONE_ANIMATION_CSS[anim] || ""}`}>{children}</div>;
}

// ── Widget Zone Preview ────────────────────────────────────────────
function WidgetZonePreview({ config }: { config: any }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (config?.widgetType === "clock" || config?.widgetType === "date") {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [config?.widgetType]);

  if (!config) return null;
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
            {[...Array(60)].map((_, i) => {
              const angle = (i * 6 - 90) * Math.PI / 180;
              const isH = i % 5 === 0;
              return <line key={i} x1={100 + (isH ? 86 : 89) * Math.cos(angle)} y1={100 + (isH ? 86 : 89) * Math.sin(angle)} x2={100 + 92 * Math.cos(angle)} y2={100 + 92 * Math.sin(angle)} stroke={fg} strokeWidth={isH ? 2 : 0.8} opacity={isH ? 0.6 : 0.3} />;
            })}
            <polygon points={`${100 + 45 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 + 45 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 + 5 * Math.cos(hDeg * Math.PI / 180)},${100 + 5 * Math.sin(hDeg * Math.PI / 180)} ${100 - 10 * Math.cos((hDeg - 90) * Math.PI / 180)},${100 - 10 * Math.sin((hDeg - 90) * Math.PI / 180)} ${100 - 5 * Math.cos(hDeg * Math.PI / 180)},${100 - 5 * Math.sin(hDeg * Math.PI / 180)}`} fill={fg} opacity="0.9" />
            <polygon points={`${100 + 65 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 + 65 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 + 4 * Math.cos(mDeg * Math.PI / 180)},${100 + 4 * Math.sin(mDeg * Math.PI / 180)} ${100 - 12 * Math.cos((mDeg - 90) * Math.PI / 180)},${100 - 12 * Math.sin((mDeg - 90) * Math.PI / 180)} ${100 - 4 * Math.cos(mDeg * Math.PI / 180)},${100 - 4 * Math.sin(mDeg * Math.PI / 180)}`} fill={fg} opacity="0.85" />
            <line x1={100 - 18 * Math.cos((sDeg - 90) * Math.PI / 180)} y1={100 - 18 * Math.sin((sDeg - 90) * Math.PI / 180)} x2={100 + 72 * Math.cos((sDeg - 90) * Math.PI / 180)} y2={100 + 72 * Math.sin((sDeg - 90) * Math.PI / 180)} stroke="hsl(0 70% 55%)" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="100" cy="100" r="5" fill={fg} />
            <circle cx="100" cy="100" r="2.5" fill="hsl(0 70% 55%)" />
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

// ── Main page ──────────────────────────────────────────────────────
export default function ContentStudioPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [zones, setZones] = useState<Zone[]>(LAYOUT_PRESETS[0].zones.map((z) => ({ ...z })));
  const [overlays, setOverlays] = useState<OverlayBlock[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<string>("layouts");

  // Project state
  const [currentProject, setCurrentProject] = useState<DesignProject | null>(null);
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  // DB media for picker
  const [dbMedia, setDbMedia] = useState<{ id: string; name: string; type: string; url: string; thumbnail: string; duration: string | null; created_at?: string }[]>([]);
  const [dbWidgets, setDbWidgets] = useState<{ id: string; name: string; url: string; created_at?: string }[]>([]);

  useEffect(() => {
    (supabase as any).from("media_items").select("id, name, type, url, thumbnail, duration, created_at").order("created_at", { ascending: false }).then((res: any) => {
      const all = res.data || [];
      setDbMedia(all.filter((m: any) => m.type !== "widget"));
      setDbWidgets(all.filter((m: any) => m.type === "widget"));
    });
  }, []);

  // Load projects list
  const loadProjects = useCallback(async () => {
    const { data } = await (supabase as any).from("design_projects").select("*").order("updated_at", { ascending: false });
    setProjects((data || []).map((d: any) => ({ ...d, zones: d.zones || [] })));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const W = aspect === "16:9" ? 960 : 540;
  const H = aspect === "16:9" ? 540 : 960;

  const applyLayout = useCallback((preset: LayoutPreset) => { setZones(preset.zones.map((z) => ({ ...z }))); setSelectedZone(null); }, []);
  const applyTemplate = useCallback((tpl: TemplateItem) => { setAspect(tpl.aspect); setZones(tpl.zones.map((z) => ({ ...z }))); setSelectedZone(null); }, []);
  const updateZoneContent = useCallback((zoneId: string, content: ZoneContent) => { setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, content } : z))); }, []);
  const updateOverlayContent = useCallback((overlayId: string, content: ZoneContent) => { setOverlays((prev) => prev.map((o) => (o.id === overlayId ? { ...o, content } : o))); }, []);

  // Overlay management
  const addOverlay = useCallback(() => {
    const id = `overlay-${Date.now()}`;
    const label = String.fromCharCode(65 + overlays.length); // A, B, C...
    setOverlays((prev) => [...prev, { id, x: 50, y: 50, w: 200, h: 120, label: `OV-${label}`, opacity: 100, zIndex: prev.length + 1, content: { type: "text", value: "", bgColor: "transparent", fontSize: 20, textColor: "hsl(0 0% 100%)" } }]);
  }, [overlays.length]);

  const deleteOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedOverlay === id) setSelectedOverlay(null);
  }, [selectedOverlay]);

  const moveOverlayLayer = useCallback((id: string, direction: "up" | "down") => {
    setOverlays((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((o) => o.id === id);
      if (direction === "up" && idx < sorted.length - 1) {
        const swapId = sorted[idx + 1].id;
        const myZ = sorted[idx].zIndex, otherZ = sorted[idx + 1].zIndex;
        return prev.map((o) => o.id === id ? { ...o, zIndex: otherZ } : o.id === swapId ? { ...o, zIndex: myZ } : o);
      }
      if (direction === "down" && idx > 0) {
        const swapId = sorted[idx - 1].id;
        const myZ = sorted[idx].zIndex, otherZ = sorted[idx - 1].zIndex;
        return prev.map((o) => o.id === id ? { ...o, zIndex: otherZ } : o.id === swapId ? { ...o, zIndex: myZ } : o);
      }
      return prev;
    });
  }, []);

  // Save project
  const handleSave = useCallback(async (name?: string) => {
    setSaving(true);
    const zonesData = JSON.parse(JSON.stringify([...zones.map(z => ({ ...z })), ...overlays.map(o => ({ ...o, _overlay: true }))]));
    const projectData = { name: name || currentProject?.name || "Untitled", aspect, zones: zonesData, created_by: user?.id, updated_at: new Date().toISOString() };
    try {
      if (currentProject) {
        await (supabase as any).from("design_projects").update({ name: projectData.name, aspect, zones: zonesData, updated_at: projectData.updated_at }).eq("id", currentProject.id);
        setCurrentProject({ ...currentProject, ...projectData, zones: zones, overlays });
        toast.success(t("studioProjectSaved"));
      } else {
        const { data } = await (supabase as any).from("design_projects").insert(projectData).select().single();
        if (data) { setCurrentProject({ ...data, zones, overlays }); toast.success(t("studioProjectSaved")); }
      }
      loadProjects();
    } catch { toast.error(t("studioProjectSaveFailed")); }
    setSaving(false);
    setShowSaveDialog(false);
  }, [currentProject, aspect, zones, overlays, user, t, loadProjects]);

  // Load project
  const handleLoad = useCallback((project: DesignProject) => {
    setCurrentProject(project);
    setAspect(project.aspect as AspectRatio);
    const allData = project.zones || [];
    const regularZones = allData.filter((z: any) => !(z as any)._overlay);
    const overlayData = allData.filter((z: any) => (z as any)._overlay).map((o: any) => { const { _overlay, ...rest } = o; return rest as OverlayBlock; });
    setZones(regularZones);
    setOverlays(overlayData);
    setSelectedZone(null);
    setSelectedOverlay(null);
    setShowLoadDialog(false);
    toast.success(t("studioProjectLoaded"));
  }, [t]);

  // Delete project
  const handleDelete = useCallback(async (id: string) => {
    await (supabase as any).from("design_projects").delete().eq("id", id);
    if (currentProject?.id === id) { setCurrentProject(null); }
    loadProjects();
    toast.success(t("studioProjectDeleted"));
  }, [currentProject, loadProjects, t]);

  // New project
  const handleNew = useCallback(() => {
    setCurrentProject(null);
    setZones(LAYOUT_PRESETS[0].zones.map((z) => ({ ...z })));
    setOverlays([]);
    setAspect("16:9");
    setSelectedZone(null);
    setSelectedOverlay(null);
  }, []);

  // Resize logic
  const canvasRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ zoneId: string; edge: "right" | "bottom"; startPos: number; startVal: number } | null>(null);

  const getAdjacentZones = useCallback((zone: Zone, edge: "right" | "bottom", allZones: Zone[]) => {
    if (edge === "right") { const re = zone.x + zone.w; return allZones.filter((z) => z.id !== zone.id && Math.abs(z.x - re) < 1 && z.y < zone.y + zone.h && z.y + z.h > zone.y); }
    const be = zone.y + zone.h; return allZones.filter((z) => z.id !== zone.id && Math.abs(z.y - be) < 1 && z.x < zone.x + zone.w && z.x + z.w > zone.x);
  }, []);

  const hasResizeHandle = useCallback((zone: Zone, edge: "right" | "bottom", allZones: Zone[]) => getAdjacentZones(zone, edge, allZones).length > 0, [getAdjacentZones]);

  const handleResizeStart = useCallback((e: React.MouseEvent, zoneId: string, edge: "right" | "bottom") => {
    e.stopPropagation(); e.preventDefault();
    const startPos = edge === "right" ? e.clientX : e.clientY;
    const zone = zones.find((z) => z.id === zoneId); if (!zone) return;
    const startVal = edge === "right" ? zone.w : zone.h;
    setResizing({ zoneId, edge, startPos, startVal });
    const canvasRect = canvasRef.current?.getBoundingClientRect(); if (!canvasRect) return;
    const canvasSize = edge === "right" ? canvasRect.width : canvasRect.height;
    const onMove = (ev: MouseEvent) => {
      const delta = edge === "right" ? ev.clientX - startPos : ev.clientY - startPos;
      const deltaPercent = (delta / canvasSize) * 100;
      const diff = Math.max(10, Math.min(90, startVal + deltaPercent)) - startVal;
      setZones((prev) => {
        const cz = prev.find((z) => z.id === zoneId)!;
        const adj = getAdjacentZones(cz, edge, prev);
        if (!adj.length) return prev;
        return prev.map((z) => {
          if (z.id === zoneId) return edge === "right" ? { ...z, w: startVal + diff } : { ...z, h: startVal + diff };
          if (adj.some((a) => a.id === z.id)) {
            if (edge === "right") { const oX = cz.x + startVal; return { ...z, x: cz.x + startVal + diff, w: Math.max(10, z.x + z.w - oX - diff) }; }
            const oY = cz.y + startVal; return { ...z, y: cz.y + startVal + diff, h: Math.max(10, z.y + z.h - oY - diff) };
          }
          return z;
        });
      });
    };
    const onUp = () => { setResizing(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [zones, getAdjacentZones]);

  // Overlay drag logic
  const handleOverlayDragStart = useCallback((e: React.MouseEvent, overlayId: string) => {
    e.stopPropagation(); e.preventDefault();
    const overlay = overlays.find((o) => o.id === overlayId);
    if (!overlay) return;
    const startX = e.clientX, startY = e.clientY;
    const origX = overlay.x, origY = overlay.y;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const newX = Math.max(0, Math.min(canvasRect.width - overlay.w, origX + dx));
      const newY = Math.max(0, Math.min(canvasRect.height - overlay.h, origY + dy));
      setOverlays((prev) => prev.map((o) => o.id === overlayId ? { ...o, x: newX, y: newY } : o));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [overlays]);

  // Overlay resize logic
  const handleOverlayResizeStart = useCallback((e: React.MouseEvent, overlayId: string, corner: string) => {
    e.stopPropagation(); e.preventDefault();
    const overlay = overlays.find((o) => o.id === overlayId);
    if (!overlay) return;
    const startX = e.clientX, startY = e.clientY;
    const origW = overlay.w, origH = overlay.h;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const newW = Math.max(60, Math.min(canvasRect.width - overlay.x, origW + dx));
      const newH = Math.max(40, Math.min(canvasRect.height - overlay.y, origH + dy));
      setOverlays((prev) => prev.map((o) => o.id === overlayId ? { ...o, w: newW, h: newH } : o));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [overlays]);

  const activeZone = zones.find((z) => z.id === selectedZone);
  const activeOverlay = overlays.find((o) => o.id === selectedOverlay);
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("studioTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentProject ? currentProject.name : t("studioSubtitle")}
              {currentProject && <Badge variant="secondary" className="ml-2 text-[10px]">{t("studioEditing")}</Badge>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Project actions */}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={handleNew}><FilePlus className="w-3.5 h-3.5" /> {t("studioNew")}</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowLoadDialog(true)}><FolderOpen className="w-3.5 h-3.5" /> {t("studioOpen")}</Button>
          <Button variant="default" size="sm" className="gap-1.5 text-xs h-8" onClick={() => { if (currentProject) handleSave(); else { setProjectName(""); setShowSaveDialog(true); } }} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> {t("save")}
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          {/* Aspect toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant={aspect === "16:9" ? "default" : "ghost"} size="sm" className="gap-1.5 text-xs h-7" onClick={() => setAspect("16:9")}>
              <Monitor className="w-3.5 h-3.5" /> 16:9
            </Button>
            <Button variant={aspect === "9:16" ? "default" : "ghost"} size="sm" className="gap-1.5 text-xs h-7" onClick={() => setAspect("9:16")}>
              <Smartphone className="w-3.5 h-3.5" /> 9:16
            </Button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={addOverlay}>
            <Layers className="w-3.5 h-3.5" /> {t("studioAddOverlay")}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 flex flex-col min-h-0">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex flex-col min-h-0 h-full">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="layouts" className="flex-1 text-xs">{t("studioLayouts")}</TabsTrigger>
              <TabsTrigger value="templates" className="flex-1 text-xs">{t("studioTemplates")}</TabsTrigger>
              <TabsTrigger value="projects" className="flex-1 text-xs">{t("studioProjects")}</TabsTrigger>
            </TabsList>

            <TabsContent value="layouts" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {LAYOUT_PRESETS.map((lp) => (
                <button key={lp.id} onClick={() => applyLayout(lp)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left group">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">{lp.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(lp.nameKey as any)}</p>
                    <p className="text-[11px] text-muted-foreground">{lp.zones.length} {t("studioZones")}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </TabsContent>

            <TabsContent value="templates" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left group">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-white" style={{ background: tpl.color }}>{tpl.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(tpl.nameKey as any)}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tpl.aspect}</Badge>
                      <span className="text-[11px] text-muted-foreground">{tpl.zones.length} {t("studioZones")}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">{t("studioNoProjects")}</p>
                </div>
              ) : projects.map((p) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group ${currentProject?.id === p.id ? "border-primary" : "border-border"}`}>
                  <button className="flex-1 text-left" onClick={() => handleLoad(p)}>
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.aspect}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl border border-border relative overflow-hidden min-h-0">
          <div ref={canvasRef} className={`relative bg-card rounded-lg shadow-lg border border-border overflow-hidden ${resizing ? "" : "transition-all duration-300"}`} style={{ width: W, height: H, maxWidth: "100%", maxHeight: "100%" }}
            onClick={() => { if (selectedOverlay) setSelectedOverlay(null); }}>
            {zones.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const bg = zone.content?.bgColor || "hsl(var(--muted))";
              const mediaItems = zone.content?.mediaItems || [];
              return (
                <div key={zone.id}
                  className={`absolute cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${isSelected ? "ring-2 ring-primary ring-offset-1 z-10" : "hover:ring-1 hover:ring-primary/40"}`}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%`, background: bg }}
                  onClick={() => { setSelectedOverlay(null); setSelectedZone(isSelected ? null : zone.id); }}
                >
                  {/* Content render */}
                  {zone.content?.type === "widget" && zone.content.widgetConfig ? (
                    <ZoneAnimatedWrapper animation={zone.content.widgetConfig.animation}>
                      <WidgetZonePreview config={zone.content.widgetConfig} />
                    </ZoneAnimatedWrapper>
                  ) : zone.content?.type === "media" && mediaItems.length > 0 ? (
                    <CarouselPreview items={mediaItems} transition={zone.content.carouselTransition || "fade"} />
                  ) : zone.content?.type === "text" && zone.content.value ? (
                    <div className="p-3 w-full" style={{ color: zone.content.textColor || "hsl(0 0% 100%)", fontSize: Math.min(zone.content.fontSize || 24, 52), textAlign: zone.content.textAlign || "center" }}>
                      <span className="font-bold leading-tight whitespace-pre-line">{zone.content.value}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-medium">{zone.label}</span>
                    </div>
                  )}

                  <span className="absolute top-1.5 left-1.5 bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 rounded">{zone.label}</span>

                  {hasResizeHandle(zone, "right", zones) && (
                    <div className="absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 group/handle hover:bg-primary/30 transition-colors" onMouseDown={(e) => handleResizeStart(e, zone.id, "right")}>
                      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full bg-primary/60 opacity-0 group-hover/handle:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {hasResizeHandle(zone, "bottom", zones) && (
                    <div className="absolute bottom-0 left-0 h-2 w-full cursor-row-resize z-20 group/handle hover:bg-primary/30 transition-colors" onMouseDown={(e) => handleResizeStart(e, zone.id, "bottom")}>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary/60 opacity-0 group-hover/handle:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Overlay blocks */}
            {overlays.map((overlay) => {
              const isSelected = selectedOverlay === overlay.id;
              const bg = overlay.content?.bgColor || "transparent";
              const mediaItems = overlay.content?.mediaItems || [];
              return (
                <div key={overlay.id}
                  className={`absolute flex items-center justify-center overflow-hidden rounded-lg ${overlay.locked ? "cursor-default" : "cursor-move"} ${isSelected ? "ring-2 ring-accent-foreground ring-offset-1" : "hover:ring-1 hover:ring-accent-foreground/50"}`}
                  style={{ left: overlay.x, top: overlay.y, width: overlay.w, height: overlay.h, background: bg, opacity: (overlay.opacity ?? 100) / 100, zIndex: 30 + (overlay.zIndex ?? 0) + (isSelected ? 10 : 0) }}
                  onClick={(e) => { e.stopPropagation(); setSelectedZone(null); setSelectedOverlay(isSelected ? null : overlay.id); }}
                  onMouseDown={(e) => { if (overlay.locked) return; if ((e.target as HTMLElement).dataset.resize) return; handleOverlayDragStart(e, overlay.id); }}
                >
                  {/* Content render */}
                  {overlay.content?.type === "widget" && overlay.content.widgetConfig ? (
                    <ZoneAnimatedWrapper animation={overlay.content.widgetConfig.animation}>
                      <WidgetZonePreview config={overlay.content.widgetConfig} />
                    </ZoneAnimatedWrapper>
                  ) : overlay.content?.type === "media" && mediaItems.length > 0 ? (
                    <CarouselPreview items={mediaItems} transition={overlay.content.carouselTransition || "fade"} />
                  ) : overlay.content?.type === "text" && overlay.content.value ? (
                    <div className="p-2 w-full" style={{ color: overlay.content.textColor || "hsl(0 0% 100%)", fontSize: Math.min(overlay.content.fontSize || 20, 40), textAlign: overlay.content.textAlign || "center" }}>
                      <span className="font-bold leading-tight whitespace-pre-line">{overlay.content.value}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-white/60">
                      <Move className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{overlay.label}</span>
                    </div>
                  )}

                  {/* Label badge */}
                  <span className="absolute top-1 left-1 bg-accent-foreground/80 text-background text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                    {overlay.locked ? <Lock className="w-2.5 h-2.5" /> : <Layers className="w-2.5 h-2.5" />} {overlay.label}
                  </span>

                  {/* Delete button */}
                  {isSelected && (
                    <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-5 w-5 z-50" onClick={(e) => { e.stopPropagation(); deleteOverlay(overlay.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}

                  {/* Resize handle bottom-right */}
                  {!overlay.locked && (
                    <div data-resize="true" className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end"
                      onMouseDown={(e) => handleOverlayResizeStart(e, overlay.id, "se")}>
                      <Maximize2 className="w-3 h-3 text-white/60 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}

            {activeZone && (
              <ZoneEditor zone={activeZone} onUpdate={(content) => updateZoneContent(activeZone.id, content)} onClose={() => setSelectedZone(null)} dbMedia={dbMedia} dbWidgets={dbWidgets} />
            )}
            {activeOverlay && (
              <Card className="absolute z-50 p-4 w-80 shadow-xl border border-border animate-scale-in max-h-[90%] overflow-y-auto" style={{ top: 8, right: 8 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{t("studioEditOverlay")} {activeOverlay.label}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedOverlay(null)}><X className="w-3.5 h-3.5" /></Button>
                </div>
                {/* Lock toggle */}
                <div className="mb-3">
                  <Button variant={activeOverlay.locked ? "default" : "outline"} size="sm" className="w-full h-7 text-xs gap-1.5"
                    onClick={() => setOverlays((prev) => prev.map((o) => o.id === activeOverlay.id ? { ...o, locked: !o.locked } : o))}>
                    {activeOverlay.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {activeOverlay.locked ? t("studioLocked") : t("studioUnlocked")}
                  </Button>
                </div>
                {/* Opacity slider */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground">{t("studioOpacity")}</label>
                    <span className="text-xs font-medium text-foreground">{activeOverlay.opacity ?? 100}%</span>
                  </div>
                  <Slider value={[activeOverlay.opacity ?? 100]} min={10} max={100} step={5} onValueChange={([v]) => setOverlays((prev) => prev.map((o) => o.id === activeOverlay.id ? { ...o, opacity: v } : o))} />
                </div>
                {/* Layer order */}
                {overlays.length > 1 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">{t("studioLayerOrder")}</label>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => moveOverlayLayer(activeOverlay.id, "down")}>
                          <ChevronLeft className="w-3 h-3" /> {t("studioLayerDown")}
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => moveOverlayLayer(activeOverlay.id, "up")}>
                          {t("studioLayerUp")} <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Reuse ZoneEditor content inline - delegate to ZoneEditor */}
                <ZoneEditor zone={{ id: activeOverlay.id, x: 0, y: 0, w: 100, h: 100, label: activeOverlay.label, content: activeOverlay.content }} onUpdate={(content) => updateOverlayContent(activeOverlay.id, content)} onClose={() => setSelectedOverlay(null)} dbMedia={dbMedia} dbWidgets={dbWidgets} isEmbedded />
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("studioSaveProject")}</DialogTitle>
            <DialogDescription>{t("studioSaveDesc")}</DialogDescription>
          </DialogHeader>
          <Input placeholder={t("studioProjectNamePlaceholder")} value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-2" autoFocus />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>{t("cancel")}</Button>
            <Button onClick={() => handleSave(projectName)} disabled={!projectName.trim() || saving}><Save className="w-4 h-4 mr-1.5" /> {t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("studioOpenProject")}</DialogTitle>
            <DialogDescription>{t("studioOpenDesc")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("studioNoProjects")}</p>
            ) : projects.map((p) => (
              <button key={p.id} onClick={() => handleLoad(p)} className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.aspect} · {new Date(p.updated_at).toLocaleString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
