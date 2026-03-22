import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

interface Org {
  id: string;
  name: string;
  description: string;
  created_at: string;
  teamCount: number;
  memberCount: number;
}

export default function OrgManagement() {
  const { t } = useLanguage();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Org | null>(null);

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data: orgData } = await supabase.from("organizations").select("*");
    const { data: teams } = await supabase.from("teams").select("id, org_id");
    const { data: members } = await supabase.from("team_members").select("id, team_id");

    if (orgData) {
      const teamsByOrg = new Map<string, string[]>();
      teams?.forEach(t => {
        const list = teamsByOrg.get(t.org_id) || [];
        list.push(t.id);
        teamsByOrg.set(t.org_id, list);
      });

      setOrgs(orgData.map(o => {
        const orgTeamIds = teamsByOrg.get(o.id) || [];
        const memberCount = members?.filter(m => orgTeamIds.includes(m.team_id)).length || 0;
        return { ...o, description: o.description || "", teamCount: orgTeamIds.length, memberCount };
      }));
    }
    setLoading(false);
  };

  const openAdd = () => { setEditOrg(null); setName(""); setDescription(""); setDialogOpen(true); };
  const openEdit = (org: Org) => { setEditOrg(org); setName(org.name); setDescription(org.description); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t("orgFillRequired")); return; }
    setSaving(true);
    if (editOrg) {
      const { error } = await supabase.from("organizations").update({ name: name.trim(), description: description.trim() }).eq("id", editOrg.id);
      if (error) toast.error(error.message); else { toast.success(t("orgUpdated")); logActivity({ action: "編輯組織", category: "admin", targetName: name.trim(), targetId: editOrg.id }); fetchOrgs(); }
    } else {
      const { error } = await supabase.from("organizations").insert({ name: name.trim(), description: description.trim() });
      if (error) toast.error(error.message); else { toast.success(t("orgCreated")); logActivity({ action: "新增組織", category: "admin", targetName: name.trim() }); fetchOrgs(); }
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const { error } = await supabase.from("organizations").delete().eq("id", deleteDialog.id);
    if (error) toast.error(error.message); else { toast.success(t("orgDeleted")); logActivity({ action: "刪除組織", category: "admin", targetName: deleteDialog.name, targetId: deleteDialog.id }); fetchOrgs(); }
    setDeleteDialog(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("orgTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("orgSubtitle")}</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5"><Plus className="w-4 h-4" />{t("orgAdd")}</Button>
      </div>

      {orgs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t("orgNoOrgs")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {orgs.map(org => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{org.name}</h3>
                      {org.description && <p className="text-sm text-muted-foreground mt-0.5">{org.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{org.teamCount} {t("orgTeamCount")}</span>
                        <span>{org.memberCount} {t("orgMemberCount")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(org)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog(org)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editOrg ? t("edit") : t("orgAdd")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("orgName")}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("orgNamePlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("orgDescription")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("orgDescriptionPlaceholder")} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogDescription>{t("orgDeleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
