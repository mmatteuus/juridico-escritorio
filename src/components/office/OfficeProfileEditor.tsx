import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock3, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/office/badges";
import { ROLE_LABEL } from "@/features/demo/permissions";
import { fmtDateTime, uid, useDemo, useOfficeView } from "@/features/demo/store";
import type { Office, OfficeIdentityFields, OfficeProfileRevision } from "@/features/demo/types";

const card = "rounded-xl border bg-card p-5 shadow-soft";
const heading = "font-display text-xl font-medium";
const managers = ["gestor", "socio"] as const;
const statusLabel = {
  rascunho: "Rascunho",
  em_revisao: "Aguardando aprovação",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
} as const;

function asFields(profile: OfficeIdentityFields): OfficeIdentityFields {
  return { ...profile, phones: [...profile.phones], units: [...profile.units], signatoryMemberIds: [...profile.signatoryMemberIds] };
}

function lines(value: string) {
  return value.split(/[\n;]/).map((item) => item.trim()).filter(Boolean);
}

function revisionRow(data: OfficeProfileRevision[], revision: OfficeProfileRevision) {
  const index = data.findIndex((item) => item.id === revision.id && item.officeId === revision.officeId);
  return index < 0 ? [revision, ...data] : data.map((item, current) => current === index ? revision : item);
}

export function OfficeProfileEditor({ office }: { office: Office }) {
  const view = useOfficeView(office);
  const { update } = useDemo();
  const profile = view.officeProfile;
  const proposal = view.officeProfileRevisions.find((item) => item.status === "rascunho" || item.status === "em_revisao");
  const nextVersion = Math.max(profile?.version ?? 0, ...view.officeProfileRevisions.map((item) => item.version)) + 1;
  const [editing, setEditing] = useState(proposal?.status === "rascunho");
  const [draft, setDraft] = useState<OfficeIdentityFields>(() => profile ? asFields(proposal?.snapshot ?? profile) : {
    legalName: "", displayName: "", address: "", phones: [], units: [], oabNumber: "", signatoryMemberIds: [],
  });
  const [formError, setFormError] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const canManage = view.role === "gestor" || view.role === "socio";
  const eligibleSignatories = view.members.filter((member) => member.oabNumber && member.oabUf);
  const preview = editing ? draft : proposal?.snapshot ?? profile;
  const signatoryNames = useMemo(() => (preview?.signatoryMemberIds ?? [])
    .map((id) => view.members.find((member) => member.id === id)?.name)
    .filter((name): name is string => Boolean(name)), [preview?.signatoryMemberIds, view.members]);

  useEffect(() => {
    if (proposal?.status === "rascunho") {
      setDraft(asFields(proposal.snapshot));
      setEditing(true);
      return;
    }
    setEditing(false);
    if (proposal?.status === "em_revisao") setDraft(asFields(proposal.snapshot));
    else if (profile) setDraft(asFields(profile));
  }, [profile?.version, proposal?.id, proposal?.status]);

  if (!profile) return <EmptyState title="Perfil institucional indisponível" hint="Não há identidade demonstrativa para este escritório." />;
  if (!canManage) return <EmptyState title="Perfil institucional restrito" hint="Apenas gestão e sociedade podem propor ou aprovar mudanças nesta demonstração." />;

  const updateField = <K extends keyof OfficeIdentityFields>(key: K, value: OfficeIdentityFields[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function validationMessage(values: OfficeIdentityFields) {
    if (!values.legalName.trim() || !values.displayName.trim() || !values.address.trim() || !values.oabNumber.trim()) {
      return "Preencha razão social, nome de exibição, endereço e registro OAB.";
    }
    if (!values.phones.length || values.phones.some((phone) => phone.replace(/\D/g, "").length < 8)) {
      return "Informe ao menos um contato válido com 8 ou mais dígitos.";
    }
    if (!values.units.length) return "Informe ao menos uma unidade do escritório.";
    if (!values.signatoryMemberIds.length || values.signatoryMemberIds.some((id) => !eligibleSignatories.some((member) => member.id === id))) {
      return "Selecione ao menos um signatário da equipe com OAB cadastrada.";
    }
    return "";
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validationMessage(draft);
    if (issue) { setFormError(issue); return; }
    if (!view.me) { setFormError("Não foi possível identificar o perfil demonstrativo atual."); return; }
    const now = new Date().toISOString();
    const revision: OfficeProfileRevision = {
      id: proposal?.id ?? uid("office-profile"),
      officeId: office.id,
      version: proposal?.version ?? nextVersion,
      snapshot: asFields(draft),
      status: "rascunho",
      proposedByMemberId: proposal?.proposedByMemberId ?? view.me.id,
      proposedAt: proposal?.proposedAt ?? now,
      ...(proposal?.submittedAt ? { submittedAt: proposal.submittedAt } : {}),
    };
    update((data) => ({ ...data, officeProfileRevisions: revisionRow(data.officeProfileRevisions, revision) }));
    setFormError("");
    toast.success("Rascunho institucional salvo nesta demonstração");
  }

  function sendForReview() {
    const issue = validationMessage(draft);
    if (issue) { setFormError(issue); return; }
    if (!view.me) { setFormError("Não foi possível identificar o perfil demonstrativo atual."); return; }
    const now = new Date().toISOString();
    const revision: OfficeProfileRevision = {
      id: proposal?.id ?? uid("office-profile"),
      officeId: office.id,
      version: proposal?.version ?? nextVersion,
      snapshot: asFields(draft),
      status: "em_revisao",
      proposedByMemberId: proposal?.proposedByMemberId ?? view.me.id,
      proposedAt: proposal?.proposedAt ?? now,
      submittedAt: now,
    };
    update((data) => ({ ...data, officeProfileRevisions: revisionRow(data.officeProfileRevisions, revision) }));
    setFormError("");
    toast.success("Alteração enviada para aprovação humana");
  }

  function decide(approved: boolean) {
    if (!proposal || proposal.status !== "em_revisao" || !view.me) return;
    const reason = reviewReason.trim();
    if (!reason) { setFormError("Registre o motivo da aprovação ou rejeição."); return; }
    if (proposal.proposedByMemberId === view.me.id) { setFormError("A aprovação deve ser feita por outra pessoa da gestão ou sociedade."); return; }
    const now = new Date().toISOString();
    update((data) => {
      const current = data.officeProfiles.find((item) => item.officeId === office.id);
      if (!current || current.version >= proposal.version) return data;
      const revision: OfficeProfileRevision = {
        ...proposal,
        status: approved ? "aprovada" : "rejeitada",
        reviewedByMemberId: view.me!.id,
        reviewedAt: now,
        reviewReason: reason,
      };
      return {
        ...data,
        officeProfiles: approved ? data.officeProfiles.map((item) => item.officeId === office.id ? {
          ...current,
          ...asFields(proposal.snapshot),
          officeId: office.id,
          version: proposal.version,
          approvedAt: now,
        } : item) : data.officeProfiles,
        officeProfileRevisions: revisionRow(data.officeProfileRevisions, revision),
      };
    });
    setReviewReason("");
    setFormError("");
    toast.success(approved ? "Versão institucional aprovada" : "Proposta institucional rejeitada");
  }

  function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2_000_000) {
      setLogoError("Use PNG, JPG ou WebP com até 2 MB.");
      event.target.value = "";
      return;
    }
    setLogoError("");
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  const proposalBy = proposal ? view.memberName(proposal.proposedByMemberId) : "";
  const reviewer = proposal?.reviewedByMemberId ? view.memberName(proposal.reviewedByMemberId) : "";
  const renderSignatories = (fields: OfficeIdentityFields) => fields.signatoryMemberIds
    .map((id) => view.members.find((member) => member.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return <div className="grid min-w-0 gap-5 lg:grid-cols-2">
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Building2 className="size-5 text-primary"/><h2 className={heading}>Identidade institucional</h2></div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">Versão aprovada {profile.version} · {fmtDateTime(profile.approvedAt)}</span>
      </div>
      <div className="my-5 flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl text-xl font-bold text-white" style={{ background: office.brandColor }}>
          {logoPreview ? <img src={logoPreview} alt="Logo escolhido para prévia local" className="size-full object-contain"/> : office.monogram}
        </span>
        <div className="min-w-0"><p className="break-words font-semibold">{profile.displayName}</p><p className="break-words text-sm text-muted-foreground">{profile.legalName}</p></div>
      </div>

      {proposal && <div className={`mb-4 rounded-lg border p-3 text-sm ${proposal.status === "em_revisao" ? "border-warning/40 bg-warning-soft" : "bg-muted/50"}`}>
        <div className="flex items-center gap-2 font-semibold">{proposal.status === "em_revisao" ? <Clock3 className="size-4"/> : <FileText className="size-4"/>}{statusLabel[proposal.status]} · proposta v{proposal.version}</div>
        <p className="mt-1 text-xs">Por {proposalBy} · criada {fmtDateTime(proposal.proposedAt)}{proposal.submittedAt ? ` · enviada ${fmtDateTime(proposal.submittedAt)}` : ""}</p>
        {proposal.reviewedAt && <p className="mt-1 text-xs">{statusLabel[proposal.status]} por {reviewer} em {fmtDateTime(proposal.reviewedAt)} · {proposal.reviewReason}</p>}
      </div>}

      {proposal?.status === "em_revisao" && <p className="mb-4 rounded-lg border border-info/30 bg-info-soft p-3 text-sm text-info">A versão aprovada continua vigente até decisão de outra pessoa da gestão ou sociedade.</p>}

      <form noValidate onSubmit={saveDraft} className="space-y-4">
        <fieldset disabled={!editing} className="space-y-4 disabled:opacity-90">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="identity-display">Nome de exibição</Label><Input id="identity-display" required value={draft.displayName} onChange={(event) => updateField("displayName", event.target.value)} aria-invalid={Boolean(formError && !draft.displayName.trim())}/></div>
            <div className="space-y-1.5"><Label htmlFor="identity-legal">Razão social</Label><Input id="identity-legal" required value={draft.legalName} onChange={(event) => updateField("legalName", event.target.value)} aria-invalid={Boolean(formError && !draft.legalName.trim())}/></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="identity-address">Endereço institucional</Label><Input id="identity-address" required value={draft.address} onChange={(event) => updateField("address", event.target.value)} aria-invalid={Boolean(formError && !draft.address.trim())}/></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="identity-phones">Contatos do escritório</Label><textarea id="identity-phones" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={draft.phones.join("\n")} onChange={(event) => updateField("phones", lines(event.target.value))} aria-describedby="identity-phones-hint" aria-invalid={Boolean(formError && (!draft.phones.length || draft.phones.some((phone) => phone.replace(/\D/g, "").length < 8)))} required/><p id="identity-phones-hint" className="text-xs text-muted-foreground">Um telefone por linha; ao menos 8 dígitos.</p></div>
            <div className="space-y-1.5"><Label htmlFor="identity-units">Unidades</Label><textarea id="identity-units" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" value={draft.units.join("\n")} onChange={(event) => updateField("units", lines(event.target.value))} aria-describedby="identity-units-hint" aria-invalid={Boolean(formError && !draft.units.length)} required/><p id="identity-units-hint" className="text-xs text-muted-foreground">Uma unidade por linha.</p></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="identity-oab">Registro OAB do escritório</Label><Input id="identity-oab" required value={draft.oabNumber} onChange={(event) => updateField("oabNumber", event.target.value)} aria-invalid={Boolean(formError && !draft.oabNumber.trim())}/></div>
          <fieldset className="space-y-2 rounded-lg border p-3" disabled={!editing} aria-invalid={Boolean(formError && (!draft.signatoryMemberIds.length || draft.signatoryMemberIds.some((id) => !eligibleSignatories.some((member) => member.id === id))))}>
            <legend className="px-1 text-sm font-medium">Signatários autorizados</legend>
            <p className="text-xs text-muted-foreground">Selecione profissionais desta equipe com OAB cadastrada.</p>
            {eligibleSignatories.length ? <div className="grid gap-2 sm:grid-cols-2">{eligibleSignatories.map((member) => <label key={member.id} className="flex min-w-0 items-start gap-2 rounded-md border p-2 text-sm"><input type="checkbox" className="mt-0.5 accent-primary" checked={draft.signatoryMemberIds.includes(member.id)} onChange={(event) => updateField("signatoryMemberIds", event.target.checked ? [...draft.signatoryMemberIds, member.id] : draft.signatoryMemberIds.filter((id) => id !== member.id))}/><span className="min-w-0 break-words">{member.name}<span className="block text-xs text-muted-foreground">OAB/{member.oabUf} {member.oabNumber}</span></span></label>)}</div> : <p className="text-sm text-muted-foreground">Nenhum profissional com OAB cadastrada.</p>}
          </fieldset>
        </fieldset>

        {formError && <p id="identity-form-error" role="alert" className="rounded-md bg-destructive-soft p-3 text-sm text-destructive">{formError}</p>}
        {logoError && <p role="alert" className="text-sm text-destructive">{logoError}</p>}
        <div className="flex flex-wrap gap-2">
          {editing ? <>
            <Button type="submit" variant="outline">Salvar rascunho</Button>
            <Button type="button" onClick={sendForReview}>Enviar para revisão</Button>
            <Button type="button" variant="ghost" onClick={() => { setDraft(asFields(proposal?.snapshot ?? profile)); setEditing(false); setFormError(""); }}>Cancelar edição</Button>
          </> : proposal?.status === "rascunho" ? <Button type="button" onClick={() => { setDraft(asFields(proposal.snapshot)); setEditing(true); setFormError(""); }}>Continuar rascunho</Button> : !proposal && <Button type="button" onClick={() => { setDraft(asFields(profile)); setEditing(true); setFormError(""); }}>Propor alteração</Button>}
        </div>
      </form>

      <div className="mt-5 border-t pt-4">
        <Label htmlFor="identity-logo">Prévia local de logo (PNG, JPG ou WebP · até 2 MB)</Label>
        <Input id="identity-logo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2" onChange={selectLogo}/>
        <p className="mt-1 text-xs text-muted-foreground">A imagem existe somente nesta sessão demo e não é publicada nem anexada ao perfil.</p>
      </div>
    </section>

    <div className="space-y-5">
      <section className={card}>
        <div className="flex items-center gap-2"><FileText className="size-5 text-primary"/><h2 className={heading}>Prévia de papel timbrado</h2></div>
        <p className="mt-1 text-xs text-muted-foreground">{proposal?.status === "em_revisao" ? "Proposta pendente · sem vigência até aprovação" : editing ? "Prévia local das alterações em edição" : "Versão institucional aprovada"}</p>
        <div className="mt-4 min-h-64 rounded-lg border bg-white p-6 text-slate-700 shadow-sm">
          <div className="flex items-center gap-3 border-b pb-4"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded text-xs font-bold text-white" style={{ background: office.brandColor }}>{logoPreview ? <img src={logoPreview} alt="" className="size-full object-contain"/> : office.monogram}</span><div className="min-w-0"><p className="break-words text-sm font-semibold">{preview?.displayName}</p><p className="break-words text-[10px]">{preview?.legalName}</p></div></div>
          <p className="mt-6 break-words text-xs">{preview?.address}</p>
          <p className="mt-1 break-words text-xs">{preview?.phones.join(" · ")}</p>
          <p className="mt-6 text-center font-serif text-lg">Instrumento jurídico</p>
          <p className="mt-5 whitespace-pre-wrap break-words font-serif text-sm leading-7">Prévia fictícia para contratos e procurações. Registro: {preview?.oabNumber}. Signatários autorizados: {signatoryNames.join(", ") || "não selecionados"}.</p>
          <p className="mt-8 border-t pt-3 text-xs">{preview?.units.join(" · ")}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">Prévia demonstrativa · sem validade documental</p>
        </div>
      </section>

      {proposal?.status === "em_revisao" && <section className={card}>
        <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className={heading}>Revisão humana</h2></div>
        {proposal.proposedByMemberId === view.me?.id ? <p className="mt-3 text-sm text-muted-foreground">A aprovação exige outro perfil da gestão ou sociedade. Troque o perfil demonstrativo para revisar esta proposta.</p> : <>
          <div className="mt-4 space-y-1.5"><Label htmlFor="identity-review-reason">Motivo da decisão</Label><textarea id="identity-review-reason" className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} required aria-describedby="identity-review-help"/><p id="identity-review-help" className="text-xs text-muted-foreground">A decisão e seu autor serão guardados no histórico demonstrativo.</p></div>
          <div className="mt-3 flex flex-wrap gap-2"><Button type="button" onClick={() => decide(true)} disabled={!reviewReason.trim()}><CheckCircle2/> Aprovar v{proposal.version}</Button><Button type="button" variant="outline" onClick={() => decide(false)} disabled={!reviewReason.trim()}>Rejeitar proposta</Button></div>
        </>}
      </section>}

      <section className={card}>
        <div className="flex items-center gap-2"><Clock3 className="size-5 text-primary"/><h2 className={heading}>Histórico de versões</h2></div>
        <p className="mt-1 text-sm text-muted-foreground">Cada decisão registra snapshot, versão, autor e data. Alterações só viram vigentes após aprovação.</p>
        {view.officeProfileRevisions.length ? <ol className="mt-4 space-y-3">{view.officeProfileRevisions.map((revision) => <li key={revision.id} className="border-l-2 border-primary/30 pl-3 text-sm">
          <p className="font-medium">v{revision.version} · {statusLabel[revision.status]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Proposta de {view.memberName(revision.proposedByMemberId)} · {fmtDateTime(revision.proposedAt)}</p>
          {revision.submittedAt && <p className="text-xs text-muted-foreground">Enviada para revisão · {fmtDateTime(revision.submittedAt)}</p>}
          {revision.reviewedAt && <p className="text-xs text-muted-foreground">Decisão de {view.memberName(revision.reviewedByMemberId)} · {fmtDateTime(revision.reviewedAt)}. {revision.reviewReason}</p>}
        </li>)}</ol> : <div className="mt-4"><EmptyState title="Nenhuma alteração proposta" hint="A versão institucional vigente está aprovada. Novas propostas aparecem neste histórico." /></div>}
        {!view.officeProfileRevisions.length && <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(profile.approvedAt)} · v{profile.version}</p>}
      </section>
    </div>
  </div>;
}
