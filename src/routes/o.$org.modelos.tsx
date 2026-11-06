import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getModelos, createModelo, updateModelo, deleteModelo, type Modelo } from "@/api/modelos";
import { withAuth } from "@/components/withAuth";
import { usePermission } from "@/hooks/usePermission";
import { useOnline } from "@/hooks/useOnline";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LayoutTemplate, Edit, Trash2, Eye } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";

const ModeloFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  area: z.string().min(1, "Área é obrigatória"),
  template: z.string().min(1, "Template é obrigatório"),
});

export const Route = createFileRoute("/o/$org/modelos")({
  component: ModelosPage,
});

function ModelosPage() {
  const canCreate = usePermission("modelo:create");
  const canEdit = usePermission("modelo:edit");
  const canDelete = usePermission("modelo:delete");
  const { isOnline } = useOnline();
  const queue = useOfflineQueue();
  const queryClient = useQueryClient();

  const { data: modelos = [], isLoading, error } = useQuery({
    queryKey: ["modelos"],
    queryFn: getModelos,
  });

  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [previewModelo, setPreviewModelo] = React.useState<Modelo | null>(null);

  const form = useForm<z.infer<typeof ModeloFormSchema>>({
    resolver: zodResolver(ModeloFormSchema),
    defaultValues: { name: "", area: "", template: "" },
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createModelo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      form.reset();
      setOpenDialog(false);
      notify("Modelo criado com sucesso");
    },
    onError: () => notify("Erro ao criar modelo", { type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Modelo> }) => updateModelo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      setOpenDialog(false);
      notify("Modelo atualizado");
    },
    onError: () => notify("Erro ao atualizar modelo", { type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteModelo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      notify("Modelo excluído");
    },
    onError: () => notify("Erro ao excluir modelo", { type: "error" }),
  });

  const handleSubmit = (values: z.infer<typeof ModeloFormSchema>) => {
    if (editingId) {
      queue.enqueue(() => updateMutation.mutateAsync({ id: editingId, data: values }));
    } else {
      queue.enqueue(() => createMutation.mutateAsync(values));
    }
    setEditingId(null);
  };

  if (isLoading) return <div className="p-4">Carregando modelos…</div>;
  if (error) return <div className="p-4 text-red-600">Erro ao carregar modelos.</div>;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutTemplate className="size-6 text-primary" /> Modelos
        </h1>
        {canCreate && (
          <Button
            variant="default"
            onClick={() => {
              form.reset();
              setEditingId(null);
              setOpenDialog(true);
            }}
          >
            <Plus className="size-4 mr-2" /> Novo modelo
          </Button>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Modelos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelos.map((modelo) => (
                  <TableRow key={modelo.id}>
                    <TableCell>{modelo.id}</TableCell>
                    <TableCell>{modelo.name}</TableCell>
                    <TableCell>{modelo.area}</TableCell>
                    <TableCell>{new Date(modelo.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => setPreviewModelo(modelo)}>
                          <Eye className="size-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const found = modelos.find((m) => m.id === modelo.id);
                              if (found) {
                                form.reset(found);
                                setEditingId(modelo.id);
                                setOpenDialog(true);
                              }
                            }}
                          >
                            <Edit className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm("Excluir modelo?")) {
                                queue.enqueue(() => deleteMutation.mutateAsync(modelo.id));
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para criar / editar modelo */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar modelo" : "Novo modelo"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Contrato de Honorários" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Jurídica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Civil, Trabalhista" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template (placeholders)</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="{{cliente}}..., {{advogado}}..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!isOnline && !queue}>
                  {editingId ? "Salvar alterações" : "Criar modelo"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview modal */}
      <Dialog open={previewModelo !== null} onOpenChange={() => setPreviewModelo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré‑visualização do modelo</DialogTitle>
          </DialogHeader>
          {previewModelo && (
            <div className="p-4 border rounded bg-white text-sm">
              <p className="font-medium">Nome: {previewModelo.name}</p>
              <p className="font-medium">Área: {previewModelo.area}</p>
              <p className="mt-2">{previewModelo.template}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewModelo(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const withAuthRoute = withAuth(Route);
