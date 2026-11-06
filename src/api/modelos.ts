// src/api/modelos.ts
// Mock store for Modelos de documentos. Replace with real API later.

export type Modelo = {
  id: number;
  name: string;
  area: string; // ex.: "Civil", "Trabalhista"
  updatedAt: string;
  template: string; // string with placeholders, e.g. "{{cliente}}"
};

let modelos: Modelo[] = [
  { id: 1, name: 'Contrato de Honorários', area: 'Civil', updatedAt: new Date().toISOString(), template: 'Contrato entre {{prestador}} e {{cliente}}...' },
  { id: 2, name: 'Procuração de Representação', area: 'Trabalhista', updatedAt: new Date().toISOString(), template: 'Eu, {{advogado}}, nomeio {{representado}}...' },
];

let nextId = 3;

export async function getModelos() {
  await new Promise(r => setTimeout(r, 150));
  return modelos;
}

export async function getModelo(id: number) {
  await new Promise(r => setTimeout(r, 100));
  const m = modelos.find(m => m.id === id);
  if (!m) throw new Error('Modelo não encontrado');
  return m;
}

export async function createModelo(data: Omit<Modelo, 'id' | 'updatedAt'>) {
  await new Promise(r => setTimeout(r, 150));
  const novo: Modelo = { id: nextId++, ...data, updatedAt: new Date().toISOString() };
  modelos.push(novo);
  return novo;
}

export async function updateModelo(id: number, data: Partial<Omit<Modelo, 'id' | 'updatedAt'>>) {
  await new Promise(r => setTimeout(r, 150));
  const idx = modelos.findIndex(m => m.id === id);
  if (idx === -1) throw new Error('Modelo não encontrado');
  const existente = modelos[idx];
  const atualizado = { ...existente, ...data, updatedAt: new Date().toISOString() };
  modelos[idx] = atualizado;
  return atualizado;
}

export async function deleteModelo(id: number) {
  await new Promise(r => setTimeout(r, 150));
  modelos = modelos.filter(m => m.id !== id);
  return true;
}
