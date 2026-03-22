import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Monitor, WifiOff, Loader2, CalendarClock, BarChart3, AlertTriangle,
  ShieldAlert, Send, Plus, Upload, Clock, Zap, RefreshCw, ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
];

const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 13,
};

const AUTO_REFRESH_INTERVAL = 30_000; // 30s

export default function DashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [screens, setScreens] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [publishRecords, setPublishRecords] = useState<any[]>([]);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [screensRes, schedulesRes, mediaRes, itemsRes, emergencyRes, todayPubRes, scheduledRes] =
      await Promise.all([
        (supabase as any).from("screens").select("id, name, branch, online").order("created_at"),
        (supabase as any).from("schedules").select("id, name, screen_id, enabled, start_time, end_time").order("created_at"),
        (supabase as any).from("media_items").select("id, name, type").order("created_at", { ascending: false }),
        (supabase as any).from("schedule_items").select("id, schedule_id, media_id, duration").order("sort_order"),
        (supabase as any).from("publish_records").select("id").eq("status", "emergency"),
        (supabase as any).from("publish_records").select("id").gte("created_at", todayStart.toISOString()),
        (supabase as any).from("publish_records").select("id").eq("status", "scheduled"),
      ]);

    setScreens(screensRes.data || []);
    setSchedules(schedulesRes.data || []);
    setMediaItems(mediaRes.data || []);
    setScheduleItems(itemsRes.data || []);
    setEmergencyCount((emergencyRes.data || []).length);
    setPublishRecords([
      { key: "today", count: (todayPubRes.data || []).length },
      { key: "scheduled", count: (scheduledRes.data || []).length },
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Derived data
  const onlineCount = useMemo(() => screens.filter((s) => s.online).length, [screens]);
  const offlineCount = useMemo(() => screens.filter((s) => !s.online).length, [screens]);
  const enabledSchedules = useMemo(() => schedules.filter((s) => s.enabled).length, [schedules]);
  const todayPublishCount = publishRecords.find((r) => r.key === "today")?.count || 0;
  const scheduledCount = publishRecords.find((r) => r.key === "scheduled")?.count || 0;

  const imageCount = useMemo(() => mediaItems.filter((m) => m.type === "image").length, [mediaItems]);
  const videoCount = useMemo(() => mediaItems.filter((m) => m.type === "video").length, [mediaItems]);
  const widgetCount = useMemo(() => mediaItems.filter((m) => m.type === "widget").length, [mediaItems]);

  const branchData = useMemo(() => {
    const map = new Map<string, number>();
    screens.forEach((s) => {
      const g = s.branch || t("screensUngrouped");
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [screens, t]);

  const mediaTypeData = useMemo(() => {
    const data = [
      { name: t("image"), value: imageCount },
      { name: t("video"), value: videoCount },
    ].filter((d) => d.value > 0);
    if (widgetCount > 0) data.push({ name: "Widget", value: widgetCount });
    return data;
  }, [imageCount, videoCount, widgetCount, t]);

  const mediaUsageData = useMemo(() => {
    const usageMap = new Map<string, number>();
    scheduleItems.forEach((si) => {
      if (si.media_id) usageMap.set(si.media_id, (usageMap.get(si.media_id) || 0) + 1);
    });
    return mediaItems
      .map((m) => ({
        name: m.name.length > 8 ? m.name.slice(0, 8) + "…" : m.name,
        fullName: m.name,
        count: usageMap.get(m.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mediaItems, scheduleItems]);

  const scheduleOverview = useMemo(() => {
    const sMap = new Map(screens.map((s: any) => [s.id, s]));
    return schedules.map((s) => {
      const items = scheduleItems.filter((si) => si.schedule_id === s.id);
      const totalDuration = items.reduce((sum: number, i: any) => sum + (i.duration || 0), 0);
      const screen = sMap.get(s.screen_id);
      return {
        ...s,
        itemCount: items.length,
        totalDuration,
        screenName: screen ? `${screen.branch || t("screensUngrouped")} – ${screen.name}` : "–",
      };
    });
  }, [schedules, scheduleItems, screens, t]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header with refresh indicator */}
      <div className="flex items-end justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} />
          <span>{t("dashAutoRefresh")}</span>
          <span className="text-muted-foreground/60">·</span>
          <span>{t("dashLastRefresh")} {format(lastRefresh, "HH:mm:ss")}</span>
        </div>
      </div>

      {/* Emergency Banner */}
      {emergencyCount > 0 && (
        <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 flex items-center gap-4 animate-pulse shadow-lg shadow-destructive/10">
          <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {t("dashEmergencyTitle")}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("dashEmergencyDesc").replace("{count}", String(emergencyCount))}
            </p>
          </div>
          <Button variant="destructive" className="shrink-0 gap-2 font-bold" onClick={() => navigate("/publishing")}>
            {t("dashEmergencyAction")}
          </Button>
        </div>
      )}

      {/* Stat Cards - 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Screen Online */}
        <Card className="p-4 border-success/20 hover-lift shadow-sm opacity-0 animate-count-up stagger-1">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center" title={t("dashOnlineScreens")}>
              <Monitor className="w-4.5 h-4.5 text-success" />
            </div>
            <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/5">LIVE</Badge>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{onlineCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashOnlineScreens")}</p>
        </Card>

        {/* Screen Offline */}
        <Card className="p-4 border-destructive/20 hover-lift shadow-sm opacity-0 animate-count-up stagger-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center" title={t("dashOfflineWarning")}>
              <WifiOff className="w-4.5 h-4.5 text-destructive" />
            </div>
            {offlineCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{offlineCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashOfflineWarning")}</p>
        </Card>

        {/* Enabled Schedules */}
        <Card className="p-4 hover-lift shadow-sm opacity-0 animate-count-up stagger-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" title={t("dashTotalSchedules")}>
              <CalendarClock className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{enabledSchedules}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashTotalSchedules")}</p>
        </Card>

        {/* Total Media */}
        <Card className="p-4 hover-lift shadow-sm opacity-0 animate-count-up stagger-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" title={t("dashTotalMedia")}>
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{mediaItems.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashTotalMedia")}</p>
        </Card>

        {/* Today's Publish */}
        <Card className="p-4 hover-lift shadow-sm opacity-0 animate-count-up stagger-5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center" title={t("dashPublishToday")}>
              <Send className="w-4.5 h-4.5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{todayPublishCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashPublishToday")}</p>
        </Card>

        {/* Scheduled Pending */}
        <Card className="p-4 hover-lift shadow-sm opacity-0 animate-count-up stagger-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center" title={t("dashScheduledPending")}>
              <Clock className="w-4.5 h-4.5 text-amber-500" />
            </div>
            {scheduledCount > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/5">{scheduledCount}</Badge>
            )}
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">{scheduledCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashScheduledPending")}</p>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <Card className="p-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {t("dashQuickActions")}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => navigate("/publishing")}
            title={t("dashQuickPublish")}
          >
            <Send className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{t("dashQuickPublish")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => navigate("/screens")}
            title={t("dashQuickScreen")}
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{t("dashQuickScreen")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => navigate("/media")}
            title={t("dashQuickMedia")}
          >
            <Upload className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{t("dashQuickMedia")}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => navigate("/schedules")}
            title={t("dashQuickSchedule")}
          >
            <CalendarClock className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{t("dashQuickSchedule")}</span>
          </Button>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        {/* Branch Screen Distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t("dashByBranch")}</h3>
          {branchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={branchData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("screensNoResult")}</p>
          )}
        </Card>

        {/* Media Type Pie */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t("dashByType")}</h3>
          {mediaTypeData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={mediaTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                    {mediaTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {mediaTypeData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-foreground">{d.name}</span>
                    <span className="text-sm font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("mediaNoResult")}</p>
          )}
        </Card>
      </div>

      {/* Media Usage Chart */}
      <Card className="p-5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("dashMediaStats")}</h3>
        {mediaUsageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mediaUsageData} margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [`${value} ${t("dashUsedIn")}`, ""]}
                labelFormatter={(label: string) => {
                  const item = mediaUsageData.find((d) => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("mediaNoResult")}</p>
        )}
      </Card>

      {/* Schedule Overview Table */}
      <Card className="p-5 animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t("dashScheduleOverview")}</h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => navigate("/schedules")}>
            {t("dashQuickSchedule")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        {scheduleOverview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("dashScheduleName")}</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">{t("dashScreen")}</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("dashItems")}</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("dashDuration")}</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">{t("dashStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {scheduleOverview.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{s.screenName}</td>
                    <td className="py-2.5 px-3 text-center text-foreground">{s.itemCount}</td>
                    <td className="py-2.5 px-3 text-center text-foreground">{s.totalDuration}s</td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge variant={s.enabled ? "default" : "secondary"} className="text-[10px]">
                        {s.enabled ? t("enabled") : t("disabled")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("schedNoResult")}</p>
        )}
      </Card>

      {/* Screen List */}
      <div className="animate-fade-in" style={{ animationDelay: "0.45s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t("dashScreenList")}</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => navigate("/screens")}>
            {t("dashQuickScreen")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        {screens.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t("screensNoResult")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {screens.map((screen, i) => (
              <Card
                key={screen.id}
                className={cn(
                  "overflow-hidden hover-lift shadow-sm group cursor-pointer opacity-0 animate-slide-up",
                  `stagger-${Math.min(i + 1, 8)}`
                )}
                onClick={() => navigate("/screens")}
              >
                <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                  <Monitor className="w-10 h-10 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110" />
                  <div
                    className={cn(
                      "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      screen.online ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", screen.online ? "bg-success animate-pulse" : "bg-destructive")} />
                    {screen.online ? t("online") : t("offline")}
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                    {screen.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{screen.branch || t("screensUngrouped")}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
