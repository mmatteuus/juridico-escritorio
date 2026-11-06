import { createFileRoute } from "@tanstack/react-router";
import { withAuth } from "@/components/withAuth"; // HOC
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, FileText } from "lucide-react";

export const Route = createFileRoute("/o/$org/comunicacao")({
  component: ComunicacaoPage,
});

function ComunicacaoPage() {
  // Placeholder: in real implementation would fetch from /api/comunicacao
  const mock = [
    { id: 1, subject: "Reunião com cliente", from: "Cliente A", date: "2024-11-01" },
    { id: 2, subject: "Atualização de processo", from: "Advogado X", date: "2024-10-29" },
  ];

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="size-6 text-primary" /> Comunicação
        </h1>
        <Button variant="default" size="sm" asChild>
          <Link to="/o/$org/comunicacao/novo">Novo
        </Link>
        </Button>
      </header>
      <div className="space-y-3">
        {mock.map(m => (
          <Card key={m.id}>
            <CardHeader className="p-4">
              <CardTitle>{m.subject}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm">De: {m.from}</p>
              <p className="text-xs text-muted-foreground">Data: {m.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const withAuthRoute = withAuth(Route);
