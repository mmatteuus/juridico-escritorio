import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
import type { Doc, DocumentFileMetadata, RoleId } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/documentos")({
  validateSearch: (s: Record<string, unknown>): { novo?: boolean } => (s["novo"] ? { novo: true } : {}),
  head: () => ({ meta: [{ title: "Documentos · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: DocumentosPage,
});

const initial = { title: "", matterId: "", category: "Contrato", visibility: "equipe" as Doc["visibility"] };
const visibility: Record<Doc["visibility"], string> = { equipe: "Equipe", restrito: "Restrito", cliente: "Liberado ao cliente" };
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
  const { novo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const [grantedRoles, setGrantedRoles] = useState<RoleId[]>([]);
  const [fileMetadata, setFileMetadata] = useState<DocumentFileMetadata | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const allowed = canSeeLegalDocs(view.role);
  const types = [...new Set(view.docs.map((doc) => doc.category))];
  const docs = allowed ? view.docs.filter((doc) =>
    (type === "todos" || doc.category === type) &&
    (doc.title + " " + doc.category + " " + (view.matterById(doc.matterId)?.title ?? "")).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")),
  ) : [];
  const preview = docs.find((doc) => doc.id === previewId) ?? null;

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
    if (!form.title.trim() || !view.matterById(form.matterId)) { toast.error("Informe o título e selecione um caso visível."); return; }
    update((data) => ({ ...data, docs: [...data.docs, {
      id: uid("doc"), officeId: office.id, matterId: form.matterId, title: form.title.trim(),
      category: form.category, visibility: form.visibility,
      ...(fileMetadata ? { fileMetadata } : {}),
      ...(form.visibility === "restrito" ? { grantedRoles } : {}), version: 1,
      createdBy: view.me?.name ?? "Equipe", createdAt: new Date().toISOString(),
    }] }));
    resetForm(); navigate({ search: {}, replace: true }); toast.success("Registro demonstrativo criado; bytes do arquivo não foram enviados");
  }

  if (!allowed) return <EmptyState title="Documentos indisponíveis para este perfil" hint="O perfil financeiro visualiza apenas informações financeiras autorizadas." />;

  return <>
    <PageHeader title="Documentos" subtitle="Biblioteca demonstrativa por caso, versão e visibilidade." actions={<Button onClick={() => navigate({ search: { novo: true } })} disabled={!view.matters.length}><Plus /> Novo registro</Button>} />
    <div className="mb-5 flex flex-wrap gap-2">
      <Input aria-label="Buscar documentos" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar título, tipo ou caso" className="max-w-sm bg-card" />
      <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Filtrar por tipo" className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
    </div>
    {docs.length === 0 ? <EmptyState title="Nenhum documento encontrado" hint="Ajuste os filtros ou crie um registro para um caso visível." /> : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {docs.map((doc) => <li key={doc.id}><button type="button" onClick={() => setPreviewId(doc.id)} className="h-full w-full rounded-xl border bg-card p-5 text-left shadow-soft hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary">
        <div className="mb-3 flex items-center justify-between"><FileText className="size-5 text-primary" /><span className="rounded-full bg-muted px-2 py-1 text-xs">v{doc.version}</span></div>
        <p className="font-display text-lg leading-snug">{doc.title}</p><p className="mt-1 text-sm text-muted-foreground">{view.matterById(doc.matterId)?.title}</p>
        <p className="mt-4 text-xs text-muted-foreground">{doc.category} · {visibility[doc.visibility]} · {fmtDate(doc.createdAt)}</p>
      </button></li>)}
    </ul>}
    <Dialog open={!!novo} onOpenChange={(open) => { if (!open) { resetForm(); navigate({ search: {}, replace: true }); } }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Novo registro de documento</DialogTitle><DialogDescription>Catálogo demonstrativo. A seleção local valida e registra apenas nome, tipo e tamanho; os bytes não são enviados nem armazenados.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="doc-title">Título</Label><Input id="doc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="space-y-1.5"><Label htmlFor="doc-case">Caso</Label><Select value={form.matterId} onValueChange={(value) => setForm({ ...form, matterId: value })}><SelectTrigger id="doc-case" aria-required="true"><SelectValue placeholder="Selecione um caso" /></SelectTrigger><SelectContent>{view.matters.map((matter) => <SelectItem key={matter.id} value={matter.id}>{matter.code} · {matter.title}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="doc-type">Tipo</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}><SelectTrigger id="doc-type"><SelectValue /></SelectTrigger><SelectContent>{["Contrato", "Procuração", "Petição", "Declaração", "Outros"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="doc-file">Arquivo local (opcional)</Label><Input ref={fileInput} id="doc-file" type="file" accept={ACCEPT_FILE} onChange={selectFile} className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium" /><p className="text-xs text-muted-foreground">PDF, DOC, DOCX, ODT, RTF, TXT, PNG ou JPG · até 20 MB. O arquivo permanece no seu dispositivo; somente os metadados fictícios abaixo serão registrados.</p>{fileMetadata ? <div className="rounded-md border bg-muted/30 p-3 text-sm"><p className="break-all font-medium">{fileMetadata.name}</p><p className="mt-1 text-xs text-muted-foreground">{fileMetadata.mimeType} · {formatFileSize(fileMetadata.sizeBytes)}</p></div> : <p className="text-xs text-muted-foreground">Nenhum arquivo selecionado.</p>}</div>
      <div className="space-y-1.5"><Label htmlFor="doc-visibility">Visibilidade</Label><Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value as Doc["visibility"] })}><SelectTrigger id="doc-visibility"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(visibility).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      {form.visibility === "restrito" && <fieldset className="space-y-2 rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Conceder acesso por perfil</legend><p className="text-xs text-muted-foreground">Sem perfis selecionados, o documento permanece bloqueado para todos nesta demonstração. A permissão é específica deste registro.</p><div className="grid gap-2 sm:grid-cols-2">{grantableRoles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={grantedRoles.includes(role.id)} onChange={(event) => setGrantedRoles((current) => event.target.checked ? [...current, role.id] : current.filter((item) => item !== role.id))} />{role.label}</label>)}</div></fieldset>}
      <DialogFooter><Button type="button" variant="outline" onClick={() => { resetForm(); navigate({ search: {}, replace: true }); }}>Cancelar</Button><Button type="submit">Adicionar registro</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={(value) => !value && setPreviewId(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle className="break-words">{preview?.title}</DialogTitle><DialogDescription>Prévia dos metadados do documento demonstrativo.</DialogDescription></DialogHeader>{preview && <div className="min-w-0 space-y-4 break-words text-sm"><div className="space-y-2 rounded-lg border bg-muted/30 p-4"><p><strong>Caso:</strong> {view.matterById(preview.matterId)?.title}</p><p><strong>Tipo:</strong> {preview.category}</p><p><strong>Versão:</strong> {preview.version}</p><p><strong>Visibilidade:</strong> {visibility[preview.visibility]}</p><p><strong>Criado por:</strong> {preview.createdBy}</p><p><strong>Data do registro:</strong> {fmtDate(preview.createdAt)}</p></div><section className="rounded-lg border p-4"><h3 className="font-semibold">Arquivo selecionado</h3>{preview.fileMetadata ? <div className="mt-2 space-y-1"><p className="break-all font-medium">{preview.fileMetadata.name}</p><p className="text-xs text-muted-foreground">{preview.fileMetadata.mimeType} · {formatFileSize(preview.fileMetadata.sizeBytes)}</p><p className="text-xs text-muted-foreground">Metadados fictícios; bytes não enviados nem armazenados.</p></div> : <p className="mt-2 text-xs text-muted-foreground">Nenhum arquivo foi selecionado para este registro.</p>}</section>{preview.originalContent && <><section className="rounded-lg border p-4"><h3 className="font-semibold">Conteúdo original demonstrativo</h3><p className="mt-2 whitespace-pre-wrap">{preview.originalContent}</p><dl className="mt-4 grid gap-2 border-t pt-3 text-xs sm:grid-cols-2"><div><dt className="text-muted-foreground">Origem</dt><dd>{preview.evidenceSource ?? "Não informada"}</dd></div><div><dt className="text-muted-foreground">Identificador</dt><dd className="break-all">{preview.evidenceIdentifier ?? "Não informado"}</dd></div><div><dt className="text-muted-foreground">Captura declarada</dt><dd>{preview.capturedAt ? fmtDate(preview.capturedAt) : "Não informada"}</dd></div><div><dt className="text-muted-foreground">Hash</dt><dd>{preview.hashExample ?? "Não registrado"}</dd></div></dl></section>{preview.interpretation && <section className="rounded-lg border border-primary/20 bg-primary/5 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Interpretação separada</h3><span className="rounded-full bg-background px-2 py-1 text-xs">v{preview.interpretationVersion ?? 1}</span></div><p className="mt-2 whitespace-pre-wrap">{preview.interpretation}</p></section>}<p className="rounded-lg bg-warning-soft p-3 text-xs text-warning">Metadados e conteúdo são fictícios. Nenhuma publicação foi recebida ou hash calculado; hash, por si só, não prova autenticidade da origem.</p></>}</div>}<DialogFooter>{preview && <Button asChild variant="outline"><Link to="/o/$org/casos/$id" params={{ org, id: preview.matterId }}>Abrir caso</Link></Button>}<Button onClick={() => setPreviewId(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
