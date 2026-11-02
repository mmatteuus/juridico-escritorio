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
    practiceAreas: [
      { id: "civel", name: "Cível" },
      { id: "trabalhista", name: "Trabalhista" },
    ],
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
    practiceAreas: [
      { id: "familia", name: "Família" },
      { id: "tributario", name: "Tributário" },
    ],
  },
];

function day(offsetDays: number, hour = 10, min = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export function buildFixtures(): DemoData {
  return {
    intakes: [
      { id: "a-i1", officeId: "off-a", name: "Carlos Fictício Mendes", contact: "(00) 9000-0101", practiceAreaId: "trabalhista", summary: "Dispensa sem pagamento de verbas rescisórias (relato demo).", stage: "novo", createdAt: day(0, 8) },
      { id: "a-i2", officeId: "off-a", name: "Padaria Exemplo ME", contact: "padaria@exemplo.test", practiceAreaId: "civel", summary: "Cobrança de fornecedor inadimplente.", stage: "em_triagem", createdAt: day(-1, 10) },
      { id: "a-i3", officeId: "off-a", name: "Rita Modelo Souza", contact: "(00) 9000-0102", practiceAreaId: "civel", summary: "Problema com contrato de aluguel; aguardando cópia do contrato.", stage: "documentos_pendentes", createdAt: day(-3, 15) },
      { id: "a-i4", officeId: "off-a", name: "Transportes Teste Ltda.", contact: "adm@transp.test", practiceAreaId: "civel", summary: "Revisão de cláusulas de seguro de frota.", stage: "aprovado", createdAt: day(-4, 9) },
      { id: "b-i1", officeId: "off-b", name: "Pedro Horizonte Lima", contact: "(00) 9111-0201", practiceAreaId: "familia", summary: "Revisão de pensão alimentícia (relato demo).", stage: "novo", createdAt: day(0, 9) },
      { id: "b-i2", officeId: "off-b", name: "Café Imaginário Ltda.", contact: "cafe@imag.test", practiceAreaId: "tributario", summary: "Dúvida sobre enquadramento tributário.", stage: "em_triagem", createdAt: day(-2, 14) },
    ],
    members: [
      { id: "a-m1", officeId: "off-a", name: "Helena Almeida", role: "gestor", practiceAreaIds: ["civel"], title: "Gestora" },
      { id: "a-m2", officeId: "off-a", name: "Ricardo Prado", role: "socio", practiceAreaIds: ["civel", "trabalhista"], title: "Sócio" },
      { id: "a-m3", officeId: "off-a", name: "Marina Teles", role: "coordenador", practiceAreaIds: ["trabalhista"], title: "Coord. Trabalhista" },
      { id: "a-m4", officeId: "off-a", name: "Paulo Nunes", role: "advogado", practiceAreaIds: ["civel", "trabalhista"], title: "Advogado multiárea" },
      { id: "a-m5", officeId: "off-a", name: "Júlia Ramos", role: "secretario", practiceAreaIds: [], title: "Secretária" },
      { id: "a-m6", officeId: "off-a", name: "Tiago Lemos", role: "substituto", practiceAreaIds: ["civel"], title: "Substituto (até 30 dias)" },
      { id: "a-m7", officeId: "off-a", name: "Sara Costa", role: "financeiro", practiceAreaIds: [], title: "Financeiro" },
      { id: "a-m8", officeId: "off-a", name: "Davi Rocha", role: "estagiario", practiceAreaIds: ["civel"], title: "Estagiário" },
      { id: "b-m1", officeId: "off-b", name: "Lúcia Horizonte", role: "gestor", practiceAreaIds: ["familia"], title: "Gestora" },
      { id: "b-m2", officeId: "off-b", name: "Fernando Vale", role: "socio", practiceAreaIds: ["tributario"], title: "Sócio" },
      { id: "b-m3", officeId: "off-b", name: "Beatriz Lago", role: "coordenador", practiceAreaIds: ["familia"], title: "Coord. Família" },
      { id: "b-m4", officeId: "off-b", name: "Caio Serra", role: "advogado", practiceAreaIds: ["familia", "tributario"], title: "Advogado" },
      { id: "b-m5", officeId: "off-b", name: "Renata Brisa", role: "secretario", practiceAreaIds: [], title: "Secretária" },
      { id: "b-m6", officeId: "off-b", name: "Otávio Mar", role: "substituto", practiceAreaIds: ["familia"], title: "Substituto" },
      { id: "b-m7", officeId: "off-b", name: "Igor Campos", role: "financeiro", practiceAreaIds: [], title: "Financeiro" },
      { id: "b-m8", officeId: "off-b", name: "Lia Duna", role: "estagiario", practiceAreaIds: ["familia"], title: "Estagiária" },
    ],
    clients: [
      { id: "a-c1", officeId: "off-a", name: "Comércio Fictício Ltda.", kind: "PJ", contact: "contato@exemplo.test", city: "Cidade Exemplo" },
      { id: "a-c2", officeId: "off-a", name: "João Exemplo da Silva", kind: "PF", contact: "(00) 9000-0001", city: "Cidade Exemplo" },
      { id: "a-c3", officeId: "off-a", name: "Maria Teste Oliveira", kind: "PF", contact: "(00) 9000-0002", city: "Vila Modelo" },
      { id: "a-c4", officeId: "off-a", name: "Indústria Demonstrativa S.A.", kind: "PJ", contact: "juridico@demo.test", city: "Polo Exemplo" },
      { id: "b-c1", officeId: "off-b", name: "Ana Horizonte Fictícia", kind: "PF", contact: "(00) 9111-0001", city: "Cidade Modelo" },
      { id: "b-c2", officeId: "off-b", name: "Tributos Imaginários ME", kind: "PJ", contact: "fiscal@imag.test", city: "Cidade Modelo" },
    ],
    matters: [
      {
        id: "a-k1", officeId: "off-a", code: "AP-2026-014", title: "Revisão de contrato de fornecimento",
        clientIds: ["a-c1"], practiceAreaId: "civel", status: "em_analise", assignedMemberIds: ["a-m4", "a-m6"],
        confidentiality: "normal", grantRoles: [], updatedAt: day(0, 9),
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
        confidentiality: "normal", grantRoles: [], updatedAt: day(-2, 11),
        summary: "Ação indenizatória em fase de conhecimento.",
      },
      {
        id: "a-k4", officeId: "off-a", code: "AP-2026-002", title: "Reestruturação societária (sigilo)",
        clientIds: ["a-c4"], practiceAreaId: "civel", status: "ativo", assignedMemberIds: ["a-m2"],
        confidentiality: "sigilo_reforcado", grantRoles: ["socio"], updatedAt: day(-3, 14),
        summary: "Caso restrito aos sócios com grant expresso.",
      },
      {
        id: "b-k1", officeId: "off-b", code: "NH-2026-021", title: "Divórcio consensual com partilha",
        clientIds: ["b-c1"], practiceAreaId: "familia", status: "ativo", assignedMemberIds: ["b-m3", "b-m4"],
        confidentiality: "restrito_a_equipe", grantRoles: ["gestor", "socio", "coordenador", "secretario", "financeiro"], updatedAt: day(0, 8),
        summary: "Acordo em minuta; aguardando documentos da cliente.",
      },
      {
        id: "b-k2", officeId: "off-b", code: "NH-2026-017", title: "Defesa em auto de infração fiscal",
        clientIds: ["b-c2"], practiceAreaId: "tributario", status: "em_analise", assignedMemberIds: ["b-m2", "b-m4"],
        confidentiality: "normal", grantRoles: [], updatedAt: day(-1, 10),
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
      { id: "a-doc1", officeId: "off-a", matterId: "a-k1", title: "Contrato de fornecimento (cópia demo)", version: 2, category: "Contrato", visibility: "equipe", createdBy: "Paulo Nunes", createdAt: day(-2, 10) },
      { id: "a-doc2", officeId: "off-a", matterId: "a-k2", title: "Procuração (minuta de demonstração)", version: 1, category: "Procuração", visibility: "restrito", createdBy: "Júlia Ramos", createdAt: day(-5, 10) },
      { id: "a-doc3", officeId: "off-a", matterId: "a-k3", title: "Petição inicial (minuta de demonstração)", version: 3, category: "Petição", visibility: "equipe", createdBy: "Ricardo Prado", createdAt: day(-10, 10) },
      { id: "b-doc1", officeId: "off-b", matterId: "b-k1", title: "Minuta de acordo de partilha", version: 1, category: "Acordo", visibility: "restrito", createdBy: "Caio Serra", createdAt: day(-1, 10) },
    ],
    messages: [
      { id: "a-msg1", officeId: "off-a", matterId: "a-k3", recipient: "Maria Teste Oliveira", content: "Olá! Informamos que a réplica está em preparação. Qualquer dúvida, estamos à disposição.", status: "rascunho" },
      { id: "b-msg1", officeId: "off-b", matterId: "b-k1", recipient: "Ana Horizonte Fictícia", content: "Olá, Ana. Precisamos da certidão de casamento atualizada para seguir com o acordo.", status: "aguardando_revisao" },
    ],
    receivables: [
      { id: "a-r1", officeId: "off-a", matterId: "a-k3", label: "Honorários contratuais – parcela 2/4", kind: "honorario", amount: 2500, paid: 0, dueDate: day(5) },
      { id: "a-r2", officeId: "off-a", matterId: "a-k2", label: "Custas de cópias (despesa)", kind: "despesa", amount: 180, paid: 180, dueDate: day(-4) },
      { id: "b-r1", officeId: "off-b", matterId: "b-k1", label: "Honorários – entrada", kind: "honorario", amount: 4000, paid: 2000, dueDate: day(2) },
    ],
    timeline: [
      { id: "a-e1", officeId: "off-a", matterId: "a-k1", at: day(-4, 10), actor: "Helena Almeida", kind: "cadastro", text: "Caso cadastrado a partir de atendimento" },
      { id: "a-e2", officeId: "off-a", matterId: "a-k1", at: day(-2, 10), actor: "Paulo Nunes", kind: "documento", text: "Adicionou Contrato de fornecimento v2" },
      { id: "a-e3", officeId: "off-a", matterId: "a-k2", at: day(-1, 15), actor: "Júlia Ramos", kind: "prazo", text: "Propôs prazo: Manifestação sobre documentos" },
      { id: "a-e4", officeId: "off-a", matterId: "a-k3", at: day(-2, 10), actor: "Ricardo Prado", kind: "aprovacao", text: "Confirmou prazo: Réplica à contestação" },
      { id: "a-e5", officeId: "off-a", matterId: "a-k4", at: day(-3, 14), actor: "Ricardo Prado", kind: "observacao", text: "Reunião reservada com diretoria (demo)" },
      { id: "b-e1", officeId: "off-b", matterId: "b-k1", at: day(-1, 10), actor: "Caio Serra", kind: "documento", text: "Adicionou minuta de acordo de partilha" },
      { id: "b-e2", officeId: "off-b", matterId: "b-k2", at: day(-1, 9), actor: "Renata Brisa", kind: "prazo", text: "Propôs prazo: Impugnação administrativa" },
    ],
    notifications: [
      { id: "a-n1", officeId: "off-a", at: day(0, 8), category: "prazo", priority: "alta", title: "Prazo proposto aguarda confirmação", matterId: "a-k2", read: false },
      { id: "a-n2", officeId: "off-a", at: day(-1, 17), category: "tarefa", priority: "alta", title: "Tarefa atrasada: Organizar cartões de ponto", matterId: "a-k2", read: false },
      { id: "a-n3", officeId: "off-a", at: day(-2, 10), category: "documento", priority: "normal", title: "Nova versão de contrato adicionada", matterId: "a-k1", read: true },
      { id: "a-n4", officeId: "off-a", at: day(-3, 14), category: "sistema", priority: "normal", title: "Bem-vindo ao ambiente de demonstração", read: false },
      { id: "b-n1", officeId: "off-b", at: day(0, 8), category: "tarefa", priority: "alta", title: "Cliente ainda não enviou certidão", matterId: "b-k1", read: false },
      { id: "b-n2", officeId: "off-b", at: day(-1, 9), category: "prazo", priority: "normal", title: "Novo prazo proposto", matterId: "b-k2", read: false },
    ],
    appointments: [
      { id: "a-ap1", officeId: "off-a", matterId: "a-k1", title: "Reunião com Comércio Fictício", at: day(0, 15, 30) },
      { id: "a-ap2", officeId: "off-a", title: "Reunião semanal da equipe", at: day(0, 9, 30) },
      { id: "b-ap1", officeId: "off-b", matterId: "b-k1", title: "Atendimento – Ana Horizonte", at: day(0, 11) },
    ],
  };
}
