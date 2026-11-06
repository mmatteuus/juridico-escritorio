import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, LayoutTemplate, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { OfficePaginationControls } from "@/components/office/OfficeListPagination";
import { SavedFilterViews } from "@/components/office/SavedFilterViews";
import { useOfficePagination } from "@/components/office/useOfficePagination";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { DocumentModel, DocumentModelRevision } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/modelos")({
  head: () => ({ meta: [{ title: "Modelos · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ModelosPage,
});
type Form = Pick<DocumentModel, "name" | "areaId" | "content"> & { reason: string };
const blank: Form = { name: "", areaId: "", content: "", reason: "" };
const statusLabel = { rascunho: "Rascunho", em_revisao: "Em revisão", publicado: "Publicado" } as const;
function ModelosPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentModel | null>(null);
  const [preview, setPreview] = useState<DocumentModel | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const allowed = canSeeLegalDocs(view.role);
  const actorId = view.me?.id;
  const actorName = view.me?.name ?? "Perfil demonstrativo";
  const models = allowed ? view.models.filter((model) =>
    (area === "todas" || model.areaId === area) &&
    (status === "todos" || (model.status ?? "publicado") === status) &&
    (model.name + " " + model.content).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))) : [];
  const pagination = useOfficePagination(models, `${query}|${area}|${status}`);
  function edit(model: DocumentModel) {
    setEditing(model); setForm({ name: model.name, areaId: model.areaId, content: model.content, reason: "" }); setOpen(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.areaId || !form.content.trim() || !form.reason.trim() || !actorId) { toast.error("Preencha nome, área, texto, justificativa e confirme o perfil atual."); return; }
    const at = new Date().toISOString();
    if (editing) {
      const previous: DocumentModelRevision = { version: editing.version, name: editing.name, areaId: editing.areaId, content: editing.content, status: editing.status ?? "publicado", updatedAt: editing.updatedAt, ...(editing.authorMemberId ? { authorMemberId: editing.authorMemberId } : {}), ...(editing.authorName ? { authorName: editing.authorName } : {}), ...(editing.submissionReason ? { submissionReason: editing.submissionReason } : {}), ...(editing.reviewerMemberId ? { reviewerMemberId: editing.reviewerMemberId } : {}), ...(editing.reviewerName ? { reviewerName: editing.reviewerName } : {}), ...(editing.reviewReason ? { reviewReason: editing.reviewReason } : {}) };
      update((data) => ({ ...data, models: data.models.map((m) => {
        if (m.id !== editing.id || m.officeId !== office.id) return m;
        const next: DocumentModel = { ...m, name: form.name.trim(), areaId: form.areaId, content: form.content.trim(), version: m.version + 1, updatedAt: at, status: "em_revisao", authorMemberId: actorId, authorName: actorName, submissionReason: form.reason.trim(), versions: [...(m.versions ?? []).filter((revision) => revision.version !== m.version), previous] };
        delete next.reviewerMemberId;
        delete next.reviewerName;
        delete next.reviewReason;
        return next;
      }) }));
      toast.success(`Versão ${editing.version + 1} enviada para revisão`);
    } else {
      update((data) => ({ ...data, models: [...data.models, { name: form.name.trim(), areaId: form.areaId, content: form.content.trim(), id: uid("model"), officeId: office.id, version: 1, updatedAt: at, status: "em_revisao", authorMemberId: actorId, authorName: actorName, submissionReason: form.reason.trim(), versions: [] }] }));
      toast.success("Modelo criado como versão em revisão");
    }
    setOpen(false); setEditing(null); setForm(blank);
  }
  if (!allowed) return <EmptyState title="Modelos indisponíveis para este perfil" hint="O perfil financeiro visualiza apenas informações financeiras autorizadas." />;
  return <>
    <PageHeader title="Modelos" subtitle="Minutas demonstrativas por área de atuação." actions={<Button onClick={() => { setEditing(null); setForm(blank); setOpen(true); }}><Plus /> Novo modelo</Button>} />
    <div className="mb-3 flex flex-wrap gap-2">
      <Input aria-label="Buscar modelos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome ou conteúdo" className="max-w-sm bg-card" />
      <Select value={area} onValueChange={setArea}><SelectTrigger aria-label="Filtrar por área" className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as áreas</SelectItem>{office.practiceAreas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filtrar por status" className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="em_revisao">Em revisão</SelectItem><SelectItem value="publicado">Publicado</SelectItem></SelectContent></Select>
    </div>
    <div className="mb-5"><SavedFilterViews officeId={office.id} role={view.role} collection="modelos" currentValues={{ query, area, status }} onApply={(filters) => {
      setQuery(filters.query.slice(0, 120));
      setArea(filters.area === "todas" || office.practiceAreas.some((item) => item.id === filters.area) ? filters.area : "todas");
      setStatus(["todos", "rascunho", "em_revisao", "publicado"].includes(filters.status) ? filters.status : "todos");
    }} /></div>
    {models.length === 0 ? <EmptyState title="Nenhum modelo encontrado" hint="Ajuste os filtros ou crie uma minuta demonstrativa." /> : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pagination.items.map((model) => <li key={model.id} className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between"><LayoutTemplate className="size-5 text-primary" /><div className="flex items-center gap-2"><span className="rounded-full bg-muted px-2 py-1 text-xs">v{model.version}</span><span className="rounded-full border px-2 py-1 text-xs">{statusLabel[model.status ?? "publicado"]}</span></div></div>
      <h2 className="font-display text-lg">{model.name}</h2><p className="mt-1 text-sm text-muted-foreground">{view.areaName(model.areaId)} · Atualizado {fmtDate(model.updatedAt)}</p>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{model.content}</p>
      <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setPreview(model)}><Eye /> Visualizar</Button><Button size="sm" variant="outline" asChild><Link to="/o/$org/modelos/$id" params={{ org, id: model.id }}><Pencil /> Editor completo</Link></Button></div>
    </li>)}</ul>}
    <OfficePaginationControls pagination={pagination} />
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setEditing(null); setForm(blank); } }}><DialogContent><DialogHeader><DialogTitle>{editing ? "Criar nova versão" : "Novo modelo"}</DialogTitle><DialogDescription>Salvar cria uma versão em revisão; outro perfil da gestão ou sociedade deverá decidir antes da publicação.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="model-name">Nome</Label><Input id="model-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="model-area">Área</Label><Select value={form.areaId} onValueChange={(value) => setForm({ ...form, areaId: value })}><SelectTrigger id="model-area"><SelectValue placeholder="Selecione uma área" /></SelectTrigger><SelectContent>{office.practiceAreas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="model-content">Texto da minuta</Label><Textarea id="model-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} required /></div>
      <div className="space-y-1.5"><Label htmlFor="model-submit-reason">Justificativa para revisão</Label><Textarea id="model-submit-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} required placeholder="Descreva o motivo da criação ou alteração desta versão" /></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit">Enviar versão para revisão</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={(value) => !value && setPreview(null)}><DialogContent><DialogHeader><DialogTitle>{preview?.name}</DialogTitle><DialogDescription>Prévia de minuta demonstrativa · {preview && view.areaName(preview.areaId)}</DialogDescription></DialogHeader>{preview && <><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border px-2 py-1 text-xs">{statusLabel[preview.status ?? "publicado"]}</span><span className="text-xs text-muted-foreground">v{preview.version} · autor: {preview.authorName ?? "Catálogo inicial"}</span></div>{preview.submissionReason && <p className="rounded-lg bg-muted/30 p-3 text-sm"><strong>Justificativa de envio:</strong> {preview.submissionReason}</p>}{preview.reviewerName && <p className="text-sm text-muted-foreground">Revisado por {preview.reviewerName}{preview.reviewReason ? ` · ${preview.reviewReason}` : ""}</p>}<div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm">{preview.content}</div><DialogFooter><Button onClick={() => { edit(preview); setPreview(null); }}>Criar nova versão</Button></DialogFooter></>}</DialogContent></Dialog>
  </>;
}
