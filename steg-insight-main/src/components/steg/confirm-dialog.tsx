import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-danger/12">
          <Trash2 className="size-6 text-danger" />
        </div>
        <h3 id="confirm-dialog-title" className="text-center text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-danger-foreground hover:bg-danger/90"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
