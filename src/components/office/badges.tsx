import { Lock, ShieldAlert, Users, CircleDashed, Eye, CheckCircle2, CircleCheckBig, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Confidentiality, DeadlineStatus, TaskPriority, TaskStatus } from "@/features/demo/types";

const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function ConfidentialityBadge({ value }: { value: Confidentiality }) {
  if (value === "normal")
    return <span className={cn(base, "bg-muted text-muted-foreground")}><Eye className="size-3" />Normal</span>;
  if (value === "restrito_a_equipe")
    return <span className={cn(base, "bg-info-soft text-info")}><Users className="size-3" />Restrito à equipe</span>;
  return <span className={cn(base, "bg-destructive-soft text-destructive")}><Lock className="size-3" />Sigilo reforçado</span>;
}

const DL: Record<DeadlineStatus, { label: string; cls: string; Icon: typeof Eye }> = {
  proposto: { label: "Proposto · não confirmado", cls: "bg-warning-soft text-warning border border-dashed border-warning", Icon: CircleDashed },
  em_revisao: { label: "Em revisão", cls: "bg-copper-soft text-copper", Icon: ShieldAlert },
  confirmado: { label: "Confirmado", cls: "bg-success-soft text-success", Icon: CheckCircle2 },
  concluido: { label: "Concluído", cls: "bg-muted text-muted-foreground", Icon: CircleCheckBig },
  cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground line-through", Icon: XCircle },
};

export function DeadlineStatusChip({ status }: { status: DeadlineStatus }) {
  const { label, cls, Icon } = DL[status];
  return <span className={cn(base, cls)}><Icon className="size-3" />{label}</span>;
}

const PR: Record<TaskPriority, { label: string; cls: string }> = {
  critica: { label: "Crítica", cls: "bg-destructive-soft text-destructive" },
  alta: { label: "Alta", cls: "bg-copper-soft text-copper" },
  normal: { label: "Normal", cls: "bg-muted text-muted-foreground" },
  baixa: { label: "Baixa", cls: "bg-muted text-muted-foreground" },
};
export function PriorityBadge({ value }: { value: TaskPriority }) {
  return <span className={cn(base, PR[value].cls)}>{PR[value].label}</span>;
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando_cliente: "Aguardando cliente",
  aguardando_revisao: "Aguardando revisão",
  concluida: "Concluída",
};

export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={cn("rounded border border-copper/40 bg-copper-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-copper", className)}>
      Dados de demonstração
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-medium text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-8 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DeniedState() {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-soft">
      <Lock className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-3 font-display text-xl text-foreground">Acesso negado (DEMO)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seu perfil de demonstração não tem permissão para este item. Nenhum detalhe é exibido.
      </p>
    </div>
  );
}
