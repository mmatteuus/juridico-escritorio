import type { DemoData, Office } from "./types";

export const OFFICES: Office[] = [
  {
    id: "off-a",
    slug: "almeida-demonstracao",
    legalName: "Almeida & Prado Sociedade de Advogados (Demonstração)",
    displayName: "Almeida & Prado",
    monogram: "AP",
    brandColor: "oklch(0.47 0.075 182)",
    address: "Rua Fictícia, 100 – Centro, Cidade Exemplo/UF",
    phones: ["(00) 0000-0000"],
    units: ["Sede", "Unidade Norte"],
    memberSeatLimit: 10,
    practiceAreas: [
      { id: "civel", name: "Cível" },
      { id: "trabalhista", name: "Trabalhista" },
    ],
    oabNumber: "OAB/UF 00000 (fictício)",
    signatoryMemberIds: ["a-m1", "a-m2"],
    identityApprovedAt: "2026-10-20T12:00:00.000Z",
  },
  {
    id: "off-b",
    slug: "horizonte-demonstracao",
    legalName: "Núcleo Jurídico Horizonte (Demonstração)",
    displayName: "Núcleo Horizonte",
    monogram: "NH",
    brandColor: "oklch(0.5 0.09 250)",
    address: "Avenida Imaginária, 2000 – Bairro Teste, Cidade Modelo/UF",
    phones: ["(00) 1111-1111"],
    units: ["Sede"],
    memberSeatLimit: 10,
    practiceAreas: [
      { id: "familia", name: "Família" },
      { id: "tributario", name: "Tributário" },
    ],
    oabNumber: "OAB/UF 11111 (fictício)",
    signatoryMemberIds: ["b-m1", "b-m2"],
    identityApprovedAt: "2026-10-21T12:00:00.000Z",
  },
];

/** Visual access examples for the pre-tenant selector. These are not routable offices. */
export const OFFICE_ACCESS_EXAMPLES = [
  { id: "pending-central", displayName: "Núcleo Central", legalName: "Núcleo Central (solicitação fictícia)", monogram: "NC", brandColor: "oklch(0.55 0.07 80)", status: "pendente" as const },
  { id: "suspended-east", displayName: "Núcleo Leste", legalName: "Núcleo Leste (vínculo fictício)", monogram: "NL", brandColor: "oklch(0.48 0.06 300)", status: "suspenso" as const },
];
function day(offsetDays: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export function buildFixtures(): DemoData {
  return {
    matterDocumentChecklists: [],
    contractAnalysisDrafts: [],
    fiscalPreparationDrafts: [],
    userPreferences: [],
    officeProfiles: OFFICES.map((office) => ({
      officeId: office.id,
      legalName: office.legalName,
      displayName: office.displayName,
      address: office.address,
      phones: [...office.phones],
      units: [...office.units],
      oabNumber: office.oabNumber,
      signatoryMemberIds: [...office.signatoryMemberIds],
      version: 1,
      approvedAt: office.identityApprovedAt,
    })),
    officeProfileRevisions: [],
    conflicts: [
      { id: "a-conf-1", officeId: "off-a", intakeId: "a-i2", prospect: "Padaria Exemplo ME", counterparty: "Comércio Fictício Ltda.", summary: "Consulta preventiva antes da aceitação do atendimento.", status: "em_revisao", createdAt: day(-1, 11), reviewedBy: "Helena Almeida", reviewReason: "Coincidência com cliente da carteira; analisar vínculo e escopo antes da decisão.", reviewedAt: day(-1, 12) },
      { id: "a-conf-2", officeId: "off-a", intakeId: "a-i1", prospect: "Carlos Fictício Mendes", counterparty: "Indústria Demonstrativa S.A.", summary: "Triagem inicial de partes em atendimento trabalhista.", status: "pendente", createdAt: day(0, 9), reviewedBy: undefined, reviewReason: undefined, reviewedAt: undefined },
      { id: "a-conf-3", officeId: "off-a", intakeId: "a-i3", prospect: "Rita Modelo Souza", counterparty: "Imobiliária Demonstração Ltda.", summary: "Conferência de partes do atendimento cível.", status: "sem_indicio", createdAt: day(-3, 16), reviewedBy: "Ricardo Prado", reviewReason: "Partes e carteira visível conferidas. Sem indício identificado nesta demonstração.", reviewedAt: day(-3, 17) },
      { id: "a-conf-4", officeId: "off-a", intakeId: "a-i4", prospect: "Transportes Teste Ltda.", counterparty: "Seguradora de Exemplo S.A.", summary: "Verificação anterior à aprovação do atendimento.", status: "prosseguir_com_ressalvas", createdAt: day(-15, 10), reviewedBy: "Ricardo Prado", reviewReason: "Coincidência nominal revista por profissional; prosseguir com ressalva e monitorar eventual vínculo.", reviewedAt: day(-15, 11) },
      { id: "b-conf-1", officeId: "off-b", intakeId: "b-i1", prospect: "Pedro Horizonte Lima", counterparty: "Ana Horizonte Fictícia", summary: "Possível coincidência nominal em assunto de família.", status: "risco_identificado", createdAt: day(-2, 10), reviewedBy: "Lúcia Horizonte", reviewReason: "Necessária avaliação da equipe antes de assumir o novo atendimento.", reviewedAt: day(-1, 9) },
    ],    intakes: [
      { id: "a-i1", officeId: "off-a", name: "Carlos Fictício Mendes", contact: "(00) 9000-0101", clientKind: "PF", practiceAreaId: "trabalhista", summary: "Dispensa sem pagamento de verbas rescisórias (relato demo).", stage: "novo", createdAt: day(0, 8) },
      { id: "a-i2", officeId: "off-a", name: "Padaria Exemplo ME", contact: "padaria@exemplo.test", clientKind: "PJ", practiceAreaId: "civel", summary: "Cobrança de fornecedor inadimplente.", stage: "em_triagem", createdAt: day(-1, 10) },
      { id: "a-i3", officeId: "off-a", name: "Rita Modelo Souza", contact: "(00) 9000-0102", clientKind: "PF", practiceAreaId: "civel", summary: "Problema com contrato de aluguel; aguardando cópia do contrato.", stage: "documentos_pendentes", createdAt: day(-3, 15) },
      { id: "a-i4", officeId: "off-a", name: "Transportes Teste Ltda.", contact: "adm@transp.test", clientKind: "PJ", practiceAreaId: "civel", summary: "Revisão de cláusulas de seguro de frota.", stage: "aprovado", createdAt: day(-15, 9) },
      { id: "b-i1", officeId: "off-b", name: "Pedro Horizonte Lima", contact: "(00) 9111-0201", clientKind: "PF", practiceAreaId: "familia", summary: "Revisão de pensão alimentícia (relato demo).", stage: "novo", createdAt: day(0, 9) },
      { id: "b-i2", officeId: "off-b", name: "Café Imaginário Ltda.", contact: "cafe@imag.test", clientKind: "PJ", practiceAreaId: "tributario", summary: "Dúvida sobre enquadramento tributário.", stage: "em_triagem", createdAt: day(-40, 14) },
    ],
    clientPortalInvites: [
      { id: "a-invite1", officeId: "off-a", clientId: "a-c1", matterId: "a-k1", recipient: "contato@exemplo.test", status: "pendente", allowedDocIds: ["a-doc1"], createdAt: day(-1), expiresAt: day(6) },
      { id: "b-invite1", officeId: "off-b", clientId: "b-c1", matterId: "b-k1", recipient: "ana.horizonte@exemplo.test", status: "ativo", allowedDocIds: [], createdAt: day(-3), expiresAt: day(27) },
    ],
    collaboratorInvites: [
      { id: "a-colinvite-pending", officeId: "off-a", email: "marina.nova@exemplo.test", role: "advogado", practiceAreaId: "civel", teamId: "a-team-civel", status: "pendente", createdByMemberId: "a-m1", createdAt: day(-1, 11), expiresAt: day(6, 11), history: [{ at: day(-1, 11), actor: "Helena Almeida", action: "Preparou convite de demonstração" }] },
      { id: "a-colinvite-accepted", officeId: "off-a", email: "lucia.assistente@exemplo.test", role: "secretario", practiceAreaId: "trabalhista", teamId: "a-team-trabalhista", status: "aceito", createdByMemberId: "a-m1", createdAt: day(-10, 10), expiresAt: day(-3, 10), acceptedAt: day(-9, 12), history: [{ at: day(-10, 10), actor: "Helena Almeida", action: "Preparou convite de demonstração" }, { at: day(-9, 12), actor: "Ação demonstrativa", action: "Simulou aceite; autenticação e membership real não foram criados" }] },
      { id: "a-colinvite-expired", officeId: "off-a", email: "estagio.candidato@exemplo.test", role: "estagiario", practiceAreaId: "civel", teamId: "a-team-civel", status: "expirado", createdByMemberId: "a-m1", createdAt: day(-20, 9), expiresAt: day(-13, 9), history: [{ at: day(-20, 9), actor: "Helena Almeida", action: "Preparou convite de demonstração" }, { at: day(-13, 9), actor: "Sistema demonstrativo", action: "Convite expirado" }] },
      { id: "a-colinvite-revoked", officeId: "off-a", email: "financeiro.novo@exemplo.test", role: "financeiro", practiceAreaId: "civel", teamId: "a-team-civel", status: "revogado", createdByMemberId: "a-m1", createdAt: day(-8, 10), expiresAt: day(6, 10), revokedAt: day(-7, 10), history: [{ at: day(-8, 10), actor: "Helena Almeida", action: "Preparou convite de demonstração" }, { at: day(-7, 10), actor: "Helena Almeida", action: "Revogou convite de demonstração" }] },
    ],
    teams: [
      { id: "a-team-civel", officeId: "off-a", name: "Equipe Cível", practiceAreaId: "civel", memberIds: ["a-m1", "a-m2", "a-m4", "a-m6", "a-m8"] },
      { id: "a-team-trabalhista", officeId: "off-a", name: "Equipe Trabalhista", practiceAreaId: "trabalhista", memberIds: ["a-m2", "a-m3", "a-m4", "a-m5"] },
      { id: "b-team-familia", officeId: "off-b", name: "Equipe Família", practiceAreaId: "familia", memberIds: ["b-m1", "b-m3", "b-m4", "b-m6", "b-m8"] },
      { id: "b-team-tributario", officeId: "off-b", name: "Equipe Tributária", practiceAreaId: "tributario", memberIds: ["b-m2", "b-m4", "b-m7"] },
    ],
    supportTickets: [
      { id: "a-support1", officeId: "off-a", description: "Dúvida sobre configuração de notificações (demo).", status: "em_atendimento", createdAt: day(-2, 11) },
      { id: "b-support1", officeId: "off-b", description: "Orientação para cadastro de equipe (demo).", status: "resolvido", createdAt: day(-5, 9) },
    ],
    securitySessions: [
      { id: "a-session-current", officeId: "off-a", memberId: "a-m1", label: "Navegador atual (exemplo)", location: "Cidade Exemplo/UF", lastSeenAt: day(0, 10), current: true, status: "ativa" },
      { id: "a-session-notebook", officeId: "off-a", memberId: "a-m1", label: "Notebook de trabalho (exemplo)", location: "Cidade Exemplo/UF", lastSeenAt: day(-1, 16), current: false, status: "ativa" },
      { id: "a-session-mobile", officeId: "off-a", memberId: "a-m1", label: "Celular (exemplo)", location: "Cidade Exemplo/UF", lastSeenAt: day(-3, 11), current: false, status: "ativa" },
      { id: "b-session-current", officeId: "off-b", memberId: "b-m1", label: "Navegador atual (exemplo)", location: "Cidade Modelo/UF", lastSeenAt: day(0, 9), current: true, status: "ativa" },
      { id: "b-session-notebook", officeId: "off-b", memberId: "b-m1", label: "Notebook de trabalho (exemplo)", location: "Cidade Modelo/UF", lastSeenAt: day(-2, 14), current: false, status: "ativa" },
      { id: "b-session-mobile", officeId: "off-b", memberId: "b-m1", label: "Celular (exemplo)", location: "Cidade Modelo/UF", lastSeenAt: day(-4, 10), current: false, status: "ativa" },
    ],
    members: [
      { id: "a-m1", officeId: "off-a", name: "Helena Almeida", role: "gestor", practiceAreaIds: ["civel"], title: "Gestora", oabNumber: "000001", oabUf: "SP" },
      { id: "a-m2", officeId: "off-a", name: "Ricardo Prado", role: "socio", practiceAreaIds: ["civel", "trabalhista"], title: "Sócio", oabNumber: "000002", oabUf: "SP" },
      { id: "a-m3", officeId: "off-a", name: "Marina Teles", role: "coordenador", practiceAreaIds: ["trabalhista"], title: "Coord. Trabalhista", oabNumber: "000003", oabUf: "SP" },
      { id: "a-m4", officeId: "off-a", name: "Paulo Nunes", role: "advogado", practiceAreaIds: ["civel", "trabalhista"], title: "Advogado multiárea", oabNumber: "000004", oabUf: "SP" },
      { id: "a-m5", officeId: "off-a", name: "Júlia Ramos", role: "secretario", practiceAreaIds: [], title: "Secretária" },
      { id: "a-m6", officeId: "off-a", name: "Tiago Lemos", role: "substituto", practiceAreaIds: ["civel"], title: "Substituto (até 30 dias)", oabNumber: "000006", oabUf: "SP" },
      { id: "a-m7", officeId: "off-a", name: "Sara Costa", role: "financeiro", practiceAreaIds: [], title: "Financeiro" },
      { id: "a-m8", officeId: "off-a", name: "Davi Rocha", role: "estagiario", practiceAreaIds: ["civel"], title: "Estagiário" },
      { id: "b-m1", officeId: "off-b", name: "Lúcia Horizonte", role: "gestor", practiceAreaIds: ["familia"], title: "Gestora", oabNumber: "000101", oabUf: "RJ" },
      { id: "b-m2", officeId: "off-b", name: "Fernando Vale", role: "socio", practiceAreaIds: ["tributario"], title: "Sócio", oabNumber: "000102", oabUf: "RJ" },
      { id: "b-m3", officeId: "off-b", name: "Beatriz Lago", role: "coordenador", practiceAreaIds: ["familia"], title: "Coord. Família", oabNumber: "000103", oabUf: "RJ" },
      { id: "b-m4", officeId: "off-b", name: "Caio Serra", role: "advogado", practiceAreaIds: ["familia", "tributario"], title: "Advogado", oabNumber: "000104", oabUf: "RJ" },
      { id: "b-m5", officeId: "off-b", name: "Renata Brisa", role: "secretario", practiceAreaIds: [], title: "Secretária" },
      { id: "b-m6", officeId: "off-b", name: "Otávio Mar", role: "substituto", practiceAreaIds: ["familia"], title: "Substituto", oabNumber: "000106", oabUf: "RJ" },
      { id: "b-m7", officeId: "off-b", name: "Igor Campos", role: "financeiro", practiceAreaIds: [], title: "Financeiro" },
      { id: "b-m8", officeId: "off-b", name: "Lia Duna", role: "estagiario", practiceAreaIds: ["familia"], title: "Estagiária" },
    ],
    clients: [
      { id: "a-c1", officeId: "off-a", name: "Comércio Fictício Ltda.", kind: "PJ", contact: "contato@exemplo.test", city: "Cidade Exemplo", state: "SP", responsibleId: "a-m1", conflictStatus: "liberado" },
      { id: "a-c2", officeId: "off-a", name: "João Exemplo da Silva", kind: "PF", contact: "(00) 9000-0001", city: "Cidade Exemplo", state: "SP", responsibleId: "a-m4", conflictStatus: "liberado" },
      { id: "a-c3", officeId: "off-a", name: "Maria Teste Oliveira", kind: "PF", contact: "(00) 9000-0002", city: "Vila Modelo" },
      { id: "a-c4", officeId: "off-a", name: "Indústria Demonstrativa S.A.", kind: "PJ", contact: "juridico@demo.test", city: "Polo Exemplo" },
      { id: "b-c1", officeId: "off-b", name: "Ana Horizonte Fictícia", kind: "PF", contact: "(00) 9111-0001", city: "Cidade Modelo" },
      { id: "b-c2", officeId: "off-b", name: "Tributos Imaginários ME", kind: "PJ", contact: "fiscal@imag.test", city: "Cidade Modelo" },
    ],
    matters: [
      {
        id: "a-k1", officeId: "off-a", code: "AP-2026-014", title: "Revisão de contrato de fornecimento",
        clientIds: ["a-c1"], practiceAreaId: "civel", status: "em_analise", assignedMemberIds: ["a-m4", "a-m6"],
        confidentiality: "normal", grantRoles: ["gestor"], updatedAt: day(0, 9),
        summary: "Consulta contratual preventiva. Ainda sem processo judicial — caso válido sem número CNJ.",
      },
      {
        id: "a-k2", officeId: "off-a", code: "AP-2026-009", title: "Reclamação trabalhista – horas extras",
        clientIds: ["a-c2"], practiceAreaId: "trabalhista", status: "ativo", assignedMemberIds: ["a-m3", "a-m4"],
        confidentiality: "restrito_a_equipe", grantRoles: ["gestor", "socio", "coordenador", "secretario", "financeiro"], updatedAt: day(-1, 16),
        summary: "Defesa do reclamante. Audiência de instrução a designar.",
      },
      {
        id: "a-k3", officeId: "off-a", code: "AP-2026-011", title: "Demanda de consumidor – produto com defeito",
        clientIds: ["a-c3"], practiceAreaId: "civel", status: "ativo", assignedMemberIds: ["a-m2", "a-m8"],
        confidentiality: "normal", grantRoles: ["gestor"], updatedAt: day(-20, 11),
        summary: "Ação indenizatória em fase de conhecimento.",
      },
      {
        id: "a-k4", officeId: "off-a", code: "AP-2026-002", title: "Reestruturação societária (sigilo)",
        clientIds: ["a-c4"], practiceAreaId: "civel", status: "ativo", assignedMemberIds: ["a-m2"],
        confidentiality: "sigilo_reforcado", grantRoles: ["socio"], updatedAt: day(-45, 14),
        summary: "Caso restrito aos sócios com acesso liberado de forma expressa.",
      },
      {
        id: "b-k1", officeId: "off-b", code: "NH-2026-021", title: "Divórcio consensual com partilha",
        clientIds: ["b-c1"], practiceAreaId: "familia", status: "ativo", assignedMemberIds: ["b-m3", "b-m4"],
        confidentiality: "restrito_a_equipe", grantRoles: ["gestor", "socio", "coordenador", "secretario", "financeiro"], updatedAt: day(-10, 8),
        summary: "Acordo em minuta; aguardando documentos da cliente.",
      },
      {
        id: "b-k2", officeId: "off-b", code: "NH-2026-017", title: "Defesa em auto de infração fiscal",
        clientIds: ["b-c2"], practiceAreaId: "tributario", status: "em_analise", assignedMemberIds: ["b-m2", "b-m4"],
        confidentiality: "normal", grantRoles: ["gestor"], updatedAt: day(-1, 10),
        summary: "Impugnação administrativa em elaboração.",
      },
    ],
    proceedings: [
      { id: "a-p1", officeId: "off-a", matterId: "a-k2", cnjMasked: "0000000-00.2026.5.00.TESTE", court: "Vara do Trabalho Exemplo", phase: "Instrução", sourceState: "manual_demo" },
      { id: "a-p2", officeId: "off-a", matterId: "a-k3", cnjMasked: "1111111-11.2026.8.00.TESTE", court: "Juizado Cível Modelo", phase: "Conhecimento", sourceState: "manual_demo" },
      { id: "b-p1", officeId: "off-b", matterId: "b-k1", cnjMasked: "2222222-22.2026.8.00.TESTE", court: "Vara de Família Fictícia", phase: "Homologação", sourceState: "manual_demo" },
    ],
    deadlines: [
      {
        id: "a-d1", officeId: "off-a", matterId: "a-k2", title: "Manifestação sobre documentos", dueDate: day(1, 18),
        status: "proposto", assigneeId: "a-m4", proposedBy: "Júlia Ramos", version: 1, sourceLabel: "Intimação (demo)",
        history: [{ at: day(-1, 15), actor: "Júlia Ramos", action: "Propôs o prazo" }],
      },
      {
        id: "a-d2", officeId: "off-a", matterId: "a-k3", title: "Réplica à contestação", dueDate: day(3, 18),
        status: "confirmado", assigneeId: "a-m2", proposedBy: "Davi Rocha", confirmedBy: "Ricardo Prado", confirmedAt: day(-2, 10), version: 1,
        sourceLabel: "Publicação (demo)",
        history: [
          { at: day(-3, 9), actor: "Davi Rocha", action: "Propôs o prazo" },
          { at: day(-2, 10), actor: "Ricardo Prado", action: "Confirmou o prazo" },
        ],
      },
      {
        id: "a-d3", officeId: "off-a", matterId: "a-k1", title: "Parecer sobre cláusula de multa", dueDate: day(0, 17),
        status: "em_revisao", assigneeId: "a-m4", proposedBy: "Helena Almeida", version: 1, sourceLabel: "Combinado com cliente",
        history: [{ at: day(-1, 11), actor: "Helena Almeida", action: "Enviou para revisão" }],
      },
      {
        id: "b-d1", officeId: "off-b", matterId: "b-k2", title: "Impugnação administrativa", dueDate: day(2, 18),
        status: "proposto", assigneeId: "b-m4", proposedBy: "Renata Brisa", version: 1, sourceLabel: "Notificação (demo)",
        history: [{ at: day(-1, 9), actor: "Renata Brisa", action: "Propôs o prazo" }],
      },
    ],
    publicationCoverage: [
      { id: "a-cov-1", officeId: "off-a", source: "Fonte judicial demonstrativa · Cível", period: "Últimas 24 horas", status: "confirmada", lastConfirmedAt: day(-1, 17), gaps: 0, note: "Registro fictício para demonstrar a exibição de cobertura." },
      { id: "a-cov-2", officeId: "off-a", source: "Fonte judicial demonstrativa · Trabalhista", period: "Últimas 24 horas", status: "atrasada", lastConfirmedAt: day(-2, 9), delayMinutes: 95, gaps: 1, note: "Atraso e lacuna simulados; não representam consulta a tribunal." },
      { id: "a-cov-3", officeId: "off-a", source: "Fonte judicial demonstrativa · Estadual", period: "Últimos 7 dias", status: "lacuna", lastConfirmedAt: day(-4, 12), gaps: 2, note: "Período fictício aguardando reconciliação manual." },
      { id: "a-cov-4", officeId: "off-a", source: "Fonte judicial demonstrativa · Federal", period: "Últimas 24 horas", status: "nao_verificada", gaps: 0, note: "A cobertura deste período não foi verificada na demonstração." },
      { id: "b-cov-1", officeId: "off-b", source: "Fonte judicial demonstrativa · Família", period: "Últimas 24 horas", status: "falha", lastConfirmedAt: day(-3, 8), gaps: 1, note: "Falha simulada; ausência de coleta não significa ausência de publicação." },
      { id: "b-cov-2", officeId: "off-b", source: "Fonte judicial demonstrativa · Tributário", period: "Últimos 7 dias", status: "confirmada", lastConfirmedAt: day(-1, 16), gaps: 0, note: "Registro fictício para demonstrar a exibição de cobertura." },
    ],
    publicationReviews: [
      { id: "a-pubrev-1", officeId: "off-a", matterId: "a-k2", title: "Datas divergentes entre registros demonstrativos", status: "divergencia", sources: [{ label: "Diário fictício A", date: day(-1, 9), identifier: "A-DEMO-100" }, { label: "Registro manual", date: day(-1, 11), identifier: "M-DEMO-101" }], linkedDeadlineId: "a-d1", history: [{ at: day(-1, 11), actor: "Sistema demonstrativo", action: "Sinalizou divergência para revisão humana" }] },
      { id: "b-pubrev-1", officeId: "off-b", matterId: "b-k2", title: "Possível duplicidade entre fontes", status: "suspeita_duplicidade", sources: [{ label: "Diário fictício B", date: day(-2, 15), identifier: "B-DEMO-200" }, { label: "Importação manual", date: day(-2, 15), identifier: "M-DEMO-201" }], history: [{ at: day(-2, 15), actor: "Sistema demonstrativo", action: "Propôs correlação para conferência; nenhum evento foi fundido" }] },
    ],
    tasks: [
      { id: "a-t1", officeId: "off-a", matterId: "a-k1", title: "Ler minuta enviada pelo cliente", priority: "alta", status: "a_fazer", assigneeId: "a-m4", dueAt: day(0, 14) },
      { id: "a-t2", officeId: "off-a", matterId: "a-k2", title: "Organizar cartões de ponto", priority: "critica", status: "em_andamento", assigneeId: "a-m5", dueAt: day(-1, 17) },
      { id: "a-t3", officeId: "off-a", matterId: "a-k3", title: "Solicitar nota fiscal do produto", priority: "normal", status: "aguardando_cliente", assigneeId: "a-m8", dueAt: day(0, 16) },
      { id: "a-t4", officeId: "off-a", matterId: "a-k4", title: "Revisar ata societária", priority: "alta", status: "aguardando_revisao", assigneeId: "a-m2", dueAt: day(0, 11) },
      { id: "a-t5", officeId: "off-a", title: "Conferir boletos do mês", priority: "normal", status: "a_fazer", assigneeId: "a-m7", dueAt: day(0, 15) },
      { id: "a-t6", officeId: "off-a", title: "Pauta da reunião semanal", priority: "baixa", status: "a_fazer", assigneeId: "a-m1", dueAt: day(0, 9, 30) },
      { id: "b-t1", officeId: "off-b", matterId: "b-k1", title: "Cobrar certidão de casamento", priority: "alta", status: "aguardando_cliente", assigneeId: "b-m5", dueAt: day(0, 12) },
      { id: "b-t2", officeId: "off-b", matterId: "b-k2", title: "Levantar jurisprudência administrativa", priority: "normal", status: "a_fazer", assigneeId: "b-m4", dueAt: day(1, 12) },
      { id: "b-t3", officeId: "off-b", title: "Atualizar planilha de honorários", priority: "normal", status: "a_fazer", assigneeId: "b-m7", dueAt: day(0, 15) },
    ],
    docs: [
      { id: "a-doc1", officeId: "off-a", matterId: "a-k1", title: "Contrato de fornecimento (cópia demo)", version: 2, category: "Contrato", visibility: "cliente", createdBy: "Paulo Nunes", createdAt: day(-2, 10) },
      { id: "a-doc2", officeId: "off-a", matterId: "a-k2", title: "Procuração (minuta de demonstração)", version: 1, category: "Procuração", visibility: "restrito", grantedRoles: ["gestor", "coordenador", "advogado", "secretario"], createdBy: "Júlia Ramos", createdAt: day(-5, 10) },
      { id: "a-doc3", officeId: "off-a", matterId: "a-k3", title: "Petição inicial (minuta de demonstração)", version: 3, category: "Petição", visibility: "equipe", createdBy: "Ricardo Prado", createdAt: day(-10, 10) },
      { id: "a-pub1", officeId: "off-a", matterId: "a-k2", title: "Publicação processual (registro demonstrativo)", version: 1, category: "Publicação", visibility: "equipe", createdBy: "Captura ilustrativa", createdAt: day(-1, 9), evidenceSource: "Diário de Justiça · fonte fictícia", evidenceIdentifier: "PUB-DEMO-0001", capturedAt: day(-1, 9), hashExample: "não calculado nesta demonstração", originalContent: "Registro original fictício: publicação referente ao processo demonstrativo. Nenhum conteúdo foi recebido de tribunal ou diário oficial.", interpretation: "Interpretação de exemplo: revisar possível prazo antes de qualquer lançamento.", interpretationVersion: 1 },
      { id: "b-doc1", officeId: "off-b", matterId: "b-k1", title: "Minuta de acordo de partilha", version: 1, category: "Acordo", visibility: "restrito", grantedRoles: ["gestor"], createdBy: "Caio Serra", createdAt: day(-1, 10) },
      { id: "b-pub1", officeId: "off-b", matterId: "b-k2", title: "Intimação (registro demonstrativo)", version: 1, category: "Publicação", visibility: "equipe", createdBy: "Captura ilustrativa", createdAt: day(-2, 15), evidenceSource: "Diário de Justiça · fonte fictícia", evidenceIdentifier: "INT-DEMO-0002", capturedAt: day(-2, 15), hashExample: "não calculado nesta demonstração", originalContent: "Registro original fictício: texto de intimação para exemplificar proveniência. Nenhum conteúdo foi recebido de tribunal ou diário oficial.", interpretation: "Interpretação de exemplo: conferir o teor com profissional habilitado; não há data jurídica calculada.", interpretationVersion: 1 },
    ],
    models: [
      { id: "a-model1", officeId: "off-a", name: "Procuração ad judicia", areaId: "civel", content: "PROCURAÇÃO AD JUDICIA\n\nOUTORGANTE: {{cliente}}\nOUTORGADO: {{advogado}}, inscrito na {{oab}}\n\nPelo presente instrumento, {{cliente}} constitui seu procurador para representá-lo nos atos relacionados ao caso {{caso}}.\n\n{{prestador}} · {{data}}", version: 2, updatedAt: day(-4) },
      { id: "a-model2", officeId: "off-a", name: "Contrato de honorários", areaId: "trabalhista", content: "CONTRATO DEMONSTRATIVO DE HONORÁRIOS\n\nCONTRATANTE: {{cliente}}\nCONTRATADO: {{prestador}}, representado por {{advogado}} ({{oab}})\n\nAs partes ajustam a prestação de serviços referente ao caso {{caso}}.\n\n{{data}}", version: 1, updatedAt: day(-2) },
      { id: "b-model1", officeId: "off-b", name: "Minuta de acordo familiar", areaId: "familia", content: "MINUTA DEMONSTRATIVA DE ACORDO\n\nPARTE REPRESENTADA: {{representado}}\nADVOGADO(A): {{advogado}} ({{oab}})\n\nAs partes apresentam proposta para análise no caso {{caso}}. Esta minuta exige revisão profissional antes de qualquer uso.\n\n{{prestador}} · {{data}}", version: 1, updatedAt: day(-1) },
    ],
    delegations: [
      { id: "a-del1", officeId: "off-a", grantorId: "a-m1", granteeId: "a-m6", matterId: "a-k1", scope: ["Visualizar caso", "Preparar documentos"], justification: "Cobertura durante ausência da equipe responsável (demo).", startsAt: day(-2), expiresAt: day(14), status: "ativa" },
      { id: "a-del2", officeId: "off-a", grantorId: "a-m2", granteeId: "a-m6", matterId: "a-k3", scope: ["Visualizar caso"], justification: "Acompanhamento temporário da carteira (demo).", startsAt: day(5), expiresAt: day(20), status: "agendada" },
      { id: "b-del1", officeId: "off-b", grantorId: "b-m1", granteeId: "b-m6", matterId: "b-k1", scope: ["Visualizar caso", "Preparar documentos"], justification: "Substituição temporária da equipe de família (demo).", startsAt: day(-12), expiresAt: day(-1), status: "revogada", revokedAt: day(-2) },
    ],    mandates: [
      { id: "a-mand1", officeId: "off-a", matterId: "a-k2", clientId: "a-c2", kind: "procuracao", title: "Procuração para reclamação trabalhista", attorneyId: "a-m3", powers: "Representação judicial e acompanhamento do caso (demo)", status: "em_revisao", createdAt: day(-5, 10) },
      { id: "a-mand2", officeId: "off-a", matterId: "a-k1", clientId: "a-c1", kind: "substabelecimento", title: "Substabelecimento para revisão contratual", attorneyId: "a-m4", powers: "Acompanhamento contratual sem reserva simulada", status: "minuta", createdAt: day(-2, 14) },
      { id: "b-mand1", officeId: "off-b", matterId: "b-k1", clientId: "b-c1", kind: "procuracao", title: "Procuração para acordo familiar", attorneyId: "b-m4", powers: "Representação no caso de família (demo)", status: "aprovado_demo", createdAt: day(-3, 11) },
    ],    messages: [
      { id: "a-msg1", officeId: "off-a", matterId: "a-k3", recipient: "Maria Teste Oliveira", content: "Olá! Informamos que a réplica está em preparação. Qualquer dúvida, estamos à disposição.", status: "rascunho" },
      { id: "b-msg1", officeId: "off-b", matterId: "b-k1", recipient: "Ana Horizonte Fictícia", content: "Olá, Ana. Precisamos da certidão de casamento atualizada para seguir com o acordo.", status: "aguardando_revisao" },
    ],
    receivables: [
      { id: "a-r1", officeId: "off-a", matterId: "a-k3", label: "Honorários contratuais – parcela 2/4", kind: "honorario", category: "honorario_contratual", clientId: "a-c3", responsibleId: "a-m2", reason: "Parcela contratual prevista na demonstração.", reviewStatus: "revisado_demo", amount: 2500, paid: 0, dueDate: day(5) },
      { id: "a-r2", officeId: "off-a", matterId: "a-k2", label: "Custas de cópias (despesa)", kind: "despesa", category: "custa_judicial", clientId: "a-c2", responsibleId: "a-m3", reason: "Cópias do processo para instrução.", reviewStatus: "revisado_demo", amount: 180, paid: 180, dueDate: day(-4) },
      { id: "a-r3", officeId: "off-a", matterId: "a-k2", label: "Reembolso previsto de custas de cópias", kind: "repasse", category: "reembolso_custa", clientId: "a-c2", responsibleId: "a-m3", relatedCostId: "a-r2", reason: "Solicitação demonstrativa de reembolso vinculada à custa.", reviewStatus: "pendente", amount: 180, paid: 0, dueDate: day(12) },
      { id: "b-r1", officeId: "off-b", matterId: "b-k1", label: "Honorários – entrada", kind: "honorario", category: "honorario_contratual", clientId: "b-c1", responsibleId: "b-m2", reason: "Entrada contratual prevista.", reviewStatus: "em_revisao", amount: 4000, paid: 2000, dueDate: day(2) },
    ],
    timeline: [
      { id: "a-e1", officeId: "off-a", matterId: "a-k1", at: day(-4, 10), actor: "Helena Almeida", kind: "cadastro", text: "Caso cadastrado a partir de atendimento" },
      { id: "a-e2", officeId: "off-a", matterId: "a-k1", docId: "a-doc1", at: day(-2, 10), actor: "Paulo Nunes", kind: "documento", text: "Adicionou Contrato de fornecimento v2" },
      { id: "a-e3", officeId: "off-a", matterId: "a-k2", at: day(-1, 15), actor: "Júlia Ramos", kind: "prazo", text: "Propôs prazo: Manifestação sobre documentos" },
      { id: "a-e4", officeId: "off-a", matterId: "a-k3", at: day(-2, 10), actor: "Ricardo Prado", kind: "aprovacao", text: "Confirmou prazo: Réplica à contestação" },
      { id: "a-e5", officeId: "off-a", matterId: "a-k4", at: day(-3, 14), actor: "Ricardo Prado", kind: "observacao", text: "Reunião reservada com diretoria (demo)" },
      { id: "b-e1", officeId: "off-b", matterId: "b-k1", docId: "b-doc1", at: day(-1, 10), actor: "Caio Serra", kind: "documento", text: "Adicionou minuta de acordo de partilha" },
      { id: "b-e2", officeId: "off-b", matterId: "b-k2", at: day(-1, 9), actor: "Renata Brisa", kind: "prazo", text: "Propôs prazo: Impugnação administrativa" },
    ],
    notifications: [
      { id: "a-n1", officeId: "off-a", at: day(0, 8), category: "prazo", priority: "alta", title: "Prazo proposto aguarda confirmação", matterId: "a-k2", read: false },
      { id: "a-n2", officeId: "off-a", at: day(-1, 17), category: "tarefa", priority: "alta", title: "Tarefa atrasada: Organizar cartões de ponto", matterId: "a-k2", read: false },
      { id: "a-n3", officeId: "off-a", at: day(-2, 10), category: "documento", priority: "normal", title: "Nova versão de contrato adicionada", matterId: "a-k1", read: true },
      { id: "a-n4", officeId: "off-a", at: day(-3, 14), category: "sistema", priority: "normal", title: "Bem-vindo ao ambiente de demonstração", read: false },
      { id: "a-n5", officeId: "off-a", at: day(0, 8, 30), category: "atribuicao", priority: "normal", title: "Tarefa atribuída: Ler minuta enviada pelo cliente", recipientMemberId: "a-m4", matterId: "a-k1", taskId: "a-t1", read: false },
      { id: "a-n6", officeId: "off-a", at: day(-1, 16), category: "mencao", priority: "normal", title: "Você foi mencionado em uma atualização da equipe", recipientMemberId: "a-m2", matterId: "a-k4", taskId: "a-t4", read: true },
      { id: "a-n7", officeId: "off-a", at: day(-1, 15), category: "resposta_cliente", priority: "alta", title: "Resposta de cliente aguardando leitura da equipe (demo)", recipientMemberId: "a-m1", matterId: "a-k1", read: false },
      { id: "a-n8", officeId: "off-a", at: day(-2, 13), category: "suporte", priority: "normal", title: "Solicitação de suporte recebeu atualização (demo)", recipientMemberId: "a-m1", read: true },
      { id: "a-n9", officeId: "off-a", at: day(-1, 9), category: "sincronizacao", priority: "normal", title: "Cobertura da fonte demonstrativa não foi verificada neste período", recipientMemberId: "a-m1", matterId: "a-k2", read: false },
      { id: "b-n1", officeId: "off-b", at: day(0, 8), category: "tarefa", priority: "alta", title: "Cliente ainda não enviou certidão", matterId: "b-k1", read: false },
      { id: "b-n2", officeId: "off-b", at: day(-1, 9), category: "prazo", priority: "normal", title: "Novo prazo proposto", matterId: "b-k2", read: false },
      { id: "b-n3", officeId: "off-b", at: day(0, 9), category: "atribuicao", priority: "alta", title: "Tarefa atribuída: Cobrar certidão de casamento", recipientMemberId: "b-m5", matterId: "b-k1", taskId: "b-t1", read: false },
    ],
    appointments: [
      { id: "a-ap1", officeId: "off-a", matterId: "a-k1", title: "Reunião com Comércio Fictício", at: day(0, 15, 30), assigneeId: "a-m4", practiceAreaId: "civel" },
      { id: "a-ap2", officeId: "off-a", title: "Reunião semanal da equipe", at: day(0, 9, 30), assigneeId: "a-m1", practiceAreaId: "civel" },
      { id: "b-ap1", officeId: "off-b", matterId: "b-k1", title: "Atendimento – Ana Horizonte", at: day(0, 11), assigneeId: "b-m4", practiceAreaId: "familia" },
    ],
  };
}
