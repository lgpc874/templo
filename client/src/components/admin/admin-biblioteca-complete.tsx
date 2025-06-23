import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, ArrowUp, ArrowDown, Settings, BookOpen, Eye, Edit, Trash2, Move } from 'lucide-react';
import { GrimoireManager } from './grimoire-manager';
import GrimoireCompleteEditor from './grimoire-complete-editor';
import type { Grimoire, LibrarySection } from '@shared/schema';

interface SectionWithGrimoires extends LibrarySection {
  grimoires: Grimoire[];
}

export default function AdminBibliotecaComplete() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('grimoires');
  const [editingSection, setEditingSection] = useState<LibrarySection | null>(null);
  const [showGrimoireEditor, setShowGrimoireEditor] = useState(false);
  const [editingGrimoire, setEditingGrimoire] = useState<Grimoire | null>(null);

  // Buscar seções
  const { data: sections = [], isLoading: sectionsLoading } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library/sections'],
  });

  // Buscar todos os grimórios (admin)
  const { data: allGrimoires = [], isLoading: grimoiresLoading } = useQuery<Grimoire[]>({
    queryKey: ['/api/admin/grimoires'],
  });

  // Agrupar grimórios por seção
  const sectionsWithGrimoires: SectionWithGrimoires[] = sections.map(section => ({
    ...section,
    grimoires: allGrimoires.filter(g => g.section_id === section.id)
  }));

  // Mutação para reordenar grimório
  const reorderGrimoireMutation = useMutation({
    mutationFn: async ({ grimoireId, newOrder }: { grimoireId: number; newOrder: number }) => {
      return apiRequest('PUT', `/api/admin/grimoires/${grimoireId}/order`, { display_order: newOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
      toast({
        title: 'Ordem atualizada',
        description: 'A ordem do grimório foi alterada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao reordenar grimório.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar seção
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<LibrarySection> }) => {
      return apiRequest('PUT', `/api/admin/library-sections/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/library/sections'] });
      toast({
        title: 'Seção atualizada',
        description: 'As configurações da seção foram salvas.',
      });
      setEditingSection(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar seção.',
        variant: 'destructive',
      });
    },
  });

  // Mover grimório para outra seção
  const moveGrimoireToSection = useMutation({
    mutationFn: async ({ grimoireId, newSectionId }: { grimoireId: number; newSectionId: number }) => {
      return apiRequest('PUT', `/api/admin/grimoires/${grimoireId}`, { section_id: newSectionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
      toast({
        title: 'Grimório movido',
        description: 'O grimório foi movido para a nova seção.',
      });
    },
  });

  // Reordenar grimório dentro da seção
  const moveGrimoire = (grimoire: Grimoire, direction: 'up' | 'down') => {
    const sectionGrimoires = allGrimoires
      .filter(g => g.section_id === grimoire.section_id)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    const currentIndex = sectionGrimoires.findIndex(g => g.id === grimoire.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sectionGrimoires.length) return;
    
    const newOrder = sectionGrimoires[newIndex].display_order || 0;
    reorderGrimoireMutation.mutate({ grimoireId: grimoire.id, newOrder });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-400 font-cinzel">Biblioteca Administrativa</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="grimoires">Gerenciar Grimórios</TabsTrigger>
          <TabsTrigger value="sections">Seções & Ordenação</TabsTrigger>
        </TabsList>

        <TabsContent value="grimoires">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-amber-400">Grimórios</h2>
              <Button 
                onClick={() => {
                  setEditingGrimoire(null);
                  setShowGrimoireEditor(true);
                }}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Grimório Avançado
              </Button>
            </div>
            <GrimoireManager />
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <div className="grid gap-6">
            {sectionsWithGrimoires.map((section) => (
              <Card key={section.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-amber-400 font-cinzel">
                        {section.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {section.description} • {section.grimoires.length} grimórios
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(section)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {section.grimoires.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      Nenhum grimório nesta seção
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {section.grimoires
                        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                        .map((grimoire, index) => (
                          <div
                            key={grimoire.id}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-400 w-8">
                                #{grimoire.display_order || index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-white">
                                  {grimoire.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant={grimoire.is_published ? "default" : "secondary"}>
                                    {grimoire.is_published ? 'Publicado' : 'Rascunho'}
                                  </Badge>
                                  {grimoire.is_paid && (
                                    <Badge variant="outline">R$ {grimoire.price}</Badge>
                                  )}
                                  {grimoire.is_restricted && (
                                    <Badge variant="destructive">Restrito</Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Mover seção */}
                              <select
                                value={grimoire.section_id}
                                onChange={(e) => {
                                  const newSectionId = parseInt(e.target.value);
                                  if (newSectionId !== grimoire.section_id) {
                                    moveGrimoireToSection.mutate({
                                      grimoireId: grimoire.id,
                                      newSectionId
                                    });
                                  }
                                }}
                                className="text-xs bg-gray-600 border-gray-500 rounded px-2 py-1"
                              >
                                {sections.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>

                              {/* Controles de ordem */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveGrimoire(grimoire, 'up')}
                                disabled={index === 0 || reorderGrimoireMutation.isPending}
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveGrimoire(grimoire, 'down')}
                                disabled={index === section.grimoires.length - 1 || reorderGrimoireMutation.isPending}
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
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

      {/* Modal de edição de seção */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-amber-400">Editar Seção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="section-name">Nome da Seção</Label>
                <Input
                  id="section-name"
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="section-description">Descrição</Label>
                <Input
                  id="section-description"
                  value={editingSection.description || ''}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    description: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="section-color">Cor da Seção</Label>
                <Input
                  id="section-color"
                  value={editingSection.color_scheme || ''}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    color_scheme: e.target.value
                  })}
                  placeholder="#D97706"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingSection(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    updateSectionMutation.mutate({
                      id: editingSection.id,
                      updates: {
                        name: editingSection.name,
                        description: editingSection.description,
                        color_scheme: editingSection.color_scheme
                      }
                    });
                  }}
                  disabled={updateSectionMutation.isPending}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal do Editor Avançado de Grimórios */}
      {showGrimoireEditor && (
        <GrimoireCompleteEditor
          grimoire={editingGrimoire}
          onClose={() => {
            setShowGrimoireEditor(false);
            setEditingGrimoire(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
          }}
        />
      )}
    </div>
  );
}