import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, ShieldCheck, Users, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserWithRole {
  user_id: string; display_name: string | null; avatar_url: string | null; role: "admin" | "user";
}

export default function AdminPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [changeDialog, setChangeDialog] = useState<{ user: UserWithRole; newRole: "admin" | "user" } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!isAdmin) return; fetchUsers(); }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (profiles && roles) {
      const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
      setUsers(profiles.map((p) => ({ user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url, role: (roleMap.get(p.user_id) as "admin" | "user") ?? "user" })));
    }
    setLoading(false);
  };

  const handleRoleChange = async () => {
    if (!changeDialog) return;
    setSaving(true);
    const { user, newRole } = changeDialog;
    await supabase.from("user_roles").delete().eq("user_id", user.user_id);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.user_id, role: newRole });
    if (error) { toast.error(`${t("adminRoleUpdateFailed")}：${error.message}`); }
    else { toast.success(t("adminRoleUpdated")); fetchUsers(); }
    setSaving(false); setChangeDialog(null);
  };

  if (roleLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">{t("adminNoPermission")}</h2>
          <p className="text-sm text-muted-foreground">{t("adminNoPermissionDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">{t("adminTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("adminSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="opacity-0 animate-fade-in stagger-1">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{users.length}</p><p className="text-sm text-muted-foreground">{t("adminTotalUsers")}</p></div>
          </CardContent>
        </Card>
        <Card className="opacity-0 animate-fade-in stagger-2">
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-warning" /></div>
            <div><p className="text-2xl font-bold text-foreground">{users.filter((u) => u.role === "admin").length}</p><p className="text-sm text-muted-foreground">{t("adminAdminCount")}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="opacity-0 animate-fade-in stagger-3">
        <CardHeader>
          <CardTitle className="text-lg">{t("adminUserList")}</CardTitle>
          <CardDescription>{t("adminUserListDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{(user.display_name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.display_name || t("adminUnnamed")}</p>
                      <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="gap-1">
                      {user.role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {user.role === "admin" ? t("adminRole") : t("adminRegularUser")}
                    </Badge>
                    <Select value={user.role} onValueChange={(value: "admin" | "user") => { if (value !== user.role) setChangeDialog({ user, newRole: value }); }}>
                      <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t("adminRole")}</SelectItem>
                        <SelectItem value="user">{t("adminRegularUser")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!changeDialog} onOpenChange={() => setChangeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminConfirmChange")}</DialogTitle>
            <DialogDescription>
              {t("adminConfirmChangeDesc")} <strong>{changeDialog?.user.display_name || t("user")}</strong> {t("adminChangeRoleTo")} <strong>{changeDialog?.newRole === "admin" ? t("adminRole") : t("adminRegularUser")}</strong>？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialog(null)}>{t("cancel")}</Button>
            <Button onClick={handleRoleChange} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("adminConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
