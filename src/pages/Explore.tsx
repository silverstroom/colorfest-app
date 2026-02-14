import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, ShoppingBag, Waves, Search } from "lucide-react";

const iconMap: Record<string, any> = {
  Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, ShoppingBag, Waves,
};

const sectionColors: Record<string, { bg: string; iconBg: string }> = {
  Music:            { bg: "bg-red-500",    iconBg: "bg-red-500" },
  Wine:             { bg: "bg-purple-500", iconBg: "bg-purple-500" },
  Beer:             { bg: "bg-amber-500",  iconBg: "bg-amber-500" },
  UtensilsCrossed:  { bg: "bg-orange-500", iconBg: "bg-orange-500" },
  Palette:          { bg: "bg-pink-500",   iconBg: "bg-pink-500" },
  Tent:             { bg: "bg-green-600",  iconBg: "bg-green-600" },
  ShoppingBag:      { bg: "bg-teal-500",   iconBg: "bg-teal-500" },
  Waves:            { bg: "bg-cyan-500",   iconBg: "bg-cyan-500" },
  MapPin:           { bg: "bg-blue-500",   iconBg: "bg-blue-500" },
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

  useEffect(() => {
    supabase
      .from("festival_sections")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setSections(data); });
  }, []);

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MapPin;
    return <Icon className="w-5 h-5 text-white" />;
  };

  const getColor = (iconName: string) => sectionColors[iconName]?.bg || "bg-primary";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-3xl font-black text-foreground">Esplora</h1>
        <p className="text-muted-foreground text-sm mt-1">Scopri tutte le aree del festival</p>
      </div>

      {/* Category pills */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => navigate(`/section/${section.id}`)}
            className={`${getColor(section.icon)} text-white rounded-2xl p-4 text-left shadow-card hover:opacity-90 transition-all animate-fade-in`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-2 mb-1">
              {getIcon(section.icon)}
              <span className="font-bold text-sm">{section.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Explore;
