import { useState, useEffect, useCallback } from "react";
import { supabaseFetch, supabaseInsert, supabaseUpdate, supabaseDelete } from "@/lib/supabase-fetch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Favorite {
  id: string;
  event_id: string;
  note: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }, []);

  const fetchFavs = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const token = await getToken();
    const data = await supabaseFetch<Favorite>(
      "user_favorites",
      `user_id=eq.${user.id}&select=id,event_id,note`,
      { token }
    );
    setFavorites(data || []);
    setLoading(false);
  }, [user, getToken]);

  useEffect(() => { fetchFavs(); }, [fetchFavs]);

  const isFavorite = (eventId: string) => favorites.some(f => f.event_id === eventId);

  const toggle = async (eventId: string) => {
    if (!user) return;
    const token = await getToken();
    const existing = favorites.find(f => f.event_id === eventId);
    if (existing) {
      await supabaseDelete("user_favorites", `id=eq.${existing.id}`, { token });
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
    } else {
      const data = await supabaseInsert<Favorite>(
        "user_favorites",
        { user_id: user.id, event_id: eventId },
        { token }
      );
      if (data) setFavorites(prev => [...prev, data]);
    }
  };

  const updateNoteFn = async (eventId: string, note: string) => {
    if (!user) return;
    const token = await getToken();
    const existing = favorites.find(f => f.event_id === eventId);
    if (!existing) return;
    await supabaseUpdate("user_favorites", `id=eq.${existing.id}`, { note }, { token });
    setFavorites(prev => prev.map(f => f.id === existing.id ? { ...f, note } : f));
  };

  const getNote = (eventId: string) => favorites.find(f => f.event_id === eventId)?.note || "";

  return { favorites, loading, isFavorite, toggle, updateNote: updateNoteFn, getNote, refetch: fetchFavs };
};
