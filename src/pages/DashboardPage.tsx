import { Monitor, WifiOff, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "success" | "warning";
}

function StatCard({ title, value, icon, subtitle, variant = "default" }: StatCardProps) {
  const variantClasses = {
    default: "bg-card",
    success: "bg-card border-success/20",
    warning: "bg-card border-warning/20",
  };

  return (
    <Card className={`p-5 ${variantClasses[variant]} shadow-sm hover:shadow-md transition-shadow`}>
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

const mockScreens = [
  { id: 1, name: "台北信義店 - 1F 入口", branch: "台北信義店", online: true, lastSeen: "剛剛" },
  { id: 2, name: "台北信義店 - B1 美食街", branch: "台北信義店", online: true, lastSeen: "1 分鐘前" },
  { id: 3, name: "台中逢甲店 - 門口大螢幕", branch: "台中逢甲店", online: false, lastSeen: "15 分鐘前" },
  { id: 4, name: "高雄巨蛋店 - 結帳區", branch: "高雄巨蛋店", online: true, lastSeen: "剛剛" },
  { id: 5, name: "新竹竹北店 - 大廳", branch: "新竹竹北店", online: true, lastSeen: "2 分鐘前" },
  { id: 6, name: "台南永康店 - 門口", branch: "台南永康店", online: false, lastSeen: "32 分鐘前" },
];

const ScreenCard = ({ screen }: { screen: typeof mockScreens[0] }) => {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer">
      <div className="aspect-video bg-muted relative flex items-center justify-center">
        <Monitor className="w-10 h-10 text-muted-foreground/40" />
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          screen.online
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
        }`}>
          <span className={`w-2 h-2 rounded-full ${screen.online ? "bg-success animate-pulse" : "bg-destructive"}`} />
          {screen.online ? "在線" : "離線"}
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {screen.name}
        </h3>
        <p className="text-xs text-muted-foreground">{screen.branch} · {screen.lastSeen}</p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const onlineCount = mockScreens.filter((s) => s.online).length;
  const offlineCount = mockScreens.filter((s) => !s.online).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">總覽儀表板</h1>
        <p className="text-sm text-muted-foreground mt-1">即時監控所有分店電子看板狀態</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="在線螢幕"
          value={onlineCount}
          icon={<Monitor className="w-5 h-5 text-success" />}
          subtitle="運行正常"
          variant="success"
        />
        <StatCard
          title="離線螢幕警告"
          value={offlineCount}
          icon={<WifiOff className="w-5 h-5 text-destructive" />}
          subtitle="需要檢查"
          variant="warning"
        />
        <StatCard
          title="今日預計播放"
          value="1,280"
          icon={<PlayCircle className="w-5 h-5 text-primary" />}
          subtitle="次廣告輪播"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">分店螢幕列表</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockScreens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </div>
      </div>
    </div>
  );
}
