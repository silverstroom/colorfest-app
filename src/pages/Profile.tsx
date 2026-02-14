import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, LogOut, LogIn, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Accedi al tuo profilo</h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Salva i tuoi eventi preferiti e personalizza la tua esperienza
        </p>
        <Button onClick={() => navigate("/auth")} className="w-full max-w-xs">
          <LogIn className="w-4 h-4 mr-2" /> Accedi
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{user.email}</h1>
          {isAdmin && (
            <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full mt-2">
              Admin
            </span>
          )}
        </div>

        <div className="space-y-3">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3 text-left hover:shadow-elevated transition-shadow"
            >
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Pannello Admin</span>
            </button>
          )}

          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-3 text-left hover:shadow-elevated transition-shadow"
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="font-semibold text-destructive">Esci</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
