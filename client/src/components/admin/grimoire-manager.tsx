import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pencil, Eye, Download, Trash2, Plus, Search, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { GrimoireEditor } from './grimoire-editor';
import type { Grimoire, LibrarySection } from '@shared/schema';

export function GrimoireManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedGrimoire, setSelectedGrimoire] = useState<Grimoire | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('published');

  // Buscar grimórios (usando rota pública funcionando)
  const { data: grimoires = [], isLoading } = useQuery<Grimoire[]>({
    queryKey: ['/api/grimoires'],
  });

  // Buscar seções
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library/sections'],
  });

  // Mutação para deletar grimório
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/grimoires/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Grimório deletado',
        description: 'O grimório foi removido com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
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

  // Mutação para alterar status de publicação
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: number; is_published: boolean }) => {
      return apiRequest('PUT', `/api/admin/grimoires/${id}`, { is_published });
    },
    onSuccess: (_, { is_published }) => {
      toast({
        title: is_published ? 'Grimório publicado!' : 'Grimório despublicado!',
        description: `O grimório foi ${is_published ? 'publicado' : 'movido para rascunhos'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status.',
        variant: 'destructive',
      });
    },
  });

  // Filtrar grimórios
  const filteredGrimoires = grimoires.filter(grimoire => {
    const matchesSearch = grimoire.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grimoire.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'published' ? grimoire.is_published : !grimoire.is_published;
    
    return matchesSearch && matchesTab;
  });

  // Obter nome da seção
  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section?.name || 'Seção desconhecida';
  };

  // Download como HTML
  const downloadGrimoireHTML = (grimoire: Grimoire) => {
    const sectionColors: { [key: string]: string } = {
      'Atrium Ignis': '#8b0000',
      'Porta Umbrae': '#6a0dad',
      'Arcana Noctis': '#003366',
      'Via Tenebris': '#111111',
      'Templo do Abismo': '#1a0a0a'
    };

    const sectionName = getSectionName(grimoire.section_id);
    const primaryColor = sectionColors[sectionName] || grimoire.background_color || '#1a0a0a';

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${grimoire.title}</title>
    <style>
        body {
            font-family: 'EB Garamond', serif;
            background-color: ${primaryColor};
            color: #f4f1e8;
            line-height: 1.7;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2, h3 { 
            font-family: 'Cinzel', serif; 
            color: #D97706;
            text-align: center;
        }
        .grimoire-content { 
            font-size: 16px; 
        }
        .section-badge {
            display: inline-block;
            background: #D97706;
            color: #000;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: bold;
            margin-bottom: 2rem;
        }
        ${grimoire.custom_css || ''}
    </style>
</head>
<body>
    <div class="section-badge">${sectionName}</div>
    <h1>${grimoire.title}</h1>
    ${grimoire.excerpt ? `<p><em>${grimoire.excerpt}</em></p>` : ''}
    <div class="grimoire-content">
        ${grimoire.content}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${grimoire.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (editorMode) {
    return (
      <GrimoireEditor
        grimoire={selectedGrimoire || undefined}
        mode={editorMode}
        onClose={() => {
          setEditorMode(null);
          setSelectedGrimoire(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-400 font-cinzel">Gerenciar Grimórios</h1>
          <p className="text-gray-400 mt-2">
            Crie, edite e publique grimórios com funcionalidades avançadas
          </p>
        </div>
        <Button 
          onClick={() => setEditorMode('create')}
          className="bg-amber-600 hover:bg-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Grimório
        </Button>
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar grimórios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs para Publicados vs Rascunhos */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="published" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Publicados ({grimoires.filter(g => g.is_published).length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Rascunhos ({grimoires.filter(g => !g.is_published).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGrimoires.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'Nenhum grimório encontrado' : 'Nenhum grimório publicado ainda'}
                </p>
              </div>
            ) : (
              filteredGrimoires.map((grimoire) => (
                <GrimoireCard
                  key={grimoire.id}
                  grimoire={grimoire}
                  sectionName={getSectionName(grimoire.section_id)}
                  onEdit={() => {
                    setSelectedGrimoire(grimoire);
                    setEditorMode('edit');
                  }}
                  onDelete={() => deleteMutation.mutate(grimoire.id)}
                  onTogglePublish={() => togglePublishMutation.mutate({
                    id: grimoire.id,
                    is_published: !grimoire.is_published
                  })}
                  onDownload={() => downloadGrimoireHTML(grimoire)}
                  isDeleting={deleteMutation.isPending}
                  isToggling={togglePublishMutation.isPending}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGrimoires.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm ? 'Nenhum rascunho encontrado' : 'Nenhum rascunho salvo ainda'}
                </p>
              </div>
            ) : (
              filteredGrimoires.map((grimoire) => (
                <GrimoireCard
                  key={grimoire.id}
                  grimoire={grimoire}
                  sectionName={getSectionName(grimoire.section_id)}
                  onEdit={() => {
                    setSelectedGrimoire(grimoire);
                    setEditorMode('edit');
                  }}
                  onDelete={() => deleteMutation.mutate(grimoire.id)}
                  onTogglePublish={() => togglePublishMutation.mutate({
                    id: grimoire.id,
                    is_published: !grimoire.is_published
                  })}
                  onDownload={() => downloadGrimoireHTML(grimoire)}
                  isDeleting={deleteMutation.isPending}
                  isToggling={togglePublishMutation.isPending}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface GrimoireCardProps {
  grimoire: Grimoire;
  sectionName: string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onDownload: () => void;
  isDeleting: boolean;
  isToggling: boolean;
}

function GrimoireCard({ 
  grimoire, 
  sectionName, 
  onEdit, 
  onDelete, 
  onTogglePublish, 
  onDownload,
  isDeleting, 
  isToggling 
}: GrimoireCardProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-amber-400/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-amber-400 text-lg font-cinzel line-clamp-2">
              {grimoire.title}
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm mt-1">
              {sectionName}
            </CardDescription>
          </div>
          {grimoire.cover_image_url && (
            <img 
              src={grimoire.cover_image_url} 
              alt="Capa" 
              className="w-12 h-16 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {grimoire.excerpt && (
          <p className="text-gray-300 text-sm line-clamp-3">
            {grimoire.excerpt}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant={grimoire.is_published ? "default" : "secondary"}>
            {grimoire.is_published ? 'Publicado' : 'Rascunho'}
          </Badge>
          {grimoire.is_paid && (
            <Badge variant="outline">R$ {grimoire.price}</Badge>
          )}
          {grimoire.is_restricted && (
            <Badge variant="destructive">Restrito</Badge>
          )}
          {grimoire.enable_pdf_download && (
            <Badge variant="outline">PDF</Badge>
          )}
        </div>
        
        <div className="text-xs text-gray-400">
          {grimoire.word_count} palavras • {grimoire.estimated_read_time}min leitura
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant={grimoire.is_published ? "outline" : "default"}
              size="sm"
              onClick={onTogglePublish}
              disabled={isToggling}
            >
              {grimoire.is_published ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar grimório?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O grimório "{grimoire.title}" será permanentemente removido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}