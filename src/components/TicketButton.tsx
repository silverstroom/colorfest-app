import { Ticket } from "lucide-react";
import { useLocation } from "react-router-dom";

const TICKET_URL = "https://colorfest.it/biglietti-info/";

const TicketButton = () => {
  const location = useLocation();
  const hiddenPaths = ["/admin", "/auth"];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <a
      href={TICKET_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:shadow-xl hover:scale-105 transition-all animate-fade-in"
    >
      <Ticket className="w-5 h-5" />
      <span className="text-sm font-bold">Biglietti</span>
    </a>
  );
};

export default TicketButton;
