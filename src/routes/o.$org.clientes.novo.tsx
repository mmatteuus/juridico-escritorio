import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Building2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/office/badges";
import { findOffice, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Client } from "@/features/demo/types";

export const Route=createFileRoute("/o/$org/clientes/novo")({
  head:()=>({meta:[{title:"Novo cliente · JURIDO Escritórios"},{name:"robots",content:"noindex"}]}),
  component:NewClient,
});
const states=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
function validDocument(value:string,kind:"PF"|"PJ"){
  const digits=value.replace(/\D/g,"");
  if(digits.length!==(kind==="PF"?11:14)||/^(\d)\1+$/.test(digits))return false;
  if(kind==="PF"){
    const check=(length:number)=>{let sum=0;for(let i=0;i<length;i++)sum+=Number(digits[i])*(length+1-i);const digit=(sum*10)%11;return Number(digits[length])===(digit===10?0:digit)};
    return check(9)&&check(10);
  }
  const check=(length:number,weights:number[])=>{const sum=weights.reduce((total,weight,index)=>total+Number(digits[index])*weight,0);const remainder=sum%11;return Number(digits[length])===(remainder<2?0:11-remainder)};
  return check(12,[5,4,3,2,9,8,7,6,5,4,3,2])&&check(13,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
}
const empty={kind:"PF" as "PF"|"PJ",name:"",document:"",contact:"",city:"",state:"",responsibleId:"",notes:""};
function NewClient(){
  const {org}=Route.useParams();const office=findOffice(org)!;const view=useOfficeView(office);const {update}=useDemo();const navigate=useNavigate();
  const [form,setForm]=useState(empty);const [error,setError]=useState("");
  const digits=form.document.replace(/\D/g,"");
  const submit=(event:FormEvent)=>{
    event.preventDefault();setError("");
    if(!form.name.trim()||!form.contact.trim()||!form.city.trim()||!form.state||!form.responsibleId){setError("Preencha nome, contato, cidade, UF e responsável.");return}
    if(!validDocument(form.document,form.kind)){setError(`${form.kind} inválido. Confira os dígitos verificadores.`);return}
    if(view.clients.some(client=>client.document?.replace(/\D/g,"")===digits)){setError("Já existe um cadastro com este documento neste escritório.");return}
    const client:Client={id:uid("c"),officeId:office.id,kind:form.kind,name:form.name.trim(),document:digits,contact:form.contact.trim(),city:form.city.trim(),state:form.state,responsibleId:form.responsibleId,notes:form.notes.trim(),conflictStatus:"pendente"};
    update(data=>({...data,clients:[client,...data.clients]}));
    toast.success("Cliente cadastrado na demonstração; conflito de interesses pendente");
    navigate({to:"/o/$org/clientes/$id",params:{org,id:client.id}});
  };
  return <div className="max-w-4xl"><Link to="/o/$org/clientes" params={{org}} className="mb-5 inline-flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="size-4"/>Voltar para clientes</Link><PageHeader title="Novo cliente" subtitle="Cadastro demonstrativo de pessoa física ou jurídica"/>
    <div className="mb-5 rounded-lg border border-copper/30 bg-copper-soft p-4 text-sm text-copper">Use apenas dados fictícios nesta apresentação. A validação é sintática e não confirma identidade ou situação cadastral.</div>
    <form onSubmit={submit} className="space-y-6"><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Tipo de cliente</h2><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant={form.kind==="PF"?"default":"outline"} onClick={()=>{setForm({...form,kind:"PF",document:""});setError("")}}><UserRound/>Pessoa física</Button><Button type="button" variant={form.kind==="PJ"?"default":"outline"} onClick={()=>{setForm({...form,kind:"PJ",document:""});setError("")}}><Building2/>Pessoa jurídica</Button></div></section>
      <section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Dados cadastrais</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="client-name">{form.kind==="PF"?"Nome completo":"Razão social"}</Label><Input id="client-name" className="mt-2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div><div><Label htmlFor="client-document">{form.kind==="PF"?"CPF":"CNPJ"}</Label><Input id="client-document" className="mt-2" inputMode="numeric" maxLength={form.kind==="PF"?14:18} placeholder={form.kind==="PF"?"000.000.000-00":"00.000.000/0000-00"} value={form.document} onChange={e=>setForm({...form,document:e.target.value})} required/><p className="mt-1 text-xs text-muted-foreground">Documento fictício para validar o formulário.</p></div><div><Label htmlFor="client-contact">E-mail ou telefone</Label><Input id="client-contact" className="mt-2" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} required/></div><div><Label htmlFor="client-city">Cidade</Label><Input id="client-city" className="mt-2" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required/></div><div><Label htmlFor="client-state">UF</Label><select id="client-state" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} required><option value="">Selecione a UF</option>{states.map(state=><option key={state} value={state}>{state}</option>)}</select></div></div></section>
      <section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Acompanhamento</h2><div className="mt-5 grid gap-4"><div><Label htmlFor="client-responsible">Profissional responsável</Label><select id="client-responsible" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.responsibleId} onChange={e=>setForm({...form,responsibleId:e.target.value})} required><option value="">Selecione</option>{view.members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></div><div><Label htmlFor="client-notes">Observações de triagem (opcional)</Label><textarea id="client-notes" className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Contexto para análise interna"/></div><p className="text-xs text-muted-foreground">O cadastro entra com verificação de conflito de interesses pendente.</p></div></section>{error&&<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}<div className="flex flex-wrap gap-2"><Button type="submit">Cadastrar cliente demo</Button><Button variant="outline" asChild><Link to="/o/$org/clientes" params={{org}}>Cancelar</Link></Button></div></form>
  </div>;
}
