import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { QuickActionFab } from "@/components/office/QuickActionFab";
import { useState, useEffect, type ReactNode } from "react";
import {
  Bell, BriefcaseBusiness, CalendarDays, ChevronsUpDown, CircleHelp, ClipboardList, CheckCircle2, FileText, Gavel, Home, ScrollText,
  Inbox, LayoutTemplate, Lock, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Search, Settings, ShieldCheck, Sun, Timer,
  UserRound, Users, Wallet, Building2, CreditCard, ListChecks, Contact,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { OFFICES } from "@/features/demo/fixtures";
import { canCreateMatter, canProposeDeadline, canSeeFinance, ROLE_LABEL } from "@/features/demo/permissions";
import { useDemo, useOfficeView } from "@/features/demo/store";
import type { Office, RoleId } from "@/features/demo/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DemoTag } from "./badges";
import { GlobalSearch } from "./GlobalSearch";
import { MeuDiaDialog } from "./MeuDiaDialog";
import { NewMatterDialog } from "./NewMatterDialog";

type NavItem = { label: string; icon: typeof Home; to?: string; step?: number; tag?: string; hideFor?: RoleId[] };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Dia a dia", items: [
    { label: "Início", icon: Home, to: "inicio" },
    { label: "Primeiros passos", icon: CheckCircle2, to: "primeiros-passos" },
    { label: "Caixa de trabalho", icon: Inbox, to: "caixa-de-trabalho" },
    { label: "Prazos", icon: Timer, to: "prazos", hideFor: ["financeiro"] },
    { label: "Tarefas", icon: ListChecks, to: "tarefas" },
    { label: "Agenda", icon: CalendarDays, to: "agenda" },
    { label: "Notificações", icon: Bell, to: "notificacoes" },
    { label: "Atividade", icon: RotateCcw, to: "atividade" },
  ]},
  { group: "Trabalho jurídico", items: [
    { label: "Atendimentos", icon: Contact, to: "atendimentos", hideFor: ["financeiro"] },
    { label: "Conflitos de interesse", icon: ShieldCheck, to: "conflitos", hideFor: ["financeiro"] },
    { label: "Clientes", icon: UserRound, to: "clientes" },
    { label: "Convites do portal", icon: Contact, to: "convites", hideFor: ["financeiro"] },
    { label: "Casos", icon: BriefcaseBusiness, to: "casos" },
    { label: "Processos", icon: Gavel, to: "processos", hideFor: ["financeiro"] },
    { label: "Documentos", icon: FileText, to: "documentos", hideFor: ["financeiro"] },
    { label: "Procurações", icon: ScrollText, to: "procuracoes", hideFor: ["financeiro"] },
    { label: "Modelos", icon: LayoutTemplate, to: "modelos", hideFor: ["financeiro"] },
    { label: "Comunicações", icon: MessageSquare, to: "comunicacao", hideFor: ["financeiro"] },
    { label: "Financeiro", icon: Wallet, to: "financeiro" },
    { label: "Relatórios", icon: ClipboardList, to: "relatorios", tag: "Conceito · Fase 2" },
  ]},
  { group: "Escritório", items: [
    { label: "Equipe", icon: Users, to: "equipe" },
    { label: "Estrutura", icon: Building2, to: "estrutura" },
    { label: "Substituições", icon: ChevronsUpDown, to: "substituicoes", hideFor: ["coordenador", "secretario", "estagiario", "substituto", "financeiro", "advogado"] },
    { label: "Permissões", icon: ShieldCheck, to: "permissoes", hideFor: ["coordenador", "secretario", "estagiario", "substituto", "financeiro", "advogado"] },
    { label: "Visibilidade e sigilo", icon: Lock, to: "sigilo", hideFor: ["secretario", "estagiario", "substituto", "financeiro", "advogado"] },
    { label: "Perfil do escritório", icon: Building2, to: "perfil-escritorio" },
    { label: "Integrações", icon: RotateCcw, to: "integracoes" },
    { label: "Assinatura", icon: CreditCard, to: "assinatura" },
    { label: "Suporte", icon: CircleHelp, to: "suporte" },
    { label: "Configurações", icon: Settings, to: "configuracoes" },
    { label: "Minhas preferências", icon: Sun, to: "preferencias" },
    { label: "Segurança da conta", icon: ShieldCheck, to: "seguranca" },
  ]},
  { group: "Futuro", items: [
    { label: "Conceitos Fase 2", icon: LayoutTemplate, to: "conceitos" },
  ]},
];

function SidebarBody({ office, onNavigate, compact = false }: { office: Office; onNavigate?: () => void; compact?: boolean }) {
  const { role } = useDemo();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Escritório: ${office.displayName}`} className={cn("m-3 flex items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent", compact && "justify-center")}>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-md font-display text-sm font-semibold text-primary-foreground"
            style={{ background: office.brandColor }}
            aria-hidden
          >
            {office.monogram}
          </span>
          <span className={cn("min-w-0 flex-1", compact && "sr-only")}>
            <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">{office.displayName}</span>
            <span className="block text-[11px] text-sidebar-foreground/70">Escritório · demonstração</span>
          </span>
          {!compact && <ChevronsUpDown className="size-4 opacity-60" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Trocar escritório (DEMO)</DropdownMenuLabel>
          {OFFICES.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onSelect={() => {
                onNavigate?.();
                navigate({ to: "/o/$org/inicio", params: { org: o.slug } });
              }}
            >
              <span className="grid size-6 place-items-center rounded text-[10px] font-bold text-primary-foreground" style={{ background: o.brandColor }}>
                {o.monogram}
              </span>
              {o.displayName}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => { onNavigate?.(); navigate({ to: "/selecionar-escritorio" }); }}>
            Ver seleção de escritórios
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegação principal">
        {NAV.map((g) => {
          const items = g.items.filter((i) => !i.hideFor?.includes(role) && !(i.label === "Financeiro" && !canSeeFinance(role)));
          return (
            <div key={g.group} className="mt-4">
              {!compact && <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{g.group}</p>}
              <ul className="space-y-0.5">
                {items.map((i) => {
                  const Icon = i.icon;
                  if (!i.to) {
                    return (
                      <li key={i.label}>
                        <span
                          aria-disabled
                          title={`Tela prevista para o Passo ${i.step} da construção`}
                          className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/40"
                        >
                          <Icon className="size-4" />
                          <span className="flex-1">{i.label}</span>
                          <span className="text-[10px]">Passo {i.step}</span>
                        </span>
                      </li>
                    );
                  }
                  const href = `/o/${office.slug}/${i.to}`;
                  const active = pathname.startsWith(href);
                  return (
                    <li key={i.label}>
                      <Link
                        to={href}
                        onClick={onNavigate}
                        aria-label={compact ? `${i.label}${i.tag ? ` · ${i.tag}` : ""}` : undefined}
                        title={compact ? `${i.label}${i.tag ? ` · ${i.tag}` : ""}` : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          compact && "justify-center px-0",
                          active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className={cn("size-4", active && "text-sidebar-primary")} />
                        <span className={compact ? "sr-only" : "min-w-0 flex-1"}>{i.label}</span>
                        {!compact && i.tag && <span className="whitespace-nowrap rounded border border-sidebar-foreground/20 px-1 py-0.5 text-[9px] font-medium leading-none text-sidebar-foreground/70">{i.tag}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      {!compact && <p className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-snug text-sidebar-foreground/60">
        Protótipo visual. Sem backend, sem dados reais, sem envio de mensagens.
      </p>}
    </div>
  );
}

export function AppShell({ office, children }: { office: Office; children: ReactNode }) {
  const { role, setRole, setMeuDiaOpen, setNewMatterOpen, reset } = useDemo();
  const view = useOfficeView(office);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);
  const navigate = useNavigate();
  const unread = view.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem("jurido-office-sidebar-collapsed") === "true");
    } catch {
      // Keep the expanded menu when browser storage is unavailable.
    } finally {
      setSidebarPreferenceLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return;
    try {
      window.localStorage.setItem("jurido-office-sidebar-collapsed", String(sidebarCollapsed));
    } catch {
      // The menu remains usable for this session without persistent storage.
    }
  }, [sidebarCollapsed, sidebarPreferenceLoaded]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <a href="#office-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">
        Pular para o conteúdo principal
      </a>
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block", sidebarCollapsed ? "w-[74px]" : "w-64")}>
        <SidebarBody office={office} compact={sidebarCollapsed} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody office={office} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 min-w-0 items-center gap-2 border-b bg-card/90 px-3 backdrop-blur sm:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:inline-flex"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            aria-keyshortcuts="Control+K Meta+K"
            title="Buscar no escritório (Ctrl+K / ⌘K)"
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground hover:border-primary/40 sm:max-w-sm"
          >
            <Search className="size-4" />
            <span className="min-w-0 truncate">Buscar caso, cliente ou CNJ…</span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <DemoTag className="hidden md:inline-block" />
            <Button variant="ghost" size="sm" onClick={() => setMeuDiaOpen(true)} aria-label="Abrir Meu Dia">
              <Sun /> <span className="hidden sm:inline">Meu Dia</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm"><Plus /> <span className="hidden sm:inline">Novo</span></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled={!canCreateMatter(role)} onSelect={() => setNewMatterOpen(true)}>
                  <BriefcaseBusiness /> Caso
                  {!canCreateMatter(role) && <span className="ml-auto text-[10px]">sem permissão</span>}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={role === "financeiro"} onSelect={() => navigate({ to: "/o/$org/atendimentos", params: { org: office.slug }, search: { novo: true } })}>
                  <Contact /> Atendimento
                  {role === "financeiro" && <span className="ml-auto text-[10px]">sem permissão</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/o/$org/clientes/novo", params: { org: office.slug } })}>
                  <UserRound /> Cliente
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/o/$org/tarefas", params: { org: office.slug }, search: { novo: true } })}>
                  <ListChecks /> Tarefa
                </DropdownMenuItem>
                {canProposeDeadline(role) && (
                  <DropdownMenuItem onSelect={() => navigate({ to: "/o/$org/prazos", params: { org: office.slug }, search: { novo: true } })}>
                    <Timer /> Prazo
                  </DropdownMenuItem>
                )}
                {role !== "financeiro" && <DropdownMenuItem onSelect={() => navigate({ to: "/o/$org/documentos", params: { org: office.slug }, search: { novo: true } })}>
                  <FileText /> Documento
                </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" asChild aria-label={`Notificações, ${unread} não lidas`}>
              <Link to="/o/$org/notificacoes" params={{ org: office.slug }} className="relative">
                <Bell />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted">
                <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {view.me?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <span className="hidden text-left leading-tight xl:block">
                  <span className="block text-sm font-medium">{view.me?.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Perfil DEMO (não é segurança real)</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as RoleId);
                    toast.success(`Agora vendo como ${ROLE_LABEL[v as RoleId]}`);
                  }}
                >
                  {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                    <DropdownMenuRadioItem key={r} value={r}>{ROLE_LABEL[r]}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { reset(); toast.success("Demonstração restaurada"); }}>
                  <RotateCcw /> Restaurar demonstração
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/login"
                    onClick={() => {
                      try {
                        window.sessionStorage.removeItem("jurido-demo-active-office");
                      } catch {
                        /* Storage can be unavailable in private browsing. */
                      }
                    }}
                  >
                    Sair da demonstração
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="office-main" key={`${office.id}-${role}`} tabIndex={-1} className="mx-auto min-w-0 w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <GlobalSearch office={office} open={searchOpen} onOpenChange={setSearchOpen} />
      <QuickActionFab office={office} />
      <MeuDiaDialog office={office} />
      <NewMatterDialog office={office} />
    </div>
  );
}
