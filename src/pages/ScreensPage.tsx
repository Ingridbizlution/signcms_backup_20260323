import { useState, useEffect } from "react";
import { Monitor, Plus, Pencil, Trash2, Search, MapPin, Loader2, FolderPlus, Layers, MoreHorizontal, Settings, RotateCw, Power, RefreshCw, Eye, Moon, Play, Brush, FileText } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrgs } from "@/hooks/useUserOrgs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScreenLogPanel } from "@/components/ScreenLogPanel";

const UNGROUPED = "__ungrouped__";

interface Screen {
  id: string;
  name: string;
  branch: string;
  location: string;
  resolution: string;
  online: boolean;
  org_id?: string | null;
}

const emptyForm = { name: "", branch: "", location: "", resolution: "1920×1080", org_id: "" };

export default function ScreensPage() {
  const { isAdmin } = useUserRole();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { orgs, defaultOrgId } = useUserOrgs();
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

  // Group rename
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");

  // Screen settings
  const [settingsScreen, setSettingsScreen] = useState<Screen | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    ipMode: "dhcp",
    ipAddress: "",
    subnet: "255.255.255.0",
    gateway: "",
    dns: "8.8.8.8",
    ntpServer: "pool.ntp.org",
    rotation: "0",
    scheduleEnabled: false,
    scheduleOn: "08:00",
    scheduleOff: "22:00",
    defaultPlayback: "sleep" as "sleep" | "media" | "design",
    defaultMediaId: "",
    defaultDesignId: "",
  });
  const [rebootConfirmOpen, setRebootConfirmOpen] = useState(false);
  const [mediaOptions, setMediaOptions] = useState<{ id: string; name: string; type: string }[]>([]);
  const [designOptions, setDesignOptions] = useState<{ id: string; name: string }[]>([]);

  // Fetch media & design projects for default playback selector
  useEffect(() => {
    if (!settingsScreen) return;
    const fetchOptions = async () => {
      const [mediaRes, designRes] = await Promise.all([
        (supabase as any).from("media_items").select("id, name, type").in("type", ["image", "video"]).order("created_at", { ascending: false }),
        (supabase as any).from("design_projects").select("id, name").order("created_at", { ascending: false }),
      ]);
      setMediaOptions(mediaRes.data || []);
      setDesignOptions(designRes.data || []);
    };
    fetchOptions();
  }, [settingsScreen]);

  const [deleteGroupTarget, setDeleteGroupTarget] = useState<string | null>(null);

  const fetchScreens = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("screens").select("id, name, branch, location, resolution, online, org_id").order("created_at", { ascending: true });
    if (error) { toast.error(error.message); }
    else {
      setScreens(data || []);
      const uniqueGroups = Array.from(new Set((data || []).map((s: Screen) => s.branch).filter(Boolean))) as string[];
      setGroups((prev) => {
        const merged = new Set([...prev, ...uniqueGroups]);
        return Array.from(merged).sort();
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchScreens(); }, []);

  const ungroupedCount = screens.filter((s) => !s.branch).length;

  const filtered = screens.filter((s) => {
    const matchSearch = s.name.includes(search) || (s.branch || "").includes(search) || s.location.includes(search);
    if (groupFilter === "all") return matchSearch;
    if (groupFilter === UNGROUPED) return matchSearch && !s.branch;
    return matchSearch && s.branch === groupFilter;
  });

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, org_id: defaultOrgId || "" }); setIsCreatingInForm(false); setInlineNewGroup(""); setDialogOpen(true); };
  const openEdit = (screen: Screen) => {
    setEditingId(screen.id);
    setForm({ name: screen.name, branch: screen.branch || "", location: screen.location, resolution: screen.resolution, org_id: screen.org_id || "" });
    setIsCreatingInForm(false);
    setInlineNewGroup("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const finalBranch = isCreatingInForm ? inlineNewGroup.trim() : form.branch;
    if (!form.name) { toast.error(t("screensFillRequired")); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await (supabase as any).from("screens").update({ name: form.name, branch: finalBranch || "", location: form.location, resolution: form.resolution, org_id: form.org_id || null, updated_at: new Date().toISOString() }).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success(t("screensUpdated"));
    } else {
      const { error } = await (supabase as any).from("screens").insert({ name: form.name, branch: finalBranch || "", location: form.location, resolution: form.resolution, org_id: form.org_id || null, uploaded_by: user?.id });
      if (error) toast.error(error.message);
      else toast.success(t("screensAdded"));
    }
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
    if (groups.includes(name)) { toast.error(t("screensGroupExists")); return; }
    setGroups((prev) => [...prev, name].sort());
    toast.success(t("screensGroupCreated"));
    setNewGroupName("");
    setNewGroupDialogOpen(false);
  };

  const handleRenameGroup = async () => {
    const newName = renameValue.trim();
    if (!newName || !renameTarget) return;
    if (newName === renameTarget) { setRenameDialogOpen(false); return; }
    if (groups.includes(newName)) { toast.error(t("screensGroupExists")); return; }
    // Update all screens with old group name
    const { error } = await (supabase as any).from("screens").update({ branch: newName, updated_at: new Date().toISOString() }).eq("branch", renameTarget);
    if (error) { toast.error(error.message); return; }
    setGroups((prev) => prev.map((g) => g === renameTarget ? newName : g).sort());
    if (groupFilter === renameTarget) setGroupFilter(newName);
    toast.success(t("screensGroupRenamed"));
    setRenameDialogOpen(false);
    fetchScreens();
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupTarget) return;
    // Set screens in this group to empty (ungrouped)
    const { error } = await (supabase as any).from("screens").update({ branch: "", updated_at: new Date().toISOString() }).eq("branch", deleteGroupTarget);
    if (error) { toast.error(error.message); return; }
    setGroups((prev) => prev.filter((g) => g !== deleteGroupTarget));
    if (groupFilter === deleteGroupTarget) setGroupFilter("all");
    toast.success(t("screensGroupDeleted"));
    setDeleteGroupTarget(null);
    fetchScreens();
  };

  const openRename = (group: string) => {
    setRenameTarget(group);
    setRenameValue(group);
    setRenameDialogOpen(true);
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
            <SelectItem value={UNGROUPED}>{t("screensUngrouped")}</SelectItem>
            {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Group chips */}
      <div className="flex flex-wrap gap-2 animate-fade-in">
        {/* Ungrouped chip */}
        <button
          onClick={() => setGroupFilter(groupFilter === UNGROUPED ? "all" : UNGROUPED)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            groupFilter === UNGROUPED
              ? "bg-muted-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Layers className="w-3 h-3" />
          {t("screensUngrouped")}
          <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
            groupFilter === UNGROUPED ? "bg-background/20" : "bg-background"
          }`}>{ungroupedCount}</span>
        </button>

        {groups.map((g) => {
          const count = screens.filter((s) => s.branch === g).length;
          return (
            <div key={g} className="inline-flex items-center group relative">
              <button
                onClick={() => setGroupFilter(groupFilter === g ? "all" : g)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  groupFilter === g
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                } ${isAdmin ? "pr-7" : ""}`}
              >
                <Layers className="w-3 h-3" />
                {g}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  groupFilter === g ? "bg-primary-foreground/20" : "bg-background"
                }`}>{count}</span>
              </button>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/10">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    <DropdownMenuItem onClick={() => openRename(g)} className="gap-2 text-xs">
                      <Pencil className="w-3.5 h-3.5" />
                      {t("screensRenameGroup")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteGroupTarget(g)} className="gap-2 text-xs text-destructive focus:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("screensDeleteGroup")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

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
                  <span className={`flex items-center gap-1 ${!screen.branch ? "italic opacity-60" : ""}`}>
                    <Layers className="w-3 h-3" />{screen.branch || t("screensUngrouped")}
                  </span>
                  {screen.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{screen.location}</span>}
                  <span>{screen.resolution}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info(t("screenLiveViewPlaceholder"))} title={t("screenLiveView")}><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsScreen(screen)} title={t("screenSettings")}><Settings className="w-4 h-4" /></Button>
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
              <Label>{t("screensBranch")}</Label>
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
                  <Select value={form.branch || UNGROUPED} onValueChange={(v) => setForm({ ...form, branch: v === UNGROUPED ? "" : v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t("screensSelectBranch")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNGROUPED}>{t("screensUngrouped")}</SelectItem>
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
            {orgs.length > 0 && (
              <div className="space-y-2">
                <Label>{t("teamOrg")}</Label>
                <Select value={form.org_id || "none"} onValueChange={(v) => setForm({ ...form, org_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder={t("teamSelectOrg")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("screensUngrouped")}</SelectItem>
                    {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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

      {/* Rename Group Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-primary" />{t("screensRenameGroup")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("screensRenameGroup")}</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder={t("screensRenameGroupPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleRenameGroup()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={handleRenameGroup} disabled={!renameValue.trim()} className="gap-2">
              {t("screensSaveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Screen Confirm */}
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

      {/* Delete Group Confirm */}
      <AlertDialog open={deleteGroupTarget !== null} onOpenChange={(open) => !open && setDeleteGroupTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("screensDeleteGroup")}：{deleteGroupTarget}</AlertDialogTitle>
            <AlertDialogDescription>{t("screensDeleteGroupDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("confirmDelete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Screen Settings Dialog */}
      <Dialog open={settingsScreen !== null} onOpenChange={(open) => { if (!open) setSettingsScreen(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {t("screenSettings")} — {settingsScreen?.name}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-3.5 h-3.5" />{t("screenSettings")}</TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5"><FileText className="w-3.5 h-3.5" />{t("navDeviceLogs")}</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
          <div className="space-y-5 py-2">
            {/* Network Settings */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                {t("screenSettingsNetwork")}
              </h3>
              <div className="space-y-3 pl-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("screenSettingsIpMode")}</Label>
                  <Select value={settingsForm.ipMode} onValueChange={(v) => setSettingsForm({ ...settingsForm, ipMode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dhcp">{t("screenSettingsDhcp")}</SelectItem>
                      <SelectItem value="static">{t("screenSettingsStatic")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {settingsForm.ipMode === "static" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsIpAddress")}</Label>
                      <Input value={settingsForm.ipAddress} onChange={(e) => setSettingsForm({ ...settingsForm, ipAddress: e.target.value })} placeholder="192.168.1.100" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsSubnet")}</Label>
                      <Input value={settingsForm.subnet} onChange={(e) => setSettingsForm({ ...settingsForm, subnet: e.target.value })} placeholder="255.255.255.0" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsGateway")}</Label>
                      <Input value={settingsForm.gateway} onChange={(e) => setSettingsForm({ ...settingsForm, gateway: e.target.value })} placeholder="192.168.1.1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsDns")}</Label>
                      <Input value={settingsForm.dns} onChange={(e) => setSettingsForm({ ...settingsForm, dns: e.target.value })} placeholder="8.8.8.8" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* NTP Server */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                {t("screenSettingsNtp")}
              </h3>
              <div className="pl-6">
                <Input value={settingsForm.ntpServer} onChange={(e) => setSettingsForm({ ...settingsForm, ntpServer: e.target.value })} placeholder="pool.ntp.org" />
              </div>
            </div>

            <Separator />

            {/* Screen Rotation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-primary" />
                {t("screenSettingsRotation")}
              </h3>
              <div className="pl-6">
                <Select value={settingsForm.rotation} onValueChange={(v) => setSettingsForm({ ...settingsForm, rotation: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("screenSettingsRotation0")}</SelectItem>
                    <SelectItem value="90">{t("screenSettingsRotation90")}</SelectItem>
                    <SelectItem value="180">{t("screenSettingsRotation180")}</SelectItem>
                    <SelectItem value="270">{t("screenSettingsRotation270")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Schedule On/Off */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Power className="w-4 h-4 text-primary" />
                {t("screenSettingsScheduleOnOff")}
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t("enabled")}</Label>
                  <Switch checked={settingsForm.scheduleEnabled} onCheckedChange={(v) => setSettingsForm({ ...settingsForm, scheduleEnabled: v })} />
                </div>
                {settingsForm.scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsScheduleOn")}</Label>
                      <Input type="time" value={settingsForm.scheduleOn} onChange={(e) => setSettingsForm({ ...settingsForm, scheduleOn: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("screenSettingsScheduleOff")}</Label>
                      <Input type="time" value={settingsForm.scheduleOff} onChange={(e) => setSettingsForm({ ...settingsForm, scheduleOff: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Default Playback */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Play className="w-4 h-4 text-primary" />
                {t("screenDefaultPlayback")}
              </h3>
              <p className="text-xs text-muted-foreground pl-6">{t("screenDefaultPlaybackDesc")}</p>
              <div className="space-y-3 pl-6">
                <div className="space-y-1.5">
                  <Select value={settingsForm.defaultPlayback} onValueChange={(v: "sleep" | "media" | "design") => setSettingsForm({ ...settingsForm, defaultPlayback: v, defaultMediaId: "", defaultDesignId: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sleep">
                        <span className="flex items-center gap-2"><Moon className="w-3.5 h-3.5" />{t("screenDefaultSleep")}</span>
                      </SelectItem>
                      <SelectItem value="media">
                        <span className="flex items-center gap-2"><Play className="w-3.5 h-3.5" />{t("screenDefaultMedia")}</span>
                      </SelectItem>
                      <SelectItem value="design">
                        <span className="flex items-center gap-2"><Brush className="w-3.5 h-3.5" />{t("screenDefaultDesign")}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {settingsForm.defaultPlayback === "media" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("screenDefaultSelectMedia")}</Label>
                    <Select value={settingsForm.defaultMediaId} onValueChange={(v) => setSettingsForm({ ...settingsForm, defaultMediaId: v })}>
                      <SelectTrigger><SelectValue placeholder={t("screenDefaultSelectMedia")} /></SelectTrigger>
                      <SelectContent>
                        {mediaOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">{m.type}</span>
                              {m.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {settingsForm.defaultPlayback === "design" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("screenDefaultSelectProject")}</Label>
                    <Select value={settingsForm.defaultDesignId} onValueChange={(v) => setSettingsForm({ ...settingsForm, defaultDesignId: v })}>
                      <SelectTrigger><SelectValue placeholder={t("screenDefaultSelectProject")} /></SelectTrigger>
                      <SelectContent>
                        {designOptions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-destructive" />
                {t("screenSettingsReboot")}
              </h3>
              <div className="pl-6">
                <Button variant="destructive" size="sm" className="gap-2" onClick={() => setRebootConfirmOpen(true)}>
                  <RefreshCw className="w-4 h-4" />
                  {t("screenSettingsReboot")}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">{t("cancel")}</Button></DialogClose>
            <Button onClick={() => { toast.success(t("screenSettingsSaved")); setSettingsScreen(null); }}>
              {t("save")}
            </Button>
          </DialogFooter>
            </TabsContent>
            <TabsContent value="logs">
              {settingsScreen && <ScreenLogPanel screenId={settingsScreen.id} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Reboot Confirm */}
      <AlertDialog open={rebootConfirmOpen} onOpenChange={setRebootConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("screenSettingsRebootConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("screenSettingsRebootDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success(t("screenSettingsRebooting")); setRebootConfirmOpen(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("screenSettingsReboot")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
