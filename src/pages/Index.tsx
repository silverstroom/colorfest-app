import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, ChevronRight, Users, Eye } from "lucide-react";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [settingsRes, eventsRes] = await Promise.all([
      supabase.from("app_settings").select("*"),
      supabase.from("events").select("*").eq("is_active", true).order("sort_order").limit(6),
    ]);
    if (settingsRes.data) {
      const map: Record<string, string> = {};
      settingsRes.data.forEach((s: AppSetting) => { map[s.key] = s.value; });
      setSettings(map);
    }
    if (eventsRes.data) setFeaturedEvents(eventsRes.data as Event[]);
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Buongiorno";
    if (h < 18) return "Buon pomeriggio";
    return "Buonasera";
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero compact */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-20">
          <img src={poster} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 px-5 pt-10 pb-14">
          <img src={logo} alt="Color Fest" className="h-8 mb-6" />
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
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
          <path d="M0,25 C360,50 720,0 1440,25 L1440,40 L0,40 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </section>

      {/* Map card */}
      <section className="px-4 -mt-5 relative z-20">
        <button
          onClick={() => navigate("/map")}
          className="w-full bg-secondary text-secondary-foreground rounded-2xl p-4 shadow-card flex items-center justify-between hover:shadow-elevated transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold">Mappa Interattiva</p>
              <p className="text-xs opacity-70">Esplora il festival</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </button>
      </section>

      {/* Featured events - card style like reference */}
      {featuredEvents.length > 0 && (
        <section className="px-4 pt-6">
          <h2 className="text-xl font-bold mb-4 text-foreground">In evidenza</h2>
          <div className="space-y-3">
            {featuredEvents.filter(e => e.artist !== "TBA").slice(0, 4).map((event) => {
              const imgSrc = localImages[event.title] || localImages[event.artist] || event.image_url;
              const viewers = getViewerCount(event.id);

              return (
                <button
                  key={event.id}
                  onClick={() => navigate(`/section/${event.section_id}`)}
                  className="w-full bg-card rounded-2xl shadow-card flex items-center gap-0 overflow-hidden text-left hover:shadow-elevated transition-shadow"
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
        </section>
      )}

      {/* Footer */}
      <footer className="px-4 pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>© 2026 Color Fest XIV Ed.</p>
      </footer>
    </div>
  );
};

export default Index;
