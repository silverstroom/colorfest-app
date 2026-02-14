import { useEffect, useState, useMemo, useRef } from "react";
import { supabaseFetch } from "@/lib/supabase-fetch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ChevronRight, Eye, Sparkles, Camera, Palette, Star, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import AdminEditButton from "@/components/AdminEditButton";
import NotificationBell from "@/components/NotificationBell";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo_white.png";
import poster from "@/assets/poster.jpeg";

// Local artist images
import imgApparat from "@/assets/artists/apparat.webp";
import imgYinYin from "@/assets/artists/yinyin.webp";
import imgGaiaBanfi from "@/assets/artists/gaia-banfi.webp";
import imgCmonTigre from "@/assets/artists/cmon-tigre.webp";
import imgMaiMaiMai from "@/assets/artists/mai-mai-mai.webp";
import imgLaNina from "@/assets/artists/la-nina.webp";
import imgTheZenCircus from "@/assets/artists/the-zen-circus.webp";
import imgDeadletter from "@/assets/artists/deadletter.webp";

const localImages: Record<string, string> = {
  "Apparat (live)": imgApparat,
  "Apparat": imgApparat,
  "Yīn Yīn": imgYinYin,
  "Gaia Banfi": imgGaiaBanfi,
  "C'Mon Tigre": imgCmonTigre,
  "MAI MAI MAI": imgMaiMaiMai,
  "La Niña": imgLaNina,
  "The Zen Circus": imgTheZenCircus,
  "Deadletter": imgDeadletter,
};

interface Event {
  id: string;
  title: string;
  artist: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  image_url: string;
  stage: string;
  day: number;
  section_id: string;
  featured: boolean;
  sort_order: number;
}

interface AppSetting {
  key: string;
  value: string;
}

// Generate stable random viewer counts per event
const getViewerCount = (eventId: string) => {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = ((hash << 5) - hash) + eventId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 88) + 3; // 3 to 90
};

const Index = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);
  const [showFeaturedEditor, setShowFeaturedEditor] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#3B5BDB");
  const [overlayOpacity, setOverlayOpacity] = useState(80);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsData, eventsData] = await Promise.all([
        supabaseFetch("app_settings", "select=*"),
        supabaseFetch("events", "is_active=eq.true&order=sort_order&select=*"),
      ]);
      if (settingsData) {
        const map: Record<string, string> = {};
        settingsData.forEach((s: any) => { map[s.key] = s.value; });
        setSettings(map);
        if (map.hero_overlay_color) setOverlayColor(map.hero_overlay_color);
        if (map.hero_overlay_opacity) setOverlayOpacity(Number(map.hero_overlay_opacity));
      }
      if (eventsData) {
        const all = eventsData as Event[];
        setAllEvents(all);
        setFeaturedEvents(all.filter((e) => e.featured).sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (err) {
      console.error("[Index] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "L'immagine deve essere inferiore a 5MB", variant: "destructive" });
      return;
    }
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `hero-cover.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Errore nel caricamento", variant: "destructive" });
      setUploadingCover(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    const coverUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save to app_settings
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    };
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/app_settings?on_conflict=key`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ key: "hero_cover_url", value: coverUrl }),
      }
    );

    setSettings((prev) => ({ ...prev, hero_cover_url: coverUrl }));
    toast({ title: "Copertina aggiornata ✓" });
    setUploadingCover(false);
  };

  const saveOverlaySettings = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    };
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/app_settings?on_conflict=key`;
    await Promise.all([
      fetch(url, { method: "POST", headers, body: JSON.stringify({ key: "hero_overlay_color", value: overlayColor }) }),
      fetch(url, { method: "POST", headers, body: JSON.stringify({ key: "hero_overlay_opacity", value: String(overlayOpacity) }) }),
    ]);
    setSettings((prev) => ({ ...prev, hero_overlay_color: overlayColor, hero_overlay_opacity: String(overlayOpacity) }));
    toast({ title: "Overlay aggiornato ✓" });
    setShowOverlayEditor(false);
  };

  const toggleFeatured = async (eventId: string, currentVal: boolean) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events?id=eq.${eventId}`,
      { method: "PATCH", headers, body: JSON.stringify({ featured: !currentVal }) }
    );
    const updated = allEvents.map((e) => (e.id === eventId ? { ...e, featured: !currentVal } : e));
    setAllEvents(updated);
    setFeaturedEvents(updated.filter((e) => e.featured).sort((a, b) => a.sort_order - b.sort_order));
  };

  const moveFeatured = async (index: number, direction: "up" | "down") => {
    const newList = [...featuredEvents];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    // Assign new sort_order values
    const updates = newList.map((e, i) => ({ ...e, sort_order: i }));
    setFeaturedEvents(updates);

    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    await Promise.all(
      updates.map((e) =>
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events?id=eq.${e.id}`, {
          method: "PATCH", headers, body: JSON.stringify({ sort_order: e.sort_order }),
        })
      )
    );
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buongiorno";
    if (h < 18) return "Buon pomeriggio";
    return "Buonasera";
  }, []);

  const heroImage = settings.hero_cover_url || poster;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden text-primary-foreground">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover" />
        </div>
        {/* Color overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
        />
        <div className="relative z-10 px-5 pt-10 pb-14">
          <div className="flex items-center justify-between mb-6">
            <img src={logo} alt="Color Fest" className="h-8" />
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    title="Cambia copertina"
                  >
                    <Camera className="w-5 h-5 text-secondary-foreground" />
                  </button>
                  <button
                    onClick={() => setShowOverlayEditor(!showOverlayEditor)}
                    className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    title="Colore e opacità"
                  >
                    <Palette className="w-5 h-5 text-secondary-foreground" />
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </>
              )}
              <NotificationBell />
              <AdminEditButton tab="settings" />
            </div>
          </div>
          <p className="text-sm opacity-70 mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-black leading-tight">
            {settings.festival_name || "Color Fest XIV"}
          </h1>
          <p className="text-base font-light opacity-80 mt-1">
            {settings.festival_subtitle || "Quando Sulla Riva Verrai"}
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs opacity-70">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {settings.festival_dates || "11-12-13 Agosto 2026"}
            </span>
          </div>

          {/* Overlay editor panel */}
          {showOverlayEditor && isAdmin && (
            <div className="mt-4 bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-elevated text-foreground space-y-4">
              <h3 className="text-sm font-bold">Colore e opacità overlay</h3>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Colore</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={overlayColor}
                    onChange={(e) => setOverlayColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <span className="text-sm font-mono text-muted-foreground">{overlayColor}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Opacità: {overlayOpacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveOverlaySettings}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Salva
                </button>
                <button
                  onClick={() => setShowOverlayEditor(false)}
                  className="flex-1 bg-muted text-muted-foreground rounded-xl py-2 text-sm font-semibold hover:bg-muted/80 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
          <path d="M0,25 C360,50 720,0 1440,25 L1440,40 L0,40 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </section>

      {/* Quick actions */}
      <section className="px-4 -mt-5 relative z-20 flex gap-3">
        <button
          onClick={() => navigate("/map")}
          className="flex-1 bg-card text-foreground rounded-2xl p-4 shadow-card flex items-center gap-3 hover:shadow-elevated transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Mappa</p>
            <p className="text-[10px] text-muted-foreground">Esplora il festival</p>
          </div>
        </button>
        <button
          onClick={() => navigate("/explore")}
          className="flex-1 bg-card text-foreground rounded-2xl p-4 shadow-card flex items-center gap-3 hover:shadow-elevated transition-shadow"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Programma</p>
            <p className="text-[10px] text-muted-foreground">Tutti gli eventi</p>
          </div>
        </button>
      </section>

      {/* Featured events */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">In evidenza</h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowFeaturedEditor(!showFeaturedEditor)}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Gestisci in evidenza"
              >
                <Star className="w-4 h-4 text-primary" />
              </button>
            )}
            <AdminEditButton tab="events" />
          </div>
        </div>

        {/* Admin featured editor */}
        {showFeaturedEditor && isAdmin && (
           <div className="bg-card rounded-2xl shadow-elevated p-4 mb-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-3">Scegli gli eventi in evidenza</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allEvents.filter(e => e.artist !== "TBA").map((event) => (
                <button
                  key={event.id}
                  onClick={() => toggleFeatured(event.id, event.featured)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <Star
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      event.featured
                        ? "text-secondary fill-secondary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                    {event.stage && <p className="text-[10px] text-muted-foreground">{event.stage}</p>}
                  </div>
                </button>
              ))}
            </div>

            {/* Reorder section */}
            {featuredEvents.length > 1 && (
              <div className="mt-4 pt-3 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Ordine visualizzazione</h4>
                <div className="space-y-1">
                  {featuredEvents.map((event, idx) => (
                    <div key={event.id} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{event.title}</span>
                      <button
                        onClick={() => moveFeatured(idx, "up")}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-lg bg-card flex items-center justify-center disabled:opacity-30 hover:bg-primary/10 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <button
                        onClick={() => moveFeatured(idx, "down")}
                        disabled={idx === featuredEvents.length - 1}
                        className="w-7 h-7 rounded-lg bg-card flex items-center justify-center disabled:opacity-30 hover:bg-primary/10 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowFeaturedEditor(false)}
              className="mt-3 w-full bg-muted text-muted-foreground rounded-xl py-2 text-sm font-semibold hover:bg-muted/80 transition-colors"
            >
              Chiudi
            </button>
          </div>
        )}

        {featuredEvents.length > 0 ? (
          <div className="space-y-3">
            {featuredEvents.map((event) => {
              const imgSrc = localImages[event.title] || localImages[event.artist] || event.image_url;
              const viewers = getViewerCount(event.id);

              return (
                <button
                  key={event.id}
                  onClick={() => navigate(`/section/${event.section_id}`)}
                  className="w-full bg-card rounded-2xl shadow-card flex items-center gap-0 overflow-hidden text-left hover:shadow-elevated transition-all active:scale-[0.98]"
                >
                  <div className="flex-1 p-4 min-w-0">
                    <h3 className="font-bold text-foreground text-base leading-tight truncate">{event.title}</h3>
                    {event.stage && (
                      <p className="text-xs text-muted-foreground mt-1">{event.stage}</p>
                    )}
                    {event.start_time && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(event.start_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                      <Eye className="w-3 h-3" />
                      <span>{viewers} persone stanno guardando</span>
                    </div>
                  </div>
                  {imgSrc && (
                    <div className="w-24 h-24 shrink-0">
                      <img
                        src={imgSrc}
                        alt={event.title}
                        className="w-full h-full object-cover rounded-r-2xl"
                        loading="lazy"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isAdmin ? "Clicca la ⭐ per scegliere gli eventi in evidenza" : "Nessun evento in evidenza"}
          </p>
        )}
      </section>



      {/* Footer */}
      <footer className="px-4 pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>© 2026 Color Fest XIV Ed.</p>
      </footer>
    </div>
  );
};

export default Index;
