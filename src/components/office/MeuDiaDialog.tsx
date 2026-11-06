import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock, FileText, Hourglass, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtTime, isOverdue, isToday, useDemo, useOfficeView } from "@/features/demo/store";
import { canSeeCnj, canSeeLegalDocs } from "@/features/demo/permissions";
import type { Office } from "@/features/demo/types";
import { DemoTag } from "./badges";

const shownThisSession = new Set<string>();
type DayTarget =
  | { type: "tarefa"; id: string }
  | { type: "prazo"; id: string }
  | { type: "caso"; id: string }
  | { type: "documento"; id: string }
  | { type: "atendimento"; id: string }
  | { type: "prazos" }
  | { type: "agenda" }
  | { type: "procuracoes" };

export function MeuDiaDialog({ office }: { office: Office }) {
  const { meuDiaOpen, setMeuDiaOpen, role } = useDemo();
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const [hideToday, setHideToday] = useState(false);
  const key = `jurido-meudia:${office.id}:${role}:${new Date().toDateString()}`;

  const close = () => {
    if (hideToday) {
      try {
        window.localStorage.setItem(key, "hidden");
      } catch {
        // Dismissing this dialog must work even when persistent storage is blocked.
      }
    }
    setMeuDiaOpen(false);
  };
  const open = (target: DayTarget) => {
    close();
    if (target.type === "tarefa") navigate({ to: "/o/$org/tarefas/$id", params: { org: office.slug, id: target.id } });
    if (target.type === "prazo") navigate({ to: "/o/$org/prazos/$id", params: { org: office.slug, id: target.id } });
    if (target.type === "caso") navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id: target.id }, search: { tab: "comunicacoes" } });
    if (target.type === "documento") navigate({ to: "/o/$org/documentos", params: { org: office.slug }, search: { docId: target.id } });
    if (target.type === "atendimento") navigate({ to: "/o/$org/atendimentos", params: { org: office.slug }, search: { intakeId: target.id } });
    if (target.type === "prazos") navigate({ to: "/o/$org/prazos", params: { org: office.slug } });
    if (target.type === "agenda") navigate({ to: "/o/$org/agenda", params: { org: office.slug } });
    if (target.type === "procuracoes") navigate({ to: "/o/$org/procuracoes", params: { org: office.slug } });
  };

  const mine = v.tasks.filter((t) => t.status !== "concluida" && (t.assigneeId === v.me?.id || role === "gestor"));
  const groups = [
    { title: "Críticos e atrasados", Icon: AlertTriangle, items: mine.filter((t) => isOverdue(t) || t.priority === "critica").map((t) => ({ id: t.id, label: t.title, meta: "Tarefa", target: { type: "tarefa" as const, id: t.id } })) },
    ...(canSeeCnj(v.role) ? [{ title: "Prazos pendentes de revisão", Icon: ShieldAlert, items: v.deadlines.filter((d) => d.status === "proposto" || d.status === "em_revisao").map((d) => ({ id: d.id, label: d.title, meta: d.status === "proposto" ? "Proposto · não confirmado" : "Em revisão", target: { type: "prazo" as const, id: d.id } })) }] : []),
    { title: "Hoje", Icon: Clock, items: [
      ...mine.filter((t) => isToday(t.dueAt) && t.status !== "aguardando_cliente").map((t) => ({ id: t.id, label: t.title, meta: `Tarefa · ${fmtTime(t.dueAt)}`, target: { type: "tarefa" as const, id: t.id } })),
      ...v.appointments.filter((a) => isToday(a.at)).map((a) => ({ id: a.id, label: a.title, meta: `Compromisso · ${fmtTime(a.at)}`, target: { type: "agenda" as const } })),
    ] },
    { title: "Aguardando cliente", Icon: Hourglass, items: mine.filter((t) => t.status === "aguardando_cliente").map((t) => ({ id: t.id, label: t.title, meta: "Aguardando documentos", target: { type: "tarefa" as const, id: t.id } })) },
    { title: "Retornos de clientes", Icon: Hourglass, items: v.notifications.filter((n) => n.category === "resposta_cliente" && !n.read && n.matterId && v.matterById(n.matterId)).map((n) => ({ id: n.id, label: n.title, meta: "Retorno demonstrativo · revisar comunicações", target: { type: "caso" as const, id: n.matterId! } })) },
    ...(v.role !== "financeiro" ? [{ title: "Atendimentos em triagem", Icon: FileText, items: v.intakes.filter((intake) => !["convertido", "arquivado"].includes(intake.stage)).map((intake) => ({ id: intake.id, label: intake.name, meta: `${intake.stage.replaceAll("_", " ")} · atendimento demonstrativo`, target: { type: "atendimento" as const, id: intake.id } })) }] : []),
    ...(canSeeCnj(v.role) ? [{ title: "Cobertura a conferir", Icon: ShieldAlert, items: v.notifications.filter((n) => n.category === "sincronizacao" && !n.read && (!n.matterId || v.matterById(n.matterId))).map((n) => ({ id: n.id, label: n.title, meta: "Estado ilustrativo · não confirma coleta externa", target: { type: "prazos" as const } })) }] : []),
    ...(canSeeLegalDocs(v.role) ? [{ title: "Procurações em revisão", Icon: FileText, items: v.mandates.filter((mandate) => mandate.status === "minuta" || mandate.status === "em_revisao").map((mandate) => ({ id: mandate.id, label: mandate.title, meta: mandate.status === "minuta" ? "Minuta · revisão pendente" : "Aguardando revisão", target: { type: "procuracoes" as const } })) }] : []),
    ...(canSeeLegalDocs(v.role) ? [{ title: "Documentos aguardando revisão", Icon: FileText, items: v.docs.filter((doc) => doc.status === "revisao_pendente").map((doc) => ({ id: doc.id, label: doc.title, meta: `${doc.category} · revisão profissional pendente · demonstração`, target: { type: "documento" as const, id: doc.id } })) }] : []),
  ];
  const hasWork = groups.some((group) => group.items.length > 0);

  useEffect(() => {
    if (shownThisSession.has(key)) return;
    try {
      if (window.localStorage.getItem(key) === "hidden") {
        shownThisSession.add(key);
        return;
      }
    } catch {
      // The in-session demo can still show the daily summary without persistent storage.
    }
    if (hasWork) {
      shownThisSession.add(key);
      setMeuDiaOpen(true);
    }
  }, [hasWork, key, setMeuDiaOpen]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Dialog open={meuDiaOpen} onOpenChange={(o) => (o ? setMeuDiaOpen(true) : close())}>
      <DialogContent className="max-h-[90vh] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2"><DemoTag /></div>
          <DialogTitle className="font-display text-2xl font-medium">
            {greet}, {v.me?.name.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} · {office.displayName}
          </DialogDescription>
        </DialogHeader>
        {!hasWork ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm font-medium text-primary">Tudo em dia. Você pode abrir Meu Dia novamente pelo painel quando precisar.</p> : <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {groups.map(({ title, Icon, items }) => (
            <section key={title} className="min-w-0 rounded-xl border bg-background p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-copper" />{title} <span className="ml-auto text-xs text-muted-foreground">{items.length}</span></h3>
              {items.length === 0 ? <p className="text-xs text-muted-foreground">Nada por aqui.</p> : (
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => open(i.target)} className="min-w-0 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted">
                        <span className="block break-words">{i.label}</span>
                        <span className="text-xs text-muted-foreground">{i.meta}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>}
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={hideToday} onCheckedChange={(c) => setHideToday(!!c)} /> Não exibir novamente hoje
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { close(); navigate({ to: "/o/$org/agenda", params: { org: office.slug } }); }}>
              <CalendarDays /> Abrir minha agenda
            </Button>
            <Button variant="outline" onClick={() => { close(); navigate({ to: "/o/$org/caixa-de-trabalho", params: { org: office.slug } }); }}>
              Ver todas
            </Button>
            <Button onClick={close}>Dispensar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
