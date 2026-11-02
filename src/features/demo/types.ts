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
  practiceAreas: { id: string; name: string }[];
}

export interface Member {
  id: string;
  officeId: string;
  name: string;
  role: RoleId;
  practiceAreaIds: string[];
  title: string;
}

export interface Client {
  id: string;
  officeId: string;
  name: string;
  kind: "PF" | "PJ";
  contact: string;
  city: string;
}

export type MatterStatus = "ativo" | "em_analise" | "suspenso" | "encerrado";

export interface Matter {
  id: string;
  officeId: string;
  code: string;
  title: string;
  clientIds: string[];
  practiceAreaId: string;
  status: MatterStatus;
  assignedMemberIds: string[];
  confidentiality: Confidentiality;
  /** Roles with explicit grant to sigilo_reforcado / restrito matters. */
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
  status: DeadlineStatus;
  assigneeId: string;
  proposedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
  version: number;
  sourceLabel: string;
  history: DeadlineHistory[];
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
}

export interface Doc {
  id: string;
  officeId: string;
  matterId: string;
  title: string;
  version: number;
  category: string;
  visibility: "equipe" | "restrito" | "cliente";
  createdBy: string;
  createdAt: string;
}

export interface MessageDraft {
  id: string;
  officeId: string;
  matterId: string;
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
  amount: number;
  paid: number;
  dueDate: string;
}

export interface TimelineEvent {
  id: string;
  officeId: string;
  matterId: string;
  at: string;
  actor: string;
  kind: "cadastro" | "tarefa" | "documento" | "prazo" | "observacao" | "comunicacao" | "aprovacao";
  text: string;
}

export interface Notification {
  id: string;
  officeId: string;
  at: string;
  category: "prazo" | "tarefa" | "documento" | "sistema";
  priority: "alta" | "normal";
  title: string;
  matterId?: string;
  read: boolean;
}

export interface Appointment {
  id: string;
  officeId: string;
  matterId?: string;
  title: string;
  at: string;
}

export type IntakeStage = "novo" | "em_triagem" | "documentos_pendentes" | "aprovado" | "convertido" | "arquivado";

export interface Intake {
  id: string;
  officeId: string;
  name: string;
  contact: string;
  practiceAreaId: string;
  summary: string;
  stage: IntakeStage;
  createdAt: string;
  matterId?: string;
}

export interface DemoData {
  intakes: Intake[];
  members: Member[];
  clients: Client[];
  matters: Matter[];
  proceedings: Proceeding[];
  deadlines: Deadline[];
  tasks: Task[];
  docs: Doc[];
  messages: MessageDraft[];
  receivables: Receivable[];
  timeline: TimelineEvent[];
  notifications: Notification[];
  appointments: Appointment[];
}
