import { useState, useEffect } from "react";
import { Monitor, Plus, Pencil, Trash2, Search, MapPin, Loader2, FolderPlus, Layers } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Screen {
  id: string;
  name: string;
  branch: string;
  location: string;
  resolution: string;
  online: boolean;
}

const emptyForm = { name: "", branch: "", location: "", resolution: "1920×1080" };

export default function ScreensPage() {
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Dynamic groups
  const [groups, setGroups] = useState<string[]>([]);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingInForm, setIsCreatingInForm] = useState(false);
  const [inlineNewGroup, setInlineNewGroup] = useState("");

  const fetchScreens = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("screens").select("id, name, branch, location, resolution, online").order("created_at", { ascending: true });
    if (error) { toast.error(error.message); }
    else {
      setScreens(data || []);
      // Derive unique groups from existing screens
      const uniqueGroups = Array.from(new Set((data || []).map((s: Screen) => s.branch).filter(Boolean))) as string[];
      setGroups((prev) => {
        const merged = new Set([...prev, ...uniqueGroups]);
        return Array.from(merged).sort();
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchScreens(); }, []);

  const filtered = screens.filter((s) => {
    const matchSearch = s.name.includes(search) || s.branch.includes(search) || s.location.includes(search);
    const matchGroup = groupFilter === "all" || s.branch === groupFilter;
    return matchSearch && matchGroup;
  });

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setIsCreatingInForm(false); setInlineNewGroup(""); setDialogOpen(true); };
  const openEdit = (screen: Screen) => {
    setEditingId(screen.id);
    setForm({ name: screen.name, branch: screen.branch, location: screen.location, resolution: screen.resolution });
    setIsCreatingInForm(false);
    setInlineNewGroup("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const finalBranch = isCreatingInForm ? inlineNewGroup.trim() : form.branch;
    if (!form.name || !finalBranch) { toast.error(t("screensFillRequired")); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await (supabase as any).from("screens").update({ name: form.name, branch: finalBranch, location: form.location, resolution: form.resolution, updated_at: new Date().toISOString() }).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success(t("screensUpdated"));
    } else {
      const { error } = await (supabase as any).from("screens").insert({ name: form.name, branch: finalBranch, location: form.location, resolution: form.resolution, uploaded_by: user?.id });
      if (error) toast.error(error.message);
      else toast.success(t("screensAdded"));
    }
    // Add new group to local list
    if (isCreatingInForm && inlineNewGroup.trim()) {
      setGroups((prev) => Array.from(new Set([...prev, inlineNewGroup.trim()])).sort());
    }
    setSaving(false);
    setDialogOpen(false);
    setIsCreatingInForm(false);
    setInlineNewGroup("");
    fetchScreens();
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await (supabase as any).from("screens").delete().eq("id", deleteId);
      if (error) toast.error(error.message);
      else { toast.success(t("screensDeleted")); fetchScreens(); }
      setDeleteId(null);
    }
  };

  const handleAddGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (groups.includes(name)) { toast.error("Group already exists"); return; }
    setGroups((prev) => [...prev, name].sort());
    toast.success(t("screensGroupCreated"));
    setNewGroupName("");
    setNewGroupDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("screensTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("screensSubtitle")}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 self-start">
            <Button variant="outline" onClick={() => setNewGroupDialogOpen(true)} className="gap-2">
              <FolderPlus className="w-4 h-4" />
              {t("screensNewGroup")}
            </Button>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("screensAdd")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("screensSearchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t("allGroups")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGroups")}</SelectItem>
            {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Group chips */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {groups.map((g) => {
            const count = screens.filter((s) => s.branch === g).length;
            return (
              <button
                key={g}
                onClick={() => setGroupFilter(groupFilter === g ? "all" : g)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  groupFilter === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <Layers className="w-3 h-3" />
                {g}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  groupFilter === g ? "bg-primary-foreground/20" : "bg-background"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <Card className="p-12 text-center text-muted-foreground">
              <Monitor className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("screensNoResult")}</p>
            </Card>
          )}
          {filtered.map((screen, i) => (
            <Card key={screen.id} className={`p-4 flex items-center gap-4 hover-lift shadow-sm opacity-0 animate-fade-in stagger-${Math.min(i + 1, 8)}`}>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Monitor className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground truncate">{screen.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    screen.online ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${screen.online ? "bg-success" : "bg-destructive"}`} />
                    {screen.online ? t("online") : t("offline")}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{screen.branch || t("screensUngrouped")}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{screen.location}</span>
                  <span>{screen.resolution}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(screen)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(screen.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Screen Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? t("screensEditTitle") : t("screensAddTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("screensName")} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("screensNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("screensBranch")} *</Label>
              {isCreatingInForm ? (
                <div className="flex gap-2">
                  <Input
                    value={inlineNewGroup}
                    onChange={(e) => setInlineNewGroup(e.target.value)}
                    placeholder={t("screensNewGroupPlaceholder")}
                    className="flex-1"
                    autoFocus
                  />
                  <Button variant="outline" size="sm" onClick={() => { setIsCreatingInForm(false); setInlineNewGroup(""); }}>
                    {t("cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t("screensSelectBranch")} /></SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsCreatingInForm(true)} title={t("screensNewGroup")}>
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("screensLocation")}</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("screensLocationPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("screensResolution")}</Label>
              <Select value={form.resolution} onValueChange={(v) => setForm({ ...form, resolution: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920×1080">1920×1080 (FHD)</SelectItem>
                  <SelectItem value="3840×2160">3840×2160 (4K)</SelectItem>
                  <SelectItem value="1080×1920">1080×1920 (Portrait FHD)</SelectItem>
                  <SelectItem value="2160×3840">2160×3840 (Portrait 4K)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? t("screensSaveChanges") : t("screensAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderPlus className="w-5 h-5 text-primary" />{t("screensNewGroup")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("screensNewGroup")} *</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t("screensNewGroupPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              />
            </div>
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("screensManageGroups")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                      <Layers className="w-3 h-3" />
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("screensNewGroup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("screensDeleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("screensDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("confirmDelete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
