import { useState, useEffect } from "react";
import { Monitor, WifiOff, PlayCircle, Loader2, Image, FileVideo, CalendarClock, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "success" | "warning";
  className?: string;
}

function StatCard({ title, value, icon, subtitle, variant = "default", className = "" }: StatCardProps) {
  const variantClasses = { default: "bg-card", success: "bg-card border-success/20", warning: "bg-card border-warning/20" };
  return (
    <Card className={`p-5 ${variantClasses[variant]} hover-lift shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">{icon}</div>
      </div>
    </Card>
  );
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)"];

export default function DashboardPage() {
  const { t } = useLanguage();
  const [screens, setScreens] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [screensRes, schedulesRes, mediaRes, itemsRes] = await Promise.all([
        (supabase as any).from("screens").select("id, name, branch, online").order("created_at"),
        (supabase as any).from("schedules").select("id, name, screen_id, enabled, start_time, end_time").order("created_at"),
        (supabase as any).from("media_items").select("id, name, type").order("created_at", { ascending: false }),
        (supabase as any).from("schedule_items").select("id, schedule_id, media_id, duration").order("sort_order"),
      ]);
      setScreens(screensRes.data || []);
      setSchedules(schedulesRes.data || []);
      setMediaItems(mediaRes.data || []);
      setScheduleItems(itemsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const onlineCount = screens.filter((s) => s.online).length;
  const offlineCount = screens.filter((s) => !s.online).length;
  const enabledSchedules = schedules.filter((s) => s.enabled).length;

  // Branch distribution data
  const branchMap = new Map<string, number>();
  screens.forEach((s) => { branchMap.set(s.branch, (branchMap.get(s.branch) || 0) + 1); });
  const branchData = Array.from(branchMap.entries()).map(([name, count]) => ({ name, count }));

  // Media type distribution
  const imageCount = mediaItems.filter((m) => m.type === "image").length;
  const videoCount = mediaItems.filter((m) => m.type === "video").length;
  const mediaTypeData = [
    { name: t("image"), value: imageCount },
    { name: t("video"), value: videoCount },
  ].filter((d) => d.value > 0);

  // Media usage count
  const mediaUsageMap = new Map<string, number>();
  scheduleItems.forEach((si) => { mediaUsageMap.set(si.media_id, (mediaUsageMap.get(si.media_id) || 0) + 1); });
  const mediaUsageData = mediaItems.map((m) => ({
    name: m.name.length > 8 ? m.name.slice(0, 8) + "…" : m.name,
    fullName: m.name,
    count: mediaUsageMap.get(m.id) || 0,
    type: m.type,
  })).sort((a, b) => b.count - a.count);

  // Schedule overview with item counts
  const screenMap = new Map(screens.map((s: any) => [s.id, s]));
  const scheduleOverview = schedules.map((s) => {
    const items = scheduleItems.filter((si) => si.schedule_id === s.id);
    const totalDuration = items.reduce((sum: number, i: any) => sum + (i.duration || 0), 0);
    const screen = screenMap.get(s.screen_id);
    return { ...s, itemCount: items.length, totalDuration, screenName: screen ? `${screen.branch} - ${screen.name}` : "-" };
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{t("dashTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashSubtitle")}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title={t("dashOnlineScreens")} value={onlineCount} icon={<Monitor className="w-5 h-5 text-success" />} subtitle={t("dashRunningNormal")} variant="success" className="opacity-0 animate-count-up stagger-1" />
        <StatCard title={t("dashOfflineWarning")} value={offlineCount} icon={<WifiOff className="w-5 h-5 text-destructive" />} subtitle={t("dashNeedCheck")} variant="warning" className="opacity-0 animate-count-up stagger-2" />
        <StatCard title={t("dashTotalSchedules")} value={enabledSchedules} icon={<CalendarClock className="w-5 h-5 text-primary" />} subtitle={t("dashPlayCount")} className="opacity-0 animate-count-up stagger-3" />
        <StatCard title={t("dashTotalMedia")} value={mediaItems.length} icon={<BarChart3 className="w-5 h-5 text-primary" />} subtitle={`${imageCount} ${t("image")} · ${videoCount} ${t("video")}`} className="opacity-0 animate-count-up stagger-4" />
      </div>

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
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
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
                    {mediaTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
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
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
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
        <h3 className="text-sm font-semibold text-foreground mb-4">{t("dashScheduleOverview")}</h3>
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
                    <td className="py-2.5 px-3 text-center text-foreground">{s.totalDuration}</td>
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
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashScreenList")}</h2>
        {screens.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t("screensNoResult")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {screens.map((screen, i) => (
              <Card key={screen.id} className={`overflow-hidden hover-lift shadow-sm group cursor-pointer opacity-0 animate-slide-up stagger-${Math.min(i + 1, 8)}`}>
                <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                  <Monitor className="w-10 h-10 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110" />
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    screen.online ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${screen.online ? "bg-success animate-pulse" : "bg-destructive"}`} />
                    {screen.online ? t("online") : t("offline")}
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">{screen.name}</h3>
                  <p className="text-xs text-muted-foreground">{screen.branch}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
