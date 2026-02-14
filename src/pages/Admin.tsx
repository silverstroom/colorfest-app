import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, Users, Settings, Map, LayoutGrid, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
  }, [isAdmin, loading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Caricamento...</div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-sidebar text-sidebar-foreground p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-sidebar-foreground hover:bg-sidebar-accent mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna all'app
        </Button>
        <h1 className="text-2xl font-black">Pannello Admin</h1>
        <p className="text-sm opacity-70">Gestisci il Color Fest</p>
      </div>

      <Tabs defaultValue="sections" className="px-4 py-4">
        <TabsList className="w-full grid grid-cols-5 mb-4">
          <TabsTrigger value="sections"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="events"><Settings className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="map"><Map className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="sponsors"><Megaphone className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="settings"><Users className="w-4 h-4" /></TabsTrigger>
        </TabsList>

        <TabsContent value="sections"><SectionsManager /></TabsContent>
        <TabsContent value="events"><EventsManager /></TabsContent>
        <TabsContent value="map"><MapAreasManager /></TabsContent>
        <TabsContent value="sponsors"><SponsorsManager /></TabsContent>
        <TabsContent value="settings"><SettingsManager /></TabsContent>
      </Tabs>
    </div>
  );
};

// ---- Sections Manager ----
const SectionsManager = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "MapPin", sort_order: 0, is_active: true });

  const fetch = async () => {
    const { data } = await supabase.from("festival_sections").select("*").order("sort_order");
    if (data) setSections(data);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (editId) {
      await supabase.from("festival_sections").update(form).eq("id", editId);
    } else {
      await supabase.from("festival_sections").insert(form);
    }
    toast.success("Salvato!");
    setEditId(null);
    setForm({ name: "", description: "", icon: "MapPin", sort_order: 0, is_active: true });
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("festival_sections").delete().eq("id", id);
    toast.success("Eliminato!");
    fetch();
  };

  const edit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description, icon: s.icon, sort_order: s.sort_order, is_active: s.is_active });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Sezioni</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <Input placeholder="Nome sezione" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Textarea placeholder="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex gap-2">
          <Input placeholder="Icona" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="flex-1" />
          <Input type="number" placeholder="Ordine" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Attivo</Label>
          </div>
          <Button size="sm" onClick={save}><Save className="w-4 h-4 mr-1" /> {editId ? "Aggiorna" : "Aggiungi"}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.id} className="bg-card rounded-lg p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.is_active ? "Attivo" : "Disattivato"}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => edit(s)}><Settings className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Events Manager ----
const EventsManager = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    section_id: "", title: "", description: "", artist: "", stage: "",
    day: 1, start_time: "", end_time: "", sort_order: 0, is_active: true, image_url: ""
  });

  const fetchAll = async () => {
    const [evRes, secRes] = await Promise.all([
      supabase.from("events").select("*").order("sort_order"),
      supabase.from("festival_sections").select("id, name").order("sort_order"),
    ]);
    if (evRes.data) setEvents(evRes.data);
    if (secRes.data) setSections(secRes.data);
  };
  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    const payload = { ...form, start_time: form.start_time || null, end_time: form.end_time || null };
    if (editId) {
      await supabase.from("events").update(payload).eq("id", editId);
    } else {
      await supabase.from("events").insert(payload);
    }
    toast.success("Salvato!");
    setEditId(null);
    setForm({ section_id: "", title: "", description: "", artist: "", stage: "", day: 1, start_time: "", end_time: "", sort_order: 0, is_active: true, image_url: "" });
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Eliminato!");
    fetchAll();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Eventi</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.section_id}
          onChange={(e) => setForm({ ...form, section_id: e.target.value })}
        >
          <option value="">Seleziona sezione</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Input placeholder="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Artista" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
        <Input placeholder="Palco (es. Palco A)" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} />
        <Textarea placeholder="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Giorno</Label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
            <option value={1}>11 Ago</option>
              <option value={2}>12 Ago</option>
              <option value={3}>13 Ago</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Inizio</Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Fine</Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
        </div>
        <Input placeholder="URL Immagine" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Attivo</Label>
          </div>
          <Button size="sm" onClick={save}><Save className="w-4 h-4 mr-1" /> {editId ? "Aggiorna" : "Aggiungi"}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="bg-card rounded-lg p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{ev.title}</p>
              <p className="text-xs text-muted-foreground">{ev.artist} · Giorno {ev.day}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setEditId(ev.id); setForm(ev); }}><Settings className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => remove(ev.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Map Areas Manager ----
const MapAreasManager = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", x_percent: 50, y_percent: 50, icon: "MapPin", section_id: "", is_active: true });

  const fetchAll = async () => {
    const [aRes, sRes] = await Promise.all([
      supabase.from("map_areas").select("*"),
      supabase.from("festival_sections").select("id, name").order("sort_order"),
    ]);
    if (aRes.data) setAreas(aRes.data);
    if (sRes.data) setSections(sRes.data);
  };
  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    const payload = { ...form, section_id: form.section_id || null };
    if (editId) {
      await supabase.from("map_areas").update(payload).eq("id", editId);
    } else {
      await supabase.from("map_areas").insert(payload);
    }
    toast.success("Salvato!");
    setEditId(null);
    setForm({ name: "", description: "", x_percent: 50, y_percent: 50, icon: "MapPin", section_id: "", is_active: true });
    fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("map_areas").delete().eq("id", id);
    toast.success("Eliminato!");
    fetchAll();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Aree Mappa</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <Input placeholder="Nome area" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Textarea placeholder="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })}>
          <option value="">Collega a sezione (opzionale)</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Posizione X (%)</Label>
            <Input type="number" min={0} max={100} value={form.x_percent} onChange={(e) => setForm({ ...form, x_percent: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Posizione Y (%)</Label>
            <Input type="number" min={0} max={100} value={form.y_percent} onChange={(e) => setForm({ ...form, y_percent: Number(e.target.value) })} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Attivo</Label>
          </div>
          <Button size="sm" onClick={save}><Save className="w-4 h-4 mr-1" /> {editId ? "Aggiorna" : "Aggiungi"}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {areas.map((a) => (
          <div key={a.id} className="bg-card rounded-lg p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{a.name}</p>
              <p className="text-xs text-muted-foreground">X: {a.x_percent}% Y: {a.y_percent}%</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setEditId(a.id); setForm(a); }}><Settings className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => remove(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Sponsors Manager ----
const SponsorsManager = () => {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", image_url: "", link_url: "", sort_order: 0, is_active: true });

  const fetch = async () => {
    const { data } = await supabase.from("sponsor_banners").select("*").order("sort_order");
    if (data) setSponsors(data);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (editId) {
      await supabase.from("sponsor_banners").update(form).eq("id", editId);
    } else {
      await supabase.from("sponsor_banners").insert(form);
    }
    toast.success("Salvato!");
    setEditId(null);
    setForm({ name: "", image_url: "", link_url: "", sort_order: 0, is_active: true });
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("sponsor_banners").delete().eq("id", id);
    toast.success("Eliminato!");
    fetch();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Sponsor</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        <Input placeholder="Nome sponsor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="URL Immagine" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <Input placeholder="URL Link" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label className="text-sm">Attivo</Label>
          </div>
          <Button size="sm" onClick={save}><Save className="w-4 h-4 mr-1" /> {editId ? "Aggiorna" : "Aggiungi"}</Button>
        </div>
      </div>
      <div className="space-y-2">
        {sponsors.map((s) => (
          <div key={s.id} className="bg-card rounded-lg p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.is_active ? "Attivo" : "Disattivato"}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => { setEditId(s.id); setForm(s); }}><Settings className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Settings Manager ----
const SettingsManager = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  const fetch = async () => {
    const { data } = await supabase.from("app_settings").select("*");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
    }
  };
  useEffect(() => { fetch(); }, []);

  const update = async (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveAll = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("app_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    }
    toast.success("Impostazioni salvate!");
  };

  const settingsFields = [
    { key: "festival_name", label: "Nome Festival" },
    { key: "festival_subtitle", label: "Sottotitolo" },
    { key: "festival_dates", label: "Date" },
    { key: "festival_location", label: "Location" },
    { key: "sponsors_enabled", label: "Sponsor attivi (true/false)" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Impostazioni</h2>
      <div className="bg-card rounded-xl p-4 shadow-card space-y-3">
        {settingsFields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input value={settings[f.key] || ""} onChange={(e) => update(f.key, e.target.value)} />
          </div>
        ))}
        <Button onClick={saveAll} className="w-full"><Save className="w-4 h-4 mr-1" /> Salva tutto</Button>
      </div>
    </div>
  );
};

export default Admin;
