import { useAuth, roleLabels } from "@/context/auth";
import { Link } from "@tanstack/react-router";
import { ShieldX, ArrowLeft } from "lucide-react";

export function UnauthorizedPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="mx-auto max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-danger/12">
          <ShieldX className="size-10 text-danger" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Accès non autorisé</h2>
        <p className="mt-2 text-muted-foreground">
          Votre rôle <span className="font-semibold">{roleLabels[user.role]}</span> ne vous permet
          pas d'accéder à cette page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="size-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
