import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import mapImage from "@/assets/mappa.png";

interface MapArea {
  id: string;
  name: string;
  description: string;
  x_percent: number;
  y_percent: number;
  icon: string;
  is_active: boolean;
  section_id: string | null;
}

interface StageArtist {
  title: string;
  artist: string;
  day: number;
  stage: string;
}

const stageColors: Record<string, string> = {
  "Palco dei Tramonti": "bg-red-500",
  "Palco Pineta": "bg-green-600",
  "Future Stage": "bg-purple-500",
  "Marley Stage": "bg-amber-500",
};

// Group map areas into zones for clarity
type AreaZone = { label: string; color: string; borderColor: string; icons: string[] };
const areaZones: AreaZone[] = [
  { label: "🎵 Palchi", color: "bg-red-500", borderColor: "border-red-400", icons: ["Music", "Disc3", "Guitar"] },
  { label: "🍽️ Food & Drink", color: "bg-orange-500", borderColor: "border-orange-400", icons: ["UtensilsCrossed", "Wine", "Beer"] },
  { label: "🎨 Cultura", color: "bg-pink-500", borderColor: "border-pink-400", icons: ["Palette"] },
  { label: "🛍️ Servizi", color: "bg-blue-500", borderColor: "border-blue-400", icons: ["ShoppingBag", "Ticket", "Bath", "LogOut"] },
];

const getZoneForIcon = (icon: string): AreaZone | undefined => areaZones.find(z => z.icons.includes(icon));

const markerColorByIcon: Record<string, string> = {
  Music: "bg-red-500 border-red-300",
  Disc3: "bg-purple-500 border-purple-300",
  Guitar: "bg-amber-500 border-amber-300",
  Wine: "bg-violet-500 border-violet-300",
  UtensilsCrossed: "bg-orange-500 border-orange-300",
  Beer: "bg-amber-600 border-amber-300",
  Palette: "bg-pink-500 border-pink-300",
  ShoppingBag: "bg-teal-500 border-teal-300",
  Ticket: "bg-blue-500 border-blue-300",
  Bath: "bg-gray-500 border-gray-300",
  LogOut: "bg-gray-400 border-gray-200",
};

const FestivalMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight");
  const [areas, setAreas] = useState<MapArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);
  const [stageArtists, setStageArtists] = useState<StageArtist[]>([]);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("map_areas").select("*").eq("is_active", true),
      supabase.from("events").select("title, artist, day, stage").eq("is_active", true).neq("artist", "TBA").order("day").order("sort_order"),
    ]).then(([areasRes, eventsRes]) => {
      if (areasRes.data) setAreas(areasRes.data);
      if (eventsRes.data) setStageArtists(eventsRes.data as StageArtist[]);
    });
  }, []);

  useEffect(() => {
    if (highlight && areas.length > 0) {
      const found = areas.find((a) => a.name.toLowerCase().includes(highlight.toLowerCase()));
      if (found) setSelectedArea(found);
    }
  }, [highlight, areas]);

  const artistsByStage = stageArtists.reduce<Record<string, StageArtist[]>>((acc, a) => {
    if (!acc[a.stage]) acc[a.stage] = [];
    acc[a.stage].push(a);
    return acc;
  }, {});

  const dayLabels: Record<number, string> = { 1: "11 Ago", 2: "12 Ago", 3: "13 Ago" };
  const selectedStageArtists = selectedArea ? stageArtists.filter(a => a.stage === selectedArea.name) : [];

  // Filter areas by active zone
  const visibleAreas = activeZone
    ? areas.filter(a => {
        const zone = getZoneForIcon(a.icon);
        return zone?.label === activeZone;
      })
    : areas;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-primary-foreground hover:bg-primary-foreground/10 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
        </Button>
        <h1 className="text-2xl font-black">Mappa del Festival</h1>
        <p className="text-sm text-primary-foreground/70">Lungomare Falcone e Borsellino - Riviera dei Tramonti</p>
      </div>

      {/* Zone filter chips */}
      <div className="px-4 pt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveZone(null)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            activeZone === null
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground shadow-card"
          }`}
        >
          Tutto
        </button>
        {areaZones.map(zone => (
          <button
            key={zone.label}
            onClick={() => setActiveZone(activeZone === zone.label ? null : zone.label)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeZone === zone.label
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-card"
            }`}
          >
            {zone.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div className="relative mx-4 mt-3 bg-card rounded-xl shadow-elevated overflow-hidden">
        <img
          src={mapImage}
          alt="Mappa Color Fest"
          className="w-full h-auto block"
        />

        {/* Interactive markers overlay */}
        {areas.map((area) => {
          const colors = markerColorByIcon[area.icon] || "bg-primary border-primary/50";
          const isVisible = !activeZone || visibleAreas.some(a => a.id === area.id);
          const isSelected = selectedArea?.id === area.id;
          const isStage = Object.keys(stageColors).includes(area.name);

          return (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area)}
              className={`absolute flex flex-col items-center transition-all duration-300 ${
                isVisible ? "opacity-100" : "opacity-20 pointer-events-none"
              } ${isSelected ? "scale-125 z-20" : "hover:scale-110 z-10"}`}
              style={{
                left: `${area.x_percent}%`,
                top: `${area.y_percent}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              {/* Pin shape */}
              <span
                className={`flex items-center justify-center shadow-lg border-2 ${colors} ${
                  isSelected ? "animate-pulse-glow" : ""
                } ${isStage ? "w-8 h-8 rounded-lg" : "w-6 h-6 rounded-full"}`}
              >
                <span className="text-white text-[9px] font-black leading-none">
                  {isStage ? "♪" : area.name.charAt(0)}
                </span>
              </span>
              {/* Label - always visible for stages, on select for others */}
              {(isStage || isSelected) && (
                <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold leading-none whitespace-nowrap ${
                  isStage ? "bg-foreground/80 text-background" : "bg-card/90 text-foreground shadow-sm"
                }`}>
                  {area.name.length > 18 ? area.name.substring(0, 16) + "…" : area.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected area info */}
      {selectedArea && (
        <div className="mx-4 mt-4 bg-card rounded-xl p-4 shadow-card animate-fade-in relative">
          <button
            onClick={() => setSelectedArea(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-lg text-foreground">{selectedArea.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{selectedArea.description}</p>

          {selectedStageArtists.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Line-up</p>
              {selectedStageArtists.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Music className="w-3 h-3 text-primary" />
                  <span className="text-foreground font-medium">{a.artist}</span>
                  <span className="text-xs text-muted-foreground">({dayLabels[a.day]})</span>
                </div>
              ))}
            </div>
          )}

          {selectedArea.section_id && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => navigate(`/section/${selectedArea.section_id}`)}
            >
              Vai alla sezione
            </Button>
          )}
        </div>
      )}

      {/* Stage legend with artists */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-4">Palchi e Line-up</h2>
        <div className="space-y-4">
          {Object.entries(artistsByStage).map(([stage, artists]) => {
            const dotColor = stageColors[stage] || "bg-muted-foreground";
            return (
              <div key={stage} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${dotColor}`} />
                  <h3 className="font-bold text-foreground">{stage}</h3>
                </div>
                <div className="space-y-1 ml-5">
                  {artists.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">{a.artist}</span>
                      <span className="text-xs text-muted-foreground">— {dayLabels[a.day]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* POI list grouped by zone */}
        <h2 className="text-lg font-bold mt-6 mb-3">Punti di interesse</h2>
        <div className="space-y-4">
          {areaZones.filter(z => z.label !== "🎵 Palchi").map(zone => {
            const zoneAreas = areas.filter(a => zone.icons.includes(a.icon) && !Object.keys(stageColors).includes(a.name));
            if (zoneAreas.length === 0) return null;
            return (
              <div key={zone.label}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{zone.label}</p>
                <div className="space-y-2">
                  {zoneAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => setSelectedArea(area)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedArea?.id === area.id
                          ? "bg-primary/10 border-l-4 border-primary"
                          : "bg-card shadow-card hover:bg-muted"
                      }`}
                    >
                      <p className="font-semibold text-foreground">{area.name}</p>
                      <p className="text-xs text-muted-foreground">{area.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FestivalMap;
