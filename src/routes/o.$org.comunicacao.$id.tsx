import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, MessageSquare, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DeniedState, PageHeader } from "@/components/office/badges";
import {
  findOffice,
  fmtDateTime,
  timelineEvent,
  useDemo,
  useOfficeView,
} from "@/features/demo/store";
import type { MessageDraft, RoleId } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/comunicacao/$id")({
  head: () => ({
    meta: [
      { title: "Revisão de comunicação · JURIDO Escritórios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReviewMessage,
});
const labels: Record<MessageDraft["status"], string> = {
  rascunho: "Rascunho",
  aguardando_revisao: "Aguardando revisão",
  pronto_envio_manual: "Pronto para envio manual",
  acao_simulada: "Ação manual simulada",
};
const reviewers: RoleId[] = ["gestor", "socio", "coordenador", "advogado"];
const card = "rounded-xl border bg-card p-5 shadow-soft";

function ReviewMessage() {
  const { org, id } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const message = view.messages.find((item) => item.id === id);
  const [contact, setContact] = useState("");
  const [confirmedRecipient, setConfirmedRecipient] = useState(false);
  const [confirmedText, setConfirmedText] = useState(false);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  if (!message) return <DeniedState />;
  const matter = view.matterById(message.matterId);
  const client = matter?.clientIds
    .map((cid) => view.clients.find((c) => c.id === cid && c.officeId === office.id))
    .find((candidate) => candidate?.id === message.clientId || (!message.clientId && candidate?.name === message.recipient));
  const history = view.timeline
    .filter((event) => event.matterId === message.matterId && event.kind === "comunicacao")
    .sort((a, b) => b.at.localeCompare(a.at));
  const canReview = reviewers.includes(view.role);
  const phoneValid = contact.replace(/\D/g, "").length >= 10;
  const actor = view.me?.name ?? "Equipe";
  const record = (next: MessageDraft["status"], action: string) => {
    update((data) => ({
      ...data,
      messages: data.messages.map((item) =>
        item.id === message.id && item.officeId === office.id ? { ...item, status: next } : item,
      ),
      timeline: [
        ...data.timeline,
        timelineEvent({
          officeId: office.id,
          matterId: message.matterId,
          actor,
          kind: "comunicacao",
          text: action,
        }),
      ],
    }));
    setNotice(action + " (demonstração).");
  };
  const approve = () => {
    if (!canReview || !client || !reason.trim() || !confirmedRecipient || !confirmedText || !phoneValid)
      return;
    record(
      "pronto_envio_manual",
      `Texto revisado para envio manual. Justificativa: ${reason.trim()}`,
    );
    setReason("");
  };
  const simulateManualAction = () => {
    if (!canReview || !client || !confirmedRecipient || !confirmedText || !phoneValid) return;
    record(
      "acao_simulada",
      "Ação de envio manual simulada pelo profissional; entrega não confirmada",
    );
  };
  return (
    <div className="space-y-5">
      <Link
        to="/o/$org/comunicacao"
        params={{ org }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Comunicações
      </Link>
      <PageHeader
        title="Revisão supervisionada"
        subtitle={`${office.displayName} · ${matter?.code ?? "Caso restrito"}`}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <MessageSquare className="size-5 text-primary" /> Texto para conferência
              </h2>
              <span className="rounded-full bg-muted px-2 py-1 text-xs">
                {labels[message.status]}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              {message.content}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Nenhuma mensagem é disparada por esta tela.
            </p>
          </section>
          <section className={card}>
            <h2 className="flex items-center gap-2 font-display text-xl">
              <ClipboardCheck className="size-5 text-primary" /> Conferência humana
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {!client && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-destructive">O destinatário não corresponde a um cliente visível vinculado ao caso. A revisão e a confirmação ficam bloqueadas.</div>}
              <div>
                <dt className="text-muted-foreground">Destinatário previsto</dt>
                <dd className="break-words font-medium">{message.recipient}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Contato do cadastro</dt>
                <dd className="break-words">{client?.contact ?? "Não disponível"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Caso</dt>
                <dd>
                  {matter ? (
                    <Link
                      to="/o/$org/casos/$id"
                      params={{ org, id: matter.id }}
                      className="break-words text-primary hover:underline"
                    >
                      {matter.code} · {matter.title}
                    </Link>
                  ) : (
                    "Não disponível"
                  )}
                </dd>
              </div>
            </dl>
            <label htmlFor="confirmed-contact" className="mt-4 block text-sm font-medium">
              Telefone confirmado para ação manual
            </label>
            <input
              id="confirmed-contact"
              type="tel"
              autoComplete="off"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setConfirmedRecipient(false);
              }}
              placeholder="Confirme o número com o destinatário"
              className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Confira o número fora do sistema. O campo não envia mensagens nem altera o cadastro.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={confirmedRecipient}
                  onCheckedChange={(value) => setConfirmedRecipient(value === true)}
                />
                <span>Confirmei o destinatário e o telefone.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={confirmedText}
                  onCheckedChange={(value) => setConfirmedText(value === true)}
                />
                <span>Revisei o conteúdo e posso assumir a ação manual.</span>
              </label>
            </div>
          </section>
        </div>
        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-xl">Decisão</h2>
            {!canReview ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Seu perfil pode consultar o rascunho, mas a aprovação cabe a um profissional
                autorizado.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <label htmlFor="review-reason" className="text-sm font-medium">
                  Justificativa da revisão
                </label>
                <textarea
                  id="review-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
                  placeholder="Registre o motivo da aprovação"
                />
                <div className="flex flex-wrap gap-2">
                  {message.status === "rascunho" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        record("aguardando_revisao", "Rascunho encaminhado à revisão humana")
                      }
                    >
                      Encaminhar para revisão
                    </Button>
                  )}
                  {message.status === "aguardando_revisao" && (
                    <Button
                      onClick={approve}
                      disabled={
                        !client || !reason.trim() || !confirmedRecipient || !confirmedText || !phoneValid
                      }
                    >
                      <CheckCircle2 /> Aprovar texto
                    </Button>
                  )}
                  {message.status === "pronto_envio_manual" && (
                    <Button
                      onClick={simulateManualAction}
                      disabled={!client || !confirmedRecipient || !confirmedText || !phoneValid}
                    >
                      <ShieldAlert /> Registrar ação manual simulada
                    </Button>
                  )}
                </div>
              </div>
            )}
            {message.status === "acao_simulada" && (
              <p className="mt-3 rounded-lg bg-warning-soft p-3 text-sm text-warning">
                Ação manual simulada. Não há confirmação de entrega, leitura ou resposta.
              </p>
            )}
            {notice && (
              <p role="status" className="mt-3 text-sm text-primary">
                {notice}
              </p>
            )}
          </section>
          <section className={card}>
            <h2 className="font-display text-xl">Histórico do caso</h2>
            {history.length ? (
              <ul className="mt-4 space-y-3">
                {history.slice(0, 8).map((event) => (
                  <li key={event.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                    <p className="break-words">{event.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.actor} · {fmtDateTime(event.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhum evento de comunicação registrado.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
