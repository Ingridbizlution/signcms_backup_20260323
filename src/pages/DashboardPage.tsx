import { Monitor, WifiOff, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "success" | "warning";
  className?: string;
}

function StatCard({ title, value, icon, subtitle, variant = "default", className = "" }: StatCardProps) {
  const variantClasses = {
    default: "bg-card",
    success: "bg-card border-success/20",
    warning: "bg-card border-warning/20",
  };

  return (
    <Card className={`p-5 ${variantClasses[variant]} hover-lift shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { t, language } = useLanguage();

  const mockScreens = [
    { id: 1, name: "台北信義店 - 1F 入口", branch: "台北信義店", online: true, lastSeen: t("dashJustNow") },
    { id: 2, name: "台北信義店 - B1 美食街", branch: "台北信義店", online: true, lastSeen: `1 ${t("dashMinAgo")}` },
    { id: 3, name: "台中逢甲店 - 門口大螢幕", branch: "台中逢甲店", online: false, lastSeen: `15 ${t("dashMinAgo")}` },
    { id: 4, name: "高雄巨蛋店 - 結帳區", branch: "高雄巨蛋店", online: true, lastSeen: t("dashJustNow") },
    { id: 5, name: "新竹竹北店 - 大廳", branch: "新竹竹北店", online: true, lastSeen: `2 ${t("dashMinAgo")}` },
    { id: 6, name: "台南永康店 - 門口", branch: "台南永康店", online: false, lastSeen: `32 ${t("dashMinAgo")}` },
  ];

  const onlineCount = mockScreens.filter((s) => s.online).length;
  const offlineCount = mockScreens.filter((s) => !s.online).length;

  const ScreenCard = ({ screen, index }: { screen: typeof mockScreens[0]; index: number }) => (
    <Card className={`overflow-hidden hover-lift shadow-sm group cursor-pointer opacity-0 animate-slide-up stagger-${index + 1}`}>
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
        <Monitor className="w-10 h-10 text-muted-foreground/40 transition-transform duration-300 group-hover:scale-110" />
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-transform duration-200 group-hover:scale-105 ${
          screen.online ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        }`}>
          <span className={`w-2 h-2 rounded-full ${screen.online ? "bg-success animate-pulse" : "bg-destructive"}`} />
          {screen.online ? t("online") : t("offline")}
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {screen.name}
        </h3>
        <p className="text-xs text-muted-foreground">{screen.branch} · {screen.lastSeen}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{t("dashTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t("dashOnlineScreens")}
          value={onlineCount}
          icon={<Monitor className="w-5 h-5 text-success" />}
          subtitle={t("dashRunningNormal")}
          variant="success"
          className="opacity-0 animate-count-up stagger-1"
        />
        <StatCard
          title={t("dashOfflineWarning")}
          value={offlineCount}
          icon={<WifiOff className="w-5 h-5 text-destructive" />}
          subtitle={t("dashNeedCheck")}
          variant="warning"
          className="opacity-0 animate-count-up stagger-2"
        />
        <StatCard
          title={t("dashTodayPlays")}
          value="1,280"
          icon={<PlayCircle className="w-5 h-5 text-primary" />}
          subtitle={t("dashPlayCount")}
          className="opacity-0 animate-count-up stagger-3"
        />
      </div>

      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashScreenList")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockScreens.map((screen, i) => (
            <ScreenCard key={screen.id} screen={screen} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
