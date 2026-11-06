import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Clock3, Eye, Mail, Smartphone } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/office/badges";
import { Button } from "@/components/ui/button";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import type { Notification, OfficeUserPreferences } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/preferencias")({
  head: () => ({ meta: [{ title: "Preferências pessoais · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: PreferencesPage,
});
const categoryLabel: Record<Notification["category"], string> = {
  prazo: "Prazos", tarefa: "Tarefas", documento: "Documentos", atribuicao: "Atribuições", mencao: "Menções", resposta_cliente: "Respostas de clientes", suporte: "Suporte", sincronizacao: "Atualização e sincronização", sistema: "Sistema",
};
const categoryHint: Record<Notification["category"], string> = {
  prazo: "Alterações e revisões de prazos", tarefa: "Atribuições e andamento de tarefas",
  documento: "Novos documentos e revisões", atribuicao: "Trabalho atribuído a você", mencao: "Menções em atualizações da equipe",
  resposta_cliente: "Retornos aguardando leitura da equipe", suporte: "Atualizações de solicitações de suporte",
  sincronizacao: "Estado informativo de atualização de fontes", sistema: "Avisos de operação do escritório",
};
const categories: Notification["category"][] = ["prazo", "tarefa", "atribuicao", "mencao", "documento", "resposta_cliente", "suporte", "sincronizacao", "sistema"];
const defaultCategories = Object.fromEntries(categories.map(category => [category, true])) as Record<Notification["category"], boolean>;
const card = "rounded-xl border bg-card p-5 shadow-soft";

function PreferencesPage() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  return <PreferencesContent key={`${office.id}:${view.me?.id ?? view.role}`} officeId={office.id} memberId={view.me?.id ?? `role-${view.role}`} name={view.me?.name ?? "Profissional"} notifications={view.notifications} officeName={office.displayName} preferences={view.userPreferences} />;
}
function PreferencesContent({ officeId, memberId, name, notifications, officeName, preferences }: { officeId: string; memberId: string; name: string; notifications: Notification[]; officeName: string; preferences: OfficeUserPreferences | undefined }) {
  const { update } = useDemo();
  const [enabled, setEnabled] = useState<Record<Notification["category"], boolean>>({ ...defaultCategories, ...preferences?.categories });
  const [channel, setChannel] = useState<"central" | "resumo">(preferences?.channel ?? "central");
  const [quiet, setQuiet] = useState(preferences?.quiet ?? false);
  const [quietStart, setQuietStart] = useState(preferences?.quietStart ?? "20:00");
  const [quietEnd, setQuietEnd] = useState(preferences?.quietEnd ?? "08:00");
  const [saved, setSaved] = useState(false);
  const preview = useMemo(() => notifications.filter(n => enabled[n.category]).sort((a,b) => b.at.localeCompare(a.at)).slice(0, 5), [notifications, enabled]);
  const changeCategory = (category: Notification["category"], next: boolean) => { setEnabled(current => ({ ...current, [category]: next })); setSaved(false); };
  const savePreferences = () => {
    const preference = { officeId, memberId, categories: enabled, channel, quiet, quietStart, quietEnd, managerAlerts: preferences?.managerAlerts ?? { deadlines: true, tasks: true } };
    update(data => ({ ...data, userPreferences: [...data.userPreferences.filter(item => item.officeId !== officeId || item.memberId !== memberId), preference] }));
    setSaved(true);
  };
  return <div className="space-y-5"><PageHeader title="Preferências pessoais" subtitle={`${name} · ${officeName} · sessão de demonstração`} />
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]"><div className="space-y-5">
      <section className={card}><div className="mb-4 flex items-center gap-2"><Bell className="size-5 text-primary"/><h2 className="font-display text-xl">Assuntos que acompanho</h2></div><p className="mb-4 text-sm text-muted-foreground">Escolha os assuntos para a prévia da sua central. Alertas de alta prioridade continuam registrados no sistema demo.</p><div className="space-y-2">{categories.map(category => <label key={category} className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-3"><span><span className="block text-sm font-medium">{categoryLabel[category]}</span><span className="block text-xs text-muted-foreground">{categoryHint[category]}</span></span><input type="checkbox" className="mt-1 size-4 accent-primary" checked={enabled[category]} onChange={e => changeCategory(category, e.target.checked)} /></label>)}</div></section>
      <section className={card}><div className="mb-4 flex items-center gap-2"><Mail className="size-5 text-primary"/><h2 className="font-display text-xl">Formato preferido</h2></div><div className="grid gap-2 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-3 ${channel === "central" ? "border-primary bg-primary/5" : ""}`}><input type="radio" name="format" className="mr-2 accent-primary" checked={channel === "central"} onChange={() => { setChannel("central"); setSaved(false); }} /><Smartphone className="mr-1 inline size-4"/>Central do aplicativo<span className="mt-1 block text-xs text-muted-foreground">Itens aparecem individualmente na prévia.</span></label><label className={`cursor-pointer rounded-lg border p-3 ${channel === "resumo" ? "border-primary bg-primary/5" : ""}`}><input type="radio" name="format" className="mr-2 accent-primary" checked={channel === "resumo"} onChange={() => { setChannel("resumo"); setSaved(false); }} /><Mail className="mr-1 inline size-4"/>Resumo diário<span className="mt-1 block text-xs text-muted-foreground">Prévia agrupada para leitura.</span></label></div><p className="mt-3 text-xs text-muted-foreground">Esta escolha demonstra a interface; nenhum e-mail ou push é enviado.</p></section>
      <section className={card}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Clock3 className="size-5 text-primary"/><h2 className="font-display text-xl">Horário silencioso</h2></div><label className="flex items-center gap-2 text-sm"><span className="sr-only">Ativar horário silencioso</span><input type="checkbox" className="size-4 accent-primary" checked={quiet} onChange={e => { setQuiet(e.target.checked); setSaved(false); }} />Ativar</label></div><p className="mt-2 text-sm text-muted-foreground">Exemplo visual para reduzir avisos fora do expediente. Prazos e tarefas continuam na central.</p>{quiet && <div className="mt-4 flex flex-wrap gap-4"><label className="grid gap-1 text-sm">Início<input type="time" value={quietStart} onChange={e => { setQuietStart(e.target.value); setSaved(false); }} className="rounded-md border bg-background p-2" /></label><label className="grid gap-1 text-sm">Fim<input type="time" value={quietEnd} onChange={e => { setQuietEnd(e.target.value); setSaved(false); }} className="rounded-md border bg-background p-2" /></label></div>}</section>
      <div className="flex items-center gap-3"><Button onClick={savePreferences}>Salvar preferências da sessão</Button>{saved && <span role="status" className="text-sm text-primary">Preferências aplicadas à prévia desta sessão.</span>}</div>
    </div><section className={`${card} h-fit`}><div className="flex items-center gap-2"><Eye className="size-5 text-primary"/><h2 className="font-display text-xl">Prévia das notificações</h2></div><p className="mt-2 text-sm text-muted-foreground">{channel === "resumo" ? `Resumo demonstrativo com ${preview.length} item(ns) selecionado(s).` : `${preview.length} item(ns) da central para os assuntos escolhidos.`}</p>{quiet && <p className="mt-2 rounded-md bg-muted p-2 text-xs">Horário silencioso: {quietStart}–{quietEnd}. Avisos permanecem disponíveis na central.</p>}{preview.length ? <ul className="mt-4 divide-y">{preview.map(n => <li key={n.id} className="py-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{n.title}</p><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{categoryLabel[n.category]}</span></div><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(n.at)} · {n.read ? "Lida" : "Não lida"}</p></li>)}</ul> : <div className="mt-4"><EmptyState title="Nenhum aviso na prévia" hint="Ative um assunto para voltar a mostrar notificações." /></div>}</section></div>
  </div>;
}
