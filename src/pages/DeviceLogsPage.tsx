import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrgs } from "@/hooks/useUserOrgs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Wifi, Settings, CalendarClock, AlertTriangle, Monitor, RefreshCw, Building2, FileText, Download, User } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface LogEntry {
  id: string;
  screen_id: string;
  org_id: string | null;
  event_type: string;
  event_title: string;
  event_detail: string;
  created_at: string;
  created_by: string | null;
  screen_name?: string;
  operator_name?: string;
}

const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Wifi; color: string; label: { zh: string; en: string; ja: string } }> = {
  status: { icon: Wifi, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: { zh: "狀態變更", en: "Status", ja: "ステータス" } },
  config: { icon: Settings, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: { zh: "設定變更", en: "Config", ja: "設定変更" } },
  schedule: { icon: CalendarClock, color: "bg-green-500/10 text-green-600 dark:text-green-400", label: { zh: "排程播放", en: "Schedule", ja: "スケジュール" } },
  system: { icon: AlertTriangle, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: { zh: "系統事件", en: "System", ja: "システム" } },
};

export default function DeviceLogsPage() {
  const { language } = useLanguage();
  const { isAdmin } = useUserRole();
  const { orgs } = useUserOrgs();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [screens, setScreens] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterScreen, setFilterScreen] = useState("all");
  const [filterOrgId, setFilterOrgId] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const [logsRes, screensRes, profilesRes] = await Promise.all([
      (supabase as any).from("screen_logs").select("id, screen_id, org_id, event_type, event_title, event_detail, created_at, created_by").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("screens").select("id, name"),
      (supabase as any).from("profiles").select("user_id, display_name"),
    ]);
    const screenMap = new Map((screensRes.data || []).map((s: any) => [s.id, s.name]));
    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p.display_name]));
    const enriched = (logsRes.data || []).map((l: any) => ({
      ...l,
      screen_name: screenMap.get(l.screen_id) || "Unknown",
      operator_name: l.created_by ? (profileMap.get(l.created_by) || "Unknown") : undefined,
    }));
    setLogs(enriched);
    setScreens(screensRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filterType !== "all" && l.event_type !== filterType) return false;
      if (filterScreen !== "all" && l.screen_id !== filterScreen) return false;
      if (filterOrgId === "none" && l.org_id) return false;
      if (filterOrgId !== "all" && filterOrgId !== "none" && l.org_id !== filterOrgId) return false;
      if (search && !l.event_title.includes(search) && !l.event_detail.includes(search) && !(l.screen_name || "").includes(search)) return false;
      return true;
    });
  }, [logs, filterType, filterScreen, filterOrgId, search]);

  const labels = {
    title: { zh: "設備狀態紀錄", en: "Device Logs", ja: "デバイスログ" },
    subtitle: { zh: "查看所有設備的狀態變更與事件紀錄", en: "View status changes and event logs for all devices", ja: "全デバイスのステータス変更とイベントログを表示" },
    searchPlaceholder: { zh: "搜尋紀錄...", en: "Search logs...", ja: "ログを検索..." },
    allTypes: { zh: "所有類型", en: "All Types", ja: "全タイプ" },
    allScreens: { zh: "所有螢幕", en: "All Screens", ja: "全スクリーン" },
    allOrgs: { zh: "所有組織", en: "All Orgs", ja: "全組織" },
    unassigned: { zh: "未分配", en: "Unassigned", ja: "未割当" },
    noLogs: { zh: "暫無紀錄", en: "No logs found", ja: "ログなし" },
    totalLogs: { zh: "共 {count} 筆紀錄", en: "{count} logs", ja: "{count} 件のログ" },
    exportExcel: { zh: "匯出 Excel", en: "Export Excel", ja: "Excelエクスポート" },
  };

  const handleExportExcel = () => {
    const headerMap = { zh: ["時間", "螢幕", "操作者", "事件類型", "事件標題", "詳細"], en: ["Time", "Screen", "Operator", "Type", "Title", "Detail"], ja: ["時間", "スクリーン", "操作者", "タイプ", "タイトル", "詳細"] };
    const headers = headerMap[language];
    const rows = filtered.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.screen_name || "",
      l.operator_name || "-",
      (EVENT_TYPE_CONFIG[l.event_type]?.label[language]) || l.event_type,
      l.event_title,
      l.event_detail,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 36 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, labels.title[language]);
    XLSX.writeFile(wb, `device-logs-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{labels.title[language]}</h1>
          <p className="text-sm text-muted-foreground mt-1">{labels.subtitle[language]}</p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} disabled={filtered.length === 0}>
            <Download className="w-4 h-4" />
            {labels.exportExcel[language]}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={labels.searchPlaceholder[language]} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.allTypes[language]}</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label[language]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterScreen} onValueChange={setFilterScreen}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.allScreens[language]}</SelectItem>
            {screens.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAdmin && orgs.length > 0 && (
          <Select value={filterOrgId} onValueChange={setFilterOrgId}>
            <SelectTrigger className="w-[180px]">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allOrgs[language]}</SelectItem>
              <SelectItem value="none">{labels.unassigned[language]}</SelectItem>
              {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {labels.totalLogs[language].replace("{count}", String(filtered.length))}
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{labels.noLogs[language]}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const cfg = EVENT_TYPE_CONFIG[log.event_type] || EVENT_TYPE_CONFIG.system;
            const Icon = cfg.icon;
            return (
              <Card key={log.id} className={`p-3 flex items-start gap-3 hover-lift shadow-sm opacity-0 animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
                <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{log.event_title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{cfg.label[language]}</Badge>
                  </div>
                  {log.event_detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.event_detail}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      {log.screen_name}
                    </span>
                    {log.operator_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.operator_name}
                      </span>
                    )}
                    <span>{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
