import { useAuth } from "@/contexts/AuthContext";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminEditButtonProps {
  tab?: string;
  className?: string;
}

const AdminEditButton = ({ tab = "sections", className = "" }: AdminEditButtonProps) => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/admin?tab=${tab}`);
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors ${className}`}
      title="Modifica"
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
};

export default AdminEditButton;
