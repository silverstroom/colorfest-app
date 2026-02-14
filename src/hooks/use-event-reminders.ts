import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/use-favorites";
import { supabaseFetch } from "@/lib/supabase-fetch";
import { useToast } from "@/hooks/use-toast";

interface EventRow {
  id: string;
  title: string;
  artist: string | null;
  start_time: string | null;
  stage: string | null;
}

const CHECK_INTERVAL = 60_000; // every minute
const REMINDER_WINDOW_MS = 15 * 60_000; // 15 minutes

export const useEventReminders = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { toast } = useToast();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || favorites.length === 0) return;

    const checkReminders = async () => {
      const eventIds = favorites.map((f) => f.event_id);
      if (eventIds.length === 0) return;

      try {
        const filter = `id=in.(${eventIds.join(",")})&select=id,title,artist,start_time,stage&is_active=is.true`;
        const events = await supabaseFetch<EventRow>("events", filter);

        const now = Date.now();

        for (const event of events) {
          if (!event.start_time || notifiedRef.current.has(event.id)) continue;

          const startMs = new Date(event.start_time).getTime();
          const diff = startMs - now;

          // Notify if event starts within 15 minutes (and hasn't started yet)
          if (diff > 0 && diff <= REMINDER_WINDOW_MS) {
            notifiedRef.current.add(event.id);
            const mins = Math.round(diff / 60_000);
            const name = event.artist || event.title;
            toast({
              title: `⏰ ${name} tra ${mins} min!`,
              description: event.stage
                ? `Sul palco: ${event.stage}`
                : "Sta per iniziare — non perdertelo!",
              duration: 10000,
            });
          }
        }
      } catch {
        // silently fail – non-critical
      }
    };

    // Initial check
    checkReminders();

    const interval = setInterval(checkReminders, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [user, favorites, toast]);
};
