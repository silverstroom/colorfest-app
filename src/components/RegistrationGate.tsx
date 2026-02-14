import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_white.png";
import { X, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FIRST_DELAY = 5000;
const REPEAT_DELAY = 20000;

const DEFAULT_TITLE = "Non perderti nulla! 🎶";
const DEFAULT_DESCRIPTION =
  'Registrati gratuitamente per sbloccare tutte le funzioni: salva i tuoi artisti preferiti, crea il tuo programma personalizzato e ricevi aggiornamenti esclusivi sul Color Fest XIV!';
const DEFAULT_BUTTON = "Registrati gratis";
const DEFAULT_DISMISS = "Continua senza registrarti";

const RegistrationGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [buttonText, setButtonText] = useState(DEFAULT_BUTTON);
  const [dismissText, setDismissText] = useState(DEFAULT_DISMISS);

  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editButton, setEditButton] = useState(buttonText);
  const [editDismiss, setEditDismiss] = useState(dismissText);

  const isAuthPage = location.pathname === "/auth";

  // Load texts from app_settings
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["popup_title", "popup_description", "popup_button", "popup_dismiss"]);
      if (data) {
        data.forEach((s) => {
          if (s.key === "popup_title" && s.value) setTitle(s.value);
          if (s.key === "popup_description" && s.value) setDescription(s.value);
          if (s.key === "popup_button" && s.value) setButtonText(s.value);
          if (s.key === "popup_dismiss" && s.value) setDismissText(s.value);
        });
      }
    };
    load();
  }, []);

  // Check admin
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(!!(data && data.length > 0));
    });
  }, [user]);

  const schedulePopup = useCallback(
    (delay: number) => {
      const timer = setTimeout(() => setShow(true), delay);
      return timer;
    },
    []
  );

  useEffect(() => {
    if (user) { setShow(false); return; }
    const delay = hasShownOnce ? REPEAT_DELAY : FIRST_DELAY;
    const timer = schedulePopup(delay);
    return () => clearTimeout(timer);
  }, [user, hasShownOnce, schedulePopup]);

  const handleDismiss = () => {
    setShow(false);
    setHasShownOnce(true);
  };

  const startEditing = () => {
    setEditTitle(title);
    setEditDescription(description);
    setEditButton(buttonText);
    setEditDismiss(dismissText);
    setEditing(true);
  };

  const saveTexts = async () => {
    const pairs = [
      { key: "popup_title", value: editTitle },
      { key: "popup_description", value: editDescription },
      { key: "popup_button", value: editButton },
      { key: "popup_dismiss", value: editDismiss },
    ];
    for (const p of pairs) {
      await supabase.from("app_settings").upsert({ key: p.key, value: p.value }, { onConflict: "key" });
    }
    setTitle(editTitle);
    setDescription(editDescription);
    setButtonText(editButton);
    setDismissText(editDismiss);
    setEditing(false);
  };

  // Admin can force-show popup for editing
  const showForAdmin = isAdmin && !show && !isAuthPage;

  if (!show && !showForAdmin) return showForAdmin ? null : null;
  if (!show && !isAdmin) return null;
  if (isAuthPage) return null;

  // Show popup for regular users OR admin preview
  const visible = show && !user;
  const adminPreview = isAdmin && !editing;

  if (!visible && !isAdmin) return null;

  return (
    <>
      {/* Admin floating button to preview/edit popup */}
      {isAdmin && !show && (
        <button
          onClick={() => { setShow(true); startEditing(); }}
          className="fixed bottom-20 right-4 z-[101] bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
          title="Modifica popup registrazione"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {(visible || (isAdmin && show)) && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-elevated text-center space-y-4 animate-fade-in relative">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {isAdmin && !editing && (
              <button
                onClick={startEditing}
                className="absolute top-3 left-3 p-1 rounded-full hover:bg-muted transition-colors"
                title="Modifica testi"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            )}

            <img src={logo} alt="Color Fest" className="h-8 mx-auto invert dark:invert-0 opacity-60" />

            {editing ? (
              <div className="space-y-3 text-left">
                <div>
                  <label className="text-xs text-muted-foreground">Titolo</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Descrizione</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm min-h-[80px]"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Testo pulsante</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={editButton}
                    onChange={(e) => setEditButton(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Testo chiudi</label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    value={editDismiss}
                    onChange={(e) => setEditDismiss(e.target.value)}
                  />
                </div>
                <Button className="w-full" size="sm" onClick={saveTexts}>
                  <Check className="w-4 h-4 mr-1" /> Salva
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  {buttonText}
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {dismissText}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RegistrationGate;
