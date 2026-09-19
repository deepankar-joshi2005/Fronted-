import { Lock, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";

const COPY = {
  suspended: {
    title: "Your account has been suspended",
    description: "The platform administrator has suspended access for your firm. Contact support to resolve this.",
  },
  expired: {
    title: "Your subscription has ended",
    description: "Renew your plan to restore full access to your firm's workspace.",
  },
};

export default function FirmLockedScreen({ reason, firmName }) {
  const navigate = useNavigate();
  const { basePath } = useAuth();
  const copy = COPY[reason] || COPY.expired;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
          <Lock size={26} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-heading">{copy.title}</h2>
          <p className="mt-2 text-sm text-text-muted">
            {firmName && <span className="font-medium text-text">{firmName}</span>} {copy.description}
          </p>
        </div>
        <Button onClick={() => navigate(`${basePath}/subscription`)} className="mt-2">
          <CreditCard size={16} /> Subscribe now
        </Button>
      </Card>
    </div>
  );
}
