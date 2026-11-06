import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, FileSearch, FileText, ListChecks, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeniedState, EmptyState, PageHeader } from "@/components/office/badges";
import { canSeeLegalDocs } from "@/features/demo/permissions";
import { useDemo, useOfficeView } from "@/features/demo/store";
import type { ContractAnalysisDraft, Office } from "@/features/demo/types";

export type ContractConceptStep = "preparacao" | "estrutura" | "clausulas" | "revisao";
const steps = [
  { id: "preparacao", label: "Preparação", to: "/o/$org/analise-contratual", icon: FileSearch },
  { id: "estrutura", label: "Estrutura", to: "/o/$org/analise-contratual-estrutura", icon: FileText },
  { id: "clausulas", label: "Cláusulas", to: "/o/$org/analise-contratual-clausulas", icon: ListChecks },
  { id: "revisao", label: "Revisão humana", to: "/o/$org/analise-contratual-revisao", icon: ClipboardCheck },
] as const;
const card = "rounded-xl border bg-card p-5 shadow-soft";
const topics = ["Partes e representação", "Objeto e entregas", "Prazos e vigência", "Responsabilidades", "Rescisão e foro"];

export function ContractAnalysisConcept({ office, step }: { office: Office; step: ContractConceptStep }) {
  const view = useOfficeView(office);
  const { update } = useDemo();
  const candidates = useMemo(
    () => view.docs.filter(doc => /contrato|instrumento|acordo/i.test(doc.category + " " + doc.title)),
    [view.docs],
  );
  const memberId = view.me?.id ?? `role-${view.role}`;
  const draft: ContractAnalysisDraft = view.contractAnalysisDraft ?? { officeId: office.id, memberId, documentId: candidates[0]?.id ?? "", scope: "Leitura estrutural", notes: {}, manualReview: false, reason: "" };
  const saveDraft = (patch: Partial<ContractAnalysisDraft>) => update(data => {
    const existing = data.contractAnalysisDrafts.find(item => item.officeId === office.id && item.memberId === memberId);
    const next = { ...(existing ?? draft), ...patch };
    return { ...data, contractAnalysisDrafts: [...data.contractAnalysisDrafts.filter(item => item.officeId !== office.id || item.memberId !== memberId), next] };
  });
  if (!canSeeLegalDocs(view.role)) return <DeniedState />;
  const selected = candidates.find(doc => doc.id === draft.documentId);
  const matter = view.matterById(selected?.matterId);
  const stepIndex = steps.findIndex(item => item.id === step);
  return <div className="space-y-5">
    <PageHeader title="Análise contratual assistida" subtitle="Roteiro visual para conferência profissional de minutas." actions={<span className="rounded border border-copper/40 bg-copper-soft px-2 py-1 text-xs font-semibold text-copper">Conceito · Fase 2</span>} />
    <div className="rounded-xl border border-dashed border-copper/40 bg-copper-soft/40 p-4 text-sm text-muted-foreground">
      Esta interface representa um fluxo futuro. Nenhuma IA leu o documento, identificou riscos ou produziu parecer nesta demonstração. Toda decisão depende de revisão humana.
    </div>
    <nav aria-label="Etapas da análise" className="grid gap-2 sm:grid-cols-4">
      {steps.map(({ id, label, to, icon: Icon }, index) => <Link key={id} to={to} params={{ org: office.slug }} aria-current={step === id ? "step" : undefined} className={`flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/40 ${step === id ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-card text-muted-foreground"}`}>
        <Icon className="size-4 shrink-0"/><span className="min-w-0">{index + 1}. {label}</span>
      </Link>)}
    </nav>
    {step === "preparacao" && <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className={card}><h2 className="font-display text-xl">Documento de referência</h2><p className="mt-1 text-sm text-muted-foreground">Somente registros demonstrativos visíveis para este perfil e escritório.</p>
        {candidates.length ? <div className="mt-4 space-y-4"><label className="block text-sm font-medium" htmlFor="concept-document">Minuta<select id="concept-document" className="mt-1 block w-full rounded-md border bg-background p-2" value={draft.documentId} onChange={e => saveDraft({ documentId: e.target.value })}>{candidates.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select></label><dl className="space-y-2 text-sm"><Info label="Caso" value={matter?.title ?? "Caso indisponível"}/><Info label="Versão" value={selected ? String(selected.version) : "—"}/><Info label="Categoria" value={selected?.category ?? "—"}/></dl></div> : <div className="mt-4"><EmptyState title="Nenhuma minuta contratual visível" hint="Cadastre um documento de categoria Contrato para explorar esta etapa." /></div>}
      </section>
      <section className={card}><h2 className="font-display text-xl">Escopo proposto</h2><p className="mt-2 text-sm text-muted-foreground">Selecione o objetivo visual da revisão. A escolha não inicia processamento.</p><div className="mt-4 space-y-2">{["Leitura estrutural", "Checklist de cláusulas", "Comparação humana com modelo"].map(option => <label key={option} className="flex items-center gap-2 rounded-lg border p-3 text-sm"><input type="radio" name="scope" checked={draft.scope === option} onChange={() => saveDraft({ scope: option })} />{option}</label>)}</div><Link to="/o/$org/analise-contratual-estrutura" params={{ org: office.slug }} className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver estrutura →</Link></section>
    </div>}
    {step === "estrutura" && <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className={card}><h2 className="font-display text-xl">Mapa de leitura</h2><p className="mt-1 text-sm text-muted-foreground">Pontos de conferência apresentados como roteiro, sem extração de texto ou diagnóstico automático.</p><ol className="mt-5 space-y-3">{topics.map((topic, index) => <li key={topic} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span><div><p className="font-medium">{topic}</p><p className="text-xs text-muted-foreground">Conferência pelo profissional responsável</p></div></li>)}</ol></section>
      <section className={card}><h2 className="font-display text-xl">Contexto disponível</h2><p className="mt-2 text-sm text-muted-foreground">A amostra contém {candidates.length} minuta(s) contratual(is) visível(is) e {view.models.length} modelo(s) do escritório.</p><div className="mt-5 space-y-2 text-sm">{view.models.slice(0, 3).map(model => <div key={model.id} className="rounded-lg border p-3"><p className="font-medium">{model.name}</p><p className="text-xs text-muted-foreground">{view.areaName(model.areaId)}</p></div>)}</div><Link to="/o/$org/analise-contratual-clausulas" params={{ org: office.slug }} className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Abrir checklist →</Link></section>
    </div>}
    {step === "clausulas" && <section className={card}><h2 className="font-display text-xl">Checklist de cláusulas</h2><p className="mt-1 text-sm text-muted-foreground">Anotações locais para demonstrar a conferência. Nenhuma cláusula foi analisada automaticamente.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{topics.map(topic => <label key={topic} className="block rounded-lg border p-4 text-sm"><span className="font-medium">{topic}</span><span className="mt-1 block text-xs text-muted-foreground">Pergunta de revisão: o texto está claro e compatível com o caso?</span><textarea className="mt-3 min-h-20 w-full rounded-md border bg-background p-2" value={draft.notes[topic] ?? ""} onChange={e => saveDraft({ notes: { ...draft.notes, [topic]: e.target.value } })} placeholder="Observação do profissional (nesta demonstração)" /></label>)}</div><Link to="/o/$org/analise-contratual-revisao" params={{ org: office.slug }} className="mt-5 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ir para revisão →</Link></section>}
    {step === "revisao" && <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><section className={card}><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="font-display text-xl">Decisão do profissional</h2></div><p className="mt-2 text-sm text-muted-foreground">Somente a pessoa responsável pode interpretar o contrato, aprovar uma minuta ou indicar ajustes.</p><label htmlFor="concept-reason" className="mt-5 block text-sm font-medium">Registro demonstrativo da revisão</label><textarea id="concept-reason" className="mt-2 min-h-28 w-full rounded-md border bg-background p-3 text-sm" value={draft.reason} onChange={e => saveDraft({ reason: e.target.value })} placeholder="Descreva os pontos que seriam verificados presencialmente" /><Button className="mt-3" disabled={!draft.reason.trim()} onClick={() => saveDraft({ manualReview: true })}><CheckCircle2 /> Marcar revisão demonstrativa</Button>{draft.manualReview && <p role="status" className="mt-3 rounded-lg bg-success-soft p-3 text-sm text-success">Revisão demonstrativa registrada para esta sessão. Nenhuma aprovação jurídica, assinatura ou publicação foi realizada.</p>}</section><section className={card}><h2 className="font-display text-xl">Antes de disponibilizar</h2><ul className="mt-4 space-y-3 text-sm"><li>✓ Conferir partes, dados e poderes de representação.</li><li>✓ Conferir redação, limites e consequências de cada cláusula.</li><li>✓ Validar com signatários e responsáveis autorizados.</li><li>✓ Gerar versão final somente após aprovação real.</li></ul><Link to="/o/$org/documentos" params={{ org: office.slug }} className="mt-5 inline-flex text-sm text-primary hover:underline">Voltar à biblioteca de documentos</Link></section></div>}
    <p className="text-xs text-muted-foreground">Etapa {stepIndex + 1} de 4 · Conceito visual da Fase 2 · sem processamento, envio ou efeito legal.</p>
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="flex flex-wrap justify-between gap-2 border-b py-2"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-xs text-right font-medium">{value}</dd></div>; }

