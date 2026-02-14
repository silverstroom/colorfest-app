import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/use-favorites";
import { ArrowLeft, Clock, MapPin as MapPinIcon, Heart, Eye, Pencil } from "lucide-react";
import AdminEditButton from "@/components/AdminEditButton";
import { Button } from "@/components/ui/button";

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
  description: string;
  artist: string;
  bio: string;
  spotify_url: string;
  start_time: string | null;
  end_time: string | null;
  day: number;
  stage: string;
  image_url: string;
  is_active: boolean;
}

interface Section {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const stageColors: Record<string, { bg: string; text: string }> = {
  "Palco dei Tramonti": { bg: "bg-red-500", text: "text-white" },
  "Palco Pineta": { bg: "bg-green-600", text: "text-white" },
  "Future Stage": { bg: "bg-purple-500", text: "text-white" },
  "Marley Stage": { bg: "bg-amber-500", text: "text-white" },
};

const toSpotifyEmbed = (url: string): string | null => {
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  const match = url.match(/open\.spotify\.com\/(artist|track|album)\/([a-zA-Z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  return null;
};

// Generate stable random viewer counts per event
const getViewerCount = (eventId: string) => {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = ((hash << 5) - hash) + eventId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 88) + 3; // 3 to 90
};

const SectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const [section, setSection] = useState<Section | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const [sectionRes, eventsRes] = await Promise.all([
      supabase.from("festival_sections").select("*").eq("id", id).single(),
      supabase.from("events").select("*").eq("section_id", id).eq("is_active", true).order("sort_order"),
    ]);
    if (sectionRes.data) setSection(sectionRes.data);
    if (eventsRes.data) setEvents(eventsRes.data as Event[]);
  };

  const days = [1, 2, 3];
  const dayLabels = ["11 Ago", "12 Ago", "13 Ago"];

  const isConcerti = section?.icon === "Music";
  const hasDayFilter = isConcerti;

  // Get unique stages from events
  const stages = [...new Set(events.map(e => e.stage).filter(Boolean))];

  // Filter by day (only for Concerti) + optionally by stage
  const filteredEvents = events.filter((e) => {
    if (hasDayFilter && e.day !== selectedDay) return false;
    if (selectedStage && e.stage !== selectedStage) return false;
    return true;
  });

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  if (!section) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pb-8 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-primary-foreground hover:bg-primary-foreground/10 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">{section.name}</h1>
          <AdminEditButton tab="events" className="bg-white/10 text-white hover:bg-white/20" />
        </div>
        <p className="text-primary-foreground/70 mt-1">{section.description}</p>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 30" fill="none" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1440,20 L1440,30 L0,30 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </div>

      {/* Stage filter (only for Concerti) - replaces legend */}
      {isConcerti && stages.length > 0 && (
        <div className="px-4 pt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStage(null)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedStage === null
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground shadow-card"
            }`}
          >
            Tutti i palchi
          </button>
          {stages.map(stage => {
            const sc = stageColors[stage];
            return (
              <button
                key={stage}
                onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  selectedStage === stage
                    ? `${sc?.bg || "bg-primary"} ${sc?.text || "text-primary-foreground"}`
                    : "bg-card text-muted-foreground shadow-card"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${sc?.bg || "bg-muted-foreground"} ${selectedStage === stage ? "bg-white/50" : ""}`} />
                {stage}
              </button>
            );
          })}
        </div>
      )}

      {/* Day selector (only for Concerti) */}
      {hasDayFilter && events.length > 0 && (
        <div className="px-4 pt-3 flex gap-2">
          {days.map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                selectedDay === day
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-card"
              }`}
            >
              {dayLabels[i]}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-6 space-y-5">
        {filteredEvents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nessun evento per questa selezione
          </p>
        )}
        {filteredEvents.map((event, i) => {
          const isExpanded = expandedEvent === event.id;
          const sc = stageColors[event.stage];
          const isTBA = event.artist === "TBA";
          const localImg = localImages[event.title] || localImages[event.artist];
          const imgSrc = localImg || event.image_url;
          const embedUrl = toSpotifyEmbed(event.spotify_url);

          return (
            <div
              key={event.id}
              className={`bg-card rounded-2xl shadow-card animate-fade-in overflow-hidden ${isTBA ? "opacity-60" : ""}`}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              {/* Artist image - mobile optimized: 16:9 crop */}
              {imgSrc && !isTBA && (
                <div className="relative">
                  <img
                    src={imgSrc}
                    alt={event.title}
                    className="w-full aspect-[16/10] object-cover object-top"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {/* Stage badge on image */}
                  {event.stage && isConcerti && sc && (
                    <span className={`absolute top-3 right-3 ${sc.bg} ${sc.text} text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                      {event.stage}
                    </span>
                  )}
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-xl text-foreground leading-tight">{event.title}</h3>
                    {event.artist && !isTBA && event.artist !== event.title && (
                      <p className="text-primary font-medium text-sm mt-0.5">{event.artist}</p>
                    )}
                  </div>
                  {user && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(event.id); }}
                      className="shrink-0 p-1 transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite(event.id) ? "text-red-500 fill-red-500" : "text-muted-foreground/40"}`}
                      />
                    </button>
                  )}
                </div>

                {/* Stage + time info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {event.start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(event.start_time)}
                      {event.end_time && ` - ${formatTime(event.end_time)}`}
                    </span>
                  )}
                  {event.stage && (
                    <button
                      onClick={() => navigate(`/map?highlight=${event.stage}`)}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <MapPinIcon className="w-3.5 h-3.5" />
                      <span className="text-xs">Vedi sulla mappa</span>
                    </button>
                  )}
                </div>

                {/* Viewers count */}
                {!isTBA && (
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Eye className="w-3 h-3" />
                    <span>{getViewerCount(event.id)} persone stanno guardando</span>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                {/* Bio toggle */}
                {!isTBA && event.bio && (
                  <div>
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      className="text-xs text-primary font-bold uppercase tracking-wide"
                    >
                      {isExpanded ? "▲ Nascondi bio" : "▼ Leggi la bio"}
                    </button>
                    {isExpanded && (
                      <p className="text-sm text-foreground/80 leading-relaxed mt-2 animate-fade-in">
                        {event.bio}
                      </p>
                    )}
                  </div>
                )}

                {/* Spotify Embed */}
                {embedUrl && !isTBA && (
                  <div className="pt-1">
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-xl"
                      title={`Spotify - ${event.title}`}
                    />
                  </div>
                )}

                {/* Camping CTA */}
                {event.title.toLowerCase().includes("camping") && (
                  <a
                    href="https://colorfest.it/prodotto/prenotazione-camping/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
                  >
                    Verifica disponibilità
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionDetail;
