import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, Calendar, ChevronRight, ShoppingBag, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_white.png";
import poster from "@/assets/poster.jpeg";

const iconMap: Record<string, any> = {
  Music, Wine, UtensilsCrossed, Beer, Palette, Tent, MapPin, ShoppingBag, Waves,
};

// Distinct color schemes per section (bg, text, icon-bg)
const sectionColors: Record<string, { bg: string; iconBg: string; iconText: string }> = {
  Music:            { bg: "bg-red-50 dark:bg-red-950/30",      iconBg: "bg-red-500",      iconText: "text-white" },
  Wine:             { bg: "bg-purple-50 dark:bg-purple-950/30", iconBg: "bg-purple-500",   iconText: "text-white" },
  Beer:             { bg: "bg-amber-50 dark:bg-amber-950/30",   iconBg: "bg-amber-500",    iconText: "text-white" },
  UtensilsCrossed:  { bg: "bg-orange-50 dark:bg-orange-950/30", iconBg: "bg-orange-500",   iconText: "text-white" },
  Palette:          { bg: "bg-pink-50 dark:bg-pink-950/30",     iconBg: "bg-pink-500",     iconText: "text-white" },
  Tent:             { bg: "bg-green-50 dark:bg-green-950/30",   iconBg: "bg-green-600",    iconText: "text-white" },
  ShoppingBag:      { bg: "bg-teal-50 dark:bg-teal-950/30",     iconBg: "bg-teal-500",     iconText: "text-white" },
  Waves:            { bg: "bg-cyan-50 dark:bg-cyan-950/30",     iconBg: "bg-cyan-500",     iconText: "text-white" },
  MapPin:           { bg: "bg-blue-50 dark:bg-blue-950/30",     iconBg: "bg-blue-500",     iconText: "text-white" },
};

const defaultColors = { bg: "bg-card", iconBg: "bg-primary", iconText: "text-primary-foreground" };

interface Section {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface AppSetting {
  key: string;
  value: string;
}

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [sectionsRes, settingsRes] = await Promise.all([
      supabase.from("festival_sections").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("app_settings").select("*"),
    ]);
    if (sectionsRes.data) setSections(sectionsRes.data);
    if (settingsRes.data) {
      const map: Record<string, string> = {};
      settingsRes.data.forEach((s: AppSetting) => { map[s.key] = s.value; });
      setSettings(map);
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || MapPin;
    return <Icon className="w-6 h-6" />;
  };

  const getColors = (iconName: string) => sectionColors[iconName] || defaultColors;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-20">
          <img src={poster} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 px-4 py-12 pb-16">
          <div className="flex items-center justify-between mb-8">
            <img src={logo} alt="Color Fest" className="h-10" />
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                  onClick={() => navigate("/admin")}
                >
                  Admin
                </Button>
              )}
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                  onClick={signOut}
                >
                  Esci
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
                  onClick={() => navigate("/auth")}
                >
                  Accedi
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-3">
              {settings.festival_name || "Color Fest XIV"}
            </h1>
            <p className="text-xl font-light opacity-90 mb-2">
              {settings.festival_subtitle || "Quando Sulla Riva Verrai"}
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm opacity-80">
              <Calendar className="w-4 h-4" />
              <span>{settings.festival_dates || "11-12-13 Agosto 2026"}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm opacity-80">
              <MapPin className="w-4 h-4" />
              <span>{settings.festival_location || "Lungomare Falcone e Borsellino - Riviera dei Tramonti, Lamezia Terme"}</span>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1440,40 L1440,60 L0,60 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </section>

      {/* Map Button */}
      <section className="px-4 -mt-4 relative z-20">
        <button
          onClick={() => navigate("/map")}
          className="w-full bg-secondary text-secondary-foreground rounded-xl p-4 shadow-card flex items-center justify-between hover:shadow-elevated transition-shadow animate-pulse-glow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Mappa Interattiva</p>
              <p className="text-sm opacity-70">Esplora il festival</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Sections Grid */}
      <section className="px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Esplora</h2>
        <div className="grid grid-cols-2 gap-4">
          {sections.map((section, i) => {
            const colors = getColors(section.icon);
            return (
              <button
                key={section.id}
                onClick={() => navigate(`/section/${section.id}`)}
                className={`${colors.bg} rounded-xl p-5 shadow-card text-left hover:shadow-elevated transition-all hover:-translate-y-1 animate-fade-in`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
              >
                <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center mb-3 ${colors.iconText}`}>
                  {getIcon(section.icon)}
                </div>
                <h3 className="font-bold text-foreground">{section.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{section.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Color Fest XIV Ed. - Tutti i diritti riservati</p>
      </footer>
    </div>
  );
};

export default Index;
