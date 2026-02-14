import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      </div>

      {/* Map Container */}
      <div className="relative mx-4 mt-4 bg-card rounded-xl shadow-elevated overflow-hidden aspect-[4/3]">
        {/* Festival map placeholder - SVG illustration */}
        <svg viewBox="0 0 800 600" className="w-full h-full">
          {/* Background - beach */}
          <rect width="800" height="600" fill="hsl(43 60% 92%)" />
          
          {/* Sea */}
          <path d="M0,0 L800,0 L800,200 C650,240 450,180 300,220 C150,260 50,200 0,230 Z" fill="hsl(224 90% 50%)" opacity="0.15" />
          <path d="M0,0 L800,0 L800,150 C600,190 400,130 200,170 C100,190 50,160 0,180 Z" fill="hsl(224 90% 50%)" opacity="0.1" />
          
          {/* Paths */}
          <path d="M400,580 L400,350 L200,250 M400,350 L600,250 M400,450 L250,450 M400,450 L550,450" 
                stroke="hsl(43 40% 75%)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="12 6" />
          
          {/* Stage areas */}
          <rect x="150" y="180" width="120" height="80" rx="12" fill="hsl(224 90% 50%)" opacity="0.2" />
          <text x="210" y="225" textAnchor="middle" fill="hsl(224 80% 30%)" fontSize="12" fontWeight="bold">PALCO A</text>
          
          <rect x="530" y="180" width="120" height="80" rx="12" fill="hsl(224 90% 50%)" opacity="0.2" />
          <text x="590" y="225" textAnchor="middle" fill="hsl(224 80% 30%)" fontSize="12" fontWeight="bold">PALCO B</text>
          
          {/* Areas */}
          <rect x="100" y="400" width="100" height="60" rx="8" fill="hsl(43 100% 55%)" opacity="0.3" />
          <text x="150" y="435" textAnchor="middle" fill="hsl(224 80% 20%)" fontSize="11" fontWeight="600">FOOD</text>
          
          <rect x="600" y="400" width="100" height="60" rx="8" fill="hsl(43 100% 55%)" opacity="0.3" />
          <text x="650" y="435" textAnchor="middle" fill="hsl(224 80% 20%)" fontSize="11" fontWeight="600">BAR</text>
          
          <rect x="330" y="500" width="140" height="60" rx="8" fill="hsl(120 40% 50%)" opacity="0.2" />
          <text x="400" y="535" textAnchor="middle" fill="hsl(120 40% 30%)" fontSize="11" fontWeight="600">CAMPING</text>
          
          <rect x="50" y="300" width="80" height="50" rx="8" fill="hsl(280 50% 50%)" opacity="0.2" />
          <text x="90" y="330" textAnchor="middle" fill="hsl(280 50% 30%)" fontSize="10" fontWeight="600">MOSTRE</text>
        </svg>

        {/* Interactive markers */}
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedArea(area)}
            className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              selectedArea?.id === area.id
                ? "bg-secondary scale-125 shadow-elevated ring-4 ring-secondary/40 animate-pulse-glow"
                : "bg-primary/80 hover:bg-primary hover:scale-110 shadow-card"
            }`}
            style={{
              left: `${area.x_percent}%`,
              top: `${area.y_percent}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-xs text-primary-foreground font-bold">
              {area.name.charAt(0)}
            </span>
          </button>
        ))}
      </div>

      {/* Selected area info */}
      {selectedArea && (
        <div className="mx-4 mt-4 bg-card rounded-xl p-4 shadow-card animate-slide-in-bottom">
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
