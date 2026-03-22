import { useState, useEffect, useCallback } from "react";
import { Radio, Monitor, RefreshCw, Loader2, Activity, Thermometer, Wind, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface IotDevice {
  id: string;
  name: string;
  device_type: string;
  status: string;
  screen_id: string;
  screens?: { id: string; name: string; branch: string; location: string };
}

interface SensorReading {
  time: string;
  value: number;
  label: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; unit: string; color: string; range: [number, number]; alertThreshold: number }> = {
  air_quality: { label: "空氣品質 (AQI)", icon: "🌬️", unit: "AQI", color: "hsl(var(--primary))", range: [20, 150], alertThreshold: 100 },
  earthquake: { label: "地震震度", icon: "🔔", unit: "gal", color: "hsl(var(--destructive))", range: [0, 5], alertThreshold: 3 },
  fire: { label: "煙霧濃度", icon: "🔥", unit: "%", color: "hsl(210, 70%, 50%)", range: [0, 30], alertThreshold: 15 },
  temperature: { label: "溫度", icon: "🌡️", unit: "°C", color: "hsl(150, 60%, 45%)", range: [18, 35], alertThreshold: 32 },
  noise: { label: "噪音", icon: "🔊", unit: "dB", color: "hsl(270, 50%, 55%)", range: [30, 90], alertThreshold: 70 },
};

function generateMockReadings(type: string, count: number = 20): SensorReading[] {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.air_quality;
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(now - (count - 1 - i) * 30000);
    const base = (cfg.range[0] + cfg.range[1]) / 2;
    const amplitude = (cfg.range[1] - cfg.range[0]) / 3;
    const value = Math.round((base + Math.sin(i * 0.5) * amplitude * 0.5 + (Math.random() - 0.5) * amplitude) * 10) / 10;
    return {
      time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`,
      value: Math.max(cfg.range[0] * 0.5, Math.min(cfg.range[1] * 1.2, value)),
      label: `${value} ${cfg.unit}`,
    };
  });
}

function generateCurrentValue(type: string): number {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.air_quality;
  const base = (cfg.range[0] + cfg.range[1]) / 2;
  const amplitude = (cfg.range[1] - cfg.range[0]) / 3;
  return Math.round((base + (Math.random() - 0.5) * amplitude) * 10) / 10;
}

export default function IoTDashboardPage() {
  const { language } = useLanguage();
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenFilter, setScreenFilter] = useState("all");
  const [sensorData, setSensorData] = useState<Record<string, SensorReading[]>>({});
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("iot_devices")
      .select("*, screens(id, name, branch, location)")
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else {
      setDevices(data || []);
      // Initialize mock data for each device
      const initialData: Record<string, SensorReading[]> = {};
      const initialValues: Record<string, number> = {};
      (data || []).forEach((d: IotDevice) => {
        initialData[d.id] = generateMockReadings(d.device_type);
        initialValues[d.id] = generateCurrentValue(d.device_type);
      });
      setSensorData(initialData);
      setCurrentValues(initialValues);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Simulate real-time updates every 5 seconds
  useEffect(() => {
    if (devices.length === 0) return;
    const interval = setInterval(() => {
      setSensorData((prev) => {
        const next = { ...prev };
        devices.forEach((d) => {
          if (!next[d.id]) return;
          const newReading = generateMockReadings(d.device_type, 1)[0];
          next[d.id] = [...next[d.id].slice(1), newReading];
        });
        return next;
      });
      setCurrentValues((prev) => {
        const next = { ...prev };
        devices.forEach((d) => {
          next[d.id] = generateCurrentValue(d.device_type);
        });
        return next;
      });
      setLastRefresh(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [devices]);

  const screens = Array.from(new Map(devices.filter(d => d.screens).map(d => [d.screens!.id, d.screens!])).values());

  const filteredDevices = screenFilter === "all" ? devices : devices.filter(d => d.screen_id === screenFilter);

  const onlineCount = filteredDevices.filter(d => d.status === "online").length;
  const alertCount = filteredDevices.filter(d => {
    const cfg = TYPE_CONFIG[d.device_type];
    const val = currentValues[d.id];
    return cfg && val !== undefined && val >= cfg.alertThreshold;
  }).length;

  const title = language === "en" ? "IoT Monitoring Dashboard" : language === "ja" ? "IoT モニタリングダッシュボード" : "IoT 即時監控儀表板";
  const subtitle = language === "en" ? "Real-time sensor data from all connected screens" : language === "ja" ? "接続されたスクリーンのリアルタイムセンサーデータ" : "即時顯示各螢幕連接的感測器數據";

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {language === "en" ? "Last update" : "最後更新"}: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchDevices} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            {language === "en" ? "Refresh" : "重新整理"}
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{filteredDevices.length}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Total Devices" : "裝置總數"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Online" : "在線裝置"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Monitor className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{screens.length}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Screens" : "連接螢幕"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alertCount > 0 ? "bg-destructive/10" : "bg-success/10"}`}>
              <AlertTriangle className={`w-5 h-5 ${alertCount > 0 ? "text-destructive" : "text-success"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{alertCount}</p>
              <p className="text-xs text-muted-foreground">{language === "en" ? "Alerts" : "異常警報"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={screenFilter} onValueChange={setScreenFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={language === "en" ? "All Screens" : "所有螢幕"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "en" ? "All Screens" : "所有螢幕"}</SelectItem>
            {screens.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3 h-3" /> {s.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {language === "en" ? "Auto-refresh: 5s" : "自動刷新: 每 5 秒"}
        </Badge>
      </div>

      {/* Device cards with charts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDevices.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{language === "en" ? "No IoT devices found" : "尚未有 IoT 裝置連接"}</p>
          <p className="text-xs mt-1">{language === "en" ? "Add devices from the Screens page" : "請至螢幕管理頁面新增 IoT 裝置"}</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDevices.map((device) => {
            const cfg = TYPE_CONFIG[device.device_type] || TYPE_CONFIG.air_quality;
            const readings = sensorData[device.id] || [];
            const currentVal = currentValues[device.id] ?? 0;
            const isAlert = currentVal >= cfg.alertThreshold;

            return (
              <Card key={device.id} className={`p-5 transition-all ${isAlert ? "ring-2 ring-destructive/50" : ""}`}>
                {/* Device header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{device.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {device.screens?.name || "Unknown"}
                        {device.screens?.location && ` · ${device.screens.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${isAlert ? "text-destructive" : "text-foreground"}`}>
                      {currentVal}
                    </p>
                    <p className="text-xs text-muted-foreground">{cfg.unit}</p>
                  </div>
                </div>

                {/* Status + alert */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={device.status === "online" ? "default" : "secondary"} className="text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${device.status === "online" ? "bg-success" : "bg-destructive"}`} />
                    {device.status === "online" ? (language === "en" ? "Online" : "連線中") : (language === "en" ? "Offline" : "離線")}
                  </Badge>
                  {isAlert && (
                    <Badge variant="destructive" className="text-[10px] gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      {language === "en" ? "Alert" : "超標警報"}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {language === "en" ? "Threshold" : "閾值"}: {cfg.alertThreshold} {cfg.unit}
                  </span>
                </div>

                {/* Chart */}
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={readings} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`grad-${device.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={cfg.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`${value} ${cfg.unit}`, cfg.label]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={cfg.color}
                        strokeWidth={2}
                        fill={`url(#grad-${device.id})`}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
