import { useState, useCallback, useRef, useEffect } from "react";
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
  Layers
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
type AspectRatio = "16:9" | "9:16";

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  name: string;
  duration?: number; // seconds for carousel auto-advance
}

interface ZoneContent {
  type: "text" | "media" | "color";
  value: string;
  bgColor?: string;
  fontSize?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  mediaItems?: MediaItem[];
  carouselInterval?: number; // seconds
}

interface Zone {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  content?: ZoneContent;
}

interface DesignProject {
  id: string;
  name: string;
  aspect: AspectRatio;
  zones: Zone[];
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
function CarouselPreview({ items, interval = 3 }: { items: MediaItem[]; interval?: number }) {
  const [idx, setIdx] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % items.length), interval * 1000);
    return () => clearInterval(timer);
  }, [items.length, interval]);

  if (items.length === 0) return null;
  const item = items[idx];

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {item.type === "image" ? (
        item.url.startsWith("data:") || item.url.startsWith("http") ? (
          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <span className="text-[10px] opacity-60 truncate max-w-[80%]">{item.name}</span>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Film className="w-8 h-8 opacity-50" />
          <span className="text-[10px] opacity-60 truncate max-w-[80%]">{item.name}</span>
        </div>
      )}
      {items.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {items.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Zone Editor ────────────────────────────────────────────────────
function ZoneEditor({ zone, onUpdate, onClose, dbMedia }: {
  zone: Zone;
  onUpdate: (content: ZoneContent) => void;
  onClose: () => void;
  dbMedia: { id: string; name: string; type: string; url: string; thumbnail: string }[];
}) {
  const { t } = useLanguage();
  const content: ZoneContent = zone.content || { type: "color", value: "", bgColor: "hsl(var(--muted))" };
  const mediaItems = content.mediaItems || [];
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const addMedia = (m: typeof dbMedia[0]) => {
    const newItem: MediaItem = { id: m.id, type: m.type as "image" | "video", url: m.thumbnail || m.url, name: m.name, duration: 5 };
    onUpdate({ ...content, type: "media", mediaItems: [...mediaItems, newItem] });
  };

  const removeMedia = (id: string) => {
    const updated = mediaItems.filter((m) => m.id !== id);
    onUpdate({ ...content, mediaItems: updated, type: updated.length > 0 ? "media" : "color" });
  };

  return (
    <Card className="absolute z-50 p-4 w-80 shadow-xl border border-border animate-scale-in max-h-[90%] overflow-y-auto" style={{ top: 8, right: 8 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{t("studioEditZone")} {zone.label}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>
      <div className="space-y-3">
        {/* Media carousel section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> {t("studioMediaCarousel")}</label>
            <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setShowMediaPicker(!showMediaPicker)}>
              <Plus className="w-3 h-3" /> {t("add")}
            </Button>
          </div>
          {mediaItems.length > 0 && (
            <div className="space-y-1 mb-2">
              {mediaItems.map((m, i) => (
                <div key={m.id + i} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50 text-xs">
                  {m.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="truncate flex-1 text-foreground">{m.name}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeMedia(m.id)}><X className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          )}
          {mediaItems.length > 1 && (
            <div className="flex items-center gap-2 mt-1">
              <label className="text-[11px] text-muted-foreground whitespace-nowrap">{t("studioInterval")}</label>
              <Slider value={[content.carouselInterval || 3]} min={1} max={15} step={1} onValueChange={([v]) => onUpdate({ ...content, carouselInterval: v })} className="flex-1" />
              <span className="text-[11px] font-medium text-foreground w-6 text-right">{content.carouselInterval || 3}s</span>
            </div>
          )}
          {showMediaPicker && (
            <div className="mt-2 border border-border rounded-md p-2 bg-card max-h-32 overflow-y-auto space-y-1">
              {dbMedia.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-2">{t("mediaNoResult")}</p>
              ) : dbMedia.map((m) => (
                <button key={m.id} className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted transition-colors text-left text-xs" onClick={() => { addMedia(m); setShowMediaPicker(false); }}>
                  {m.type === "image" ? <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" /> : <Film className="w-3.5 h-3.5 text-primary shrink-0" />}
                  <span className="truncate text-foreground">{m.name}</span>
                </button>
              ))}
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
            {["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(220 14% 20%)", "hsl(0 0% 100%)", "hsl(280 60% 50%)", "hsl(190 70% 45%)"].map((c) => (
              <button key={c} className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform" style={{ background: c }} onClick={() => onUpdate({ ...content, bgColor: c })} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function ContentStudioPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [zones, setZones] = useState<Zone[]>(LAYOUT_PRESETS[0].zones.map((z) => ({ ...z })));
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<string>("layouts");

  // Project state
  const [currentProject, setCurrentProject] = useState<DesignProject | null>(null);
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  // DB media for picker
  const [dbMedia, setDbMedia] = useState<{ id: string; name: string; type: string; url: string; thumbnail: string }[]>([]);

  useEffect(() => {
    (supabase as any).from("media_items").select("id, name, type, url, thumbnail").order("created_at", { ascending: false }).then((res: any) => {
      setDbMedia(res.data || []);
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

  // Save project
  const handleSave = useCallback(async (name?: string) => {
    setSaving(true);
    const projectData = { name: name || currentProject?.name || "Untitled", aspect, zones, created_by: user?.id, updated_at: new Date().toISOString() };
    try {
      if (currentProject) {
        await (supabase as any).from("design_projects").update({ name: projectData.name, aspect, zones, updated_at: projectData.updated_at }).eq("id", currentProject.id);
        setCurrentProject({ ...currentProject, ...projectData });
        toast.success(t("studioProjectSaved"));
      } else {
        const { data } = await (supabase as any).from("design_projects").insert(projectData).select().single();
        if (data) { setCurrentProject(data); toast.success(t("studioProjectSaved")); }
      }
      loadProjects();
    } catch { toast.error(t("studioProjectSaveFailed")); }
    setSaving(false);
    setShowSaveDialog(false);
  }, [currentProject, aspect, zones, user, t, loadProjects]);

  // Load project
  const handleLoad = useCallback((project: DesignProject) => {
    setCurrentProject(project);
    setAspect(project.aspect as AspectRatio);
    setZones(project.zones);
    setSelectedZone(null);
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
    setAspect("16:9");
    setSelectedZone(null);
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

  const activeZone = zones.find((z) => z.id === selectedZone);

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
          <div ref={canvasRef} className={`relative bg-card rounded-lg shadow-lg border border-border overflow-hidden ${resizing ? "" : "transition-all duration-300"}`} style={{ width: W, height: H, maxWidth: "100%", maxHeight: "100%" }}>
            {zones.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const bg = zone.content?.bgColor || "hsl(var(--muted))";
              const mediaItems = zone.content?.mediaItems || [];
              return (
                <div key={zone.id}
                  className={`absolute cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${isSelected ? "ring-2 ring-primary ring-offset-1 z-10" : "hover:ring-1 hover:ring-primary/40"}`}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%`, background: bg }}
                  onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                >
                  {/* Content render */}
                  {zone.content?.type === "media" && mediaItems.length > 0 ? (
                    <CarouselPreview items={mediaItems} interval={zone.content.carouselInterval || 3} />
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

            {activeZone && (
              <ZoneEditor zone={activeZone} onUpdate={(content) => updateZoneContent(activeZone.id, content)} onClose={() => setSelectedZone(null)} dbMedia={dbMedia} />
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
