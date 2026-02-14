import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Esplora", icon: Compass, path: "/explore" },
  { label: "Preferiti", icon: Heart, path: "/my-program" },
  { label: "Profilo", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin, auth, and map pages
  const hiddenPaths = ["/admin", "/auth", "/map"];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ label, icon: Icon, path }) => {
          const isActive = path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
