import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/use-favorites";
import { supabaseFetch } from "@/lib/supabase-fetch";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";

interface EventRow {
  id: string;
  title: string;
  artist: string | null;
  start_time: string | null;
  stage: string | null;
}

const CHECK_INTERVAL = 60_000;
const REMINDER_WINDOW_MS = 15 * 60_000;

export const useEventReminders = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { toast } = useToast();
  const { addNotification, remindersEnabled } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || favorites.length === 0 || !remindersEnabled) return;

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

          if (diff > 0 && diff <= REMINDER_WINDOW_MS) {
            notifiedRef.current.add(event.id);
            const mins = Math.round(diff / 60_000);
            const name = event.artist || event.title;
            const title = `⏰ ${name} tra ${mins} min!`;
            const description = event.stage
              ? `Sul palco: ${event.stage}`
              : "Sta per iniziare — non perdertelo!";

            toast({ title, description, duration: 10000 });
            addNotification({ title, description });
          }
        }
      } catch {
        // silently fail
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [user, favorites, toast, remindersEnabled, addNotification]);
};
