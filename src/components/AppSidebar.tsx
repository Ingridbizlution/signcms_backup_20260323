import { LayoutDashboard, Monitor, Image, CalendarClock, ShieldCheck, Brush, Send, FileText, Store } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();

  const navItems = [
    { titleKey: "navDashboard" as const, url: "/", icon: LayoutDashboard, adminOnly: false },
    { titleKey: "navScreens" as const, url: "/screens", icon: Monitor, adminOnly: false },
    { titleKey: "navMedia" as const, url: "/media", icon: Image, adminOnly: false },
    { titleKey: "navStudio" as const, url: "/studio", icon: Brush, adminOnly: false },
    { titleKey: "navSchedules" as const, url: "/schedules", icon: CalendarClock, adminOnly: false },
    { titleKey: "navPublishing" as const, url: "/publishing", icon: Send, adminOnly: false },
    { titleKey: "navDeviceLogs" as const, url: "/device-logs", icon: FileText, adminOnly: false },
    { titleKey: "navAppStore" as const, url: "/app-store", icon: Store, adminOnly: false },
    { titleKey: "navAdmin" as const, url: "/admin", icon: ShieldCheck, adminOnly: true },
  ];

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2">
        <img src={logoImg} alt="SignCMS" className="h-8 shrink-0 object-contain" style={collapsed ? { width: 30 } : {}} />
      </div>
      <SidebarContent>
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
      </SidebarContent>
    </Sidebar>
  );
}
