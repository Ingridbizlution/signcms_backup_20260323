import { useState, useEffect, useMemo } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrgs } from "@/hooks/useUserOrgs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarClock, Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown,
  Play, Clock, Monitor, FileImage, FileVideo, X, Loader2, Layers, Code2, Building2,
} from "lucide-react";
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
import { logActivity } from "@/lib/activityLogger";

type PlaylistItemType = "media" | "design_project" | "widget";

interface PlaylistItem {
  id: string;
  media_id: string | null;
  design_project_id: string | null;
  item_type: PlaylistItemType;
  item_name: string;
  item_sub_type: "image" | "video" | "design" | "widget";
  duration: number;
  sort_order: number;
}

interface Schedule {
  id: string;
  name: string;
  org_id: string | null;
  screen_id: string;
  screen_label: string;
  start_time: string;
  end_time: string;
  days: string[];
  enabled: boolean;
  items: PlaylistItem[];
}

interface ScreenOption { id: string; label: string; }
interface MediaOption { id: string; name: string; type: "image" | "video" | "widget"; }
interface DesignProjectOption { id: string; name: string; aspect: string; }
interface WidgetOption { id: string; name: string; }

interface FormPlaylistItem {
  tempId: number;
  media_id: string | null;
  design_project_id: string | null;
  item_type: PlaylistItemType;
  item_name: string;
  item_sub_type: "image" | "video" | "design" | "widget";
  duration: number;
}

function ItemIcon({ subType }: { subType: "image" | "video" | "design" | "widget" }) {
  if (subType === "design") return <Layers className="w-4 h-4 text-primary shrink-0" />;
  if (subType === "widget") return <Code2 className="w-4 h-4 text-accent-foreground shrink-0" />;
  if (subType === "video") return <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" />;
  return <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function SmallItemIcon({ subType }: { subType: "image" | "video" | "design" | "widget" }) {
  if (subType === "design") return <Layers className="w-3.5 h-3.5 text-primary shrink-0" />;
  if (subType === "widget") return <Code2 className="w-3.5 h-3.5 text-accent-foreground shrink-0" />;
  if (subType === "video") return <FileVideo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  return <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

export default function SchedulesPage() {
  const { isAdmin } = useUserRole();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { orgs, defaultOrgId } = useUserOrgs();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screenOptions, setScreenOptions] = useState<ScreenOption[]>([]);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [widgetOptions, setWidgetOptions] = useState<WidgetOption[]>([]);
  const [designOptions, setDesignOptions] = useState<DesignProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [filterOrgId, setFilterOrgId] = useState<string>("all");

  const [form, setForm] = useState({
    name: "", screen_id: "", startTime: "09:00", endTime: "18:00",
    days: ["一", "二", "三", "四", "五"] as string[],
    items: [] as FormPlaylistItem[],
  });

  const dayKeys = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"] as const;
  const allDaysRaw = ["一", "二", "三", "四", "五", "六", "日"];
  const dayLabels = dayKeys.map((k) => t(k));

  const fetchAll = async () => {
    setLoading(true);

    const { data: screensData } = await (supabase as any).from("screens").select("id, name, branch").order("branch");
    const opts: ScreenOption[] = (screensData || []).map((s: any) => ({ id: s.id, label: `${s.branch} - ${s.name}` }));
    setScreenOptions(opts);

    const { data: mediaData } = await (supabase as any).from("media_items").select("id, name, type").order("created_at", { ascending: false });
    const allMedia = mediaData || [];
    setMediaOptions(allMedia.filter((m: any) => m.type !== "widget"));
    setWidgetOptions(allMedia.filter((m: any) => m.type === "widget"));

    const { data: designData } = await (supabase as any).from("design_projects").select("id, name, aspect").order("updated_at", { ascending: false });
    setDesignOptions(designData || []);

    const { data: schedData } = await (supabase as any).from("schedules").select("*").order("created_at");

    const { data: itemsData } = await (supabase as any).from("schedule_items")
      .select("id, schedule_id, media_id, design_project_id, item_type, sort_order, duration")
      .order("sort_order");

    const mediaMap = new Map(allMedia.map((m: any) => [m.id, m]));
    const designMap = new Map((designData || []).map((d: any) => [d.id, d]));
    const screenMap = new Map(opts.map((s) => [s.id, s.label]));

    const merged: Schedule[] = (schedData || []).map((s: any) => {
      const schedItems: PlaylistItem[] = (itemsData || [])
        .filter((i: any) => i.schedule_id === s.id)
        .map((i: any) => {
          if (i.item_type === "design_project") {
            const d = designMap.get(i.design_project_id) as any;
            return {
              id: i.id, media_id: null, design_project_id: i.design_project_id,
              item_type: "design_project" as PlaylistItemType,
              item_name: d?.name || "Unknown", item_sub_type: "design" as const,
              duration: i.duration, sort_order: i.sort_order,
            };
          }
          const m = mediaMap.get(i.media_id) as any;
          const isWidget = m?.type === "widget";
          return {
            id: i.id, media_id: i.media_id, design_project_id: null,
            item_type: (isWidget ? "widget" : "media") as PlaylistItemType,
            item_name: m?.name || "Unknown", item_sub_type: (isWidget ? "widget" : (m?.type || "image")) as "image" | "video" | "widget",
            duration: i.duration, sort_order: i.sort_order,
          };
        });
      return {
        id: s.id, name: s.name, org_id: s.org_id || null, screen_id: s.screen_id,
        screen_label: screenMap.get(s.screen_id) || "",
        start_time: s.start_time, end_time: s.end_time,
        days: s.days || [], enabled: s.enabled, items: schedItems,
      };
    });

    setSchedules(merged);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredSchedules = useMemo(() => {
    if (filterOrgId === "all") return schedules;
    if (filterOrgId === "none") return schedules.filter(s => !s.org_id);
    return schedules.filter(s => s.org_id === filterOrgId);
  }, [schedules, filterOrgId]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: "", screen_id: "", startTime: "09:00", endTime: "18:00", days: ["一", "二", "三", "四", "五"], items: [] });
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditingId(s.id);
    setForm({
      name: s.name, screen_id: s.screen_id, startTime: s.start_time, endTime: s.end_time,
      days: [...s.days],
      items: s.items.map((i) => ({
        tempId: Math.random(), media_id: i.media_id, design_project_id: i.design_project_id,
        item_type: i.item_type, item_name: i.item_name, item_sub_type: i.item_sub_type, duration: i.duration,
      })),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.screen_id) { toast.error(t("schedFillRequired")); return; }
    if (form.items.length === 0) { toast.error(t("schedAddItem")); return; }
    setSaving(true);

    if (editingId) {
      await (supabase as any).from("schedules").update({
        name: form.name, screen_id: form.screen_id, start_time: form.startTime,
        end_time: form.endTime, days: form.days, updated_at: new Date().toISOString(),
      }).eq("id", editingId);

      await (supabase as any).from("schedule_items").delete().eq("schedule_id", editingId);
      const items = form.items.map((item, i) => ({
        schedule_id: editingId, media_id: item.media_id, design_project_id: item.design_project_id,
        item_type: item.item_type === "widget" ? "media" : item.item_type, sort_order: i, duration: item.duration,
      }));
      await (supabase as any).from("schedule_items").insert(items);
      toast.success(t("schedUpdated"));
      logActivity({ action: "編輯排程", category: "schedule", targetName: form.name, targetId: editingId! });
    } else {
      const { data: newSched, error } = await (supabase as any).from("schedules").insert({
        name: form.name, screen_id: form.screen_id, start_time: form.startTime,
        end_time: form.endTime, days: form.days, created_by: user?.id,
        org_id: defaultOrgId,
      }).select("id").single();

      if (error) { toast.error(error.message); setSaving(false); return; }

      const items = form.items.map((item, i) => ({
        schedule_id: newSched.id, media_id: item.media_id, design_project_id: item.design_project_id,
        item_type: item.item_type === "widget" ? "media" : item.item_type, sort_order: i, duration: item.duration,
      }));
      await (supabase as any).from("schedule_items").insert(items);
      toast.success(t("schedAdded"));
      logActivity({ action: "新增排程", category: "schedule", targetName: form.name });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await (supabase as any).from("schedules").delete().eq("id", deleteId);
      if (error) toast.error(error.message);
      else {
        const deleted = schedules.find(s => s.id === deleteId);
        toast.success(t("schedDeleted"));
        logActivity({ action: "刪除排程", category: "schedule", targetName: deleted?.name || "", targetId: deleteId });
        fetchAll();
      }
      setDeleteId(null);
    }
  };

  const toggleEnabled = async (id: string, current: boolean) => {
    await (supabase as any).from("schedules").update({ enabled: !current }).eq("id", id);
    fetchAll();
  };

  const addMediaToForm = (media: MediaOption) => {
    const item: FormPlaylistItem = {
      tempId: Date.now() + Math.random(), media_id: media.id, design_project_id: null,
      item_type: "media", item_name: media.name, item_sub_type: media.type,
      duration: media.type === "video" ? 30 : 10,
    };
    setForm((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const addDesignToForm = async (dp: DesignProjectOption) => {
    let loopDuration = 15;
    try {
      const { data } = await (supabase as any).from("design_projects").select("zones").eq("id", dp.id).single();
      if (data?.zones && Array.isArray(data.zones)) {
        // Each zone may have mediaItems with individual durations.
        // A single loop = the max zone duration (each zone plays its carousel independently).
        // Zone duration = sum of all its media item durations.
        const zoneDurations = (data.zones as any[]).map((zone: any) => {
          const items = zone.content?.mediaItems;
          if (!Array.isArray(items) || items.length === 0) return 0;
          return items.reduce((sum: number, m: any) => sum + (m.duration || 5), 0);
        });
        const maxDur = Math.max(...zoneDurations, 0);
        if (maxDur > 0) loopDuration = Math.round(maxDur);
      }
    } catch {}
    const item: FormPlaylistItem = {
      tempId: Date.now() + Math.random(), media_id: null, design_project_id: dp.id,
      item_type: "design_project", item_name: dp.name, item_sub_type: "design",
      duration: loopDuration,
    };
    setForm((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const addWidgetToForm = (widget: WidgetOption) => {
    const item: FormPlaylistItem = {
      tempId: Date.now() + Math.random(), media_id: widget.id, design_project_id: null,
      item_type: "widget", item_name: widget.name, item_sub_type: "widget",
      duration: 15,
    };
    setForm((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const removeItemFromForm = (tempId: number) => { setForm((prev) => ({ ...prev, items: prev.items.filter((i) => i.tempId !== tempId) })); };
  const updateItemDuration = (tempId: number, duration: number) => { setForm((prev) => ({ ...prev, items: prev.items.map((i) => i.tempId === tempId ? { ...i, duration: Math.max(1, duration) } : i) })); };
  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...form.items]; const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setForm((prev) => ({ ...prev, items: newItems }));
  };
  const handleDragStart = (index: number) => { setDragIndex(index); };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); if (dragIndex === null || dragIndex === index) return;
    const newItems = [...form.items]; const [dragged] = newItems.splice(dragIndex, 1); newItems.splice(index, 0, dragged);
    setForm((prev) => ({ ...prev, items: newItems })); setDragIndex(index);
  };
  const handleDragEnd = () => { setDragIndex(null); };
  const toggleDay = (day: string) => { setForm((prev) => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day] })); };

  const totalDuration = (items: { duration: number }[]) => items.reduce((sum, i) => sum + i.duration, 0);
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60); const s = secs % 60;
    return m > 0 ? `${m}${t("durationMin")}${s > 0 ? `${s}${t("durationSec")}` : ""}` : `${s}${t("durationSec")}`;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("schedTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("schedSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {isAdmin && orgs.length > 1 && (
            <Select value={filterOrgId} onValueChange={setFilterOrgId}>
              <SelectTrigger className="w-[180px] h-9">
                <Building2 className="w-4 h-4 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("orgFilterAll")}</SelectItem>
                {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                <SelectItem value="none">— 未分配 —</SelectItem>
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" />{t("schedAdd")}</Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {filteredSchedules.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("schedNoResult")}</p>
            </Card>
          )}

          <div className="grid gap-4">
            {filteredSchedules.map((schedule, i) => (
              <div key={schedule.id} className={`opacity-0 animate-fade-in stagger-${Math.min(i + 1, 8)} ${!schedule.enabled ? "[&>*]:opacity-60" : ""}`}>
                <Card className="hover-lift shadow-sm">
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarClock className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{schedule.name}</h3>
                        <Badge variant={schedule.enabled ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {schedule.enabled ? t("enabled") : t("disabled")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{schedule.screen_label}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{schedule.start_time} - {schedule.end_time}</span>
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" />{schedule.items.length} {t("schedItems")} · {formatDuration(totalDuration(schedule.items))}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {allDaysRaw.map((day, di) => (
                          <span key={day} className={`w-6 h-6 rounded text-[10px] font-medium flex items-center justify-center ${
                            schedule.days.includes(day) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                          }`}>{dayLabels[di]}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin && <Switch checked={schedule.enabled} onCheckedChange={() => toggleEnabled(schedule.id, schedule.enabled)} />}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedId(expandedId === schedule.id ? null : schedule.id)}>
                        {expandedId === schedule.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(schedule)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(schedule.id)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  {expandedId === schedule.id && (
                    <div className="border-t border-border px-4 py-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">{t("schedPlayOrder")}</p>
                      <div className="space-y-1.5">
                        {schedule.items.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-3 bg-card rounded-lg px-3 py-2 text-sm">
                            <span className="text-muted-foreground text-xs w-5 text-center">{index + 1}</span>
                            <ItemIcon subType={item.item_sub_type} />
                            <span className="flex-1 truncate text-foreground">{item.item_name}</span>
                            {item.item_sub_type === "design" && <Badge variant="secondary" className="text-[9px] px-1 py-0">{t("schedTabDesign")}</Badge>}
                            {item.item_sub_type === "widget" && <Badge variant="outline" className="text-[9px] px-1 py-0">{t("schedTabWidget")}</Badge>}
                            <span className="text-xs text-muted-foreground">{item.duration}{t("seconds")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t("schedEditTitle") : t("schedAddTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>{t("schedName")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("schedNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("schedScreen")} *</Label>
              <Select value={form.screen_id} onValueChange={(v) => setForm({ ...form, screen_id: v })}>
                <SelectTrigger><SelectValue placeholder={t("schedSelectScreen")} /></SelectTrigger>
                <SelectContent>{screenOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>{t("schedStartTime")}</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label>{t("schedEndTime")}</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>{t("schedPlayDays")}</Label>
              <div className="flex gap-2">
                {allDaysRaw.map((day, di) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    form.days.includes(day) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}>{dayLabels[di]}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("schedPlaylist")}</Label>
                <span className="text-xs text-muted-foreground">{form.items.length} {t("schedItems")} · {formatDuration(totalDuration(form.items))}</span>
              </div>
              <div className="space-y-1.5 min-h-[40px]">
                {form.items.length === 0 && <div className="text-center text-sm text-muted-foreground py-4 bg-muted/50 rounded-lg">{t("schedFromBelow")}</div>}
                {form.items.map((item, index) => (
                  <div key={item.tempId} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5 text-sm group transition-colors ${dragIndex === index ? "opacity-50 border-primary" : ""}`}>
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab shrink-0" />
                    <span className="text-muted-foreground text-xs w-4 text-center shrink-0">{index + 1}</span>
                    <SmallItemIcon subType={item.item_sub_type} />
                    <span className="flex-1 truncate text-foreground text-xs">{item.item_name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input type="number" min={1} value={item.duration} onChange={(e) => updateItemDuration(item.tempId, parseInt(e.target.value) || 1)} className="w-14 h-7 text-xs text-center" />
                      <span className="text-[10px] text-muted-foreground">{t("seconds")}</span>
                    </div>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(index, "up")} disabled={index === 0}><ChevronUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(index, "down")} disabled={index === form.items.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive shrink-0" onClick={() => removeItemFromForm(item.tempId)}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2">{t("schedClickToAdd")}</p>
                <Tabs defaultValue="media" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="media" className="text-xs gap-1"><FileImage className="w-3 h-3" />{t("schedTabMedia")}</TabsTrigger>
                    <TabsTrigger value="design" className="text-xs gap-1"><Layers className="w-3 h-3" />{t("schedTabDesign")}</TabsTrigger>
                    <TabsTrigger value="widget" className="text-xs gap-1"><Code2 className="w-3 h-3" />{t("schedTabWidget")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="media" className="mt-2">
                    {mediaOptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">{t("mediaNoResult")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {mediaOptions.map((media) => (
                          <button key={media.id} type="button" onClick={() => addMediaToForm(media)} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-left transition-colors">
                            {media.type === "image" ? <FileImage className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <FileVideo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                            <span className="truncate text-xs text-foreground">{media.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="design" className="mt-2">
                    {designOptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">{t("studioNoProjects")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {designOptions.map((dp) => (
                          <button key={dp.id} type="button" onClick={() => addDesignToForm(dp)} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-left transition-colors">
                            <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="truncate">
                              <span className="text-xs text-foreground block truncate">{dp.name}</span>
                              <span className="text-[10px] text-muted-foreground">{dp.aspect}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="widget" className="mt-2">
                    {widgetOptions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">{t("mediaNoResult")}</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                        {widgetOptions.map((w) => (
                          <button key={w.id} type="button" onClick={() => addWidgetToForm(w)} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm text-left transition-colors">
                            <Code2 className="w-3.5 h-3.5 text-accent-foreground shrink-0" />
                            <span className="truncate text-xs text-foreground">{w.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? t("schedSaveChanges") : t("schedAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("schedDeleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("schedDeleteDesc")}</AlertDialogDescription>
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
