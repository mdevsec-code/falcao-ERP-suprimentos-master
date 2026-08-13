import { CompassIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={CompassIcon}
      title="Página não encontrada"
      description="O endereço acessado não existe ou ainda não foi implementado."
      action={
        <Button asChild size="sm">
          <Link to="/">Voltar ao Dashboard</Link>
        </Button>
      }
    />
  );
}
