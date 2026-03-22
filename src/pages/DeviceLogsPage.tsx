import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrgs } from "@/hooks/useUserOrgs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Search, Wifi, Settings, CalendarClock, AlertTriangle, Monitor,
  RefreshCw, Building2, FileText, Download, User, LogIn, LogOut, Plus, Pencil,
  Trash2, Send, ShieldCheck, Image, Brush,
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";
import * as XLSX from "xlsx";

// --- Device log types ---
interface DeviceLog {
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

const DEVICE_TYPE_CONFIG: Record<string, { icon: typeof Wifi; color: string; label: { zh: string; en: string; ja: string } }> = {
  status: { icon: Wifi, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: { zh: "狀態變更", en: "Status", ja: "ステータス" } },
  config: { icon: Settings, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: { zh: "設定變更", en: "Config", ja: "設定変更" } },
  schedule: { icon: CalendarClock, color: "bg-green-500/10 text-green-600 dark:text-green-400", label: { zh: "排程播放", en: "Schedule", ja: "スケジュール" } },
  system: { icon: AlertTriangle, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: { zh: "系統事件", en: "System", ja: "システム" } },
};

// --- Activity log types ---
interface ActivityLog {
  id: string;
  user_id: string;
  org_id: string | null;
  action: string;
  category: string;
  target_type: string;
  target_id: string;
  target_name: string;
  detail: string;
  created_at: string;
  ip_address: string;
  user_name?: string;
}

// Action type determines row color: create=green, update=blue, delete=red, auth=sky, publish=emerald, admin=amber
const ACTION_COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  create: { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" },
  update: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  delete: { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  login: { bg: "bg-sky-50 dark:bg-sky-950/20", text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  logout: { bg: "bg-slate-50 dark:bg-slate-950/20", text: "text-slate-700 dark:text-slate-400", dot: "bg-slate-400" },
  publish: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  admin: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
};

function getActionColor(action: string, category: string) {
  const lower = action.toLowerCase();
  if (lower.includes("刪除") || lower.includes("delete") || lower.includes("移除")) return ACTION_COLOR_MAP.delete;
  if (lower.includes("新增") || lower.includes("create") || lower.includes("建立") || lower.includes("上傳")) return ACTION_COLOR_MAP.create;
  if (lower.includes("修改") || lower.includes("update") || lower.includes("編輯") || lower.includes("變更")) return ACTION_COLOR_MAP.update;
  if (lower.includes("發佈") || lower.includes("publish")) return ACTION_COLOR_MAP.publish;
  if (lower.includes("登出") || lower.includes("logout")) return ACTION_COLOR_MAP.logout;
  if (lower.includes("登入") || lower.includes("login")) return ACTION_COLOR_MAP.login;
  if (category === "admin") return ACTION_COLOR_MAP.admin;
  if (category === "publish") return ACTION_COLOR_MAP.publish;
  if (category === "auth") return ACTION_COLOR_MAP.login;
  return ACTION_COLOR_MAP.update;
}

const ACTIVITY_CATEGORY_CONFIG: Record<string, { icon: typeof User; color: string; label: { zh: string; en: string; ja: string } }> = {
  auth: { icon: LogIn, color: "bg-sky-500/10 text-sky-600 dark:text-sky-400", label: { zh: "登入/登出", en: "Auth", ja: "認証" } },
  screen: { icon: Monitor, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: { zh: "螢幕管理", en: "Screen", ja: "スクリーン" } },
  media: { icon: Image, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: { zh: "素材管理", en: "Media", ja: "メディア" } },
  schedule: { icon: CalendarClock, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: { zh: "排程管理", en: "Schedule", ja: "スケジュール" } },
  publish: { icon: Send, color: "bg-green-500/10 text-green-600 dark:text-green-400", label: { zh: "發佈操作", en: "Publish", ja: "配信" } },
  admin: { icon: ShieldCheck, color: "bg-red-500/10 text-red-600 dark:text-red-400", label: { zh: "管理操作", en: "Admin", ja: "管理" } },
  studio: { icon: Brush, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400", label: { zh: "內容設計", en: "Studio", ja: "スタジオ" } },
};

export default function SystemLogsPage() {
  const { language } = useLanguage();
  const { isAdmin } = useUserRole();
  const { orgs } = useUserOrgs();
  const [activeTab, setActiveTab] = useState("device");

  // --- Device logs state ---
  const [deviceLogs, setDeviceLogs] = useState<DeviceLog[]>([]);
  const [screens, setScreens] = useState<{ id: string; name: string }[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilterType, setDeviceFilterType] = useState("all");
  const [deviceFilterScreen, setDeviceFilterScreen] = useState("all");
  const [deviceFilterOrg, setDeviceFilterOrg] = useState("all");

  // --- Activity logs state ---
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilterCategory, setActivityFilterCategory] = useState("all");
  const [activityFilterOrg, setActivityFilterOrg] = useState("all");
  const [activityFilterTime, setActivityFilterTime] = useState("all");

  // --- Shared ---
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());

  const fetchProfiles = async (): Promise<Map<string, string>> => {
    const { data } = await (supabase as any).from("profiles").select("user_id, display_name");
    return new Map<string, string>((data || []).map((p: any) => [p.user_id, p.display_name]));
  };

  const fetchDeviceLogs = async (pMap: Map<string, string>) => {
    setDeviceLoading(true);
    const [logsRes, screensRes] = await Promise.all([
      (supabase as any).from("screen_logs").select("id, screen_id, org_id, event_type, event_title, event_detail, created_at, created_by").order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("screens").select("id, name"),
    ]);
    const sMap = new Map((screensRes.data || []).map((s: any) => [s.id, s.name]));
    setDeviceLogs((logsRes.data || []).map((l: any) => ({
      ...l,
      screen_name: sMap.get(l.screen_id) || "Unknown",
      operator_name: l.created_by ? (pMap.get(l.created_by) || "Unknown") : undefined,
    })));
    setScreens(screensRes.data || []);
    setDeviceLoading(false);
  };

  const fetchActivityLogs = async (pMap: Map<string, string>) => {
    setActivityLoading(true);
    const { data } = await (supabase as any).from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
    setActivityLogs((data || []).map((l: any) => ({
      ...l,
      user_name: pMap.get(l.user_id) || "Unknown",
    })));
    setActivityLoading(false);
  };

  const fetchAll = async () => {
    const pMap = await fetchProfiles();
    setProfileMap(pMap);
    await Promise.all([fetchDeviceLogs(pMap), fetchActivityLogs(pMap)]);
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Device filters ---
  const filteredDevice = useMemo(() => {
    return deviceLogs.filter(l => {
      if (deviceFilterType !== "all" && l.event_type !== deviceFilterType) return false;
      if (deviceFilterScreen !== "all" && l.screen_id !== deviceFilterScreen) return false;
      if (deviceFilterOrg === "none" && l.org_id) return false;
      if (deviceFilterOrg !== "all" && deviceFilterOrg !== "none" && l.org_id !== deviceFilterOrg) return false;
      if (deviceSearch && !l.event_title.includes(deviceSearch) && !l.event_detail.includes(deviceSearch) && !(l.screen_name || "").includes(deviceSearch)) return false;
      return true;
    });
  }, [deviceLogs, deviceFilterType, deviceFilterScreen, deviceFilterOrg, deviceSearch]);

  // --- Activity filters ---
  const filteredActivity = useMemo(() => {
    let timeStart: Date | null = null;
    if (activityFilterTime === "today") timeStart = startOfDay(new Date());
    else if (activityFilterTime === "week") timeStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    else if (activityFilterTime === "month") timeStart = startOfMonth(new Date());

    return activityLogs.filter(l => {
      if (activityFilterCategory !== "all" && l.category !== activityFilterCategory) return false;
      if (activityFilterOrg === "none" && l.org_id) return false;
      if (activityFilterOrg !== "all" && activityFilterOrg !== "none" && l.org_id !== activityFilterOrg) return false;
      if (timeStart && !isAfter(new Date(l.created_at), timeStart)) return false;
      if (activitySearch && !l.action.includes(activitySearch) && !l.target_name.includes(activitySearch) && !l.detail.includes(activitySearch) && !(l.user_name || "").includes(activitySearch)) return false;
      return true;
    });
  }, [activityLogs, activityFilterCategory, activityFilterOrg, activityFilterTime, activitySearch]);

  const labels = {
    title: { zh: "系統紀錄", en: "System Logs", ja: "システムログ" },
    subtitle: { zh: "查看設備狀態與使用者操作紀錄", en: "View device status and user activity logs", ja: "デバイスステータスとユーザー操作ログを表示" },
    tabDevice: { zh: "設備紀錄", en: "Device Logs", ja: "デバイスログ" },
    tabActivity: { zh: "操作紀錄", en: "Activity Logs", ja: "操作ログ" },
    searchPlaceholder: { zh: "搜尋紀錄...", en: "Search logs...", ja: "ログを検索..." },
    allTypes: { zh: "所有類型", en: "All Types", ja: "全タイプ" },
    allCategories: { zh: "所有分類", en: "All Categories", ja: "全カテゴリ" },
    allScreens: { zh: "所有螢幕", en: "All Screens", ja: "全スクリーン" },
    allOrgs: { zh: "所有組織", en: "All Orgs", ja: "全組織" },
    unassigned: { zh: "未分配", en: "Unassigned", ja: "未割当" },
    noLogs: { zh: "暫無紀錄", en: "No logs found", ja: "ログなし" },
    totalLogs: { zh: "共 {count} 筆紀錄", en: "{count} logs", ja: "{count} 件のログ" },
    exportExcel: { zh: "匯出 Excel", en: "Export Excel", ja: "Excelエクスポート" },
    allTime: { zh: "所有時間", en: "All Time", ja: "全期間" },
    today: { zh: "今天", en: "Today", ja: "今日" },
    thisWeek: { zh: "本週", en: "This Week", ja: "今週" },
    thisMonth: { zh: "本月", en: "This Month", ja: "今月" },
  };

  const handleExportDeviceExcel = () => {
    const headers = { zh: ["時間", "螢幕", "操作者", "事件類型", "事件標題", "詳細"], en: ["Time", "Screen", "Operator", "Type", "Title", "Detail"], ja: ["時間", "スクリーン", "操作者", "タイプ", "タイトル", "詳細"] }[language];
    const rows = filteredDevice.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.screen_name || "", l.operator_name || "-",
      (DEVICE_TYPE_CONFIG[l.event_type]?.label[language]) || l.event_type,
      l.event_title, l.event_detail,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 36 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, labels.tabDevice[language]);
    XLSX.writeFile(wb, `device-logs-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  };

  const handleExportActivityExcel = () => {
    const headers = { zh: ["時間", "操作人員", "操作內容", "分類", "目標", "詳細", "IP 地址"], en: ["Time", "Operator", "Action", "Category", "Target", "Detail", "IP Address"], ja: ["時間", "操作者", "操作内容", "カテゴリ", "対象", "詳細", "IPアドレス"] }[language];
    const rows = filteredActivity.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
      l.user_name || "", l.action,
      (ACTIVITY_CATEGORY_CONFIG[l.category]?.label[language]) || l.category,
      l.target_name || l.target_type, l.detail, l.ip_address || "-",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 20 }, { wch: 36 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, labels.tabActivity[language]);
    XLSX.writeFile(wb, `activity-logs-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`);
  };

  const currentFiltered = activeTab === "device" ? filteredDevice : filteredActivity;
  const handleExport = activeTab === "device" ? handleExportDeviceExcel : handleExportActivityExcel;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{labels.title[language]}</h1>
          <p className="text-sm text-muted-foreground mt-1">{labels.subtitle[language]}</p>
        </div>
        <div className="flex gap-2 self-start">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={currentFiltered.length === 0}>
            <Download className="w-4 h-4" />
            {labels.exportExcel[language]}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="device" className="gap-1.5">
            <Monitor className="w-3.5 h-3.5" />{labels.tabDevice[language]}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <User className="w-3.5 h-3.5" />{labels.tabActivity[language]}
          </TabsTrigger>
        </TabsList>

        {/* ===== Device Logs Tab ===== */}
        <TabsContent value="device" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={labels.searchPlaceholder[language]} value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={deviceFilterType} onValueChange={setDeviceFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allTypes[language]}</SelectItem>
                {Object.entries(DEVICE_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label[language]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deviceFilterScreen} onValueChange={setDeviceFilterScreen}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allScreens[language]}</SelectItem>
                {screens.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && orgs.length > 0 && (
              <Select value={deviceFilterOrg} onValueChange={setDeviceFilterOrg}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{labels.allOrgs[language]}</SelectItem>
                  <SelectItem value="none">{labels.unassigned[language]}</SelectItem>
                  {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{labels.totalLogs[language].replace("{count}", String(filteredDevice.length))}</p>
          {deviceLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredDevice.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>{labels.noLogs[language]}</p></Card>
          ) : (
            <div className="space-y-2">
              {filteredDevice.map((log, i) => {
                const cfg = DEVICE_TYPE_CONFIG[log.event_type] || DEVICE_TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <Card key={log.id} className={`p-3 flex items-start gap-3 shadow-sm opacity-0 animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
                    <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.color}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{log.event_title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{cfg.label[language]}</Badge>
                      </div>
                      {log.event_detail && <p className="text-xs text-muted-foreground mt-0.5">{log.event_detail}</p>}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground/60">
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{log.screen_name}</span>
                        {log.operator_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.operator_name}</span>}
                        <span>{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== Activity Logs Tab ===== */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={labels.searchPlaceholder[language]} value={activitySearch} onChange={e => setActivitySearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={activityFilterCategory} onValueChange={setActivityFilterCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allCategories[language]}</SelectItem>
                {Object.entries(ACTIVITY_CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label[language]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activityFilterTime} onValueChange={setActivityFilterTime}>
              <SelectTrigger className="w-[130px]">
                <CalendarClock className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allTime[language]}</SelectItem>
                <SelectItem value="today">{labels.today[language]}</SelectItem>
                <SelectItem value="week">{labels.thisWeek[language]}</SelectItem>
                <SelectItem value="month">{labels.thisMonth[language]}</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && orgs.length > 0 && (
              <Select value={activityFilterOrg} onValueChange={setActivityFilterOrg}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{labels.allOrgs[language]}</SelectItem>
                  <SelectItem value="none">{labels.unassigned[language]}</SelectItem>
                  {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{labels.totalLogs[language].replace("{count}", String(filteredActivity.length))}</p>
          {activityLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredActivity.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>{labels.noLogs[language]}</p></Card>
          ) : (
            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[160px]">{{ zh: "操作人員", en: "Operator", ja: "操作者" }[language]}</TableHead>
                    <TableHead>{{ zh: "操作內容", en: "Action", ja: "操作内容" }[language]}</TableHead>
                    <TableHead className="w-[120px]">{{ zh: "操作時間", en: "Time", ja: "時間" }[language]}</TableHead>
                    <TableHead className="w-[130px]">{{ zh: "IP 地址", en: "IP Address", ja: "IPアドレス" }[language]}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivity.map((log) => {
                    const colors = getActionColor(log.action, log.category);
                    return (
                      <TableRow key={log.id} className={`${colors.bg} border-b border-border/50 transition-colors`}>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{log.user_name || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                            <div className="min-w-0">
                              <span className={`text-sm font-medium ${colors.text}`}>{log.action}</span>
                              {log.target_name && <span className="text-xs text-muted-foreground ml-2">— {log.target_name}</span>}
                              {log.detail && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{log.detail}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                          {log.ip_address || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
