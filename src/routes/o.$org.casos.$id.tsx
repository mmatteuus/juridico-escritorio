import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/o/$org/casos/$id")({
  component: CaseDetail,
});

function CaseDetail() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Detalhes do Caso</h1>
      <p className="text-muted-foreground">Conteúdo do caso será carregado aqui.</p>
    </div>
  );
}

