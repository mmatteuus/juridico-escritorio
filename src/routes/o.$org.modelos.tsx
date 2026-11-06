import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { DocumentModel } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/modelos")({
  head: () => ({ meta: [{ title: "Modelos · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ModelosPage,
});
type Form = Pick<DocumentModel, "name" | "areaId" | "content">;
const blank: Form = { name: "", areaId: "", content: "" };
function ModelosPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("todas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentModel | null>(null);
  const [preview, setPreview] = useState<DocumentModel | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const allowed = canSeeLegalDocs(view.role);
  const models = allowed ? view.models.filter((model) =>
    (area === "todas" || model.areaId === area) &&
    (model.name + " " + model.content).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))) : [];
  function edit(model: DocumentModel) {
    setEditing(model); setForm({ name: model.name, areaId: model.areaId, content: model.content }); setOpen(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.areaId || !form.content.trim()) { toast.error("Preencha todos os campos."); return; }
    if (editing) {
      update((data) => ({ ...data, models: data.models.map((m) => m.id === editing.id && m.officeId === office.id ? { ...m, ...form, name: form.name.trim(), content: form.content.trim(), version: m.version + 1, updatedAt: new Date().toISOString() } : m) }));
      toast.success("Modelo atualizado na demonstração");
    } else {
      update((data) => ({ ...data, models: [...data.models, { ...form, name: form.name.trim(), content: form.content.trim(), id: uid("model"), officeId: office.id, version: 1, updatedAt: new Date().toISOString() }] }));
      toast.success("Modelo demonstrativo criado");
    }
    setOpen(false); setEditing(null); setForm(blank);
  }
  function remove(model: DocumentModel) {
    update((data) => ({ ...data, models: data.models.filter((m) => !(m.id === model.id && m.officeId === office.id)) }));
    setPreview(null); toast.success("Modelo removido da demonstração");
  }
  if (!allowed) return <EmptyState title="Modelos indisponíveis para este perfil" hint="O perfil financeiro visualiza apenas informações financeiras autorizadas." />;
  return <>
    <PageHeader title="Modelos" subtitle="Minutas demonstrativas por área de atuação." actions={<Button onClick={() => { setEditing(null); setForm(blank); setOpen(true); }}><Plus /> Novo modelo</Button>} />
    <div className="mb-5 flex flex-wrap gap-2">
      <Input aria-label="Buscar modelos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome ou conteúdo" className="max-w-sm bg-card" />
      <Select value={area} onValueChange={setArea}><SelectTrigger aria-label="Filtrar por área" className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as áreas</SelectItem>{office.practiceAreas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
    </div>
    {models.length === 0 ? <EmptyState title="Nenhum modelo encontrado" hint="Ajuste os filtros ou crie uma minuta demonstrativa." /> : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{models.map((model) => <li key={model.id} className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between"><LayoutTemplate className="size-5 text-primary" /><span className="rounded-full bg-muted px-2 py-1 text-xs">v{model.version}</span></div>
      <h2 className="font-display text-lg">{model.name}</h2><p className="mt-1 text-sm text-muted-foreground">{view.areaName(model.areaId)} · Atualizado {fmtDate(model.updatedAt)}</p>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{model.content}</p>
      <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setPreview(model)}><Eye /> Visualizar</Button><Button size="sm" variant="outline" asChild><Link to="/o/$org/modelos/$id" params={{ org, id: model.id }}><Pencil /> Editor completo</Link></Button></div>
    </li>)}</ul>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Editar modelo" : "Novo modelo"}</DialogTitle><DialogDescription>Conteúdo de demonstração. Revise antes de qualquer uso real.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="model-name">Nome</Label><Input id="model-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="model-area">Área</Label><Select value={form.areaId} onValueChange={(value) => setForm({ ...form, areaId: value })}><SelectTrigger id="model-area"><SelectValue placeholder="Selecione uma área" /></SelectTrigger><SelectContent>{office.practiceAreas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="model-content">Texto da minuta</Label><Textarea id="model-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} required /></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Salvar modelo</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={(value) => !value && setPreview(null)}><DialogContent><DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>Prévia de minuta demonstrativa · {preview && view.areaName(preview.areaId)}</DialogDescription></DialogHeader>{preview && <><div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{preview.content}</div><DialogFooter><Button variant="outline" onClick={() => remove(preview)}><Trash2 /> Excluir</Button><Button onClick={() => { edit(preview); setPreview(null); }}>Editar</Button></DialogFooter></>}</DialogContent></Dialog>
  </>;
}
