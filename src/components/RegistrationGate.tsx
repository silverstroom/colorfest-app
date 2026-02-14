import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo_white.png";

const GATE_KEY = "colorfest_gate_dismissed";

const RegistrationGate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // If logged in, never show
    if (user) return;

    // If already dismissed without registering, show immediately
    const dismissed = localStorage.getItem(GATE_KEY);
    if (dismissed === "blocked") {
      setShow(true);
      return;
    }

    // Otherwise wait 5 seconds
    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(GATE_KEY, "blocked");
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  // Once user logs in, clear the gate
  useEffect(() => {
    if (user) {
      localStorage.removeItem(GATE_KEY);
      setShow(false);
    }
  }, [user]);

  if (!show || user) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-elevated text-center space-y-4 animate-fade-in">
        <img src={logo} alt="Color Fest" className="h-8 mx-auto invert dark:invert-0 opacity-60" />
        <h2 className="text-xl font-black text-foreground">Registrati per continuare</h2>
        <p className="text-sm text-muted-foreground">
          Per esplorare il programma del Color Fest XIV, salva i tuoi eventi preferiti e crea il tuo programma personalizzato, registrati gratuitamente.
        </p>
        <Button
          className="w-full"
          onClick={() => navigate("/auth")}
        >
          Registrati / Accedi
        </Button>
      </div>
    </div>
  );
};

export default RegistrationGate;
