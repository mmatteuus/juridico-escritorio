import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Fingerprint, KeyRound, Laptop, LockKeyhole, ShieldCheck, Smartphone, UserRound, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/office/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { findOffice, fmtDateTime, useDemo, useOfficeView } from "@/features/demo/store";
import type { SecuritySession } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/seguranca")({
  head: () => ({ meta: [{ title: "Segurança da conta · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: AccountSecurity,
});
const card = "min-w-0 rounded-xl border bg-card p-5 shadow-soft";
type Preview = "pronto" | "carregando" | "vazio" | "erro" | "expirada" | "bloqueada";
const previewLabels: Record<Preview,string> = { pronto:"Visão normal", carregando:"Carregando", vazio:"Sem sessões", erro:"Erro de consulta", expirada:"Sessão expirada", bloqueada:"Conta bloqueada" };
function AccountSecurity() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const { update } = useDemo();
  const [tab, setTab] = useState<"proteção" | "sessões">("proteção");
  const [preview, setPreview] = useState<Preview>("pronto");
  const [mfaStep, setMfaStep] = useState<1|2|3>(1);
  const [showRecovery, setShowRecovery] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string|"all"|null>(null);
  const sessions = view.securitySessions;
  const otherActive = sessions.filter(s => !s.current && s.status === "ativa");
  const targetLabel = revokeTarget === "all" ? "todas as outras sessões" : sessions.find(s => s.id === revokeTarget)?.label;
  function revoke() {
    if (!revokeTarget || !view.me) return;
    update(data => ({ ...data, securitySessions: data.securitySessions.map(s =>
      s.officeId === office.id && s.memberId === view.me?.id && !s.current && s.status === "ativa" &&
      (revokeTarget === "all" || s.id === revokeTarget) ? { ...s, status: "revogada" } : s,
    ) }));
    setRevokeTarget(null);
  }
  return <div className="space-y-5">
    <PageHeader title="Segurança da conta" subtitle={preview === "expirada" || preview === "bloqueada" ? "Prévia sem dados da conta" : `${office.displayName} · ${view.me?.name ?? ROLE_LABEL[view.role]}`} />
    <div role="status" className="rounded-xl border border-copper/30 bg-copper-soft p-4 text-sm text-copper"><strong>Ambiente de demonstração.</strong> MFA, recuperação e revogação são prévias visuais. Nenhuma credencial, sessão ou dispositivo real é alterado.</div>
    <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Prévia de estado
      <select aria-label="Prévia de estado da segurança" className="rounded-md border bg-background px-3 py-2 text-sm text-foreground" value={preview} onChange={e => setPreview(e.target.value as Preview)}>{Object.entries(previewLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
    </label>
    {preview === "expirada" || preview === "bloqueada" ? <section role="alert" className={card}><LockKeyhole className="size-7 text-copper"/><h2 className="mt-3 font-display text-2xl">{preview === "expirada" ? "Sessão expirada — prévia" : "Acesso bloqueado — prévia"}</h2><p className="mt-2 text-sm text-muted-foreground">{preview === "expirada" ? "Em uma aplicação autenticada, seria necessário entrar novamente. Nenhum dado de conta é mostrado neste estado." : "Em uma aplicação autenticada, o acesso exigiria revisão apropriada. Nenhum dado de conta é mostrado neste estado."}</p><Button asChild variant="outline" className="mt-5"><Link to="/o/$org/inicio" params={{org}}>Voltar ao início demo</Link></Button></section> : <>
      <div className="grid gap-3 sm:grid-cols-3"><Metric icon={<UserRound className="size-4"/>} label="Perfil demo" value={ROLE_LABEL[view.role]}/><Metric icon={<Fingerprint className="size-4"/>} label="MFA real" value="Não ativo"/><Metric icon={<Laptop className="size-4"/>} label="Outras sessões da amostra" value={String(otherActive.length)}/></div>
      <nav className="flex flex-wrap gap-2 border-b pb-2" aria-label="Áreas de segurança"><Tab selected={tab === "proteção"} onClick={() => setTab("proteção")}>Proteção da conta</Tab><Tab selected={tab === "sessões"} onClick={() => setTab("sessões")}>Sessões e dispositivos</Tab></nav>
      {tab === "proteção" ? <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}><div className="flex items-center gap-2"><Fingerprint className="size-5 text-primary"/><h2 className="font-display text-xl">Verificação em duas etapas</h2></div><p className="mt-2 text-sm text-muted-foreground">Assistente visual em três etapas. Não cadastre um segundo fator aqui.</p><ol className="mt-4 flex flex-wrap gap-2 text-xs" aria-label="Etapas da prévia MFA">{[1,2,3].map(n => <li key={n} className={`rounded-full px-3 py-1 ${mfaStep === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Etapa {n}</li>)}</ol>
          <div className="mt-4 min-h-36 rounded-lg border bg-muted/30 p-4 text-sm">{mfaStep === 1 ? <><p className="font-medium">1. Confirmar identidade</p><p className="mt-2 text-muted-foreground">Uma conta real exigiria autenticação antes de iniciar a ativação.</p></> : mfaStep === 2 ? <><p className="font-medium">2. Configurar aplicativo autenticador</p><div className="mt-3 grid size-20 place-items-center rounded border border-dashed bg-background text-xs text-muted-foreground">QR não disponível</div><p className="mt-2 text-muted-foreground">Nenhuma chave secreta é gerada neste protótipo.</p></> : <><p className="font-medium">3. Confirmar código e recuperação</p><input disabled inputMode="numeric" aria-label="Código MFA indisponível" placeholder="Código indisponível" className="mt-3 w-full rounded-md border bg-background p-2 text-sm opacity-60"/><p className="mt-2 text-muted-foreground">Ativação indisponível sem serviço de identidade.</p></>}</div>
          <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={mfaStep === 1} onClick={() => setMfaStep(s => Math.max(1,s-1) as 1|2|3)}>Voltar</Button><Button variant="outline" disabled={mfaStep === 3} onClick={() => setMfaStep(s => Math.min(3,s+1) as 1|2|3)}>Próxima etapa</Button>{mfaStep === 3 && <Button disabled>Ativar MFA real</Button>}</div></section>
        <div className="space-y-5"><section className={card}><div className="flex items-center gap-2"><KeyRound className="size-5 text-primary"/><h2 className="font-display text-xl">Credenciais</h2></div><dl className="mt-4 space-y-1"><Info label="Profissional" value={view.me?.name ?? "Perfil demo"}/><Info label="E-mail" value="•••@exemplo.test (fictício)"/><Info label="Autenticação" value="Não conectada"/></dl><p className="mt-3 text-xs text-muted-foreground">Não digite senha nem código nesta demonstração.</p></section>
          <section className={card}><div className="flex items-center gap-2"><RotateCcw className="size-5 text-primary"/><h2 className="font-display text-xl">Recuperação de acesso</h2></div><p className="mt-2 text-sm text-muted-foreground">A prévia não verifica se uma conta existe e não envia e-mail ou SMS.</p><Button variant="outline" className="mt-4" onClick={() => setShowRecovery(v => !v)} aria-expanded={showRecovery}>{showRecovery ? "Ocultar orientação" : "Ver orientação de recuperação"}</Button>{showRecovery && <p className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm">No produto autenticado, a recuperação deverá seguir um canal seguro e não revelar a existência de uma conta. Esta é apenas uma orientação visual.</p>}</section></div>
      </div> : <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><section className={card}><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Laptop className="size-5 text-primary"/><h2 className="font-display text-xl">Sessões fictícias</h2></div><Button variant="outline" size="sm" disabled={!otherActive.length || preview !== "pronto"} onClick={() => setRevokeTarget("all")}>Revogar outras (demo)</Button></div><p className="mt-2 text-sm text-muted-foreground">Registros do perfil selecionado neste escritório. A troca de perfil simula outra pessoa.</p>
        {preview === "carregando" ? <div className="mt-5 space-y-2" aria-label="Carregando sessões"><div className="h-16 animate-pulse rounded-lg bg-muted"/><div className="h-16 animate-pulse rounded-lg bg-muted"/></div> : preview === "erro" ? <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive">Erro ilustrativo ao consultar sessões. Nenhuma informação de dispositivo é mostrada.</p> : preview === "vazio" || !sessions.length ? <p className="mt-5 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhuma sessão disponível nesta prévia.</p> : <ul className="mt-4 space-y-2">{sessions.map(session => <SessionRow key={session.id} session={session} onRevoke={() => setRevokeTarget(session.id)}/>)}</ul>}
        </section><section className={card}><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="font-display text-xl">Escopo da conta</h2></div><dl className="mt-4 space-y-1"><Info label="Escritório" value={office.displayName}/><Info label="Perfil" value={ROLE_LABEL[view.role]}/><Info label="Profissional" value={view.me?.name ?? "Não identificado"}/></dl><p className="mt-4 text-xs text-muted-foreground">O estado de revogação desta demonstração fica no store em memória. Não representa revogação de token ou acesso real.</p></section></div>}
    </>}
    <Dialog open={revokeTarget !== null} onOpenChange={open => !open && setRevokeTarget(null)}><DialogContent><DialogHeader><DialogTitle>Confirmar revogação demonstrativa</DialogTitle><DialogDescription>Marcar {targetLabel ?? "a sessão"} como revogada na amostra? A sessão atual permanece. Nenhum acesso real será interrompido.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancelar</Button><Button onClick={revoke}>Confirmar na demo</Button></DialogFooter></DialogContent></Dialog>
    <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/o/$org/inicio" params={{org}}><UserRound/> Voltar ao escritório</Link></Button><Button variant="ghost" asChild><Link to="/o/$org/suporte" params={{org}}>Ajuda e suporte</Link></Button></div>
  </div>;
}
function Tab({selected,onClick,children}:{selected:boolean;onClick:()=>void;children:React.ReactNode}){return <button type="button" aria-pressed={selected} onClick={onClick} className={`rounded-md px-3 py-2 text-sm ${selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{children}</button>}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className={card}><span className="text-copper">{icon}</span><p className="mt-2 font-medium">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>}
function Info({label,value}:{label:string;value:string}){return <div className="flex justify-between gap-4 border-b py-2 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>}
function SessionRow({session,onRevoke}:{session:SecuritySession;onRevoke:()=>void}){return <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"><div className="min-w-0"><p className="flex items-center gap-2 font-medium">{session.current ? <Laptop className="size-4 text-primary"/> : <Smartphone className="size-4 text-copper"/>}{session.label}</p><p className="mt-1 text-xs text-muted-foreground">{session.location} · {fmtDateTime(session.lastSeenAt)}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs ${session.status === "revogada" ? "bg-muted text-muted-foreground" : "bg-success-soft text-success"}`}>{session.current ? "Atual (demo)" : session.status === "revogada" ? "Revogada na demo" : "Ativa na demo"}</span>{!session.current && session.status === "ativa" && <Button size="sm" variant="outline" onClick={onRevoke}>Revogar</Button>}</div></li>}
