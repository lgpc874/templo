import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, ArrowUp, ArrowDown, Settings, BookOpen, Eye, Edit, Trash2, Move, Download } from 'lucide-react';
import type { Grimoire, LibrarySection } from '@shared/schema';

interface GrimoireFormData {
  title: string;
  content: string;
  section_id: number;
  price: string;
  is_paid: boolean;
  is_published: boolean;
  cover_image_url: string;
  excerpt: string;
}

export default function AdminBibliotecaWorking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('grimoires');
  const [editingGrimoire, setEditingGrimoire] = useState<Grimoire | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [formData, setFormData] = useState<GrimoireFormData>({
    title: '',
    content: '',
    section_id: 1,
    price: '0',
    is_paid: false,
    is_published: true,
    cover_image_url: '',
    excerpt: '',
  });

  // Buscar seções
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library/sections'],
  });

  // Buscar grimórios
  const { data: grimoires = [], isLoading: grimoiresLoading } = useQuery<Grimoire[]>({
    queryKey: ['/api/grimoires'],
  });

  // Mutação para criar grimório
  const createGrimoireMutation = useMutation({
    mutationFn: async (data: GrimoireFormData) => {
      const payload = {
        ...data,
        section_id: Number(data.section_id),
        price: Number(data.price),
        word_count: data.content.split(' ').length,
        estimated_read_time: Math.ceil(data.content.split(' ').length / 200),
      };
      return apiRequest('POST', '/api/admin/grimoires', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Grimório criado!',
        description: 'O grimório foi criado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
      setCreatingNew(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar grimório.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar grimório
  const updateGrimoireMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GrimoireFormData> }) => {
      const payload = {
        ...data,
        section_id: data.section_id ? Number(data.section_id) : undefined,
        price: data.price ? Number(data.price) : undefined,
      };
      return apiRequest('PUT', `/api/admin/grimoires/${id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: 'Grimório atualizado!',
        description: 'As alterações foram salvas.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
      setEditingGrimoire(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar grimório.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para deletar grimório
  const deleteGrimoireMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/grimoires/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Grimório deletado',
        description: 'O grimório foi removido.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar grimório.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      section_id: 1,
      price: '0',
      is_paid: false,
      is_published: true,
      cover_image_url: '',
      excerpt: '',
    });
  };

  const startEdit = (grimoire: Grimoire) => {
    setFormData({
      title: grimoire.title,
      content: grimoire.content,
      section_id: grimoire.section_id || 1,
      price: grimoire.price || '0',
      is_paid: grimoire.is_paid || false,
      is_published: grimoire.is_published || true,
      cover_image_url: grimoire.cover_image_url || '',
      excerpt: grimoire.excerpt || '',
    });
    setEditingGrimoire(grimoire);
  };

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.name || 'Seção desconhecida';
  };

  // Agrupar grimórios por seção
  const grimoiresBySection = sections.map(section => ({
    ...section,
    grimoires: grimoires.filter(g => g.section_id === section.id)
  }));

  const publishedGrimoires = grimoires.filter(g => g.is_published);
  const draftGrimoires = grimoires.filter(g => !g.is_published);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-amber-400 font-cinzel">Biblioteca Administrativa</h1>
          <p className="text-gray-400 mt-2">
            {sections.length} seções • {grimoires.length} grimórios ({publishedGrimoires.length} publicados, {draftGrimoires.length} rascunhos)
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setCreatingNew(true);
          }}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Grimório
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="grimoires">Gerenciar Grimórios</TabsTrigger>
          <TabsTrigger value="sections">Seções & Organização</TabsTrigger>
        </TabsList>

        <TabsContent value="grimoires" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grimórios Publicados */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400">Publicados ({publishedGrimoires.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {publishedGrimoires.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Nenhum grimório publicado</p>
                ) : (
                  publishedGrimoires.map((grimoire) => (
                    <div key={grimoire.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{grimoire.title}</h4>
                          <p className="text-sm text-gray-400">{getSectionName(grimoire.section_id || 1)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {grimoire.is_paid && (
                              <Badge variant="outline">R$ {grimoire.price}</Badge>
                            )}
                            <Badge variant="default">Publicado</Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => startEdit(grimoire)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteGrimoireMutation.mutate(grimoire.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Rascunhos */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400">Rascunhos ({draftGrimoires.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftGrimoires.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Nenhum rascunho salvo</p>
                ) : (
                  draftGrimoires.map((grimoire) => (
                    <div key={grimoire.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{grimoire.title}</h4>
                          <p className="text-sm text-gray-400">{getSectionName(grimoire.section_id || 1)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {grimoire.is_paid && (
                              <Badge variant="outline">R$ {grimoire.price}</Badge>
                            )}
                            <Badge variant="secondary">Rascunho</Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => startEdit(grimoire)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteGrimoireMutation.mutate(grimoire.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <div className="grid gap-6">
            {grimoiresBySection.map((section) => (
              <Card key={section.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-amber-400 font-cinzel">{section.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {section.description} • {section.grimoires.length} grimórios
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {section.grimoires.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nenhum grimório nesta seção</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.grimoires.map((grimoire) => (
                        <div key={grimoire.id} className="p-3 bg-gray-700 rounded-lg">
                          <h4 className="font-medium text-white text-sm">{grimoire.title}</h4>
                          <div className="flex items-center space-x-1 mt-2">
                            <Badge variant={grimoire.is_published ? "default" : "secondary"} className="text-xs">
                              {grimoire.is_published ? 'Pub' : 'Rasc'}
                            </Badge>
                            {grimoire.is_paid && (
                              <Badge variant="outline" className="text-xs">R$ {grimoire.price}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de criação/edição */}
      {(creatingNew || editingGrimoire) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-amber-400">
                {creatingNew ? 'Criar Novo Grimório' : 'Editar Grimório'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do grimório..."
                  />
                </div>
                <div>
                  <Label htmlFor="section">Seção</Label>
                  <Select 
                    value={formData.section_id.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, section_id: Number(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Descrição/Resumo</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Breve descrição do grimório..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo HTML</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo HTML do grimório..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cover_url">URL da Capa</Label>
                  <Input
                    id="cover_url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://exemplo.com/capa.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_paid"
                    checked={formData.is_paid}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_paid: checked }))}
                  />
                  <Label htmlFor="is_paid">Grimório pago</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label htmlFor="is_published">Publicar imediatamente</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatingNew(false);
                    setEditingGrimoire(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (creatingNew) {
                      createGrimoireMutation.mutate(formData);
                    } else if (editingGrimoire) {
                      updateGrimoireMutation.mutate({
                        id: editingGrimoire.id,
                        data: formData
                      });
                    }
                  }}
                  disabled={createGrimoireMutation.isPending || updateGrimoireMutation.isPending || !formData.title.trim()}
                >
                  {creatingNew ? 'Criar Grimório' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}