import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, ShoppingBag, Waves, ChevronRight } from "lucide-react";
import AdminEditButton from "@/components/AdminEditButton";

const iconMap: Record<string, any> = {
  Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, ShoppingBag, Waves,
};

const sectionColors: Record<string, string> = {
  Music: "from-red-500 to-red-600",
  Wine: "from-purple-500 to-purple-600",
  Beer: "from-amber-500 to-amber-600",
  UtensilsCrossed: "from-orange-500 to-orange-600",
  Palette: "from-pink-500 to-pink-600",
  Tent: "from-green-500 to-green-600",
  ShoppingBag: "from-teal-500 to-teal-600",
  Waves: "from-cyan-500 to-cyan-600",
  MapPin: "from-blue-500 to-blue-600",
};

interface Section {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        console.log("[Explore] ENV check - URL:", url, "KEY:", key ? key.substring(0, 20) + "..." : "MISSING");
        
        // Test direct fetch first to check connectivity
        console.log("[Explore] Testing direct fetch...");
        const testUrl = `${url}/rest/v1/festival_sections?is_active=eq.true&order=sort_order&select=*`;
        const directRes = await fetch(testUrl, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          }
        });
        const directData = await directRes.json();
        console.log("[Explore] Direct fetch result:", directRes.status, "rows:", Array.isArray(directData) ? directData.length : "not array");
        
        if (Array.isArray(directData) && directData.length > 0) {
          setSections(directData);
        }

        // Also fetch event counts
        const evUrl = `${url}/rest/v1/events?is_active=eq.true&select=section_id`;
        const evDirectRes = await fetch(evUrl, {
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const evData = await evDirectRes.json();
        if (Array.isArray(evData)) {
          const counts: Record<string, number> = {};
          evData.forEach((e: any) => { counts[e.section_id] = (counts[e.section_id] || 0) + 1; });
          setEventCounts(counts);
        }
      } catch (err: any) {
        console.error("[Explore] Fetch error:", err);
        setError(err.message || "Errore nel caricamento");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MapPin;
    return <Icon className="w-6 h-6 text-white" />;
  };

  const getGradient = (iconName: string) => sectionColors[iconName] || "from-primary to-primary";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">Esplora</h1>
            <p className="text-muted-foreground text-sm mt-1">Scopri tutte le aree del festival</p>
          </div>
          <AdminEditButton tab="sections" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="text-primary text-sm font-semibold">Riprova</button>
          </div>
        )}
        {!loading && !error && sections.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nessuna sezione disponibile</p>
        )}
        {sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => navigate(`/section/${section.id}`)}
            className="w-full bg-card rounded-2xl shadow-card p-4 flex items-center gap-4 text-left hover:shadow-elevated transition-all active:scale-[0.98] animate-fade-in"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradient(section.icon)} flex items-center justify-center shrink-0`}>
              {getIcon(section.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{section.name}</p>
              {section.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{section.description}</p>
              )}
              {eventCounts[section.id] && (
                <p className="text-[10px] text-primary font-semibold mt-1">{eventCounts[section.id]} eventi</p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Explore;
