import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, X } from "lucide-react";
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

const FestivalMap = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight");
  const [areas, setAreas] = useState<MapArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);

  useEffect(() => {
    supabase
      .from("map_areas")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setAreas(data);
      });
  }, []);

  useEffect(() => {
    if (highlight && areas.length > 0) {
      const found = areas.find((a) => a.name.toLowerCase().includes(highlight.toLowerCase()));
      if (found) setSelectedArea(found);
    }
  }, [highlight, areas]);

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

      {/* Map Container */}
      <div className="relative mx-4 mt-4 bg-card rounded-xl shadow-elevated overflow-hidden">
        <img
          src={mapImage}
          alt="Mappa Color Fest"
          className="w-full h-auto block"
        />

        {/* Interactive markers overlay */}
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedArea(area)}
            className={`absolute flex items-center justify-center transition-all duration-300 ${
              selectedArea?.id === area.id
                ? "scale-150 z-20"
                : "hover:scale-125 z-10"
            }`}
            style={{
              left: `${area.x_percent}%`,
              top: `${area.y_percent}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white ${
                selectedArea?.id === area.id
                  ? "bg-secondary text-secondary-foreground animate-pulse-glow"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {area.name.charAt(0)}
            </span>
          </button>
        ))}
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

      {/* Areas list */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-3">Punti di interesse</h2>
        <div className="space-y-2">
          {areas.map((area) => (
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
    </div>
  );
};

export default FestivalMap;
