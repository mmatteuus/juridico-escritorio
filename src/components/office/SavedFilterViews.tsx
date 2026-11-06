import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleId } from "@/features/demo/types";

type FilterValues = Record<string, string>;
type SavedView<T extends FilterValues> = { id: string; name: string; values: T };

function readSavedViews<T extends FilterValues>(raw: string | null, expectedKeys: string[]): SavedView<T>[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedView<T> =>
      !!item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.name === "string" &&
      !!item.values && typeof item.values === "object" &&
      expectedKeys.every((key) => typeof item.values[key] === "string"),
    );
  } catch {
    return [];
  }
}

export function SavedFilterViews<T extends FilterValues>({
  officeId,
  role,
  collection,
  currentValues,
  onApply,
}: {
  officeId: string;
  role: RoleId;
  collection: string;
  currentValues: T;
  onApply: (values: T) => void;
}) {
  const storageKey = `jurido-demo-saved-views:${officeId}:${role}:${collection}`;
  const expectedKeys = Object.keys(currentValues);
  const schemaKey = expectedKeys.join("|");
  const [views, setViews] = useState<SavedView<T>[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(storageKey); } catch { stored = null; }
    setViews(readSavedViews(stored, schemaKey ? schemaKey.split("|") : []));
    setSelectedId("");
    setStorageError(false);
  }, [storageKey, schemaKey]);

  const saveViews = (next: SavedView<T>[]) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setViews(next);
      setStorageError(false);
      return true;
    } catch {
      setStorageError(true);
      setAnnouncement("Não foi possível salvar a visualização neste navegador.");
      return false;
    }
  };

  const saveCurrent = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const existing = views.find((view) => view.name.toLocaleLowerCase("pt-BR") === trimmedName.toLocaleLowerCase("pt-BR"));
    const id = existing?.id ?? `view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next: SavedView<T>[] = existing
      ? views.map((view) => view.id === id ? { ...view, name: trimmedName, values: { ...currentValues } } : view)
      : [...views, { id, name: trimmedName, values: { ...currentValues } }];
    if (saveViews(next)) {
      setSelectedId(id);
      setName("");
      setAnnouncement(`Visualização ${trimmedName} salva para esta lista e perfil.`);
    }
  };

  const applySelected = () => {
    const selected = views.find((view) => view.id === selectedId);
    if (!selected || !expectedKeys.every((key) => typeof selected.values[key] === "string")) return;
    onApply({ ...selected.values });
    setAnnouncement(`Visualização ${selected.name} aplicada.`);
  };

  const deleteSelected = () => {
    const selected = views.find((view) => view.id === selectedId);
    if (!selected) return;
    if (saveViews(views.filter((view) => view.id !== selected.id))) {
      setSelectedId("");
      setAnnouncement(`Visualização ${selected.name} excluída deste perfil.`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <label className="sr-only" htmlFor={`${collection}-saved-view-name`}>Nome da visualização atual</label>
      <Input
        id={`${collection}-saved-view-name`}
        className="h-9 min-w-40 flex-1 sm:max-w-56"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveCurrent(); } }}
        maxLength={60}
        placeholder="Nome da visualização"
      />
      <Button type="button" size="sm" variant="outline" disabled={!name.trim()} onClick={saveCurrent}>Salvar filtros</Button>
      <label className="sr-only" htmlFor={`${collection}-saved-view-select`}>Visualizações salvas</label>
      <select
        id={`${collection}-saved-view-select`}
        aria-label="Visualizações salvas"
        className="h-9 min-w-40 max-w-full rounded-md border bg-background px-2 text-sm"
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        disabled={views.length === 0}
      >
        <option value="">{views.length ? "Escolha uma visualização" : "Nenhuma salva"}</option>
        {views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
      </select>
      <Button type="button" size="sm" onClick={applySelected} disabled={!selectedId}>Aplicar</Button>
      <Button type="button" size="sm" variant="ghost" onClick={deleteSelected} disabled={!selectedId} aria-label="Excluir visualização selecionada">Excluir</Button>
      {storageError && <p role="alert" className="w-full text-sm text-destructive">Não foi possível salvar a visualização neste navegador.</p>}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    </div>
  );
}
