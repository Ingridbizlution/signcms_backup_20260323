import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Send, CalendarClock, Monitor, CheckCircle2, Clock, Loader2,
  Radio, Play, Zap, Calendar as CalendarIcon, ListMusic, ChevronRight,
  CheckCheck, AlertCircle, Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScheduleOption {
  id: string;
  name: string;
  screen_name: string;
  items_count: number;
}

interface ScreenOption {
  id: string;
  name: string;
  branch: string;
  online: boolean;
}

interface PublishRecord {
  id: string;
  schedule_name: string;
  screen_name: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
}

export default function PublishingCenterPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Data
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [screens, setScreens] = useState<ScreenOption[]>([]);
  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedScreenIds, setSelectedScreenIds] = useState<Set<string>>(new Set());
  const [publishMode, setPublishMode] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [publishing, setPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchScreen, setSearchScreen] = useState("");

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [schedRes, screenRes, recordRes] = await Promise.all([
      (supabase as any).from("schedules").select("id, name, screen_id, screens:screen_id(name)").order("name"),
      (supabase as any).from("screens").select("id, name, branch, online").order("branch, name"),
      (supabase as any).from("publish_records").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    // Also get item counts
    const { data: itemCounts } = await (supabase as any).from("schedule_items").select("schedule_id");

    const countMap = new Map<string, number>();
    (itemCounts || []).forEach((i: any) => {
      countMap.set(i.schedule_id, (countMap.get(i.schedule_id) || 0) + 1);
    });

    setSchedules((schedRes.data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      screen_name: s.screens?.name || "-",
      items_count: countMap.get(s.id) || 0,
    })));
    setScreens((screenRes.data || []) as ScreenOption[]);
    setRecords((recordRes.data || []) as PublishRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Grouped screens by branch
  const groupedScreens = useMemo(() => {
    const groups = new Map<string, ScreenOption[]>();
    const filtered = screens.filter((s) =>
      s.name.toLowerCase().includes(searchScreen.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchScreen.toLowerCase())
    );
    filtered.forEach((s) => {
      const branch = s.branch || t("publishUngrouped");
      if (!groups.has(branch)) groups.set(branch, []);
      groups.get(branch)!.push(s);
    });
    return groups;
  }, [screens, searchScreen, t]);

  const allScreenIds = useMemo(() => new Set(screens.map((s) => s.id)), [screens]);
  const allSelected = selectedScreenIds.size === screens.length && screens.length > 0;

  const toggleScreen = (id: string) => {
    setSelectedScreenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBranch = (branchScreens: ScreenOption[]) => {
    setSelectedScreenIds((prev) => {
      const next = new Set(prev);
      const allIn = branchScreens.every((s) => next.has(s.id));
      if (allIn) branchScreens.forEach((s) => next.delete(s.id));
      else branchScreens.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedScreenIds(new Set());
    else setSelectedScreenIds(new Set(allScreenIds));
  };

  // Publish action
  const handlePublish = async () => {
    if (!selectedScheduleId) { toast.error(t("publishSelectPlaylist")); return; }
    if (selectedScreenIds.size === 0) { toast.error(t("publishSelectScreen")); return; }
    if (publishMode === "scheduled" && !scheduledDate) { toast.error(t("publishSelectDate")); return; }

    setPublishing(true);
    const schedule = schedules.find((s) => s.id === selectedScheduleId);

    let scheduledAt: string | null = null;
    if (publishMode === "scheduled" && scheduledDate) {
      const [h, m] = scheduledTime.split(":").map(Number);
      const dt = new Date(scheduledDate);
      dt.setHours(h, m, 0, 0);
      scheduledAt = dt.toISOString();
    }

    const inserts = Array.from(selectedScreenIds).map((screenId) => {
      const screen = screens.find((s) => s.id === screenId);
      return {
        schedule_id: selectedScheduleId,
        screen_id: screenId,
        schedule_name: schedule?.name || "",
        screen_name: screen?.name || "",
        status: publishMode === "now" ? "playing" : "scheduled",
        scheduled_at: scheduledAt,
        published_by: user?.id,
      };
    });

    const { error } = await (supabase as any).from("publish_records").insert(inserts);
    if (error) {
      toast.error(error.message);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      toast.success(publishMode === "now" ? t("publishSuccessNow") : t("publishSuccessScheduled"));
      setSelectedScheduleId(null);
      setSelectedScreenIds(new Set());
      setPublishMode("now");
      setScheduledDate(undefined);
      fetchData();
    }
    setPublishing(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === "playing") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><Play className="w-3 h-3" />{t("publishStatusPlaying")}</Badge>;
    if (status === "scheduled") return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10"><Clock className="w-3 h-3" />{t("publishStatusScheduled")}</Badge>;
    if (status === "sending") return <Badge variant="outline" className="gap-1 text-blue-600 border-blue-500/30 bg-blue-500/10"><Loader2 className="w-3 h-3 animate-spin" />{t("publishStatusSending")}</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> {t("publishLoading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-75 duration-500">
            <div className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-in zoom-in-50 duration-700" />
            </div>
            <p className="text-xl font-bold text-foreground">{t("publishSuccessTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("publishSuccessDesc")}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Send className="w-8 h-8 text-primary" />
          {t("publishTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("publishSubtitle")}</p>
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Playlist selection */}
        <Card className="lg:col-span-3 p-4 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-primary" />
            {t("publishPlaylist")}
          </h2>
          <Separator />
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("publishNoPlaylists")}</p>
            ) : schedules.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScheduleId(s.id === selectedScheduleId ? null : s.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all duration-200",
                  selectedScheduleId === s.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{s.items_count} {t("publishItems")}</Badge>
                  <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{s.screen_name}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Middle: Target screens */}
        <Card className="lg:col-span-4 p-4 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary" />
            {t("publishTargetScreens")}
            {selectedScreenIds.size > 0 && (
              <Badge variant="default" className="ml-auto">{selectedScreenIds.size}</Badge>
            )}
          </h2>
          <Separator />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchScreen}
              onChange={(e) => setSearchScreen(e.target.value)}
              placeholder={t("publishSearchScreens")}
              className="pl-9 h-9"
            />
          </div>
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
              {t("publishSelectAll")}
            </label>
            <span className="text-xs text-muted-foreground ml-auto">{screens.length} {t("publishScreensTotal")}</span>
          </div>
          <Separator />
          <div className="space-y-3 max-h-[340px] overflow-y-auto">
            {Array.from(groupedScreens.entries()).map(([branch, branchScreens]) => {
              const branchAllSelected = branchScreens.every((s) => selectedScreenIds.has(s.id));
              const branchSomeSelected = branchScreens.some((s) => selectedScreenIds.has(s.id));
              return (
                <div key={branch}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Checkbox
                      checked={branchAllSelected}
                      onCheckedChange={() => toggleBranch(branchScreens)}
                      className={branchSomeSelected && !branchAllSelected ? "data-[state=unchecked]:bg-primary/20" : ""}
                    />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{branch}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{branchScreens.length}</Badge>
                  </div>
                  <div className="space-y-0.5 pl-6">
                    {branchScreens.map((s) => (
                      <label
                        key={s.id}
                        className={cn(
                          "flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors",
                          selectedScreenIds.has(s.id) ? "bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={selectedScreenIds.has(s.id)}
                          onCheckedChange={() => toggleScreen(s.id)}
                        />
                        <span className="text-sm text-foreground truncate flex-1">{s.name}</span>
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          s.online ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )} />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Publish actions */}
        <Card className="lg:col-span-5 p-4 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {t("publishActions")}
          </h2>
          <Separator />

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("publishPlaylist")}：</span>
              <span className="font-medium text-foreground truncate max-w-[60%] text-right">
                {selectedScheduleId ? schedules.find((s) => s.id === selectedScheduleId)?.name || "-" : <span className="text-muted-foreground italic">{t("publishNotSelected")}</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("publishTargetScreens")}：</span>
              <span className="font-medium text-foreground">
                {selectedScreenIds.size > 0 ? `${selectedScreenIds.size} ${t("publishScreensSelected")}` : <span className="text-muted-foreground italic">{t("publishNotSelected")}</span>}
              </span>
            </div>
          </div>

          {/* Mode buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPublishMode("now")}
              className={cn(
                "relative p-5 rounded-xl border-2 transition-all duration-300 text-center group",
                publishMode === "now"
                  ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                  : "border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-all",
                publishMode === "now" ? "bg-emerald-500 text-white scale-110" : "bg-muted text-muted-foreground group-hover:bg-emerald-500/20 group-hover:text-emerald-600"
              )}>
                <Zap className="w-6 h-6" />
              </div>
              <p className={cn("font-bold text-base", publishMode === "now" ? "text-emerald-600" : "text-foreground")}>
                {t("publishNow")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("publishNowDesc")}</p>
            </button>

            <button
              onClick={() => setPublishMode("scheduled")}
              className={cn(
                "relative p-5 rounded-xl border-2 transition-all duration-300 text-center group",
                publishMode === "scheduled"
                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10"
                  : "border-border hover:border-amber-500/50 hover:bg-amber-500/5"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-all",
                publishMode === "scheduled" ? "bg-amber-500 text-white scale-110" : "bg-muted text-muted-foreground group-hover:bg-amber-500/20 group-hover:text-amber-600"
              )}>
                <CalendarClock className="w-6 h-6" />
              </div>
              <p className={cn("font-bold text-base", publishMode === "scheduled" ? "text-amber-600" : "text-foreground")}>
                {t("publishScheduled")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("publishScheduledDesc")}</p>
            </button>
          </div>

          {/* Scheduled options */}
          {publishMode === "scheduled" && (
            <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-sm font-medium">{t("publishScheduleDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "yyyy/MM/dd") : t("publishPickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("publishScheduleTime")}</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Publish button */}
          {isAdmin && (
            <Button
              onClick={handlePublish}
              disabled={publishing || !selectedScheduleId || selectedScreenIds.size === 0}
              className={cn(
                "w-full h-14 text-lg font-bold gap-3 transition-all duration-300",
                publishMode === "now"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25"
                  : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25"
              )}
            >
              {publishing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : publishMode === "now" ? (
                <Send className="w-5 h-5" />
              ) : (
                <CalendarClock className="w-5 h-5" />
              )}
              {publishMode === "now" ? t("publishNowBtn") : t("publishScheduledBtn")}
            </Button>
          )}
        </Card>
      </div>

      {/* Publish Records */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-primary" />
          {t("publishRecords")}
        </h2>
        <Separator />
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("publishNoRecords")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="py-2 pr-4 font-medium">{t("publishRecordPlaylist")}</th>
                  <th className="py-2 pr-4 font-medium">{t("publishRecordScreen")}</th>
                  <th className="py-2 pr-4 font-medium">{t("publishRecordStatus")}</th>
                  <th className="py-2 pr-4 font-medium">{t("publishRecordTime")}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <ListMusic className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{r.schedule_name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground">{r.screen_name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{getStatusBadge(r.status)}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {r.scheduled_at
                        ? format(new Date(r.scheduled_at), "yyyy/MM/dd HH:mm")
                        : format(new Date(r.created_at), "yyyy/MM/dd HH:mm")
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
