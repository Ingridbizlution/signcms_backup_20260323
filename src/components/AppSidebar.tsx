import { LayoutDashboard, Monitor, Image, CalendarClock, ShieldCheck, Brush, Send, FileText, Store, Megaphone, Users, CloudSun, Instagram, DoorOpen, Languages, Clock } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useInstalledApps, APP_DEFINITIONS } from "@/contexts/InstalledAppsContext";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const INSTALLED_ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  queue: Users,
  weather: CloudSun,
  social: Instagram,
  "meeting-room": DoorOpen,
  multilingual: Languages,
  attendance: Clock,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { t, language } = useLanguage();
  const { installedApps } = useInstalledApps();

  const navItems = [
    { titleKey: "navDashboard" as const, url: "/", icon: LayoutDashboard, adminOnly: false },
    { titleKey: "navScreens" as const, url: "/screens", icon: Monitor, adminOnly: false },
    { titleKey: "navMedia" as const, url: "/media", icon: Image, adminOnly: false },
    { titleKey: "navStudio" as const, url: "/studio", icon: Brush, adminOnly: false },
    { titleKey: "navSchedules" as const, url: "/schedules", icon: CalendarClock, adminOnly: false },
    { titleKey: "navPublishing" as const, url: "/publishing", icon: Send, adminOnly: false },
    { titleKey: "navDeviceLogs" as const, url: "/device-logs", icon: FileText, adminOnly: false },
    { titleKey: "navAdmin" as const, url: "/admin", icon: ShieldCheck, adminOnly: true },
  ];

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const installedAppDefs = APP_DEFINITIONS.filter((a) => installedApps.has(a.id));

  const sectionLabel: Record<Language, string> = { zh: "擴充應用", en: "Extensions", ja: "拡張アプリ" };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2">
        <img src={logoImg} alt="SignCMS" className="h-8 shrink-0 object-contain" style={collapsed ? { width: 30 } : {}} />
      </div>
      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-3 h-[18px] w-[18px]" />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-3 my-1" />

        {/* Extensions section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wider px-3">
            {!collapsed && sectionLabel[language]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* App Store link */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/app-store"
                    className="hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  >
                    <Store className="mr-3 h-[18px] w-[18px]" />
                    {!collapsed && <span>{t("navAppStore")}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Installed apps */}
              {installedAppDefs.map((app) => {
                const Icon = INSTALLED_ICONS[app.id] || Store;
                return (
                  <SidebarMenuItem key={app.id}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={app.id === "announcement" ? "/announcement" : app.id === "queue" ? "/queue" : app.id === "meeting-room" ? "/meeting-room" : `/app-store?open=${app.id}`}
                        className="hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <div className={`mr-3 h-[18px] w-[18px] rounded bg-gradient-to-br ${app.color} flex items-center justify-center`}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        {!collapsed && <span className="text-sm">{app.name[language]}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
