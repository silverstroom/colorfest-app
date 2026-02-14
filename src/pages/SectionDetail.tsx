import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, MapPin as MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  description: string;
  artist: string;
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

const SectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);

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
    if (eventsRes.data) setEvents(eventsRes.data);
  };

  const days = [1, 2, 3];
  const dayLabels = ["11 Ago", "12 Ago", "13 Ago"];
  const filteredEvents = events.filter((e) => e.day === selectedDay);

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  if (!section) return null;

  return (
    <div className="min-h-screen bg-background">
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
        <h1 className="text-3xl font-black">{section.name}</h1>
        <p className="text-primary-foreground/70 mt-1">{section.description}</p>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 30" fill="none" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1440,20 L1440,30 L0,30 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </div>

      {/* Day selector */}
      {events.length > 0 && (
        <div className="px-4 pt-4 flex gap-2">
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

      {/* Events */}
      <div className="px-4 py-6 space-y-4">
        {filteredEvents.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nessun evento per questo giorno
          </p>
        )}
        {filteredEvents.map((event, i) => (
          <div
            key={event.id}
            className="bg-card rounded-xl p-4 shadow-card animate-fade-in"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
          >
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover rounded-lg mb-3" />
            )}
            <h3 className="font-bold text-lg text-foreground">{event.title}</h3>
            {event.artist && <p className="text-primary font-medium">{event.artist}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                  {event.stage}
                </button>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionDetail;
