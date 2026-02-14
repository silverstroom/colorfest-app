import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/use-favorites";
import { ArrowLeft, Heart, Clock, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  artist: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  day: number;
  stage: string;
  image_url: string;
  section_id: string;
}

interface Section {
  id: string;
  name: string;
  icon: string;
}

const dayLabels: Record<number, string> = { 1: "11 Ago", 2: "12 Ago", 3: "13 Ago" };

const stageColors: Record<string, string> = {
  "Palco dei Tramonti": "bg-red-500",
  "Palco Pineta": "bg-green-600",
  "Future Stage": "bg-purple-500",
  "Marley Stage": "bg-amber-500",
};

const MyProgram = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, isFavorite, toggle, getNote, updateNote } = useFavorites();
  const [events, setEvents] = useState<Event[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, favorites]);

  const fetchData = async () => {
    const eventIds = favorites.map(f => f.event_id);
    if (eventIds.length === 0) { setEvents([]); return; }

    const [eventsRes, sectionsRes] = await Promise.all([
      supabase.from("events").select("*").in("id", eventIds),
      supabase.from("festival_sections").select("id, name, icon"),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data as Event[]);
    if (sectionsRes.data) setSections(sectionsRes.data as Section[]);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const getSectionName = (sectionId: string) => sections.find(s => s.id === sectionId)?.name || "";
  const getSectionIcon = (sectionId: string) => sections.find(s => s.id === sectionId)?.icon || "";

  // Group events: concerti by day, others flat
  const concertiEvents = events.filter(e => getSectionIcon(e.section_id) === "Music");
  const otherEvents = events.filter(e => getSectionIcon(e.section_id) !== "Music");

  const concertiByDay = concertiEvents.reduce<Record<number, Event[]>>((acc, e) => {
    const day = e.day || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  const startNoteEdit = (eventId: string) => {
    setEditingNote(eventId);
    setNoteText(getNote(eventId));
  };

  const saveNote = async (eventId: string) => {
    await updateNote(eventId, noteText);
    setEditingNote(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Il tuo programma</h2>
        <p className="text-muted-foreground text-center mb-4">Accedi per salvare i tuoi eventi preferiti e creare il tuo programma personale</p>
        <Button onClick={() => navigate("/auth")}>Accedi</Button>
      </div>
    );
  }

  const renderEventCard = (event: Event) => {
    const note = getNote(event.id);
    const isEditingThis = editingNote === event.id;

    return (
      <div key={event.id} className="bg-card rounded-xl shadow-card p-4 space-y-2 animate-fade-in">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{event.title}</h3>
            {event.artist && event.artist !== event.title && (
              <p className="text-primary text-sm font-medium">{event.artist}</p>
            )}
          </div>
          <button
            onClick={() => toggle(event.id)}
            className="text-red-500 hover:text-red-600 transition-colors shrink-0 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {event.stage && (
            <span className={`${stageColors[event.stage] || "bg-muted"} text-white px-2 py-0.5 rounded-full font-semibold`}>
              {event.stage}
            </span>
          )}
          {event.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(event.start_time)}
              {event.end_time && ` - ${formatTime(event.end_time)}`}
            </span>
          )}
          <span className="text-muted-foreground/60">{getSectionName(event.section_id)}</span>
        </div>

        {/* Note */}
        {isEditingThis ? (
          <div className="flex gap-2 items-end">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="La tua nota..."
              className="flex-1 bg-muted rounded-lg p-2 text-sm text-foreground resize-none border-0 focus:ring-1 focus:ring-primary"
              rows={2}
              autoFocus
            />
            <Button size="sm" onClick={() => saveNote(event.id)}>Salva</Button>
          </div>
        ) : (
          <button
            onClick={() => startNoteEdit(event.id)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <StickyNote className="w-3 h-3" />
            {note ? <span className="italic">{note}</span> : <span>Aggiungi nota</span>}
          </button>
        )}
      </div>
    );
  };

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
        <div className="flex items-center gap-3">
          <Heart className="w-7 h-7" fill="currentColor" />
          <div>
            <h1 className="text-2xl font-black">Il mio programma</h1>
            <p className="text-primary-foreground/70 text-sm">{favorites.length} eventi salvati</p>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 30" fill="none" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1440,20 L1440,30 L0,30 Z" fill="hsl(43 100% 96%)" />
        </svg>
      </div>

      <div className="px-4 py-6 space-y-6">
        {favorites.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">Non hai ancora salvato nessun evento</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Tocca il cuoricino sugli eventi per aggiungerli al tuo programma
            </p>
          </div>
        )}

        {/* Concerti grouped by day */}
        {Object.keys(concertiByDay).sort().map(dayStr => {
          const day = Number(dayStr);
          return (
            <div key={day}>
              <h2 className="text-lg font-bold mb-3 text-foreground">{dayLabels[day] || `Giorno ${day}`} — Concerti</h2>
              <div className="space-y-3">
                {concertiByDay[day].map(renderEventCard)}
              </div>
            </div>
          );
        })}

        {/* Other events */}
        {otherEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-3 text-foreground">Stand & Attività</h2>
            <div className="space-y-3">
              {otherEvents.map(renderEventCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProgram;
