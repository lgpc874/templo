import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractTextFromHTML } from '@/lib/text-utils';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download, 
  Eye,
  FileText,
  Settings,
  Users,
  BarChart3,
  Folder,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Grimoire, LibrarySection } from '@shared/schema';
import CompleteGrimoireEditor from './complete-grimoire-editor';
import SectionEditor from './section-editor';

interface MobileAdminPanelProps {
  onClose?: () => void;
}

export default function MobileAdminPanel({ onClose }: MobileAdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [editingGrimoire, setEditingGrimoire] = useState<Grimoire | null>(null);
  const [showGrimoireEditor, setShowGrimoireEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<LibrarySection | null>(null);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('grimoires');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current section color
  const getCurrentSectionColor = () => {
    if (selectedSection) {
      const section = sections.find(s => s.id === selectedSection);
      return section?.color || '#D97706';
    }
    return '#D97706'; // Default golden color
  };

  // Consultar seções da biblioteca
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library-sections'],
  });

  // Consultar grimórios
  const { data: grimoires = [], isLoading: loadingGrimoires } = useQuery<Grimoire[]>({
    queryKey: ['/api/admin/grimoires'],
  });

  // Mutation para deletar grimório
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/grimoires/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Erro ao deletar grimório');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      toast({
        title: "Sucesso",
        description: "Grimório deletado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar grimório",
        variant: "destructive",
      });
    },
  });

  // Mutation para gerar PDF
  const generatePdfMutation = useMutation({
    mutationFn: async (grimoireId: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/grimoires/${grimoireId}/pdf`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!response.ok) throw new Error('Erro ao gerar PDF');
      
      // Download do arquivo PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `grimoire-${grimoireId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "PDF gerado e baixado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar PDF",
        variant: "destructive",
      });
    },
  });

  // Filtrar grimórios
  const filteredGrimoires = grimoires.filter(grimoire => {
    const matchesSearch = grimoire.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === null || grimoire.section_id === selectedSection;
    return matchesSearch && matchesSection;
  });

  const handleEditGrimoire = (grimoire: Grimoire) => {
    setEditingGrimoire(grimoire);
    setShowGrimoireEditor(true);
  };

  const handleNewGrimoire = () => {
    setEditingGrimoire(null);
    setShowGrimoireEditor(true);
  };

  const handleCloseEditor = () => {
    setShowGrimoireEditor(false);
    setEditingGrimoire(null);
    queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
  };

  const handleEditSection = (section: LibrarySection) => {
    setEditingSection(section);
    setShowSectionEditor(true);
  };

  const handleNewSection = () => {
    setEditingSection(null);
    setShowSectionEditor(true);
  };

  const handleCloseSectionEditor = () => {
    setShowSectionEditor(false);
    setEditingSection(null);
    queryClient.invalidateQueries({ queryKey: ['/api/library-sections'] });
  };

  // Estatísticas rápidas
  const stats = {
    totalGrimoires: grimoires.length,
    publishedGrimoires: grimoires.filter(g => g.is_published).length,
    draftGrimoires: grimoires.filter(g => !g.is_published).length,
    totalSections: sections.length
  };

  if (showGrimoireEditor) {
    return (
      <CompleteGrimoireEditor 
        grimoire={editingGrimoire || undefined}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Mobile-First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 
              className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 transition-colors duration-300"
              style={{ color: getCurrentSectionColor() }}
            >
              🏛️ Painel Administrativo
            </h1>
            <p 
              className="text-sm sm:text-base opacity-70 transition-colors duration-300"
              style={{ color: getCurrentSectionColor() }}
            >
              Gerenciar grimórios e seções da biblioteca
            </p>
          </div>
          
          {onClose && (
            <Button 
              onClick={onClose}
              variant="outline" 
              size="sm"
              className="w-full sm:w-auto"
            >
              Voltar ao Site
            </Button>
          )}
        </div>

        {/* Stats Cards - Mobile Stack */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card 
            className="bg-black/50 transition-colors duration-300"
            style={{ borderColor: `${getCurrentSectionColor()}30` }}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div 
                className="text-lg sm:text-2xl font-bold transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                {stats.totalGrimoires}
              </div>
              <div 
                className="text-xs sm:text-sm opacity-70 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Total
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-black/50 transition-colors duration-300"
            style={{ borderColor: `${getCurrentSectionColor()}30` }}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div 
                className="text-lg sm:text-2xl font-bold transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                {stats.publishedGrimoires}
              </div>
              <div 
                className="text-xs sm:text-sm opacity-70 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Publicados
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-black/50 transition-colors duration-300"
            style={{ borderColor: `${getCurrentSectionColor()}30` }}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div 
                className="text-lg sm:text-2xl font-bold transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                {stats.draftGrimoires}
              </div>
              <div 
                className="text-xs sm:text-sm opacity-70 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Rascunhos
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-black/50 transition-colors duration-300"
            style={{ borderColor: `${getCurrentSectionColor()}30` }}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div 
                className="text-lg sm:text-2xl font-bold transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                {stats.totalSections}
              </div>
              <div 
                className="text-xs sm:text-sm opacity-70 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Seções
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation - Mobile Scroll */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList 
            className="grid w-full grid-cols-3 bg-black/50 border mb-4 transition-colors duration-300"
            style={{ borderColor: `${getCurrentSectionColor()}30` }}
          >
            <TabsTrigger 
              value="grimoires" 
              className="text-xs sm:text-sm transition-colors duration-300"
              style={{
                color: activeTab === 'grimoires' ? getCurrentSectionColor() : '#9CA3AF',
                backgroundColor: activeTab === 'grimoires' ? `${getCurrentSectionColor()}20` : 'transparent'
              }}
            >
              <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Grimórios</span>
              <span className="sm:hidden">Grim.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sections" 
              className="text-xs sm:text-sm transition-colors duration-300"
              style={{
                color: activeTab === 'sections' ? getCurrentSectionColor() : '#9CA3AF',
                backgroundColor: activeTab === 'sections' ? `${getCurrentSectionColor()}20` : 'transparent'
              }}
            >
              <Folder className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Seções</span>
              <span className="sm:hidden">Seç.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-xs sm:text-sm transition-colors duration-300"
              style={{
                color: activeTab === 'analytics' ? getCurrentSectionColor() : '#9CA3AF',
                backgroundColor: activeTab === 'analytics' ? `${getCurrentSectionColor()}20` : 'transparent'
              }}
            >
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: GRIMÓRIOS */}
          <TabsContent value="grimoires" className="space-y-4">
            
            {/* Search & Filters - Mobile Stack */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300" 
                  style={{ color: getCurrentSectionColor() }}
                />
                <Input
                  placeholder="Buscar grimórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 text-sm sm:text-base transition-colors duration-300"
                  style={{ 
                    borderColor: `${getCurrentSectionColor()}30`,
                    color: getCurrentSectionColor()
                  }}
                />
              </div>
              
              <select
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-black/50 border rounded-md px-3 py-2 text-sm sm:text-base min-w-0 sm:min-w-[150px] transition-colors duration-300"
                style={{
                  borderColor: `${getCurrentSectionColor()}30`,
                  color: getCurrentSectionColor()
                }}
              >
                <option value="">Todas Seções</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
              
              <Button 
                onClick={handleNewGrimoire}
                className="w-full sm:w-auto text-black transition-colors duration-300"
                style={{
                  backgroundColor: getCurrentSectionColor()
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${getCurrentSectionColor()}CC`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = getCurrentSectionColor();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Novo</span>
                <span className="hidden sm:inline">Novo Grimório</span>
              </Button>
            </div>

            {/* Grimoires Grid - Mobile Responsive */}
            {loadingGrimoires ? (
              <div 
                className="text-center py-8 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Carregando grimórios...
              </div>
            ) : filteredGrimoires.length === 0 ? (
              <div 
                className="text-center py-8 opacity-70 transition-colors duration-300"
                style={{ color: getCurrentSectionColor() }}
              >
                Nenhum grimório encontrado
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredGrimoires.map((grimoire) => {
                  const grimoireSection = sections.find(s => s.id === grimoire.section_id);
                  const grimoireSectionColor = grimoireSection?.color || getCurrentSectionColor();
                  
                  return (
                    <Card 
                      key={grimoire.id} 
                      className="bg-black/50 hover:scale-[1.02] transition-all duration-300"
                      style={{
                        borderColor: `${grimoireSectionColor}30`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${grimoireSectionColor}50`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${grimoireSectionColor}30`;
                      }}
                    >
                      <CardHeader className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle 
                              className="text-sm sm:text-base truncate transition-colors duration-300"
                              style={{ color: grimoireSectionColor }}
                            >
                              {grimoire.title}
                            </CardTitle>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge 
                                variant={grimoire.is_published ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {grimoire.is_published ? "Publicado" : "Rascunho"}
                              </Badge>
                              {grimoire.is_paid && (
                                <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                  Pago
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      
                      {grimoire.excerpt && (
                        <p className="text-amber-200/70 text-xs sm:text-sm line-clamp-2 mt-2">
                          {extractTextFromHTML(grimoire.excerpt)}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleEditGrimoire(grimoire)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          onClick={() => generatePdfMutation.mutate(grimoire.id)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs sm:text-sm"
                          disabled={generatePdfMutation.isPending}
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          PDF
                        </Button>
                        
                        <Button
                          onClick={() => deleteMutation.mutate(grimoire.id)}
                          size="sm"
                          variant="destructive"
                          className="text-xs sm:text-sm"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            )}
          </TabsContent>

          {/* TAB: SEÇÕES */}
          <TabsContent value="sections" className="space-y-4">
            
            {/* Botão Criar Nova Seção */}
            <div className="flex justify-end">
              <Button 
                onClick={handleNewSection}
                className="w-full sm:w-auto text-black transition-colors duration-300"
                style={{ backgroundColor: getCurrentSectionColor() }}
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:hidden">Nova Seção</span>
                <span className="hidden sm:inline">Nova Seção</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sections.map((section) => {
                const sectionGrimoires = grimoires.filter(g => g.section_id === section.id);
                const sectionColor = section.color || '#D97706';
                
                return (
                  <Card 
                    key={section.id} 
                    className="bg-black/50 hover:scale-[1.02] transition-all duration-300"
                    style={{ borderColor: `${sectionColor}30` }}
                  >
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle 
                            className="text-sm sm:text-base flex items-center gap-2 transition-colors duration-300"
                            style={{ color: sectionColor }}
                          >
                            <span className="text-lg">{section.icon || '📚'}</span>
                            <span className="truncate">{section.name}</span>
                          </CardTitle>
                          <p 
                            className="text-xs sm:text-sm mt-1 opacity-70 transition-colors duration-300"
                            style={{ color: sectionColor }}
                          >
                            {sectionGrimoires.length} grimório(s)
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-3 sm:p-4 pt-0">
                      {section.description && (
                        <p 
                          className="text-xs sm:text-sm line-clamp-2 mb-3 opacity-60 transition-colors duration-300"
                          style={{ color: sectionColor }}
                        >
                          {section.description}
                        </p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleEditSection(section)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs sm:text-sm transition-colors duration-300"
                          style={{
                            borderColor: `${sectionColor}50`,
                            color: sectionColor
                          }}
                        >
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          onClick={() => {/* TODO: implementar deleção */}}
                          size="sm"
                          variant="destructive"
                          className="text-xs sm:text-sm"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB: ANALYTICS */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-amber-400 text-sm sm:text-base">
                    Grimórios por Seção
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2">
                    {sections.map(section => {
                      const count = grimoires.filter(g => g.section_id === section.id).length;
                      return (
                        <div key={section.id} className="flex justify-between items-center">
                          <span className="text-amber-200 text-xs sm:text-sm truncate">
                            {section.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-amber-400 text-sm sm:text-base">
                    Status dos Grimórios
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 text-xs sm:text-sm">Publicados</span>
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        {stats.publishedGrimoires}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-400 text-xs sm:text-sm">Rascunhos</span>
                      <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                        {stats.draftGrimoires}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 text-xs sm:text-sm">Pagos</span>
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        {grimoires.filter(g => g.is_paid).length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Editores Modal */}
      <SectionEditor 
        section={editingSection || undefined}
        isOpen={showSectionEditor}
        onClose={handleCloseSectionEditor}
      />
    </div>
  );
}