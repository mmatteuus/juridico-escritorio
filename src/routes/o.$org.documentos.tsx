import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocumentos,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  type Documento,
} from "@/api/documentos";
import { withAuth } from "@/components/withAuth";
import { usePermission } from "@/hooks/usePermission";
import { useOnline } from "@/hooks/useOnline";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Edit, Trash2, Eye } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const DocumentoFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  status: z.enum(["Rascunho", "Autorizado", "Rejeitado"]),
});

export const Route = createFileRoute("/o/$org/documentos")({
  component: DocumentosPage,
});

function DocumentosPage() {
  const canCreate = usePermission("documento:create");
  const canEdit = usePermission("documento:edit");
  const canDelete = usePermission("documento:delete");
  const { isOnline } = useOnline();
  const queue = useOfflineQueue();
  const queryClient = useQueryClient();

  const {
    data: documentos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documentos"],
    queryFn: getDocumentos,
  });

  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<Documento | null>(null);

  const form = useForm<z.infer<typeof DocumentoFormSchema>>({
    resolver: zodResolver(DocumentoFormSchema),
    defaultValues: { title: "", type: "", status: "Rascunho" },
  });

  const createMutation = useMutation({
    mutationFn: createDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      form.reset();
      setOpenDialog(false);
      notify("Documento criado com sucesso");
    },
    onError: () => notify("Erro ao criar documento", { type: "error" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Documento> }) =>
      updateDocumento(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      setOpenDialog(false);
      notify("Documento atualizado com sucesso");
    },
    onError: () => notify("Erro ao atualizar documento", { type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      notify("Documento excluído com sucesso");
    },
    onError: () => notify("Erro ao excluir documento", { type: "error" }),
  });

  const handleSubmit = (values: z.infer<typeof DocumentoFormSchema>) => {
    if (editingId) {
      queue.enqueue(() => updateMutation.mutateAsync({ id: editingId, data: values }));
    } else {
      queue.enqueue(() => createMutation.mutateAsync(values));
    }
    setEditingId(null);
  };

  if (isLoading) return <div className="p-4">Carregando documentos…</div>;
  if (error) return <div className="p-4 text-red-600">Erro ao carregar documentos.</div>;

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="size-6 text-primary" /> Documentos
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
            <Plus className="size-4 mr-2" /> Novo documento
          </Button>
        )}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.id}</TableCell>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        doc.status === "Autorizado"
                          ? "bg-green-100 text-green-700"
                          : doc.status === "Rascunho"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(doc.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => setPreviewDoc(doc)}>
                          <Eye className="size-4" />
                        </Button>
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const found = documentos.find((d) => d.id === doc.id);
                              if (found) {
                                form.reset(found);
                                setEditingId(doc.id);
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
                              if (window.confirm("Tem certeza que deseja excluir este documento?")) {
                                queue.enqueue(() => deleteMutation.mutateAsync(doc.id));
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar documento" : "Novo documento"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do documento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Contrato">Contrato</SelectItem>
                            <SelectItem value="Procuração">Procuração</SelectItem>
                            <SelectItem value="Petição">Petição</SelectItem>
                            <SelectItem value="Declaração">Declaração</SelectItem>
                          </SelectContent>
                        </FormControl>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rascunho">Rascunho</SelectItem>
                            <SelectItem value="Autorizado">Autorizado</SelectItem>
                            <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                          </SelectContent>
                        </FormControl>
                      </Select>
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
                  {editingId ? "Salvar alterações" : "Criar documento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDoc !== null} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle>Pré-visualização do documento</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="border p-4 bg-white text-sm">
              <p><strong>Título:</strong> {previewDoc.title}</p>
              <p><strong>Tipo:</strong> {previewDoc.type}</p>
              <p><strong>Status:</strong> {previewDoc.status}</p>
              <hr />
              <p className="text-muted-foreground">
                Conteúdo do documento "{previewDoc.title}" será renderizado aqui (preview simulado).
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewDoc(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React from "react";

export const withAuthRoute = withAuth(Route);
