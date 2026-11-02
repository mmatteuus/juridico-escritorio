import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { findOffice, uid, useDemo, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/clientes/")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Clientes · JURIDO Escritórios" }, { name: "description", content: "Clientes do escritório." }, { name: "robots", content: "noindex" }] }),
  component: Clientes,
});

function Clientes() {
  const { org } = Route.useParams();
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const v = useOfficeView(office);
  const { update } = useDemo();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"todos" | "PF" | "PJ">("todos");
  const [form, setForm] = useState({ name: "", kind: "PF" as "PF" | "PJ", contact: "", city: "" });
  const list = v.clients.filter((c) => (kind === "todos" || c.kind === kind) && c.name.toLowerCase().includes(q.toLowerCase()));

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe o nome."); return; }
    update((d) => ({ ...d, clients: [...d.clients, { id: uid("c"), officeId: office.id, name: form.name.trim(), kind: form.kind, contact: form.contact, city: form.city }] }));
    setForm({ name: "", kind: "PF", contact: "", city: "" });
    navigate({ search: {}, replace: true });
    toast.success("Cliente cadastrado");
  };

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${v.clients.length} clientes fictícios`} actions={<Button onClick={() => navigate({ search: { novo: true } })}><Plus /> Novo cliente</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Buscar cliente" placeholder="Buscar por nome" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        {(["todos", "PF", "PJ"] as const).map((k) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)} aria-pressed={kind === k}>{k === "todos" ? "Todos" : k === "PF" ? "Pessoa física" : "Empresa"}</Button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState title="Nenhum cliente encontrado" /> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const n = v.matters.filter((m) => m.clientIds.includes(c.id)).length;
            return (
              <li key={c.id}>
                <Link to="/o/$org/clientes/$id" params={{ org, id: c.id }} className="block rounded-xl border bg-card p-4 shadow-soft hover:border-primary/40">
                  <p className="text-xs text-muted-foreground">{c.kind === "PF" ? "Pessoa física" : "Empresa"} · {c.city}</p>
                  <p className="mt-1 font-display text-lg">{c.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.contact} · {n} caso(s) visível(is)</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog open={!!novo} onOpenChange={(o) => !o && navigate({ search: {}, replace: true })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-xl font-medium">Novo cliente</DialogTitle><DialogDescription>Não use CPF ou dados reais.</DialogDescription></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="c-n">Nome</Label><Input id="c-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="flex gap-2">
              {(["PF", "PJ"] as const).map((k) => <Button key={k} type="button" size="sm" variant={form.kind === k ? "default" : "outline"} onClick={() => setForm({ ...form, kind: k })}>{k === "PF" ? "Pessoa física" : "Empresa"}</Button>)}
            </div>
            <div className="space-y-1.5"><Label htmlFor="c-c">Contato</Label><Input id="c-c" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="c-ci">Cidade</Label><Input id="c-ci" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <DialogFooter><Button type="submit">Cadastrar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
