import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock, Hourglass, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtTime, isOverdue, isToday, useDemo, useOfficeView } from "@/features/demo/store";
import type { Office } from "@/features/demo/types";
import { DemoTag } from "./badges";

const shownThisSession = new Set<string>();

export function MeuDiaDialog({ office }: { office: Office }) {
  const { meuDiaOpen, setMeuDiaOpen, role } = useDemo();
  const v = useOfficeView(office);
  const navigate = useNavigate();
  const [hideToday, setHideToday] = useState(false);
  const key = `jurido-meudia:${office.id}:${role}:${new Date().toDateString()}`;

  useEffect(() => {
    if (shownThisSession.has(key)) return;
    shownThisSession.add(key);
    if (window.localStorage.getItem(key) !== "hidden") setMeuDiaOpen(true);
  }, [key, setMeuDiaOpen]);

  const close = () => {
    if (hideToday) window.localStorage.setItem(key, "hidden");
    setMeuDiaOpen(false);
  };
  const open = (matterId?: string) => {
    close();
    if (matterId) navigate({ to: "/o/$org/casos/$id", params: { org: office.slug, id: matterId } });
  };

  const mine = v.tasks.filter((t) => t.status !== "concluida" && (t.assigneeId === v.me?.id || role === "gestor"));
  const groups = [
    { title: "Críticos e atrasados", Icon: AlertTriangle, items: mine.filter((t) => isOverdue(t) || t.priority === "critica").map((t) => ({ id: t.id, label: t.title, meta: "Tarefa", matterId: t.matterId })) },
    { title: "Prazos pendentes de revisão", Icon: ShieldAlert, items: v.deadlines.filter((d) => d.status === "proposto" || d.status === "em_revisao").map((d) => ({ id: d.id, label: d.title, meta: d.status === "proposto" ? "Proposto · não confirmado" : "Em revisão", matterId: d.matterId })) },
    { title: "Hoje", Icon: Clock, items: [
      ...mine.filter((t) => isToday(t.dueAt) && t.status !== "aguardando_cliente").map((t) => ({ id: t.id, label: t.title, meta: `Tarefa · ${fmtTime(t.dueAt)}`, matterId: t.matterId })),
      ...v.appointments.filter((a) => isToday(a.at)).map((a) => ({ id: a.id, label: a.title, meta: `Compromisso · ${fmtTime(a.at)}`, matterId: a.matterId })),
    ] },
    { title: "Aguardando cliente", Icon: Hourglass, items: mine.filter((t) => t.status === "aguardando_cliente").map((t) => ({ id: t.id, label: t.title, meta: "Aguardando documentos", matterId: t.matterId })) },
  ];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Dialog open={meuDiaOpen} onOpenChange={(o) => (o ? setMeuDiaOpen(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2"><DemoTag /></div>
          <DialogTitle className="font-display text-2xl font-medium">
            {greet}, {v.me?.name.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} · {office.displayName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(({ title, Icon, items }) => (
            <section key={title} className="rounded-xl border bg-background p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-copper" />{title} <span className="ml-auto text-xs text-muted-foreground">{items.length}</span></h3>
              {items.length === 0 ? <p className="text-xs text-muted-foreground">Nada por aqui.</p> : (
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => open(i.matterId)} disabled={!i.matterId} className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:cursor-default">
                        <span className="block">{i.label}</span>
                        <span className="text-xs text-muted-foreground">{i.meta}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={hideToday} onCheckedChange={(c) => setHideToday(!!c)} /> Não exibir novamente hoje
          </label>
          <div className="flex gap-2">
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
