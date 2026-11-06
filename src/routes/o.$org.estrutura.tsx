import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Building2, BriefcaseBusiness, MapPin, Pencil, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/office/badges";
import { findOffice, useOfficeView } from "@/features/demo/store";

export const Route = createFileRoute("/o/$org/estrutura")({
  head: () => ({ meta: [{ title: "Estrutura · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: Structure,
});
type Area = { id: string; name: string; preview?: boolean };
type Unit = { id: string; name: string; preview?: boolean };
type Tab = "unidades" | "areas" | "equipes";
const card = "rounded-xl border bg-card p-5 shadow-soft";
function Structure() {
  const { org } = Route.useParams();
  const office = findOffice(org)!;
  const view = useOfficeView(office);
  const [tab, setTab] = useState<Tab>("unidades");
  const [units, setUnits] = useState<Unit[]>(() => office.units.map((name, index) => ({id:`unit-${index}`,name})));
  const [areas, setAreas] = useState<Area[]>(() => office.practiceAreas.map(area => ({...area})));
  const [editing, setEditing] = useState<{kind:"unidade"|"area";id:string}|null>(null);
  const [name, setName] = useState("");
  const canManage = view.role === "gestor" || view.role === "socio";
  const start = (kind:"unidade"|"area", id="") => { setEditing({kind,id}); setName(id ? (kind==="unidade" ? units.find(u=>u.id===id)?.name : areas.find(a=>a.id===id)?.name) ?? "" : ""); };
  const save = (e:FormEvent<HTMLFormElement>) => { e.preventDefault(); if(!editing || !name.trim())return; const text=name.trim(); if(editing.kind==="unidade") { setUnits(items=> editing.id ? items.map(x=>x.id===editing.id?{...x,name:text,preview:true}:x) : [...items,{id:`demo-unit-${Date.now()}`,name:text,preview:true}]); } else { setAreas(items=> editing.id ? items.map(x=>x.id===editing.id?{...x,name:text,preview:true}:x) : [...items,{id:`demo-area-${Date.now()}`,name:text,preview:true}]); } setEditing(null); setName(""); };
  return <div className="space-y-5"><PageHeader title="Estrutura do escritório" subtitle="Unidades, áreas jurídicas e equipes em uma visão institucional" />
    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={MapPin} label="Unidades" value={units.length}/><Metric icon={BriefcaseBusiness} label="Áreas jurídicas" value={areas.length}/><Metric icon={Users} label="Profissionais" value={view.members.length}/></div>
    <div className="flex flex-wrap gap-2 border-b" role="tablist" aria-label="Estrutura">{([{key:"unidades",label:"Unidades"},{key:"areas",label:"Áreas jurídicas"},{key:"equipes",label:"Equipes"}] as const).map(item=><button key={item.key} type="button" role="tab" aria-selected={tab===item.key} onClick={()=>{setTab(item.key);setEditing(null)}} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab===item.key?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>
    {tab==="unidades"&&<section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-xl">Unidades</h2><p className="text-sm text-muted-foreground">Locais de atendimento exibidos no perfil do escritório.</p></div>{canManage&&<Button onClick={()=>start("unidade")}><Plus/> Nova unidade</Button>}</div><div className="grid gap-3 md:grid-cols-2">{units.map(unit=><article key={unit.id} className="flex items-start gap-3 rounded-lg border p-4"><Building2 className="size-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="font-medium">{unit.name}</p><p className="mt-1 text-xs text-muted-foreground">{unit.preview?"Prévia local · não salva":"Unidade do perfil demonstrativo"}</p></div>{canManage&&<Button size="icon" variant="ghost" aria-label={`Editar ${unit.name}`} onClick={()=>start("unidade",unit.id)}><Pencil className="size-4"/></Button>}</article>)}</div></section>}
    {tab==="areas"&&<section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-xl">Áreas jurídicas</h2><p className="text-sm text-muted-foreground">Especialidades e profissionais associados na amostra.</p></div>{canManage&&<Button onClick={()=>start("area")}><Plus/> Nova área</Button>}</div><div className="grid gap-3 md:grid-cols-2">{areas.map(area=><article key={area.id} className="rounded-lg border p-4"><div className="flex items-start gap-3"><BriefcaseBusiness className="size-5 shrink-0 text-primary"/><div className="flex-1"><p className="font-medium">{area.name}</p><p className="mt-1 text-xs text-muted-foreground">{area.preview?"Prévia local · não salva":"Área do perfil demonstrativo"}</p></div>{canManage&&<Button size="icon" variant="ghost" aria-label={`Editar ${area.name}`} onClick={()=>start("area",area.id)}><Pencil className="size-4"/></Button>}</div><div className="mt-4 flex gap-4 border-t pt-3 text-sm"><span>{view.members.filter(m=>m.practiceAreaIds.includes(area.id)).length} profissional(is)</span><span>{view.matters.filter(m=>m.practiceAreaId===area.id).length} caso(s) visíveis</span></div></article>)}</div></section>}
    {tab==="equipes"&&<section className={card}><h2 className="font-display text-xl">Equipes por área</h2><p className="mt-1 text-sm text-muted-foreground">Agrupamento demonstrativo com base nas áreas de cada profissional.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{areas.map(area=><article key={area.id} className="rounded-lg border p-4"><p className="font-semibold">{area.name}</p><div className="mt-3 flex flex-wrap gap-2">{view.members.filter(m=>m.practiceAreaIds.includes(area.id)).map(m=><Link key={m.id} to="/o/$org/equipe/$id" params={{org,id:m.id}} className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary/10">{m.name}</Link>)}{!view.members.some(m=>m.practiceAreaIds.includes(area.id))&&<p className="text-sm text-muted-foreground">Nenhum profissional associado nesta sessão.</p>}</div></article>)}</div><Link to="/o/$org/equipe" params={{org}} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Ver toda a equipe →</Link></section>}
    {editing&&<form onSubmit={save} className="rounded-xl border border-primary/30 bg-card p-5 shadow-soft"><h2 className="font-display text-xl">{editing.id?"Editar":"Adicionar"} {editing.kind==="unidade"?"unidade":"área jurídica"}</h2><p className="mt-1 text-sm text-muted-foreground">Esta alteração é uma prévia local da sessão e não modifica o cadastro do escritório.</p><div className="mt-4 flex flex-wrap items-end gap-2"><label className="grid min-w-56 flex-1 gap-1 text-sm">Nome<Input value={name} onChange={e=>setName(e.target.value)} maxLength={80} required autoFocus/></label><Button type="submit">Aplicar prévia</Button><Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button></div></form>}
  </div>;
}
function Metric({icon:Icon,label,value}:{icon:typeof MapPin;label:string;value:number}){return <div className={card}><Icon className="size-4 text-copper"/><p className="mt-3 font-display text-3xl">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>}
