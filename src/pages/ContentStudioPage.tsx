import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Monitor, Smartphone, LayoutGrid, Columns2, Rows2, Square,
  Type, ImageIcon, Film, Palette, Upload, Trash2, ChevronRight,
  Utensils, PartyPopper, ShoppingBag, Sun, Gift, Coffee,
  X, GripVertical, Plus, AlignLeft, AlignCenter, AlignRight, Minus
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

// ── Types ──────────────────────────────────────────────────────────
type AspectRatio = "16:9" | "9:16";

interface Zone {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  content?: ZoneContent;
}

interface ZoneContent {
  type: "text" | "image" | "video" | "color";
  value: string;
  bgColor?: string;
  fontSize?: number;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
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
  {
    id: "full",
    nameKey: "studioLayoutFull",
    icon: <Square className="w-4 h-4" />,
    zones: [{ id: "z1", x: 0, y: 0, w: 100, h: 100, label: "A" }],
  },
  {
    id: "lr",
    nameKey: "studioLayoutLR",
    icon: <Columns2 className="w-4 h-4" />,
    zones: [
      { id: "z1", x: 0, y: 0, w: 50, h: 100, label: "A" },
      { id: "z2", x: 50, y: 0, w: 50, h: 100, label: "B" },
    ],
  },
  {
    id: "tb",
    nameKey: "studioLayoutTB",
    icon: <Rows2 className="w-4 h-4" />,
    zones: [
      { id: "z1", x: 0, y: 0, w: 100, h: 75, label: "A" },
      { id: "z2", x: 0, y: 75, w: 100, h: 25, label: "B" },
    ],
  },
  {
    id: "grid",
    nameKey: "studioLayoutGrid",
    icon: <LayoutGrid className="w-4 h-4" />,
    zones: [
      { id: "z1", x: 0, y: 0, w: 50, h: 50, label: "A" },
      { id: "z2", x: 50, y: 0, w: 50, h: 50, label: "B" },
      { id: "z3", x: 0, y: 50, w: 50, h: 50, label: "C" },
      { id: "z4", x: 50, y: 50, w: 50, h: 50, label: "D" },
    ],
  },
];

// ── Template library ───────────────────────────────────────────────
const TEMPLATES: TemplateItem[] = [
  {
    id: "t-food",
    nameKey: "studioTplFood",
    icon: <Utensils className="w-5 h-5" />,
    color: "hsl(15 80% 55%)",
    aspect: "16:9",
    zones: [
      { id: "z1", x: 0, y: 0, w: 60, h: 100, label: "A", content: { type: "color", value: "", bgColor: "hsl(15 80% 55%)" } },
      { id: "z2", x: 60, y: 0, w: 40, h: 60, label: "B", content: { type: "text", value: "🍕 今日特餐 50% OFF", fontSize: 28, textColor: "hsl(0 0% 100%)", bgColor: "hsl(15 70% 45%)" } },
      { id: "z3", x: 60, y: 60, w: 40, h: 40, label: "C", content: { type: "text", value: "限時優惠", fontSize: 20, textColor: "hsl(0 0% 100%)", bgColor: "hsl(15 60% 35%)" } },
    ],
  },
  {
    id: "t-holiday",
    nameKey: "studioTplHoliday",
    icon: <PartyPopper className="w-5 h-5" />,
    color: "hsl(340 75% 55%)",
    aspect: "16:9",
    zones: [
      { id: "z1", x: 0, y: 0, w: 100, h: 70, label: "A", content: { type: "text", value: "🎉 新年快樂！", fontSize: 48, textColor: "hsl(45 100% 60%)", bgColor: "hsl(340 75% 50%)" } },
      { id: "z2", x: 0, y: 70, w: 100, h: 30, label: "B", content: { type: "text", value: "全館消費滿千送百 🧧", fontSize: 22, textColor: "hsl(0 0% 100%)", bgColor: "hsl(340 65% 40%)" } },
    ],
  },
  {
    id: "t-newproduct",
    nameKey: "studioTplNew",
    icon: <ShoppingBag className="w-5 h-5" />,
    color: "hsl(210 80% 55%)",
    aspect: "9:16",
    zones: [
      { id: "z1", x: 0, y: 0, w: 100, h: 55, label: "A", content: { type: "color", value: "", bgColor: "hsl(210 80% 55%)" } },
      { id: "z2", x: 0, y: 55, w: 100, h: 25, label: "B", content: { type: "text", value: "✨ 新品上市", fontSize: 36, textColor: "hsl(0 0% 100%)", bgColor: "hsl(210 70% 45%)" } },
      { id: "z3", x: 0, y: 80, w: 100, h: 20, label: "C", content: { type: "text", value: "即日起限量發售", fontSize: 18, textColor: "hsl(210 20% 90%)", bgColor: "hsl(210 60% 35%)" } },
    ],
  },
  {
    id: "t-summer",
    nameKey: "studioTplSummer",
    icon: <Sun className="w-5 h-5" />,
    color: "hsl(38 90% 55%)",
    aspect: "16:9",
    zones: [
      { id: "z1", x: 0, y: 0, w: 100, h: 100, label: "A", content: { type: "text", value: "☀️ 夏日祭典\n冰品買一送一", fontSize: 40, textColor: "hsl(0 0% 100%)", bgColor: "hsl(38 85% 50%)" } },
    ],
  },
  {
    id: "t-gift",
    nameKey: "studioTplGift",
    icon: <Gift className="w-5 h-5" />,
    color: "hsl(280 60% 55%)",
    aspect: "16:9",
    zones: [
      { id: "z1", x: 0, y: 0, w: 50, h: 100, label: "A", content: { type: "color", value: "", bgColor: "hsl(280 60% 50%)" } },
      { id: "z2", x: 50, y: 0, w: 50, h: 100, label: "B", content: { type: "text", value: "🎁 禮品卡\n滿額贈送", fontSize: 32, textColor: "hsl(0 0% 100%)", bgColor: "hsl(280 50% 40%)" } },
    ],
  },
  {
    id: "t-coffee",
    nameKey: "studioTplCoffee",
    icon: <Coffee className="w-5 h-5" />,
    color: "hsl(25 60% 40%)",
    aspect: "9:16",
    zones: [
      { id: "z1", x: 0, y: 0, w: 100, h: 40, label: "A", content: { type: "text", value: "☕", fontSize: 72, textColor: "hsl(25 30% 90%)", bgColor: "hsl(25 50% 30%)" } },
      { id: "z2", x: 0, y: 40, w: 100, h: 35, label: "B", content: { type: "text", value: "手沖咖啡\n第二杯半價", fontSize: 28, textColor: "hsl(0 0% 100%)", bgColor: "hsl(25 55% 35%)" } },
      { id: "z3", x: 0, y: 75, w: 100, h: 25, label: "C", content: { type: "text", value: "每日 14:00-17:00", fontSize: 18, textColor: "hsl(25 20% 80%)", bgColor: "hsl(25 40% 25%)" } },
    ],
  },
];

// ── Zone Editor Popover ────────────────────────────────────────────
function ZoneEditor({
  zone,
  onUpdate,
  onClose,
}: {
  zone: Zone;
  onUpdate: (content: ZoneContent) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const content = zone.content || { type: "color" as const, value: "", bgColor: "hsl(var(--muted))" };

  return (
    <Card className="absolute z-50 p-4 w-72 shadow-xl border border-border animate-scale-in" style={{ top: 8, right: 8 }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{t("studioEditZone")} {zone.label}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-3.5 h-3.5" /></Button>
      </div>
      <div className="space-y-3">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline" size="sm" className="justify-start gap-2 text-xs"
            onClick={() => onUpdate({ type: "image", value: "uploaded-image", bgColor: content.bgColor })}
          >
            <ImageIcon className="w-3.5 h-3.5" /> {t("studioUploadImage")}
          </Button>
          <Button
            variant="outline" size="sm" className="justify-start gap-2 text-xs"
            onClick={() => onUpdate({ type: "video", value: "uploaded-video", bgColor: content.bgColor })}
          >
            <Film className="w-3.5 h-3.5" /> {t("studioUploadVideo")}
          </Button>
        </div>
        {/* Text input */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("studioText")}</label>
          <Input
            placeholder={t("studioTextPlaceholder")}
            value={content.type === "text" ? content.value : ""}
            className="h-8 text-xs"
            onChange={(e) => onUpdate({ ...content, type: "text", value: e.target.value })}
          />
        </div>
        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{t("studioFontSize")}</label>
            <span className="text-xs font-medium text-foreground">{content.fontSize || 24}px</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdate({ ...content, fontSize: Math.max(12, (content.fontSize || 24) - 2) })}>
              <Minus className="w-3 h-3" />
            </Button>
            <Slider
              value={[content.fontSize || 24]}
              min={12} max={72} step={2}
              onValueChange={([v]) => onUpdate({ ...content, fontSize: v })}
              className="flex-1"
            />
            <Button variant="outline" size="icon" className="h-6 w-6 shrink-0" onClick={() => onUpdate({ ...content, fontSize: Math.min(72, (content.fontSize || 24) + 2) })}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {/* Text align */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t("studioTextAlign")}</label>
          <div className="flex gap-1">
            {([
              { val: "left" as const, icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { val: "center" as const, icon: <AlignCenter className="w-3.5 h-3.5" /> },
              { val: "right" as const, icon: <AlignRight className="w-3.5 h-3.5" /> },
            ]).map(({ val, icon }) => (
              <Button
                key={val}
                variant={(content.textAlign || "center") === val ? "default" : "outline"}
                size="sm"
                className="h-7 w-9 px-0"
                onClick={() => onUpdate({ ...content, textAlign: val })}
              >
                {icon}
              </Button>
            ))}
          </div>
        </div>
        {/* BG color */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("studioBgColor")}</label>
          <div className="flex gap-1.5 flex-wrap">
            {[
              "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))",
              "hsl(var(--success))", "hsl(220 14% 20%)", "hsl(0 0% 100%)",
              "hsl(280 60% 50%)", "hsl(190 70% 45%)",
            ].map((c) => (
              <button
                key={c}
                className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform"
                style={{ background: c }}
                onClick={() => onUpdate({ ...content, bgColor: c })}
              />
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
  const [aspect, setAspect] = useState<AspectRatio>("16:9");
  const [zones, setZones] = useState<Zone[]>(LAYOUT_PRESETS[0].zones.map((z) => ({ ...z })));
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<string>("layouts");

  // Canvas dimensions at design time (virtual px)
  const W = aspect === "16:9" ? 960 : 540;
  const H = aspect === "16:9" ? 540 : 960;

  const applyLayout = useCallback((preset: LayoutPreset) => {
    setZones(preset.zones.map((z) => ({ ...z })));
    setSelectedZone(null);
  }, []);

  const applyTemplate = useCallback((tpl: TemplateItem) => {
    setAspect(tpl.aspect);
    setZones(tpl.zones.map((z) => ({ ...z })));
    setSelectedZone(null);
  }, []);

  const updateZoneContent = useCallback((zoneId: string, content: ZoneContent) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, content } : z)));
  }, []);

  const activeZone = zones.find((z) => z.id === selectedZone);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("studioTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("studioSubtitle")}</p>
        </div>
        {/* Aspect toggle */}
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={aspect === "16:9" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setAspect("16:9")}
          >
            <Monitor className="w-3.5 h-3.5" /> {t("studioLandscape")}
          </Button>
          <Button
            variant={aspect === "9:16" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setAspect("9:16")}
          >
            <Smartphone className="w-3.5 h-3.5" /> {t("studioPortrait")}
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
            </TabsList>

            <TabsContent value="layouts" className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {LAYOUT_PRESETS.map((lp) => (
                <button
                  key={lp.id}
                  onClick={() => applyLayout(lp)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    {lp.icon}
                  </div>
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
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-white" style={{ background: tpl.color }}>
                    {tpl.icon}
                  </div>
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
          </Tabs>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl border border-border relative overflow-hidden min-h-0">
          <div
            className="relative bg-card rounded-lg shadow-lg border border-border overflow-hidden transition-all duration-300"
            style={{ width: W, height: H, maxWidth: "100%", maxHeight: "100%" }}
          >
            {zones.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const bg = zone.content?.bgColor || "hsl(var(--muted))";
              return (
                <div
                  key={zone.id}
                  className={`absolute cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden ${
                    isSelected ? "ring-2 ring-primary ring-offset-1 z-10" : "hover:ring-1 hover:ring-primary/40"
                  }`}
                  style={{
                    left: `${zone.x}%`, top: `${zone.y}%`,
                    width: `${zone.w}%`, height: `${zone.h}%`,
                    background: bg,
                  }}
                  onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                >
                  {/* Content render */}
                  {zone.content?.type === "text" && zone.content.value ? (
                    <div className="p-3 w-full" style={{ color: zone.content.textColor || "hsl(0 0% 100%)", fontSize: Math.min(zone.content.fontSize || 24, 52), textAlign: zone.content.textAlign || "center" }}>
                      <span className="font-bold leading-tight whitespace-pre-line">{zone.content.value}</span>
                    </div>
                  ) : zone.content?.type === "image" ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                      <span className="text-xs opacity-60">{t("image")}</span>
                    </div>
                  ) : zone.content?.type === "video" ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Film className="w-8 h-8 opacity-50" />
                      <span className="text-xs opacity-60">{t("video")}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                      <Plus className="w-6 h-6" />
                      <span className="text-xs font-medium">{zone.label}</span>
                    </div>
                  )}

                  {/* Zone label badge */}
                  <span className="absolute top-1.5 left-1.5 bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {zone.label}
                  </span>
                </div>
              );
            })}

            {/* Zone editor popover */}
            {activeZone && (
              <ZoneEditor
                zone={activeZone}
                onUpdate={(content) => updateZoneContent(activeZone.id, content)}
                onClose={() => setSelectedZone(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
