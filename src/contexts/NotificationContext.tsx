import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearAll: () => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (v: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const REMINDERS_KEY = "colorfest_reminders_enabled";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [remindersEnabled, setRemindersEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored === null ? true : stored === "true";
  });

  const setRemindersEnabled = useCallback((v: boolean) => {
    setRemindersEnabledState(v);
    localStorage.setItem(REMINDERS_KEY, String(v));
  }, []);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
      setNotifications((prev) => [
        { ...n, id: crypto.randomUUID(), timestamp: Date.now(), read: false },
        ...prev,
      ]);
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAllRead,
        clearAll,
        remindersEnabled,
        setRemindersEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};
