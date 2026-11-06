// src/api/documentos.ts
// Mock in‑memory store for Documentos. In a real app these calls would hit /api/documentos.

export type Documento = {
  id: number;
  title: string;
  type: string; // e.g. "Contrato", "Procuração"
  status: 'Rascunho' | 'Autorizado' | 'Rejeitado';
  updatedAt: string;
};

let documentos: Documento[] = [
  { id: 1, title: 'Contrato de Prestação de Serviços', type: 'Contrato', status: 'Rascunho', updatedAt: new Date().toISOString() },
  { id: 2, title: 'Procuração Judicial', type: 'Procuração', status: 'Autorizado', updatedAt: new Date().toISOString() },
];

let nextId = 3;

export async function getDocumentos() {
  // simulate async latency
  await new Promise(r => setTimeout(r, 200));
  return documentos;
}

export async function getDocumento(id: number) {
  await new Promise(r => setTimeout(r, 100));
  const doc = documentos.find(d => d.id === id);
  if (!doc) throw new Error('Documento não encontrado');
  return doc;
}

export async function createDocumento(data: Omit<Documento, 'id' | 'updatedAt'>) {
  await new Promise(r => setTimeout(r, 200));
  const novo: Documento = {
    id: nextId++,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  documentos.push(novo);
  return novo;
}

export async function updateDocumento(id: number, data: Partial<Omit<Documento, 'id' | 'updatedAt'>>) {
  await new Promise(r => setTimeout(r, 200));
  const idx = documentos.findIndex(d => d.id === id);
  if (idx === -1) throw new Error('Documento não encontrado');
  const existente = documentos[idx];
  const atualizado = { ...existente, ...data, updatedAt: new Date().toISOString() };
  documentos[idx] = atualizado;
  return atualizado;
}

export async function deleteDocumento(id: number) {
  await new Promise(r => setTimeout(r, 200));
  documentos = documentos.filter(d => d.id !== id);
  return true;
}
