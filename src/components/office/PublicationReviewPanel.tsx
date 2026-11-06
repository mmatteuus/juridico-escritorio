import { useState } from "react";
import { AlertTriangle, GitCompareArrows, History, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canConfirmDeadline } from "@/features/demo/permissions";
import { fmtDateTime, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Office, PublicationReview } from "@/features/demo/types";

const labels: Record<PublicationReview["status"], string> = {
  divergencia: "Divergência a revisar",
  suspeita_duplicidade: "Possível correlação duplicada",
  correlacao_revisada: "Correlação revisada",
};

export function PublicationReviewPanel({ office, reviews }: { office: Office; reviews: PublicationReview[] }) {
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const reviewer = canConfirmDeadline(view.role);

  function record(review: PublicationReview, action: "revisar" | "desfazer") {
    const reason = reasons[review.id]?.trim();
    if (!reviewer || !reason) return;
    const at = new Date().toISOString();
    const actor = view.me?.name ?? "Profissional";
    update(data => ({
      ...data,
      publicationReviews: data.publicationReviews.map(item => item.id !== review.id || item.officeId !== office.id ? item : {
        ...item,
        ...(action === "desfazer" ? { status: "divergencia" as const, linkedDeadlineId: undefined } : { status: "correlacao_revisada" as const }),
        reason,
        history: [...item.history, { at, actor, action: action === "revisar" ? `Revisou a correlação: ${reason}` : `Desfez a correlação: ${reason}` }],
      }),
    }));
    setReasons(current => ({ ...current, [review.id]: "" }));
  }

  if (!reviews.length) return null;
  return <section className="rounded-xl border bg-card p-5 shadow-soft" aria-labelledby="source-review-title">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning"><GitCompareArrows className="size-5"/></span><div><h2 id="source-review-title" className="font-display text-xl">Divergências e correlações de fontes</h2><p className="mt-1 text-sm text-muted-foreground">Registros ilustrativos para revisão humana. Nenhuma publicação ou intimação foi recebida de fonte oficial.</p></div></div>
    <div className="mt-4 space-y-3">{reviews.map(review => {
      const linked = review.linkedDeadlineId ? view.deadlines.find(item => item.id === review.linkedDeadlineId) : undefined;
      return <article key={review.id} className="rounded-lg border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{review.title}</p><p className="mt-1 text-xs text-muted-foreground">{review.matterId ? view.matterById(review.matterId)?.code ?? "Caso indisponível" : "Sem caso vinculado"} · Registro fictício</p></div><span className="rounded-full bg-warning-soft px-2 py-1 text-xs font-medium text-warning">{labels[review.status]}</span></div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">{review.sources.map((source, index) => <div key={`${source.identifier}-${index}`} className="min-w-0 rounded-md bg-muted p-3 text-sm"><p className="font-medium">{source.label}</p><p className="mt-1 break-all text-xs text-muted-foreground">Referência ilustrativa: {source.identifier}</p><p className="text-xs text-muted-foreground">Data informada: {fmtDateTime(source.date)}</p></div>)}</div>
        {linked && <p className="mt-3 flex items-center gap-2 text-sm"><AlertTriangle className="size-4 text-warning"/> Prazo relacionado: {linked.title} · vigente {fmtDateTime(linked.dueDate)}{linked.proposedDueDate ? ` · proposta ${fmtDateTime(linked.proposedDueDate)}` : ""}</p>}
        {review.reason && <p className="mt-3 text-sm text-muted-foreground">Registro da revisão: {review.reason}</p>}
        {review.history.length > 0 && <details className="mt-3"><summary className="flex cursor-pointer items-center gap-2 text-xs font-medium"><History className="size-4"/> Histórico demonstrativo ({review.history.length})</summary><ol className="mt-2 space-y-1 text-xs text-muted-foreground">{[...review.history].reverse().map((event,index)=><li key={`${event.at}-${index}`}>{fmtDateTime(event.at)} · {event.actor}: {event.action}</li>)}</ol></details>}
        {reviewer && <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input aria-label="Justificativa da revisão da correlação" className="h-9 min-w-0 rounded-md border bg-background px-3 text-sm" value={reasons[review.id] ?? ""} onChange={event=>setReasons(current=>({...current,[review.id]:event.target.value}))} placeholder="Justificativa obrigatória"/><Button size="sm" variant="outline" disabled={!reasons[review.id]?.trim()} onClick={()=>record(review,"revisar")}>{review.status === "correlacao_revisada" ? "Registrar nova decisão" : "Registrar revisão"}</Button>{review.linkedDeadlineId && <Button size="sm" variant="outline" disabled={!reasons[review.id]?.trim()} onClick={()=>record(review,"desfazer")}><Link2Off/> Desfazer correlação</Button>}</div>}
        {!reviewer && <p className="mt-3 text-xs text-muted-foreground">A revisão é reservada a profissional habilitado; nenhum prazo confirmado é alterado por esta tela.</p>}
      </article>;
    })}</div>
  </section>;
}
