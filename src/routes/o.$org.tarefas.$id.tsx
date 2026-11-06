import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, History, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, PageHeader, PriorityBadge, TASK_STATUS_LABEL } from "@/components/office/badges";
import { findOffice, fmtDateTime, timelineEvent, useDemo, useOfficeView } from "@/features/demo/store";
import { canTransitionTask, TASK_TRANSITIONS } from "@/features/demo/actions";
import type { Task, TaskPriority, TaskStatus } from "@/features/demo/types";

export const Route = createFileRoute("/o/$org/tarefas/$id")({
  head: () => ({ meta: [{ title: "Detalhe da tarefa · JURIDO Escritórios" }, { name: "robots", content: "noindex" }] }),
  component: TaskDetail,
});
const priorities:TaskPriority[]=["critica","alta","normal","baixa"];
function TaskDetail(){
  const {org,id}=Route.useParams();
  const office=findOffice(org)!;
  const view=useOfficeView(office);
  const {update}=useDemo();
  const task=view.tasks.find(item=>item.id===id);
  const [comment,setComment]=useState("");
  const [draft,setDraft]=useState({title:task?.title??"",assigneeId:task?.assigneeId??"",priority:task?.priority??"normal" as TaskPriority,status:task?.status??"a_fazer" as TaskStatus,dueAt:task?.dueAt?new Date(task.dueAt).toISOString().slice(0,16):"",note:""});
  useEffect(()=>{setDraft({title:task?.title??"",assigneeId:task?.assigneeId??"",priority:task?.priority??"normal",status:task?.status??"a_fazer",dueAt:task?.dueAt?new Date(task.dueAt).toISOString().slice(0,16):"",note:""})},[task?.id]);
  if(!task) return <><PageHeader title="Tarefa não encontrada" subtitle="A tarefa não está disponível para este perfil ou escritório."/><Link className="text-sm text-primary hover:underline" to="/o/$org/tarefas" params={{org}}>Voltar para tarefas</Link></>;
  const matter=view.matterById(task.matterId);
  const events=view.timeline.filter(event=>event.kind==="tarefa"&&event.matterId===task.matterId&&(event.text.includes(`#${task.id}`)||event.text.includes(task.title))).sort((a,b)=>b.at.localeCompare(a.at));
  const save=(event:FormEvent)=>{
    event.preventDefault();
    if(!draft.title.trim()||!draft.assigneeId||!draft.dueAt||!draft.note.trim()) return;
    if(draft.status!==task.status&&!canTransitionTask(task.status,draft.status)){toast.error("Use as etapas válidas da tarefa; conclusão exige revisão.");return}
    const next:Task={...task,title:draft.title.trim(),assigneeId:draft.assigneeId,priority:draft.priority,status:draft.status,dueAt:new Date(draft.dueAt).toISOString()};
    const changes:string[]=[];
    if(next.title!==task.title)changes.push("título");
    if(next.assigneeId!==task.assigneeId)changes.push("responsável");
    if(next.priority!==task.priority)changes.push("prioridade");
    if(next.status!==task.status)changes.push("etapa");
    if(next.dueAt!==task.dueAt)changes.push("data-alvo");
    if(!changes.length){toast.info("Nenhuma alteração na tarefa");return}
    update(data=>({...data,tasks:data.tasks.map(item=>item.id===task.id&&item.officeId===office.id?next:item),timeline:task.matterId?[timelineEvent({officeId:office.id,matterId:task.matterId,actor:view.me?.name??"Equipe",kind:"tarefa",text:`Tarefa #${task.id}: alterou ${changes.join(", ")}. ${draft.note.trim()}`}),...data.timeline]:data.timeline}));
    setDraft({...draft,note:""});toast.success("Tarefa atualizada na demonstração");
  };
  const addComment=(event:FormEvent)=>{
    event.preventDefault();
    const text=comment.trim();
    if(!text||!matter)return;
    update(data=>({...data,timeline:[timelineEvent({officeId:office.id,matterId:matter.id,actor:view.me?.name??"Equipe",kind:"tarefa",text:`Tarefa #${task.id} · ${task.title}: ${text}`}),...data.timeline]}));
    setComment("");toast.success("Comentário adicionado à atividade da tarefa");
  };
  const availableStatuses=[task.status,...TASK_TRANSITIONS[task.status]];
  return <div className="space-y-5"><Link className="inline-flex items-center gap-2 text-sm text-primary hover:underline" to="/o/$org/tarefas" params={{org}}><ArrowLeft className="size-4"/>Voltar para tarefas</Link><PageHeader title={task.title} subtitle="Detalhe e colaboração demonstrativos da tarefa"/>
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><div className="space-y-5"><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Editar tarefa</h2><form onSubmit={save} className="mt-5 grid gap-4"><div><Label htmlFor="detail-title">Título</Label><Input id="detail-title" className="mt-2" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} required/></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="detail-assignee">Responsável</Label><select id="detail-assignee" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={draft.assigneeId} onChange={e=>setDraft({...draft,assigneeId:e.target.value})}>{view.members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select></div><div><Label htmlFor="detail-status">Etapa</Label><select id="detail-status" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as TaskStatus})}>{availableStatuses.map(status=><option key={status} value={status}>{TASK_STATUS_LABEL[status]}</option>)}</select></div><div><Label htmlFor="detail-priority">Prioridade</Label><select id="detail-priority" className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm" value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as TaskPriority})}>{priorities.map(priority=><option key={priority} value={priority}>{priority}</option>)}</select></div><div><Label htmlFor="detail-due">Data-alvo interna</Label><Input id="detail-due" className="mt-2" type="datetime-local" value={draft.dueAt} onChange={e=>setDraft({...draft,dueAt:e.target.value})} required/></div></div><div><Label htmlFor="detail-note">Justificativa da alteração</Label><textarea id="detail-note" className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={draft.note} onChange={e=>setDraft({...draft,note:e.target.value})} placeholder="Registre o motivo da mudança" required/></div><div><Button type="submit">Salvar alterações demo</Button></div></form></section>{matter && <section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Colaboração</h2><p className="mt-1 text-sm text-muted-foreground">Anotações locais da equipe vinculadas ao caso. Nada é enviado ao cliente.</p><form onSubmit={addComment} className="mt-4 flex flex-wrap gap-2"><textarea aria-label="Comentário da tarefa" className="min-h-20 min-w-0 flex-1 rounded-md border bg-background p-3 text-sm" value={comment} onChange={event=>setComment(event.target.value)} placeholder="Deixe uma atualização para a equipe"/><Button type="submit" disabled={!comment.trim()}>Adicionar anotação</Button></form></section>}<section className="rounded-xl border bg-card p-5 shadow-soft"><div className="flex items-center gap-2"><History className="size-5 text-primary"/><h2 className="font-display text-xl">Atividade</h2></div>{events.length?<ul className="mt-4 space-y-3">{events.map(event=><li key={event.id} className="border-l-2 border-primary/30 pl-4 text-sm"><p className="break-words">{event.text}</p><p className="mt-1 text-xs text-muted-foreground">{event.actor} · {fmtDateTime(event.at)}</p></li>)}</ul>:<div className="mt-4"><EmptyState title="Sem atividade registrada" hint="Alterações feitas nesta demonstração aparecerão aqui quando ligadas a um caso."/></div>}</section></div><aside className="space-y-5"><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Resumo</h2><div className="mt-4 space-y-3 text-sm"><p className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground"/>{view.memberName(task.assigneeId)}</p><p className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground"/>{fmtDateTime(task.dueAt)}</p><p><PriorityBadge value={task.priority}/></p><p>{TASK_STATUS_LABEL[task.status]}</p></div></section><section className="rounded-xl border bg-card p-5 shadow-soft"><h2 className="font-display text-xl">Caso vinculado</h2>{matter?<div className="mt-3 text-sm"><Link className="font-medium text-primary hover:underline break-words" to="/o/$org/casos/$id" params={{org,id:matter.id}}>{matter.code} · {matter.title}</Link><p className="mt-2 text-muted-foreground">{view.areaName(matter.practiceAreaId)}</p></div>:<p className="mt-3 text-sm text-muted-foreground">Tarefa interna sem caso vinculado.</p>}</section></aside></div>
  </div>;
}
