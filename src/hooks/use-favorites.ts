import { useState, useEffect, useCallback } from "react";
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

  const fetch = useCallback(async () => {
    if (!user) { setFavorites([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("user_favorites")
      .select("id, event_id, note")
      .eq("user_id", user.id);
    setFavorites((data as Favorite[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const isFavorite = (eventId: string) => favorites.some(f => f.event_id === eventId);

  const toggle = async (eventId: string) => {
    if (!user) return;
    const existing = favorites.find(f => f.event_id === eventId);
    if (existing) {
      await supabase.from("user_favorites").delete().eq("id", existing.id);
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, event_id: eventId })
        .select("id, event_id, note")
        .single();
      if (data) setFavorites(prev => [...prev, data as Favorite]);
    }
  };

  const updateNote = async (eventId: string, note: string) => {
    if (!user) return;
    const existing = favorites.find(f => f.event_id === eventId);
    if (!existing) return;
    await supabase.from("user_favorites").update({ note }).eq("id", existing.id);
    setFavorites(prev => prev.map(f => f.id === existing.id ? { ...f, note } : f));
  };

  const getNote = (eventId: string) => favorites.find(f => f.event_id === eventId)?.note || "";

  return { favorites, loading, isFavorite, toggle, updateNote, getNote, refetch: fetch };
};
