export type RoleId =
  | "gestor"
  | "socio"
  | "coordenador"
  | "advogado"
  | "secretario"
  | "substituto"
  | "financeiro"
  | "estagiario";

export type Confidentiality = "normal" | "restrito_a_equipe" | "sigilo_reforcado";

export interface Office {
  id: string;
  slug: string;
  legalName: string;
  displayName: string;
  monogram: string;
  brandColor: string; // oklch string, demo only
  address: string;
  phones: string[];
  units: string[];
  memberSeatLimit: number;
  practiceAreas: { id: string; name: string }[];
  oabNumber: string;
  signatoryMemberIds: string[];
  identityApprovedAt: string;
}

export interface OfficeIdentityFields {
  legalName: string;
  displayName: string;
  address: string;
  phones: string[];
  units: string[];
  oabNumber: string;
  signatoryMemberIds: string[];
}

export interface OfficeProfile extends OfficeIdentityFields {
  officeId: string;
  version: number;
  approvedAt: string;
}

export type OfficeProfileRevisionStatus = "rascunho" | "em_revisao" | "aprovada" | "rejeitada";

export interface OfficeProfileRevision {
  id: string;
  officeId: string;
  version: number;
  snapshot: OfficeIdentityFields;
  status: OfficeProfileRevisionStatus;
  proposedByMemberId: string;
  proposedAt: string;
  submittedAt?: string;
  reviewedByMemberId?: string;
  reviewedAt?: string;
  reviewReason?: string;
}

export interface Member {
  id: string;
  officeId: string;
  name: string;
  role: RoleId;
  practiceAreaIds: string[];
  title: string;
  oabNumber?: string;
  oabUf?: string;
}

export interface Client {
  id: string;
  officeId: string;
  name: string;
  kind: "PF" | "PJ";
  contact: string;
  city: string;
  document?: string;
  state?: string;
  responsibleId?: string;
  notes?: string;
  conflictStatus?: "pendente" | "liberado";
}

export type MatterStatus = "ativo" | "em_analise" | "suspenso" | "encerrado";
export type MatterNature = "consultivo" | "extrajudicial" | "pre_contencioso" | "judicial";

export interface Matter {
  id: string;
  officeId: string;
  code: string;
  title: string;
  matterNature: MatterNature;
  clientIds: string[];
  opposingParties?: string;
  practiceAreaId: string;
  status: MatterStatus;
  assignedMemberIds: string[];
  confidentiality: Confidentiality;
  /** Explicit role grants for case access; normal cases otherwise require assignment. */
  grantRoles: RoleId[];
  updatedAt: string;
  summary: string;
}

export interface Proceeding {
  id: string;
  officeId: string;
  matterId: string;
  cnjMasked?: string;
  court?: string;
  phase?: string;
  sourceState: "manual_demo";
}

export type DeadlineStatus = "proposto" | "em_revisao" | "confirmado" | "concluido" | "cancelado";

export interface DeadlineHistory {
  at: string;
  actor: string;
  action: string;
}

export interface Deadline {
  id: string;
  officeId: string;
  matterId: string;
  title: string;
  dueDate: string;
  /** Proposed replacement; current confirmed date remains effective until human approval. */
  proposedDueDate?: string | undefined;
  proposedReason?: string | undefined;
  proposedVersion?: number | undefined;
  status: DeadlineStatus;
  assigneeId: string;
  proposedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  version: number;
  sourceLabel: string;
  /** IANA zone used to interpret the proposed local date/time. */
  timeZone?: string;
  basis?: string;
  notes?: string;
  history: DeadlineHistory[];
}

export type PublicationCoverageStatus = "confirmada" | "atrasada" | "falha" | "lacuna" | "nao_verificada";

export interface PublicationCoverage {
  id: string;
  officeId: string;
  source: string;
  period: string;
  status: PublicationCoverageStatus;
  lastConfirmedAt?: string;
  delayMinutes?: number;
  gaps: number;
  note: string;
}

export type PublicationReviewStatus = "divergencia" | "suspeita_duplicidade" | "correlacao_revisada";
export interface PublicationReviewSource {
  label: string;
  date: string;
  identifier: string;
}
export interface PublicationReviewHistory {
  at: string;
  actor: string;
  action: string;
}
export interface PublicationReview {
  id: string;
  officeId: string;
  matterId: string;
  title: string;
  status: PublicationReviewStatus;
  sources: PublicationReviewSource[];
  linkedDeadlineId?: string | undefined;
  reason?: string | undefined;
  history: PublicationReviewHistory[];
}

export type TaskPriority = "critica" | "alta" | "normal" | "baixa";
export type TaskStatus = "a_fazer" | "em_andamento" | "aguardando_cliente" | "aguardando_revisao" | "concluida";

export interface Task {
  id: string;
  officeId: string;
  matterId?: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId: string;
  dueAt: string;
  requesterId?: string;
  instructions?: string;
  proceedingId?: string;
  appointmentId?: string;
  history?: TaskHistoryEntry[];
}

export interface TaskHistoryEntry {
  at: string;
  actor: string;
  action: string;
}

export interface DocumentFileMetadata {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Doc {
  id: string;
  officeId: string;
  matterId: string;
  title: string;
  version: number;
  category: string;
  visibility: "equipe" | "restrito" | "cliente";
  /** Local file selection metadata only; demo bytes are never uploaded or persisted. */
  fileMetadata?: DocumentFileMetadata;
  /** Explicit role grants for a restricted document; case access alone never grants it. */
  grantedRoles?: RoleId[];
  createdBy: string;
  createdAt: string;
  description?: string;
  content?: string;
  status?: "rascunho" | "revisao_pendente" | "aprovado";
  authorMemberId?: string;
  submittedByMemberId?: string;
  submissionReason?: string;
  reviewerMemberId?: string;
  reviewerName?: string;
  reviewReason?: string;
  versions?: DocRevision[];
  history?: DocWorkflowEvent[];
  /** Illustrative evidence metadata; it does not prove receipt or authenticity. */
  evidenceSource?: string;
  evidenceIdentifier?: string;
  capturedAt?: string;
  hashExample?: string;
  originalContent?: string;
  interpretation?: string;
  interpretationVersion?: number;
}

export interface DocRevision {
  version: number;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByMemberId?: string;
}

export interface DocWorkflowEvent {
  at: string;
  actor: string;
  actorMemberId?: string;
  action: string;
  reason?: string;
  version: number;
  status: "rascunho" | "revisao_pendente" | "aprovado";
}

export interface MatterDocumentChecklistItem {
  id: string;
  label: string;
  status: "pendente" | "conferido";
}

export interface MatterDocumentChecklist {
  officeId: string;
  matterId: string;
  items: MatterDocumentChecklistItem[];
}

export type DocumentModelStatus = "rascunho" | "em_revisao" | "publicado";

export interface DocumentModelRevision {
  version: number;
  name: string;
  areaId: string;
  content: string;
  status: DocumentModelStatus;
  updatedAt: string;
  authorMemberId?: string;
  authorName?: string;
  submissionReason?: string;
  reviewerMemberId?: string;
  reviewerName?: string;
  reviewReason?: string;
}

export interface DocumentModel {
  id: string;
  officeId: string;
  name: string;
  areaId: string;
  content: string;
  version: number;
  updatedAt: string;
  status?: DocumentModelStatus;
  authorMemberId?: string;
  authorName?: string;
  submissionReason?: string;
  reviewerMemberId?: string;
  reviewerName?: string;
  reviewReason?: string;
  versions?: DocumentModelRevision[];
}

export interface Mandate {
  id: string;
  officeId: string;
  matterId: string;
  clientId: string;
  kind: "procuracao" | "substabelecimento";
  title: string;
  attorneyId: string;
  powers: string;
  status: "minuta" | "em_revisao" | "aprovado_demo" | "revogado_demo";
  createdAt: string;
  expiresAt?: string;
}
export interface MessageDraft {
  id: string;
  officeId: string;
  matterId: string;
  clientId?: string;
  recipient: string;
  content: string;
  status: "rascunho" | "aguardando_revisao" | "pronto_envio_manual" | "acao_simulada";
}

export interface Receivable {
  id: string;
  officeId: string;
  matterId: string;
  label: string;
  kind: "honorario" | "despesa" | "repasse";
  category?: "honorario_contratual" | "honorario_sucumbencial" | "despesa_escritorio" | "custa_judicial" | "reembolso_despesa" | "reembolso_custa";
  clientId?: string;
  responsibleId?: string;
  relatedCostId?: string;
  reason?: string;
  reviewStatus?: "pendente" | "em_revisao" | "revisado_demo";
  /** Forecast amount, stored in integer BRL cents. */
  amountCents: number;
  dueDate: string;
}

export interface TimelineEvent {
  id: string;
  officeId: string;
  matterId: string;
  /** Required to enforce document-level visibility in activity feeds. */
  docId?: string;
  at: string;
  actor: string;
  kind: "cadastro" | "tarefa" | "documento" | "prazo" | "observacao" | "comunicacao" | "aprovacao";
  text: string;
}

export interface Notification {
  id: string;
  officeId: string;
  at: string;
  category: "prazo" | "tarefa" | "documento" | "atribuicao" | "mencao" | "resposta_cliente" | "suporte" | "sincronizacao" | "sistema";
  priority: "alta" | "normal";
  title: string;
  recipientMemberId?: string;
  matterId?: string;
  taskId?: string;
  docId?: string;
  read: boolean;
  snoozedUntil?: string;
}

export interface OfficeUserPreferences {
  officeId: string;
  memberId: string;
  categories: Record<Notification["category"], boolean>;
  channel: "central" | "resumo";
  quiet: boolean;
  quietStart: string;
  quietEnd: string;
  managerAlerts: { deadlines: boolean; tasks: boolean };
}

export interface ContractAnalysisDraft {
  officeId: string;
  memberId: string;
  documentId: string;
  scope: string;
  notes: Record<string, string>;
  manualReview: boolean;
  reason: string;
}

export interface FiscalPreparationDraft {
  officeId: string;
  memberId: string;
  classification: Record<string, string>;
  reviewedIds: string[];
  checks: Record<string, boolean>;
}

export interface Appointment {
  id: string;
  officeId: string;
  matterId?: string;
  title: string;
  at: string;
  assigneeId: string;
  practiceAreaId: string;
}

export type IntakeStage = "novo" | "em_triagem" | "conflito_pendente" | "documentos_pendentes" | "aprovado" | "convertido" | "arquivado";

export interface Intake {
  id: string;
  officeId: string;
  name: string;
  contact: string;
  clientKind: Client["kind"];
  existingClientId?: string;
  assigneeId?: string;
  practiceAreaId: string;
  matterNature: MatterNature;
  summary: string;
  stage: IntakeStage;
  createdAt: string;
  matterId?: string;
}

export interface DelegationGrant {
  id: string;
  officeId: string;
  grantorId: string;
  granteeId: string;
  matterId?: string;
  scope: string[];
  justification: string;
  startsAt: string;
  expiresAt: string;
  status: "ativa" | "agendada" | "revogada";
  revokedAt?: string;
}
export interface ConflictCheck {
  id: string;
  officeId: string;
  intakeId: string | undefined;
  prospect: string;
  counterparty: string;
  summary: string;
  status: "pendente" | "em_revisao" | "sem_indicio" | "risco_identificado" | "prosseguir_com_ressalvas";
  createdAt: string;
  reviewedBy: string | undefined;
  reviewReason: string | undefined;
  reviewedAt: string | undefined;
}
export interface ClientPortalInvite {
  id: string;
  officeId: string;
  clientId: string;
  matterId: string;
  recipient: string;
  status: "pendente" | "ativo" | "expirado" | "revogado";
  allowedDocIds: string[];
  createdAt: string;
  expiresAt: string;
}
export interface OfficeTeam {
  id: string;
  officeId: string;
  name: string;
  practiceAreaId: string;
  memberIds: string[];
}
export type CollaboratorInviteStatus = "pendente" | "aceito" | "expirado" | "revogado";
export interface CollaboratorInviteHistory {
  at: string;
  actor: string;
  action: string;
}
export interface CollaboratorInvite {
  id: string;
  officeId: string;
  email: string;
  role: RoleId;
  practiceAreaId: string;
  teamId?: string;
  status: CollaboratorInviteStatus;
  createdByMemberId?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  history: CollaboratorInviteHistory[];
}
export interface SupportTicket {
  id: string;
  officeId: string;
  category?: "acesso" | "agenda" | "documentos" | "navegacao" | "outro";
  referenceId?: string;
  description: string;
  technicalContext?: { app: string; route: string; requestReference: string; capturedAt: string };
  caseContextConsent?: { caseCode: string; consentedAt: string };
  status: "aberto" | "em_atendimento" | "resolvido";
  createdAt: string;
}
export interface SecuritySession {
  id: string;
  officeId: string;
  memberId: string;
  label: string;
  location: string;
  lastSeenAt: string;
  current: boolean;
  status: "ativa" | "revogada";
}

export interface DemoData {
  matterDocumentChecklists: MatterDocumentChecklist[];
  contractAnalysisDrafts: ContractAnalysisDraft[];
  fiscalPreparationDrafts: FiscalPreparationDraft[];
  userPreferences: OfficeUserPreferences[];
  officeProfiles: OfficeProfile[];
  officeProfileRevisions: OfficeProfileRevision[];
  intakes: Intake[];
  conflicts: ConflictCheck[];
  clientPortalInvites: ClientPortalInvite[];
  collaboratorInvites: CollaboratorInvite[];
  teams: OfficeTeam[];
  supportTickets: SupportTicket[];
  securitySessions: SecuritySession[];
  members: Member[];
  clients: Client[];
  matters: Matter[];
  proceedings: Proceeding[];
  deadlines: Deadline[];
  publicationCoverage: PublicationCoverage[];
  publicationReviews: PublicationReview[];
  tasks: Task[];
  docs: Doc[];
  models: DocumentModel[];
  mandates: Mandate[];
  delegations: DelegationGrant[];
  messages: MessageDraft[];
  receivables: Receivable[];
  timeline: TimelineEvent[];
  notifications: Notification[];
  appointments: Appointment[];
}
