import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "../../components/ui/Button.jsx";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Compass size={26} />
      </span>
      <h1 className="text-3xl font-bold text-heading">Page not found</h1>
      <p className="max-w-sm text-sm text-text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/">
        <Button variant="brand">Back to home</Button>
      </Link>
    </div>
  );
}
