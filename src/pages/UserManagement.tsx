import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabaseFetch, supabaseUpdate } from "@/lib/supabase-fetch";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Shield, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  marketing_consent: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const UserManagement = () => {
  const { user, isAdmin, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const token = session?.access_token;

  useEffect(() => {
    if (!isAdmin || !token) return;
    loadData();
  }, [isAdmin, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData, rolesData] = await Promise.all([
        supabaseFetch<UserProfile>("profiles", "select=*&order=created_at.desc", { token }),
        supabaseFetch<UserRole>("user_roles", "select=user_id,role", { token }),
      ]);
      setProfiles(profilesData);
      const rolesMap: Record<string, string> = {};
      rolesData.forEach((r) => (rolesMap[r.user_id] = r.role));
      setRoles(rolesMap);
    } catch (err) {
      console.error(err);
      toast({ title: "Errore nel caricamento utenti", variant: "destructive" });
    }
    setLoading(false);
  };

  const toggleRole = async (targetUserId: string) => {
    if (!token) return;
    const current = roles[targetUserId] || "user";
    const newRole = current === "admin" ? "user" : "admin";

    setUpdatingRole(targetUserId);
    try {
      await supabaseUpdate(
        "user_roles",
        `user_id=eq.${targetUserId}`,
        { role: newRole },
        { token }
      );
      setRoles((prev) => ({ ...prev, [targetUserId]: newRole }));
      toast({ title: `Ruolo aggiornato a ${newRole}` });
    } catch {
      toast({ title: "Errore nell'aggiornamento del ruolo", variant: "destructive" });
    }
    setUpdatingRole(null);
  };

  const exportCSV = () => {
    const header = "Username,Email,Consenso Marketing,Data Registrazione,Ruolo";
    const rows = profiles.map((p) => {
      const role = roles[p.user_id] || "user";
      const date = new Date(p.created_at).toLocaleDateString("it-IT");
      return `"${p.username}","${p.email}",${p.marketing_consent ? "Sì" : "No"},"${date}","${role}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utenti_colorfest_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Accesso non autorizzato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/profile")} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Users className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground flex-1">Gestione Utenti</h1>
        <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
            <p className="text-xs text-muted-foreground">Utenti registrati</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-primary">
              {Object.values(roles).filter((r) => r === "admin").length}
            </p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="px-4 pt-2 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
        ) : (
          profiles.map((p) => {
            const role = roles[p.user_id] || "user";
            const isCurrentUser = p.user_id === user.id;
            return (
              <div
                key={p.id}
                className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm truncate">
                    {p.username}
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground ml-1">(tu)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("it-IT")} ·{" "}
                    {p.marketing_consent ? "📩 Marketing OK" : "📩 No marketing"}
                  </p>
                </div>
                <button
                  onClick={() => !isCurrentUser && toggleRole(p.user_id)}
                  disabled={isCurrentUser || updatingRole === p.user_id}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  } ${isCurrentUser ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
                >
                  <Shield className="w-3 h-3 inline mr-1" />
                  {updatingRole === p.user_id ? "..." : role === "admin" ? "Admin" : "User"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserManagement;
