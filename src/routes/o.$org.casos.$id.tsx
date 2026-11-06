import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  FileText,
  Gavel,
  LockKeyhole,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ConfidentialityBadge,
  DeadlineStatusChip,
  DeniedState,
  EmptyState,
  PageHeader,
  PriorityBadge,
  TASK_STATUS_LABEL,
} from "@/components/office/badges";
import { canSeeFinance, canSeeLegalDocs, ROLE_LABEL } from "@/features/demo/permissions";
import {
  findOffice,
  fmtDate,
  fmtDateTime,
  timelineEvent,
  useDemo,
  useOfficeView,
} from "@/features/demo/store";
import { formatBrlCents } from "@/features/demo/money";
import type { Doc, Matter, RoleId } from "@/features/demo/types";

const tabs = [
  "resumo",
  "processos",
  "documentos",
  "tarefas",
  "prazos",
  "comunicacoes",
  "financeiro",
  "atividade",
] as const;
type Tab = (typeof tabs)[number];
const names: Record<Tab, string> = {
  resumo: "Resumo",
  processos: "Processos",
  documentos: "Documentos",
  tarefas: "Tarefas",
  prazos: "Prazos",
  comunicacoes: "Comunicações",
  financeiro: "Financeiro",
  atividade: "Atividade",
};
const status: Record<Matter["status"], string> = {
  ativo: "Ativo",
  em_analise: "Em análise",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};
const matterNatureLabel: Record<Matter["matterNature"], string> = {
  consultivo: "Consultivo",
  extrajudicial: "Extrajudicial",
  pre_contencioso: "Pré-contencioso",
  judicial: "Judicial",
};
const visibility: Record<Doc["visibility"], string> = {
  equipe: "Equipe",
  restrito: "Restrito",
  cliente: "Liberado ao cliente",
};
const card = "min-w-0 rounded-xl border bg-card p-5 shadow-soft";
const defaultDocumentChecklist = [
  {
    id: "identificacao",
    label: "Identificação ou documentos constitutivos",
    status: "pendente" as const,
  },
  { id: "representacao", label: "Representação e poderes", status: "pendente" as const },
  { id: "suporte", label: "Documentos de suporte do caso", status: "pendente" as const },
];

export const Route = createFileRoute("/o/$org/casos/$id")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    tabs.includes(search["tab"] as Tab) ? { tab: search["tab"] as Tab } : {},
  head: () => ({
    meta: [{ title: "Caso · JURIDO Escritórios" }, { name: "robots", content: "noindex" }],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { org, id } = Route.useParams();
  const { tab } = Route.useSearch();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const matter = view.matterById(id);
  if (!matter) return <DeniedState />;
  const matterId = matter.id;
  const sourceIntake = view.intakes.find((intake) => intake.id === matter.sourceIntakeId);
  const processes = view.proceedings.filter((item) => item.matterId === matter.id);
  const tasks = view.tasks
    .filter((item) => item.matterId === matter.id)
    .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
  const deadlines = view.deadlines
    .filter((item) => item.matterId === matter.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const messages = view.messages.filter((item) => item.matterId === matter.id);
  const events = view.timeline
    .filter((item) => item.matterId === matter.id)
    .sort((a, b) => b.at.localeCompare(a.at));
  const finance = canSeeFinance(view.role)
    ? view.receivables.filter((item) => item.matterId === matter.id)
    : [];
  const canManageDocs = ["gestor", "socio", "coordenador"].includes(view.role);
  const docs = view.docs.filter((item) => item.matterId === matter.id);
  const selectedDoc = docs.find((item) => item.id === selectedDocId);
  const clients = matter.clientIds
    .map((clientId) => view.clients.find((client) => client.id === clientId))
    .filter((client): client is NonNullable<typeof client> => !!client);
  const members = matter.assignedMemberIds
    .map((memberId) => view.members.find((member) => member.id === memberId))
    .filter((member): member is NonNullable<typeof member> => !!member);
  const visibleTabs = tabs.filter((item) => item !== "financeiro" || canSeeFinance(view.role));
  const activeTab: Tab = tab && visibleTabs.includes(tab) ? tab : "resumo";

  function changeVisibility(doc: Doc, next: Doc["visibility"]) {
    if (!canManageDocs || !docs.some((item) => item.id === doc.id)) return;
    update((data) => ({
      ...data,
      docs: data.docs.map((item) =>
        item.id === doc.id && item.officeId === office.id
          ? {
              ...item,
              visibility: next,
            }
          : item,
      ),
      timeline: [
        timelineEvent({
          officeId: office.id,
          matterId: id,
          docId: doc.id,
          actor: view.me?.name ?? "Equipe",
          kind: "documento",
          text: `Alterou a visibilidade de ${doc.title} para ${visibility[next]} (demo)`,
        }),
        ...data.timeline,
      ],
    }));
  }

  function changeRoleGrant(doc: Doc, grantedRole: RoleId, checked: boolean) {
    if (!canManageDocs || grantedRole === view.role || !docs.some((item) => item.id === doc.id))
      return;
    update((data) => ({
      ...data,
      docs: data.docs.map((item) =>
        item.id === doc.id && item.officeId === office.id
          ? {
              ...item,
              grantedRoles: checked
                ? [...new Set([...(item.grantedRoles ?? []), grantedRole])]
                : (item.grantedRoles ?? []).filter((role) => role !== grantedRole),
            }
          : item,
      ),
      timeline: [
        timelineEvent({
          officeId: office.id,
          matterId: id,
          docId: doc.id,
          actor: view.me?.name ?? "Equipe",
          kind: "documento",
          text: `${checked ? "Concedeu" : "Revogou"} acesso de ${ROLE_LABEL[grantedRole]} a ${doc.title} (demo)`,
        }),
        ...data.timeline,
      ],
    }));
  }

  function toggleChecklistItem(itemId: string, checked: boolean) {
    const checklist = view.matterDocumentChecklists.find((item) => item.matterId === matterId);
    const items = (checklist?.items ?? defaultDocumentChecklist).map((item) =>
      item.id === itemId
        ? { ...item, status: checked ? ("conferido" as const) : ("pendente" as const) }
        : item,
    );
    update((data) => ({
      ...data,
      matterDocumentChecklists: [
        ...data.matterDocumentChecklists.filter(
          (item) => item.officeId !== office.id || item.matterId !== matterId,
        ),
        { officeId: office.id, matterId, items },
      ],
    }));
  }

  return (
    <div className="space-y-5">
      <Link
        to="/o/$org/casos"
        params={{ org }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Casos
      </Link>
      <PageHeader
        title={matter.title}
        subtitle={`${matter.code} · ${view.areaName(matter.practiceAreaId)} · ${clients.map((client) => client.name).join(", ") || "Sem cliente vinculado"}${matter.opposingParties ? ` · Parte contrária: ${matter.opposingParties}` : ""} · Equipe: ${members.map((member) => member.name).join(", ") || "Sem responsável"} · atualizado em ${fmtDate(matter.updatedAt)}`}
        actions={<ConfidentialityBadge value={matter.confidentiality} />}
      />
      {sourceIntake && !["convertido", "arquivado"].includes(sourceIntake.stage) && (
        <section className="rounded-lg border border-copper/30 bg-copper-soft p-4 text-sm text-copper" role="status">
          <p className="font-semibold">Rascunho em análise · revisão de conflito pendente</p>
          <p className="mt-1">A conversão só fica disponível após a revisão humana e aprovação do atendimento vinculado.</p>
          <Link to="/o/$org/atendimentos" params={{ org }} search={{ intakeId: sourceIntake.id }} className="mt-2 inline-flex font-semibold underline">Abrir atendimento e revisão</Link>
        </section>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<BriefcaseBusiness />} label="Estado" value={status[matter.status]} />
        <Metric icon={<Gavel />} label="Processos vinculados" value={String(processes.length)} />
        <Metric icon={<FileText />} label="Documentos visíveis" value={String(docs.length)} />
        <Metric
          icon={<CalendarClock />}
          label="Prazos em aberto"
          value={String(
            deadlines.filter((item) => !["concluido", "cancelado"].includes(item.status)).length,
          )}
        />
      </div>
      <nav aria-label="Seções do caso" className="flex gap-1 overflow-x-auto border-b pb-1">
        {visibleTabs.map((item) => (
          <Link
            key={item}
            to="/o/$org/casos/$id"
            params={{ org, id }}
            search={{ tab: item }}
            className={`shrink-0 rounded-md px-3 py-2 text-sm ${activeTab === item ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            {names[item]}
          </Link>
        ))}
      </nav>
      {activeTab === "resumo" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className={card}>
            <h2 className="font-display text-xl">Visão do caso</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {matter.summary}
            </p>
            <dl className="mt-5 space-y-2">
              <Info label="Natureza do caso" value={matterNatureLabel[matter.matterNature]} />
              <Info label="Área" value={view.areaName(matter.practiceAreaId)} />
              <Info
                label="Confidencialidade"
                value={
                  matter.confidentiality === "normal"
                    ? "Normal"
                    : matter.confidentiality === "sigilo_reforcado"
                      ? "Sigilo reforçado"
                      : "Restrito à equipe"
                }
              />
              {matter.opposingParties && (
                <Info label="Parte contrária" value={matter.opposingParties} />
              )}
            </dl>
          </section>
          <div className="space-y-5">
            <section className={card}>
              <h2 className="font-display text-xl">Clientes vinculados</h2>
              {clients.length ? (
                <ul className="mt-3 space-y-2">
                  {clients.map((client) => (
                    <li key={client.id}>
                      <Link
                        to="/o/$org/clientes/$id"
                        params={{ org, id: client.id }}
                        className="text-sm text-primary hover:underline"
                      >
                        {client.name}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{client.kind}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Nenhum cliente visível" />
              )}
            </section>
            <section className={card}>
              <h2 className="font-display text-xl">Equipe responsável</h2>
              {members.length ? (
                <ul className="mt-3 space-y-2">
                  {members.map((member) => (
                    <li key={member.id}>
                      <Link
                        to="/o/$org/equipe/$id"
                        params={{ org, id: member.id }}
                        className="text-sm text-primary hover:underline"
                      >
                        {member.name}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{member.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Sem responsável designado" />
              )}
            </section>
          </div>
        </div>
      )}
      {activeTab === "processos" && (
        <section className={card}>
          <SectionHeading title="Processos vinculados" count={processes.length} />
          <Records empty="Nenhum processo vinculado. O caso pode existir sem número CNJ.">
            {processes.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <Link
                  to="/o/$org/processos/$id"
                  params={{ org, id: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.cnjMasked ?? "Processo sem número"}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.court ?? "Tribunal não informado"} · {item.phase ?? "Fase não informada"}
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      {activeTab === "documentos" && (
        <section className={card}>
          <SectionHeading title="Dossiê de documentos" count={docs.length} />
          {!canSeeLegalDocs(view.role) ? (
            <EmptyState title="Documentos indisponíveis para este perfil" />
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Documento restrito exige concessão expressa por perfil, além do acesso ao caso. O
                vínculo com a equipe não libera seu conteúdo.
              </p>
              <Records empty="Nenhum documento visível neste caso.">
                {docs.map((item) => (
                  <li key={item.id} className="border-b py-3 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedDocId(item.id)}
                        className="text-left font-medium text-primary hover:underline"
                      >
                        {item.title}
                      </button>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {visibility[item.visibility]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.category} · v{item.version} · {fmtDate(item.createdAt)} ·{" "}
                      {item.createdBy}
                    </p>
                  </li>
                ))}
              </Records>
              <section
                className="mt-5 rounded-lg border bg-muted/20 p-4"
                aria-labelledby="document-checklist-title"
              >
                <h3 id="document-checklist-title" className="font-semibold">
                  Checklist documental
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Marque a conferência dos itens. Isso não confirma upload nem substitui um
                  documento no dossiê.
                </p>
                <ul className="mt-3 space-y-2">
                  {(
                    view.matterDocumentChecklists.find((item) => item.matterId === matter.id)
                      ?.items ?? defaultDocumentChecklist
                  ).map((item) => (
                    <li key={item.id}>
                      <label className="flex items-start gap-2 rounded-md border bg-card p-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-primary"
                          checked={item.status === "conferido"}
                          onChange={(event) => toggleChecklistItem(item.id, event.target.checked)}
                        />
                        <span>
                          {item.label}
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.status === "conferido"
                              ? "Conferido nesta demonstração"
                              : "Pendente de conferência"}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
              {selectedDoc && (
                <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                  <h3 className="font-semibold">{selectedDoc.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    Metadados do documento demonstrativo. O arquivo não está disponível.
                  </p>
                  <p className="mt-2">
                    Versão {selectedDoc.version} · {visibility[selectedDoc.visibility]}
                  </p>
                  {selectedDoc.fileMetadata && (
                    <div className="mt-3 rounded-md border bg-background/60 p-3 text-sm">
                      <p className="break-all font-medium">{selectedDoc.fileMetadata.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedDoc.fileMetadata.mimeType} ·{" "}
                        {formatFileSize(selectedDoc.fileMetadata.sizeBytes)} · metadados fictícios
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Bytes não enviados nem armazenados nesta demonstração.
                      </p>
                    </div>
                  )}
                  {canManageDocs && (
                    <>
                      <label className="mt-4 block text-sm">
                        Alterar visibilidade (demo)
                        <select
                          className="mt-1 block w-full max-w-xs rounded-md border bg-background p-2"
                          value={selectedDoc.visibility}
                          onChange={(event) =>
                            changeVisibility(selectedDoc, event.target.value as Doc["visibility"])
                          }
                        >
                          {Object.entries(visibility).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <fieldset className="mt-4">
                        <legend className="font-medium">Concessões por perfil (demo)</legend>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Prepare concessões antes de restringir. Alterar o próprio perfil exige
                          outro gestor habilitado. Esta simulação não aprova acesso real.
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {(Object.entries(ROLE_LABEL) as [RoleId, string][])
                            .filter(([role]) => canSeeLegalDocs(role))
                            .map(([role, label]) => (
                              <label key={role} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  disabled={role === view.role}
                                  checked={selectedDoc.grantedRoles?.includes(role) ?? false}
                                  onChange={(event) =>
                                    changeRoleGrant(selectedDoc, role, event.target.checked)
                                  }
                                />
                                {label}
                              </label>
                            ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3"
                    onClick={() => setSelectedDocId(null)}
                  >
                    Fechar detalhe
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {activeTab === "tarefas" && (
        <section className={card}>
          <SectionHeading title="Tarefas" count={tasks.length} />
          <Records empty="Nenhuma tarefa vinculada.">
            {tasks.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <Link
                  to="/o/$org/tarefas/$id"
                  params={{ org, id: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {view.memberName(item.assigneeId)} · {(item.dueAt ? fmtDateTime(item.dueAt) : "Sem data-alvo")} ·{" "}
                  {TASK_STATUS_LABEL[item.status]} <PriorityBadge value={item.priority} />
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      {activeTab === "prazos" && (
        <section className={card}>
          <SectionHeading title="Prazos" count={deadlines.length} />
          <Records empty="Nenhum prazo vinculado.">
            {deadlines.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <Link
                  to="/o/$org/prazos/$id"
                  params={{ org, id: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {fmtDateTime(item.dueDate)} · {view.memberName(item.assigneeId)}{" "}
                  <DeadlineStatusChip status={item.status} />
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      {activeTab === "comunicacoes" && (
        <section className={card}>
          <SectionHeading title="Comunicações" count={messages.length} />
          <Records empty="Nenhuma comunicação vinculada.">
            {messages.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <Link
                  to="/o/$org/comunicacao/$id"
                  params={{ org, id: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.recipient}
                </Link>
                <p className="mt-1 break-words text-sm">{item.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.status.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      {activeTab === "financeiro" && canSeeFinance(view.role) && (
        <section className={card}>
          <SectionHeading title="Honorários e despesas" count={finance.length} />
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric
              icon={<Wallet />}
              label="Previsões no caso"
              value={formatBrlCents(finance.reduce((sum, item) => sum + item.amountCents, 0))}
            />
            <Metric
              icon={<Wallet />}
              label="Itens previstos"
              value={String(finance.length)}
            />
            <Metric
              icon={<Wallet />}
              label="Em revisão"
              value={String(finance.filter((item) => item.reviewStatus === "pendente" || item.reviewStatus === "em_revisao").length)}
            />
          </div>
          <Records empty="Nenhum lançamento vinculado.">
            {finance.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <Link
                  to="/o/$org/financeiro/$id"
                  params={{ org, id: item.id }}
                  className="font-medium text-primary hover:underline"
                >
                  {item.label}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBrlCents(item.amountCents)} · previsão · referência {fmtDate(item.dueDate)}
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      {activeTab === "atividade" && (
        <section className={card}>
          <SectionHeading title="Atividade do caso" count={events.length} />
          <Records empty="Nenhuma atividade registrada.">
            {events.map((item) => (
              <li key={item.id} className="border-b py-3 last:border-0">
                <p className="font-medium">{item.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.actor} · {fmtDateTime(item.at)}
                </p>
              </li>
            ))}
          </Records>
        </section>
      )}
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="size-4 shrink-0" /> Informações e permissões demonstrativas. Dados
        reais exigem autorização validada no servidor.
      </p>
    </div>
  );
}
function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      <span className="text-sm text-muted-foreground">{count}</span>
    </div>
  );
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={card}>
      <span className="text-copper [&_svg]:size-4">{icon}</span>
      <p className="mt-2 font-display text-2xl">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
function Records({ empty, children }: { empty: string; children: React.ReactNode }) {
  return (
    <ul className="mt-4 divide-y empty:hidden">
      {children && (Array.isArray(children) ? children.length : 1) ? (
        children
      ) : (
        <li>
          <EmptyState title={empty} />
        </li>
      )}
    </ul>
  );
}
function formatFileSize(sizeBytes: number) {
  return sizeBytes < 1024 * 1024
    ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
