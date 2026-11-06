// src/api/comunicacao.ts
// Mock store for comunicação (WhatsApp/e‑mail). Replace with real API when available.

export type Mensagem = {
  id: number;
  subject: string;
  from: string;
  to: string;
  status: 'Rascunho' | 'Aguardando aprovação' | 'Autorizado';
  createdAt: string;
};

let mensagens: Mensagem[] = [
  { id: 1, subject: 'Reunião com cliente', from: 'Cliente A', to: '+55 11 91234-5678', status: 'Rascunho', createdAt: new Date().toISOString() },
];

let nextId = 2;

export async function getMensagens() {
  await new Promise(r => setTimeout(r, 120));
  return mensagens;
}

export async function createMensagem(data: Omit<Mensagem, 'id' | 'createdAt'>) {
  await new Promise(r => setTimeout(r, 120));
  const nova: Mensagem = { id: nextId++, ...data, createdAt: new Date().toISOString() };
  mensagens.push(nova);
  return nova;
}

export async function updateMensagem(id: number, data: Partial<Omit<Mensagem, 'id' | 'createdAt'>>) {
  await new Promise(r => setTimeout(r, 120));
  const idx = mensagens.findIndex(m => m.id === id);
  if (idx === -1) throw new Error('Mensagem não encontrada');
  const atualizada = { ...mensagens[idx], ...data };
  mensagens[idx] = atualizada;
  return atualizada;
}

export async function deleteMensagem(id: number) {
  await new Promise(r => setTimeout(r, 120));
  mensagens = mensagens.filter(m => m.id !== id);
  return true;
}
