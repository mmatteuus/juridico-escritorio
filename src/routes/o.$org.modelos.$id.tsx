import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Check, CheckCircle2, Eye, History, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import type { DocumentModel, DocumentModelRevision, DocumentModelStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/modelos/$id")({
  head: () => ({ meta: [{ title: "Editor de modelo · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: ModeloEditor,
});
function templateFields(text: string): string[] {
  return Array.from(new Set(Array.from(text.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g), (match) => match[1]?.trim().toLowerCase() ?? "")));
}
function renderPreview(text: string, values: Record<string, string>) {
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, key: string) => values[key.trim().toLowerCase()] ?? `[${key.trim()}]`);
}
const modelStatusLabel: Record<DocumentModelStatus, string> = { rascunho: "Rascunho", em_revisao: "Em revisão", publicado: "Publicado" };
function ModeloEditor() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const model = view.models.find(m=>m.id===id);
  const [name,setName] = useState(model?.name ?? "");
  const [areaId,setAreaId] = useState(model?.areaId ?? "");
  const [content,setContent] = useState(model?.content ?? "");
  const [submissionReason,setSubmissionReason] = useState("");
  const [reviewReason,setReviewReason] = useState("");
  const [tab,setTab] = useState<"editar"|"previa">("editar");
  const [selectedVersion,setSelectedVersion] = useState<number|null>(null);
  const [selectedMatterId,setSelectedMatterId] = useState("");
  const [selectedClientId,setSelectedClientId] = useState("");
  const [previewReady,setPreviewReady] = useState(false);
  if (!canSeeLegalDocs(view.role)) return <DeniedState/>;
  if (!model) return <div className="space-y-4"><EmptyState title="Modelo não encontrado neste escritório" hint="O modelo pode ter sido removido ou não estar disponível para este perfil."/><Button variant="outline" asChild><Link to="/o/$org/modelos" params={{org}}>Voltar aos modelos</Link></Button></div>;
  const currentModel = model;
  const changed = name.trim()!==model.name || areaId!==model.areaId || content!==model.content;
  const currentRevision: DocumentModelRevision = { version: model.version, name: model.name, areaId: model.areaId, content: model.content, status: model.status ?? "publicado", updatedAt: model.updatedAt, ...(model.authorMemberId ? { authorMemberId: model.authorMemberId } : {}), ...(model.authorName ? { authorName: model.authorName } : {}), ...(model.submissionReason ? { submissionReason: model.submissionReason } : {}), ...(model.reviewerMemberId ? { reviewerMemberId: model.reviewerMemberId } : {}), ...(model.reviewerName ? { reviewerName: model.reviewerName } : {}), ...(model.reviewReason ? { reviewReason: model.reviewReason } : {}) };
  const history = [...(model.versions ?? []), currentRevision].sort((a,b)=>b.version-a.version);
  const previous = history.find(x=>x.version===selectedVersion);
  const actorId = view.me?.id;
  const actorName = view.me?.name ?? "Perfil demonstrativo";
  const isReviewer = (view.role === "gestor" || view.role === "socio") && !!actorId && actorId !== model.authorMemberId;
  const displayContent = previous?.content ?? content;
  const fields = templateFields(displayContent);
  const selectedMatter = view.matters.find((matter) => matter.id === selectedMatterId);
  const relatedClients = selectedMatter
    ? view.clients.filter((client) => selectedMatter.clientIds.includes(client.id))
    : view.clients;
  const selectedClient = relatedClients.find((client) => client.id === selectedClientId);
  const currentMember = view.me;
  const oabValue = currentMember?.oabNumber ? `OAB/${currentMember.oabUf ?? "UF"} ${currentMember.oabNumber}` : "";
  const previewValues: Record<string,string> = {
    cliente: selectedClient?.name ?? "",
    advogado: currentMember?.name ?? "",
    prestador: office.displayName,
    representado: selectedClient?.name ?? "",
    data: new Intl.DateTimeFormat("pt-BR").format(new Date()),
    caso: selectedMatter ? `${selectedMatter.code} · ${selectedMatter.title}` : "",
    oab: oabValue,
  };
  const missingFields = Array.from(new Set([
    ...fields.filter((field) => !previewValues[field]?.trim()),
    ...(!selectedMatter ? ["caso"] : []),
    ...(!selectedClient ? ["cliente"] : []),
  ]));
  function save() {
    if (!name.trim() || !areaId || !content.trim() || !submissionReason.trim() || !actorId) { toast.error("Preencha nome, área, texto e justificativa, e confirme o perfil atual."); return; }
    if (!changed) return;
    const at = new Date().toISOString();
    const nextVersion = currentModel.version + 1;
    const prior: DocumentModelRevision = currentRevision;
    update(data=>({...data,models:data.models.map(m=>{
      if(m.id!==id||m.officeId!==office.id)return m;
      const next:DocumentModel={...m,name:name.trim(),areaId,content,version:nextVersion,updatedAt:at,status:"em_revisao",authorMemberId:actorId!,authorName:actorName,submissionReason:submissionReason.trim(),versions:[...(m.versions??[]).filter(revision=>revision.version!==m.version),prior]};
      delete next.reviewerMemberId;delete next.reviewerName;delete next.reviewReason;
      return next;
    })}));
    setSelectedVersion(null); setSubmissionReason(""); setReviewReason(""); toast.success(`Versão ${nextVersion} enviada para revisão`);
  }
  function decideReview(next: "publicado" | "rascunho") {
    if (!isReviewer || currentModel.status !== "em_revisao" || !reviewReason.trim() || !actorId) { toast.error("A revisão exige outro perfil gestor ou sócio e uma justificativa."); return; }
    const at = new Date().toISOString();
    update(data=>({...data,models:data.models.map(m=>m.id===id&&m.officeId===office.id&&m.status==="em_revisao"&&m.authorMemberId!==actorId?{...m,status:next,reviewerMemberId:actorId,reviewerName:actorName,reviewReason:reviewReason.trim(),updatedAt:at}:m)}));
    setReviewReason("");
    toast.success(next === "publicado" ? "Versão aprovada e publicada na demonstração" : "Versão devolvida para ajustes");
  }
  function reset() { setName(currentModel.name);setAreaId(currentModel.areaId);setContent(currentModel.content);setSubmissionReason("");setSelectedVersion(null);setPreviewReady(false); }
  return <div className="space-y-5"><Button variant="ghost" size="sm" asChild><Link to="/o/$org/modelos" params={{org}}><ArrowLeft/> Modelos</Link></Button>
    <PageHeader title={model.name} subtitle={`${view.areaName(model.areaId)} · versão ${model.version} · ${modelStatusLabel[model.status ?? "publicado"]} · atualização ${fmtDateTime(model.updatedAt)}`} actions={<Button onClick={save} disabled={!changed || !submissionReason.trim()}><Save/> Enviar nova versão</Button>}/>
    <section className="rounded-xl border bg-card p-4 shadow-soft" aria-labelledby="model-governance-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="model-governance-title" className="font-display text-lg">Governança desta versão</h2><p className="mt-1 text-sm text-muted-foreground">Autor: {model.authorName ?? "Catálogo inicial"}{model.status === "em_revisao" && !model.reviewerName ? " · Aguardando decisão de outro perfil da gestão ou sociedade" : model.reviewerName ? ` · Revisada por: ${model.reviewerName}` : ""}</p>{model.submissionReason && <p className="mt-2 text-sm"><strong>Justificativa do autor:</strong> {model.submissionReason}</p>}{model.reviewReason && <p className="mt-1 text-sm"><strong>Justificativa da revisão:</strong> {model.reviewReason}</p>}</div><span className="rounded-full border px-3 py-1 text-xs font-medium">{modelStatusLabel[model.status ?? "publicado"]}</span></div>
      {model.status === "em_revisao" && <div className="mt-4 border-t pt-4">{isReviewer ? <div className="space-y-3"><label className="grid gap-1 text-sm font-medium" htmlFor="model-review-reason">Justificativa da decisão<textarea id="model-review-reason" className="min-h-20 rounded-md border bg-background p-3 text-sm" value={reviewReason} onChange={event=>setReviewReason(event.target.value)} required placeholder="Registre o motivo da aprovação ou dos ajustes"/></label><div className="flex flex-wrap gap-2"><Button disabled={!reviewReason.trim()} onClick={()=>decideReview("publicado")}><CheckCircle2/> Aprovar e publicar</Button><Button variant="outline" disabled={!reviewReason.trim()} onClick={()=>decideReview("rascunho")}>Solicitar ajustes</Button></div></div> : <p className="text-sm text-muted-foreground">A versão exige decisão de um perfil gestor ou sócio diferente do autor. O mesmo perfil que a enviou não pode aprová-la.</p>}</div>}
      {model.status === "rascunho" && <p className="mt-3 text-sm text-muted-foreground">A versão voltou para ajustes e não está publicada. Edite o conteúdo e envie uma nova versão para revisão.</p>}
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]"><section className="rounded-xl border bg-card shadow-soft"><div className="flex gap-1 border-b p-3"><Button variant={tab==="editar"?"default":"ghost"} size="sm" onClick={()=>setTab("editar")}><BookOpen/> Editor</Button><Button variant={tab==="previa"?"default":"ghost"} size="sm" onClick={()=>setTab("previa")}><Eye/> Prévia preenchida</Button></div>
      {tab === "editar" ? <div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium" htmlFor="template-name">Nome do modelo<Input id="template-name" value={name} onChange={event => setName(event.target.value)} /></label>
          <label className="grid gap-1 text-sm font-medium" htmlFor="template-area">Área de atuação<select id="template-area" className="h-9 rounded-md border bg-background px-3 text-sm" value={areaId} onChange={event => setAreaId(event.target.value)}>{office.practiceAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
        </div>
        <label className="grid gap-1 text-sm font-medium" htmlFor="template-content">Texto da minuta<Textarea id="template-content" rows={18} className="font-mono text-sm leading-relaxed" value={content} onChange={event => { setContent(event.target.value); setPreviewReady(false); }} /></label>
        <label className="grid gap-1 text-sm font-medium" htmlFor="template-submit-reason">Justificativa para revisão<textarea id="template-submit-reason" className="min-h-20 rounded-md border bg-background p-3 text-sm" value={submissionReason} onChange={event => setSubmissionReason(event.target.value)} required placeholder="Explique o motivo desta nova versão" /></label>
        <div className="flex flex-wrap gap-2"><Button onClick={save} disabled={!changed || !submissionReason.trim()}><Save /> Enviar para revisão</Button><Button variant="outline" onClick={reset} disabled={!changed}>Desfazer alterações</Button></div>
        <p className="text-xs text-muted-foreground">Variáveis usam chaves duplas, por exemplo {"{{cliente}}"}, {"{{advogado}}"} e {"{{data}}"}. O editor não gera PDF ou assinatura. A versão enviada aguarda outro perfil da gestão ou sociedade.</p>
      </div> : <div className="grid gap-5 bg-muted/30 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(230px,.42fr)]">
        <div><article className="mx-auto min-h-[560px] max-w-2xl rounded border bg-white p-8 text-slate-800 shadow-sm sm:p-10">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded font-bold text-white" style={{ background: office.brandColor }}>{office.monogram}</span><div><p className="text-sm font-semibold">{office.displayName}</p><p className="text-[11px] text-slate-500">{office.legalName}</p></div></div><span className="text-right text-[11px] text-slate-500">{office.oabNumber}</span></header>
          <h2 className="mt-10 text-center font-serif text-xl font-semibold">{previous?.name ?? name}</h2><div className="mt-8 whitespace-pre-wrap font-serif text-sm leading-7">{previewReady && missingFields.length === 0 ? renderPreview(displayContent, previewValues) : displayContent}</div>
          <footer className="mt-20 border-t pt-4 text-[11px] text-slate-500"><p>{office.address}</p><p>{office.phones.join(" · ")}</p><p className="mt-3">Prévia demonstrativa · não gera nem salva documento</p></footer>
        </article></div>
        <aside className="space-y-4 rounded-xl border bg-card p-4"><div><h3 className="font-display text-lg">Contexto de preenchimento</h3><p className="mt-1 text-xs text-muted-foreground">Selecione apenas dados visíveis para seu perfil neste escritório. A saída fica nesta tela.</p></div>
          <label className="grid gap-1 text-sm font-medium" htmlFor="preview-matter">Caso<select id="preview-matter" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedMatterId} onChange={event => { setSelectedMatterId(event.target.value); setSelectedClientId(""); setPreviewReady(false); }}><option value="">Selecione um caso</option>{view.matters.map(matter => <option key={matter.id} value={matter.id}>{matter.code} · {matter.title}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium" htmlFor="preview-client">Cliente<select id="preview-client" className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedClientId} onChange={event => { setSelectedClientId(event.target.value); setPreviewReady(false); }} disabled={!selectedMatterId}><option value="">Selecione um cliente</option>{relatedClients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          {missingFields.length > 0 && <div role="alert" aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-xs text-destructive"><strong>Campos obrigatórios pendentes:</strong><ul className="mt-1 list-inside list-disc">{missingFields.map(field => <li key={field}>{`{{${field}}}`}</li>)}</ul></div>}
          <Button className="w-full" disabled={missingFields.length > 0} onClick={() => setPreviewReady(true)}><Eye /> Atualizar prévia demonstrativa</Button><p className="text-[11px] text-muted-foreground">Campos do modelo: {fields.length ? fields.map(field => `{{${field}}}`).join(", ") : "nenhum marcador encontrado"}</p>
        </aside>
      </div>}
    </section><aside className="space-y-5"><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="flex items-center gap-2 font-display text-xl"><History className="size-5 text-primary"/> Versões da demonstração</h2><p className="mt-2 text-xs text-muted-foreground">Snapshots versionados e seus estados ficam na store local do escritório.</p><div className="mt-4 space-y-2">{history.map(entry=><button key={`${entry.version}-${entry.updatedAt}`} onClick={()=>{setSelectedVersion(entry.version);setTab("previa");setPreviewReady(false)}} className={`flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted ${selectedVersion===entry.version?"border-primary":""}`}><span><strong>Versão {entry.version} · {modelStatusLabel[entry.status]}</strong><span className="block text-xs text-muted-foreground">{fmtDateTime(entry.updatedAt)} · {entry.authorName ?? "Catálogo inicial"}{entry.reviewerName ? ` · revisada por ${entry.reviewerName}` : ""}</span></span>{selectedVersion===entry.version&&<Check className="size-4 text-primary"/>}</button>)}</div>{selectedVersion!==null&&<Button className="mt-3" variant="outline" size="sm" onClick={()=>{setSelectedVersion(null);setPreviewReady(false)}}>Mostrar texto atual</Button>}</section><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Valores do contexto</h2><p className="mt-2 text-xs text-muted-foreground">Dados autorizados do escritório e do contexto escolhido; campos ausentes bloqueiam a prévia.</p><ul className="mt-4 space-y-2 text-xs">{Object.entries(previewValues).map(([key,value])=><li key={key} className="flex justify-between gap-2 border-b pb-2"><code>{`{{${key}}}`}</code><span className="text-right text-muted-foreground">{value||"Pendente"}</span></li>)}</ul></section></aside></div>
  </div>;
}
