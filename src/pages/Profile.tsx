import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/use-favorites";
import { supabaseFetchSingle } from "@/lib/supabase-fetch";
import { supabase } from "@/integrations/supabase/client";
import {
  User, LogOut, LogIn, Shield, Heart, Lock, Mail,
  ChevronRight, Calendar, CheckCircle2, XCircle, Megaphone, Pencil, Camera, Users, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationContext";

interface ProfileData {
  username: string;
  email: string;
  marketing_consent: boolean;
  created_at: string;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, isAdmin, signOut, session } = useAuth();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { toast } = useToast();
  const { remindersEnabled, setRemindersEnabled } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [togglingMarketing, setTogglingMarketing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabaseFetchSingle<ProfileData>(
      "profiles",
      `user_id=eq.${user.id}&select=username,email,marketing_consent,created_at,avatar_url`
    ).then((data) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "L'immagine deve essere inferiore a 2MB", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Errore nel caricamento", variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", user.id);

    if (!updateError && profile) {
      setProfile({ ...profile, avatar_url: avatarUrl });
      toast({ title: "Foto profilo aggiornata ✓" });
    }
    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "La password deve avere almeno 6 caratteri", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Le password non coincidono", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password aggiornata con successo ✓" });
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleToggleMarketing = async () => {
    if (!user || !profile) return;
    setTogglingMarketing(true);
    const newVal = !profile.marketing_consent;
    const { error } = await supabase
      .from("profiles")
      .update({ marketing_consent: newVal })
      .eq("user_id", user.id);
    setTogglingMarketing(false);
    if (!error) {
      setProfile({ ...profile, marketing_consent: newVal });
      toast({ title: newVal ? "Comunicazioni attivate" : "Comunicazioni disattivate" });
    }
  };

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

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("it-IT", { year: "numeric", month: "long" })
    : "";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-8 pb-2">
        <div className="flex flex-col items-center mb-6">
          {/* Avatar with upload */}
          <div className="relative mb-3">
            <Avatar className="w-20 h-20">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Avatar" />
              ) : null}
              <AvatarFallback className="bg-primary/10">
                <User className="w-10 h-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {profile?.username || user.email}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {isAdmin && (
            <span className="text-xs bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full mt-2">
              Admin
            </span>
          )}
          {memberSince && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Membro da {memberSince}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Favorites recap */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">I tuoi preferiti</h2>
          <button
            onClick={() => navigate("/my-program")}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center justify-between hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">{favorites.length} eventi salvati</p>
                <p className="text-xs text-muted-foreground">Vedi il tuo programma completo</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Account</h2>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-3 w-full text-left"
              >
                <Lock className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Cambia password</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
              </button>
              {showPasswordForm && (
                <div className="mt-3 space-y-3 pl-8">
                  <input
                    type="password"
                    placeholder="Nuova password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="password"
                    placeholder="Conferma password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    className="w-full"
                  >
                    {savingPassword ? "Salvataggio..." : "Aggiorna password"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Preferenze</h2>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Comunicazioni e novità</p>
                <p className="text-xs text-muted-foreground">Ricevi aggiornamenti su eventi e promozioni</p>
              </div>
              <Switch
                checked={profile?.marketing_consent ?? false}
                onCheckedChange={handleToggleMarketing}
                disabled={togglingMarketing}
              />
            </div>
            <div className="p-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Promemoria eventi</p>
                <p className="text-xs text-muted-foreground">Avviso 15 min prima degli eventi preferiti</p>
              </div>
              <Switch
                checked={remindersEnabled}
                onCheckedChange={(v) => {
                  setRemindersEnabled(v);
                  toast({ title: v ? "Promemoria attivati ✓" : "Promemoria disattivati" });
                }}
              />
            </div>
          </div>
        </section>

        {/* Admin section */}
        {isAdmin && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Gestione App</h2>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden divide-y divide-border">
              <button
                onClick={() => navigate("/admin")}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Modalità Modifica</p>
                  <p className="text-xs text-muted-foreground">Gestisci contenuti, eventi e impostazioni</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate("/admin?tab=events")}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Gestione Eventi</p>
                  <p className="text-xs text-muted-foreground">Aggiungi o modifica artisti e line-up</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Gestione Utenti</p>
                  <p className="text-xs text-muted-foreground">Visualizza utenti, cambia ruoli, esporta CSV</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </section>
        )}

        {/* Logout */}
        <section>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <button
              onClick={async () => { await signOut(); navigate("/"); }}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
            >
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="font-semibold text-destructive">Esci dall'account</span>
            </button>
          </div>
        </section>

        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-muted-foreground">Color Fest XIV — v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
