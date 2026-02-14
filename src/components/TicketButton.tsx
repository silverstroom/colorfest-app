import { Ticket, Pencil, Check, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseFetch } from "@/lib/supabase-fetch";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULTS = {
  ticket_url: "https://colorfest.it/biglietti-info/",
  ticket_label: "Biglietti",
  ticket_color: "",
};

const TicketButton = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULTS);

  const hiddenPaths = ["/admin", "/auth"];
  const hidden = hiddenPaths.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    supabaseFetch("app_settings", "select=key,value&key=in.(ticket_url,ticket_label,ticket_color)").then((data: any) => {
      if (!data) return;
      const map = { ...DEFAULTS };
      data.forEach((s: any) => { if (s.value) (map as any)[s.key] = s.value; });
      setSettings(map);
      setDraft(map);
    });
  }, []);

  const save = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const headers: Record<string, string> = {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    };
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/app_settings?on_conflict=key`;
    await Promise.all(
      Object.entries(draft).map(([key, value]) =>
        fetch(url, { method: "POST", headers, body: JSON.stringify({ key, value }) })
      )
    );
    setSettings(draft);
    setEditing(false);
  };

  if (hidden) return null;

  const customStyle = settings.ticket_color
    ? { backgroundColor: settings.ticket_color, color: "#fff" }
    : {};

  return (
    <>
      {/* Floating ticket button */}
      <a
        href={settings.ticket_url}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        style={customStyle}
      >
        <Ticket className="w-5 h-5" />
        <span className="text-sm font-bold">{settings.ticket_label}</span>
      </a>

      {/* Admin edit button */}
      {isAdmin && !editing && (
        <button
          onClick={() => { setDraft(settings); setEditing(true); }}
          className="fixed bottom-32 right-4 z-50 w-8 h-8 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted transition-colors"
          title="Modifica pulsante biglietti"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}

      {/* Editor panel */}
      {editing && (
        <div className="fixed bottom-20 right-4 z-[60] bg-card rounded-2xl shadow-elevated border border-border p-4 w-72 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Pulsante Biglietti</h3>
            <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Testo</label>
            <input
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={draft.ticket_label}
              onChange={(e) => setDraft({ ...draft, ticket_label: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Link</label>
            <input
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={draft.ticket_url}
              onChange={(e) => setDraft({ ...draft, ticket_url: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Colore (vuoto = default)</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={draft.ticket_color || "#6366f1"}
                onChange={(e) => setDraft({ ...draft, ticket_color: e.target.value })}
                className="w-9 h-9 rounded-lg border border-border cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground">{draft.ticket_color || "default"}</span>
              {draft.ticket_color && (
                <button
                  onClick={() => setDraft({ ...draft, ticket_color: "" })}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <button
            onClick={save}
            className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Check className="w-4 h-4" /> Salva
          </button>
        </div>
      )}
    </>
  );
};

export default TicketButton;
