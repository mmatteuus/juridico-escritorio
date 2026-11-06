import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDate, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Doc, DocRevision, DocWorkflowEvent, DocumentFileMetadata, RoleId } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/documentos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean; docId?: string } => ({ ...(s["novo"] ? { novo: true } : {}), ...(typeof s["docId"] === "string" ? { docId: s["docId"] } : {}) }),
  head: () => ({ meta: [{ title: "Documentos · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: DocumentosPage,
});

const initial = { title: "", description: "", content: "", matterId: "", category: "Contrato", visibility: "equipe" as Doc["visibility"] };
const visibility: Record<Doc["visibility"], string> = { equipe: "Equipe", restrito: "Restrito", cliente: "Liberado ao cliente" };
const docStatusLabel: Record<NonNullable<Doc["status"]>, string> = { rascunho: "Rascunho", revisao_pendente: "Revisão pendente", aprovado: "Aprovado" };
function statusLabel(doc: Doc) { return doc.status ? docStatusLabel[doc.status] : "Registro anterior"; }
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES: Record<string, string> = {
  ".pdf": "application/pdf", ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".odt": "application/vnd.oasis.opendocument.text", ".rtf": "application/rtf",
  ".txt": "text/plain", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
};
const ACCEPT_FILE = Object.keys(ACCEPTED_FILE_TYPES).join(",");
const grantableRoles: { id: RoleId; label: string }[] = [
  { id: "gestor", label: "Gestor" }, { id: "socio", label: "Sócio" },
  { id: "coordenador", label: "Coordenação" }, { id: "advogado", label: "Advogado" },
  { id: "estagiario", label: "Estagiário" }, { id: "secretario", label: "Secretaria" },
  { id: "substituto", label: "Substituto" },
];

function DocumentosPage() {
  const { org } = Route.useParams();
  const { novo, docId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<NonNullable<Doc["status"]> | "todos">("todos");
  const [form, setForm] = useState(initial);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", content: "" });
  const [submissionReason, setSubmissionReason] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [grantedRoles, setGrantedRoles] = useState<RoleId[]>([]);
  const [fileMetadata, setFileMetadata] = useState<DocumentFileMetadata | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const allowed = canSeeLegalDocs(view.role);
  const types = [...new Set(view.docs.map((doc) => doc.category))];
  const docs = allowed ? view.docs.filter((doc) =>
    (type === "todos" || doc.category === type) &&
    (statusFilter === "todos" || doc.status === statusFilter) &&
    (doc.title + " " + doc.category + " " + (doc.description ?? "") + " " + (doc.content ?? "") + " " + (view.matterById(doc.matterId)?.title ?? "")).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  ) : [];
  const preview = view.docs.find((doc) => doc.id === previewId) ?? null;

  useEffect(() => {
    if (!docId || !canSeeLegalDocs(view.role)) return;
    const visibleDoc = view.docs.find((doc) => doc.id === docId && doc.officeId === office.id);
    if (!visibleDoc) return;
    setStatusFilter(visibleDoc.status ?? "todos");
    setPreviewId(visibleDoc.id);
  }, [docId, office.id, view.docs, view.role]);

  function formatFileSize(sizeBytes: number) {
    return sizeBytes < 1024 * 1024 ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function resetForm() {
    setForm(initial);
    setGrantedRoles([]);
    setFileMetadata(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setFileMetadata(null);
      return;
    }
    const extension = `.${file.name.split(".").pop()?.toLocaleLowerCase("pt-BR") ?? ""}`;
    const expectedMimeType = ACCEPTED_FILE_TYPES[extension];
    if (!expectedMimeType) {
      toast.error("Tipo não aceito. Escolha PDF, Word, OpenDocument, RTF, TXT, PNG ou JPG.");
      event.currentTarget.value = "";
      setFileMetadata(null);
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("O arquivo deve ter conteúdo e tamanho máximo de 20 MB.");
      event.currentTarget.value = "";
      setFileMetadata(null);
      return;
    }
    setFileMetadata({ name: file.name, mimeType: file.type || expectedMimeType, sizeBytes: file.size });
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.content.trim() || !view.matterById(form.matterId)) { toast.error("Informe título, descrição, conteúdo e selecione um caso visível."); return; }
    const now = new Date().toISOString();
    const revision: DocRevision = { version: 1, title: form.title.trim(), description: form.description.trim(), content: form.content.trim(), createdAt: now, createdBy: view.me?.name ?? "Equipe", ...(view.me?.id ? { createdByMemberId: view.me.id } : {}) };
    const history: DocWorkflowEvent = { at: now, actor: view.me?.name ?? "Equipe", ...(view.me?.id ? { actorMemberId: view.me.id } : {}), action: "Criou o rascunho", version: 1, status: "rascunho" };
    update((data) => ({ ...data, docs: [...data.docs, {
      id: uid("doc"), officeId: office.id, matterId: form.matterId, title: form.title.trim(),
      category: form.category, visibility: form.visibility,
      description: form.description.trim(), content: form.content.trim(), status: "rascunho",
      ...(view.me?.id ? { authorMemberId: view.me.id } : {}), versions: [revision], history: [history],
      ...(fileMetadata ? { fileMetadata } : {}),
      ...(form.visibility === "restrito" ? { grantedRoles } : {}), version: 1,
      createdBy: view.me?.name ?? "Equipe", createdAt: now,
    }] }));
    resetForm(); navigate({ search: {}, replace: true }); toast.success("Rascunho demonstrativo criado; bytes de arquivo não foram enviados");
  }

  function beginEdit(doc: Doc) {
    if ((doc.status ?? "rascunho") === "revisao_pendente") return;
    setEditingDocId(doc.id);
    setEditForm({ title: doc.title, description: doc.description ?? "", content: doc.content ?? doc.originalContent ?? "" });
    setPreviewId(null);
  }

  function saveRevision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const doc = view.docs.find((item) => item.id === editingDocId);
    if (!doc || (doc.status ?? "rascunho") === "revisao_pendente" || !editForm.title.trim() || !editForm.description.trim() || !editForm.content.trim()) {
      toast.error("Preencha título, descrição e conteúdo para criar uma nova versão.");
      return;
    }
    const now = new Date().toISOString();
    const version = doc.version + 1;
    const existingText = doc.content ?? doc.originalContent;
    const baseVersions = doc.versions?.length ? doc.versions : existingText ? [{
      version: doc.version,
      title: doc.title,
      description: doc.description ?? "Descrição não registrada nesta versão legada.",
      content: existingText,
      createdAt: doc.createdAt,
      createdBy: doc.createdBy,
      ...(doc.authorMemberId ? { createdByMemberId: doc.authorMemberId } : {}),
    }] : [];
    const revision: DocRevision = { version, title: editForm.title.trim(), description: editForm.description.trim(), content: editForm.content.trim(), createdAt: now, createdBy: view.me?.name ?? "Equipe", ...(view.me?.id ? { createdByMemberId: view.me.id } : {}) };
    const status: NonNullable<Doc["status"]> = "rascunho";
    const historyEvent: DocWorkflowEvent = { at: now, actor: view.me?.name ?? "Equipe", ...(view.me?.id ? { actorMemberId: view.me.id } : {}), action: "Criou nova versão como rascunho", version, status };
    update((data) => ({ ...data, docs: data.docs.map((item) => {
      if (item.id !== doc.id || item.officeId !== office.id) return item;
      const next: Doc = { ...item, title: revision.title, description: revision.description, content: revision.content, version, status,
        createdBy: revision.createdBy, createdAt: now, ...(view.me?.id ? { authorMemberId: view.me.id } : {}),
        versions: [...baseVersions, revision], history: [...(item.history ?? []), historyEvent] };
      delete next.submittedByMemberId;
      delete next.submissionReason;
      delete next.reviewerMemberId;
      delete next.reviewerName;
      delete next.reviewReason;
      return next;
    }) }));
    setEditingDocId(null); setPreviewId(doc.id); toast.success(`Versão ${version} salva como rascunho`);
  }

  function submitForReview(doc: Doc) {
    if ((doc.status ?? "rascunho") !== "rascunho" || !submissionReason.trim() || !view.me) return;
    const now = new Date().toISOString();
    const event: DocWorkflowEvent = { at: now, actor: view.me.name, actorMemberId: view.me.id, action: "Enviou para revisão", reason: submissionReason.trim(), version: doc.version, status: "revisao_pendente" };
    update((data) => ({ ...data, docs: data.docs.map((item) => {
      if (item.id !== doc.id || item.officeId !== office.id) return item;
      const next: Doc = { ...item, status: "revisao_pendente", submittedByMemberId: view.me!.id, submissionReason: submissionReason.trim(), history: [...(item.history ?? []), event] };
      delete next.reviewerMemberId;
      delete next.reviewerName;
      delete next.reviewReason;
      return next;
    }) }));
    setSubmissionReason(""); toast.success("Documento enviado para revisão na demonstração");
  }

  function approveDocument(doc: Doc) {
    const professional = ["socio", "coordenador", "advogado"].includes(view.role);
    if (!professional || (doc.status ?? "rascunho") !== "revisao_pendente" || !view.me || !doc.submittedByMemberId || doc.submittedByMemberId === view.me.id || !reviewReason.trim()) return;
    const now = new Date().toISOString();
    const event: DocWorkflowEvent = { at: now, actor: view.me.name, actorMemberId: view.me.id, action: "Aprovou a versão", reason: reviewReason.trim(), version: doc.version, status: "aprovado" };
    update((data) => ({ ...data, docs: data.docs.map((item) => item.id === doc.id && item.officeId === office.id ? { ...item, status: "aprovado", reviewerMemberId: view.me!.id, reviewerName: view.me!.name, reviewReason: reviewReason.trim(), history: [...(item.history ?? []), event] } : item) }));
    setReviewReason(""); toast.success("Versão aprovada na demonstração");
  }

  if (!allowed) return <EmptyState title="Documentos indisponíveis para este perfil" hint="O perfil financeiro visualiza apenas informações financeiras autorizadas." />;

  return <>
    <PageHeader title="Documentos" subtitle="Biblioteca demonstrativa por caso, versão e visibilidade." actions={<Button onClick={() => navigate({ search: { novo: true } })} disabled={!view.matters.length}><Plus /> Novo registro</Button>} />
    <div className="mb-5 flex flex-wrap gap-2">
      <Input aria-label="Buscar documentos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar título, tipo ou caso" className="max-w-sm bg-card" />
      <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Filtrar por tipo" className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger aria-label="Filtrar por estado" className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os estados</SelectItem>{Object.entries(docStatusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
    </div>
    {docs.length === 0 ? <EmptyState title="Nenhum documento encontrado" hint="Ajuste os filtros ou crie um registro para um caso visível." /> : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {docs.map((doc) => <li key={doc.id}><button type="button" onClick={() => setPreviewId(doc.id)} className="h-full w-full rounded-xl border bg-card p-5 text-left shadow-soft hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary">
        <div className="mb-3 flex items-center justify-between"><FileText className="size-5 text-primary" /><span className="rounded-full bg-muted px-2 py-1 text-xs">v{doc.version} · {statusLabel(doc)}</span></div>
        <p className="font-display text-lg leading-snug">{doc.title}</p><p className="mt-1 text-sm text-muted-foreground">{view.matterById(doc.matterId)?.title}</p>
        {doc.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>}
        <p className="mt-4 text-xs text-muted-foreground">{doc.category} · {visibility[doc.visibility]} · {fmtDate(doc.createdAt)}</p>
      </button></li>)}
    </ul>}
    <Dialog open={!!novo} onOpenChange={(open) => { if (!open) { resetForm(); navigate({ search: {}, replace: true }); } }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Novo registro de documento</DialogTitle><DialogDescription>Catálogo demonstrativo. A seleção local valida e registra apenas nome, tipo e tamanho; os bytes não são enviados nem armazenados.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="doc-title">Título</Label><Input id="doc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="doc-description">Descrição</Label><textarea id="doc-description" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} required /></div>
      <div className="space-y-1.5"><Label htmlFor="doc-content">Conteúdo textual da versão 1</Label><textarea id="doc-content" className="min-h-48 w-full rounded-md border bg-background p-3 text-sm" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} maxLength={20000} required /><p className="text-xs text-muted-foreground">O texto é fictício e fica apenas na memória desta demonstração.</p></div>
      <div className="space-y-1.5"><Label htmlFor="doc-case">Caso</Label><Select value={form.matterId} onValueChange={(value) => setForm({ ...form, matterId: value })}><SelectTrigger id="doc-case" aria-required="true"><SelectValue placeholder="Selecione um caso" /></SelectTrigger><SelectContent>{view.matters.map((matter) => <SelectItem key={matter.id} value={matter.id}>{matter.code} · {matter.title}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="doc-type">Tipo</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}><SelectTrigger id="doc-type"><SelectValue /></SelectTrigger><SelectContent>{["Contrato", "Procuração", "Petição", "Declaração", "Outros"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="doc-file">Arquivo local (opcional)</Label><Input ref={fileInput} id="doc-file" type="file" accept={ACCEPT_FILE} onChange={selectFile} className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium" /><p className="text-xs text-muted-foreground">PDF, DOC, DOCX, ODT, RTF, TXT, PNG ou JPG · até 20 MB. O arquivo permanece no seu dispositivo; somente os metadados fictícios abaixo serão registrados.</p>{fileMetadata ? <div className="rounded-md border bg-muted/30 p-3 text-sm"><p className="break-all font-medium">{fileMetadata.name}</p><p className="mt-1 text-xs text-muted-foreground">{fileMetadata.mimeType} · {formatFileSize(fileMetadata.sizeBytes)}</p></div> : <p className="text-xs text-muted-foreground">Nenhum arquivo selecionado.</p>}</div>
      <div className="space-y-1.5"><Label htmlFor="doc-visibility">Visibilidade</Label><Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value as Doc["visibility"] })}><SelectTrigger id="doc-visibility"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(visibility).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      {form.visibility === "restrito" && <fieldset className="space-y-2 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Conceder acesso por perfil</legend><p className="text-xs text-muted-foreground">Sem perfis selecionados, o documento permanece bloqueado para todos nesta demonstração. A permissão é específica deste registro.</p><div className="grid gap-2 sm:grid-cols-2">{grantableRoles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grantedRoles.includes(role.id)} onChange={(event) => setGrantedRoles((current) => event.target.checked ? [...current, role.id] : current.filter((item) => item !== role.id))} />{role.label}</label>)}</div></fieldset>}
      <DialogFooter><Button type="button" variant="outline" onClick={() => { resetForm(); navigate({ search: {}, replace: true }); }}>Cancelar</Button><Button type="submit">Salvar rascunho</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!editingDocId} onOpenChange={(open) => !open && setEditingDocId(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Nova versão textual</DialogTitle><DialogDescription>Salvar cria um snapshot imutável e reabre o documento como rascunho.</DialogDescription></DialogHeader><form onSubmit={saveRevision} className="space-y-4"><div><Label htmlFor="edit-doc-title">Título</Label><Input id="edit-doc-title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required /></div><div><Label htmlFor="edit-doc-description">Descrição</Label><textarea id="edit-doc-description" className="mt-1 min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} maxLength={1000} required /></div><div><Label htmlFor="edit-doc-content">Conteúdo textual</Label><textarea id="edit-doc-content" className="mt-1 min-h-48 w-full rounded-md border bg-background p-3 text-sm" value={editForm.content} onChange={(event) => setEditForm({ ...editForm, content: event.target.value })} maxLength={20000} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingDocId(null)}>Cancelar</Button><Button type="submit">Salvar nova versão</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={(value) => { if (!value) { setPreviewId(null); setSubmissionReason(""); setReviewReason(""); } }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{preview?.title}</DialogTitle><DialogDescription>Prévia e revisão demonstrativa. Nenhum arquivo real é enviado ou armazenado.</DialogDescription></DialogHeader>{preview && <div className="min-w-0 space-y-4 break-words text-sm"><div className="space-y-2 rounded-lg border bg-muted/30 p-4"><p><strong>Caso:</strong> {view.matterById(preview.matterId)?.title}</p><p><strong>Tipo:</strong> {preview.category}</p><p><strong>Estado:</strong> {statusLabel(preview)}</p><p><strong>Versão:</strong> {preview.version}</p><p><strong>Visibilidade:</strong> {visibility[preview.visibility]}</p><p><strong>Autor:</strong> {preview.createdBy}</p><p><strong>Data da versão:</strong> {fmtDate(preview.createdAt)}</p><p><strong>Descrição:</strong> {preview.description ?? "Descrição não registrada."}</p></div>
      {(preview.content ?? preview.originalContent) && <section className="rounded-lg border p-4"><h3 className="font-semibold">Conteúdo textual atual · v{preview.version}</h3><p className="mt-2 whitespace-pre-wrap">{preview.content ?? preview.originalContent}</p></section>}
      <section className="rounded-lg border p-4"><h3 className="font-semibold">Arquivo selecionado</h3>{preview.fileMetadata ? <div className="mt-2 space-y-1"><p className="break-all font-medium">{preview.fileMetadata.name}</p><p className="text-xs text-muted-foreground">{preview.fileMetadata.mimeType} · {formatFileSize(preview.fileMetadata.sizeBytes)}</p><p className="text-xs text-muted-foreground">Somente metadados fictícios; os bytes ficam no dispositivo e não são enviados ou armazenados.</p></div> : <p className="mt-2 text-xs text-muted-foreground">Nenhum arquivo foi selecionado para este registro.</p>}</section>
      {preview.originalContent && <section className="rounded-lg border p-4"><h3 className="font-semibold">Conteúdo original demonstrativo</h3><p className="mt-2 whitespace-pre-wrap">{preview.originalContent}</p><dl className="mt-4 grid gap-2 border-t pt-3 text-xs sm:grid-cols-2"><div><dt className="text-muted-foreground">Origem</dt><dd>{preview.evidenceSource ?? "Não informada"}</dd></div><div><dt className="text-muted-foreground">Identificador</dt><dd className="break-all">{preview.evidenceIdentifier ?? "Não informado"}</dd></div><div><dt className="text-muted-foreground">Captura declarada</dt><dd>{preview.capturedAt ? fmtDate(preview.capturedAt) : "Não informada"}</dd></div><div><dt className="text-muted-foreground">Hash</dt><dd>{preview.hashExample ?? "Não registrado"}</dd></div></dl>{preview.interpretation && <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4"><h3 className="font-semibold">Interpretação separada · v{preview.interpretationVersion ?? 1}</h3><p className="mt-2 whitespace-pre-wrap">{preview.interpretation}</p></div>}<p className="mt-4 rounded-lg bg-warning-soft p-3 text-xs text-warning">Metadados e conteúdo são fictícios. Nenhuma publicação foi recebida ou hash calculado.</p></section>}
      <section className="rounded-lg border p-4"><h3 className="font-semibold">Versões textuais imutáveis</h3>{preview.versions?.length ? <ol className="mt-3 space-y-3">{[...preview.versions].sort((a, b) => b.version - a.version).map((version) => <li key={version.version} className="rounded-md bg-muted/40 p-3"><p className="font-medium">v{version.version} · {version.title}</p><p className="mt-1 text-xs text-muted-foreground">{version.createdBy} · {fmtDate(version.createdAt)}</p><p className="mt-2 text-xs">{version.description}</p><details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-primary">Ver conteúdo salvo</summary><p className="mt-2 whitespace-pre-wrap text-xs">{version.content}</p></details></li>)}</ol> : <p className="mt-2 text-xs text-muted-foreground">Este registro anterior ao fluxo de versões não possui snapshots textuais.</p>}</section>
      <section className="rounded-lg border p-4"><h3 className="font-semibold">Estado e revisão</h3>{preview.status === "aprovado" && <p className="mt-2 rounded-md bg-success-soft p-3 text-sm">Aprovado por {preview.reviewerName ?? "profissional"}: {preview.reviewReason ?? "sem justificativa registrada"}</p>}{preview.status === "revisao_pendente" && <p className="mt-2 rounded-md bg-warning-soft p-3 text-sm">Aguardando revisão de outra pessoa profissional. Enviado por {preview.submittedByMemberId === view.me?.id ? "você" : view.memberName(preview.submittedByMemberId)}: {preview.submissionReason}</p>}
      {!preview.status && <p className="mt-3 text-xs text-muted-foreground">Registro anterior ao fluxo de revisão. Crie uma nova versão textual para iniciar a jornada demonstrativa.</p>}
      {preview.status === "rascunho" && <div className="mt-3 space-y-2"><Label htmlFor="doc-submission-reason">Motivo para solicitar revisão</Label><textarea id="doc-submission-reason" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={submissionReason} onChange={(event) => setSubmissionReason(event.target.value)} required placeholder="O que deve ser conferido?"/><Button type="button" variant="outline" disabled={!submissionReason.trim()} onClick={() => submitForReview(preview)}>Enviar para revisão</Button></div>}
      {preview.status === "revisao_pendente" && ["socio", "coordenador", "advogado"].includes(view.role) && preview.submittedByMemberId !== view.me?.id && <div className="mt-3 space-y-2"><Label htmlFor="doc-review-reason">Justificativa da aprovação</Label><textarea id="doc-review-reason" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} required placeholder="Registre a revisão profissional realizada"/><Button type="button" disabled={!reviewReason.trim()} onClick={() => approveDocument(preview)}>Aprovar versão atual</Button></div>}
      {preview.status === "revisao_pendente" && preview.submittedByMemberId === view.me?.id && <p className="mt-3 text-xs text-muted-foreground">A mesma pessoa que enviou não pode aprovar esta versão. Outro advogado, sócio ou coordenador deve revisar.</p>}
      {preview.status === "revisao_pendente" && !["socio", "coordenador", "advogado"].includes(view.role) && <p className="mt-3 text-xs text-muted-foreground">A aprovação exige outra pessoa no perfil de advogado, sócio ou coordenação.</p>}
      <ol className="mt-4 space-y-2 border-t pt-3">{[...(preview.history ?? [])].slice().reverse().map((event, index) => <li key={`${event.at}-${index}`} className="border-l-2 border-primary/30 pl-3 text-xs"><p>{event.action} · v{event.version} · {docStatusLabel[event.status]}</p><p className="mt-1 text-muted-foreground">{event.actor} · {fmtDate(event.at)}{event.reason ? ` · ${event.reason}` : ""}</p></li>)}</ol></section>
      <DialogFooter className="flex-wrap">{preview && preview.status !== "revisao_pendente" && <Button type="button" variant="outline" onClick={() => beginEdit(preview)}>{preview.status === "aprovado" ? "Criar nova versão" : preview.status === "rascunho" ? "Editar rascunho" : "Criar versão textual"}</Button>}{preview && <Button asChild variant="outline"><Link to="/o/$org/casos/$id" params={{ org, id: preview.matterId }}>Abrir caso</Link></Button>}<Button type="button" onClick={() => setPreviewId(null)}>Fechar</Button></DialogFooter></div>}</DialogContent></Dialog>
  </>;
}
