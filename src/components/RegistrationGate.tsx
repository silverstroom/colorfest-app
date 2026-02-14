import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_white.png";
import { X } from "lucide-react";

const FIRST_DELAY = 5000;
const REPEAT_DELAY = 20000;

const RegistrationGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  const isAuthPage = location.pathname === "/auth";

  const schedulePopup = useCallback(
    (delay: number) => {
      const timer = setTimeout(() => {
        setShow(true);
      }, delay);
      return timer;
    },
    []
  );

  useEffect(() => {
    if (user) {
      setShow(false);
      return;
    }

    const delay = hasShownOnce ? REPEAT_DELAY : FIRST_DELAY;
    const timer = schedulePopup(delay);
    return () => clearTimeout(timer);
  }, [user, hasShownOnce, schedulePopup]);

  const handleDismiss = () => {
    setShow(false);
    setHasShownOnce(true);
  };

  if (!show || user || isAuthPage) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-elevated text-center space-y-4 animate-fade-in relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <img src={logo} alt="Color Fest" className="h-8 mx-auto invert dark:invert-0 opacity-60" />
        <h2 className="text-xl font-black text-foreground">Non perderti nulla! 🎶</h2>
        <p className="text-sm text-muted-foreground">
          Registrati <span className="font-semibold text-foreground">gratuitamente</span> per sbloccare tutte le funzioni: salva i tuoi artisti preferiti, crea il tuo programma personalizzato e ricevi aggiornamenti esclusivi sul Color Fest XIV!
        </p>
        <Button className="w-full" onClick={() => navigate("/auth")}>
          Registrati gratis
        </Button>
        <button
          onClick={handleDismiss}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Continua senza registrarti
        </button>
      </div>
    </div>
  );
};

export default RegistrationGate;
