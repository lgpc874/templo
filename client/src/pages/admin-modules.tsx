import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import RichTextEditor from "@/components/rich-text-editor";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  ArrowLeft,
  BookOpen,
  Scroll,
  Crown,
  Flame,
  RefreshCw,
  Settings,
  Eye,
  Target,
  CheckCircle,
  Zap
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  required_role: string;
  is_published: boolean;
  price: number;
  is_paid: boolean;
  sort_order: number;
  course_section_id: number;
  course_sections?: {
    name: string;
    color: string;
  };
}

interface Module {
  id: number;
  course_id: number;
  title: string;
  html_content: string;
  order_number: number;
  requires_submission?: boolean;
  ritual_mandatory?: boolean;
}

export default function AdminModulesFinal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    html_content: '',
    order_number: 1,
    requires_submission: false,
    ritual_mandatory: false,
    submission_text: '',
    ritual_text: '',
    custom_css: '',
    submission_position: 'before'
  });

  // Verificar se é admin
  if (user?.email !== 'admin@templodoabismo.com.br') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
          <Card className="bg-black/80 border-red-600/50 backdrop-blur-sm shadow-2xl shadow-red-900/50">
            <CardContent className="p-8 text-center">
              <Crown className="w-16 h-16 mx-auto text-red-500 animate-pulse mb-6" />
              <h1 className="text-3xl font-bold text-red-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                Sanctum Clausum
              </h1>
              <p className="text-gray-300 text-lg" style={{ fontFamily: 'EB Garamond' }}>
                Apenas o Magus Supremo pode adentrar nestes domínios sagrados
              </p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Carregar cursos
  const loadCourses = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast({
        title: "Erro ao carregar cursos",
        description: "Não foi possível carregar os cursos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Carregar módulos
  const loadModules = async (courseId: number) => {
    setModulesLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const modulesData = await response.json();
        setModules(modulesData);
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: "Erro ao carregar módulos",
        description: "Não foi possível carregar os módulos",
        variant: "destructive"
      });
    } finally {
      setModulesLoading(false);
    }
  };

  // Inicializar cursos automaticamente
  if (!initialized && !loading) {
    loadCourses();
  }

  const handleCourseChange = (courseId: string) => {
    const id = parseInt(courseId);
    setSelectedCourseId(id);
    setModules([]);
    loadModules(id);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...moduleForm, 
          course_id: selectedCourseId 
        })
      });

      if (response.ok) {
        const newModule = await response.json();
        setModules([...modules, newModule]);
        setModuleForm({
          title: '',
          html_content: '',
          order_number: modules.length + 1,
          requires_submission: false,
          ritual_mandatory: false
        });
        toast({ 
          title: "Módulo forjado com sucesso!", 
          description: "Um novo capítulo foi adicionado ao grimório do conhecimento"
        });
      } else {
        throw new Error('Erro ao criar módulo');
      }
    } catch (error: any) {
      toast({ 
        title: "Falha na criação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleUpdateModule = async (module: Module) => {
    if (!editingModule) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingModule)
      });

      if (response.ok) {
        const updatedModule = await response.json();
        setModules(modules.map(m => m.id === module.id ? updatedModule : m));
        setEditingModule(null);
        toast({ 
          title: "Módulo transmutado!", 
          description: "As alterações foram seladas nos registros arcanos"
        });
        
        // Recarregar a lista de módulos para garantir sincronização
        if (selectedCourseId) {
          loadModules(selectedCourseId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar módulo');
      }
    } catch (error: any) {
      toast({ 
        title: "Falha na transmutação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este módulo?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/modules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setModules(modules.filter(m => m.id !== id));
        toast({ 
          title: "Módulo banido!", 
          description: "O conhecimento foi removido dos registros"
        });
        
        // Recarregar a lista de módulos para garantir sincronização
        if (selectedCourseId) {
          loadModules(selectedCourseId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar módulo');
      }
    } catch (error: any) {
      toast({ 
        title: "Falha no banimento", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-4xl font-bold text-purple-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Forja dos Módulos
                </h1>
                <p className="text-xl text-gray-300" style={{ fontFamily: 'EB Garamond' }}>
                  Criação dos capítulos que compõem os grimórios do conhecimento
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto gap-4">
                <Button
                  onClick={() => setLocation('/admin')}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retornar ao Sanctum
                </Button>
                
                <div className="flex items-center text-blue-300/80">
                  <Flame className="w-4 h-4 mr-2 animate-pulse" />
                  <span style={{ fontFamily: 'EB Garamond' }}>
                    Forjador de Conhecimento
                  </span>
                  <Flame className="w-4 h-4 ml-2 animate-pulse" />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={loadCourses}
                    variant="outline"
                    className="text-purple-400 border-purple-600 hover:bg-purple-600/10"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button
                    onClick={() => setLocation('/admin-courses')}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black font-bold"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Gerenciar Cursos
                  </Button>
                </div>
              </div>
            </div>

            {/* Seletor de Curso */}
            <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm shadow-xl shadow-purple-900/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                  <Scroll className="w-5 h-5 mr-2" />
                  Selecionar Grimório
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Escolha o curso para gerenciar seus módulos</Label>
                    <Select 
                      value={selectedCourseId?.toString() || ''} 
                      onValueChange={handleCourseChange}
                    >
                      <SelectTrigger className="bg-black/30 border-purple-500/50 text-white">
                        <SelectValue placeholder="Selecione um curso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            <div className="flex items-center">
                              <Badge 
                                variant="outline" 
                                className="mr-2 text-xs"
                                style={{ 
                                  color: course.course_sections?.color,
                                  borderColor: course.course_sections?.color 
                                }}
                              >
                                {course.course_sections?.name}
                              </Badge>
                              {course.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedCourseId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulário de Criação de Módulo */}
              <Card className="bg-black/40 border-green-500/30 backdrop-blur-sm shadow-xl shadow-green-900/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                    <Plus className="w-5 h-5 mr-2" />
                    Forjar Novo Capítulo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateModule} className="space-y-6">
                    <div>
                      <Label className="text-gray-300">Título do Módulo</Label>
                      <Input
                        value={moduleForm.title}
                        onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                        required
                        className="bg-black/30 border-green-500/50 text-white placeholder-gray-400"
                        placeholder="Ex: Introdução aos Mistérios"
                      />
                    </div>

                    <Tabs defaultValue="content" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                        <TabsTrigger value="content">Conteúdo</TabsTrigger>
                        <TabsTrigger value="submission">Submissão</TabsTrigger>
                        <TabsTrigger value="completion">Conclusão</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>

                      <TabsContent value="content" className="space-y-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Conteúdo HTML do Módulo</Label>
                          <RichTextEditor
                            value={moduleForm.html_content}
                            onChange={(value) => setModuleForm({...moduleForm, html_content: value})}
                            placeholder="Insira o conteúdo HTML do módulo..."
                            height="300px"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-gray-300 mb-2 block">CSS Customizado (Opcional)</Label>
                          <Textarea
                            value={moduleForm.custom_css || ''}
                            onChange={(e) => setModuleForm({...moduleForm, custom_css: e.target.value})}
                            placeholder="CSS personalizado para este módulo..."
                            className="bg-gray-800 border-gray-600 text-white min-h-[100px] font-mono text-sm"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="submission" className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="requires_submission_new"
                            checked={moduleForm.requires_submission}
                            onCheckedChange={(checked) => 
                              setModuleForm({...moduleForm, requires_submission: checked as boolean})
                            }
                          />
                          <Label htmlFor="requires_submission_new" className="text-gray-300">
                            Este módulo requer submissão/aceitação
                          </Label>
                        </div>

                        {moduleForm.requires_submission && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-gray-300 mb-2 block">Posição da Submissão</Label>
                              <Select 
                                value={moduleForm.submission_position || 'before'}
                                onValueChange={(value) => setModuleForm({...moduleForm, submission_position: value})}
                              >
                                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="before">Antes do conteúdo (bloqueia acesso)</SelectItem>
                                  <SelectItem value="after">Após o conteúdo</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-gray-400 mt-1">
                                {moduleForm.submission_position === 'before' 
                                  ? 'O usuário deve aceitar antes de ver o conteúdo'
                                  : 'A submissão aparece no final do módulo'
                                }
                              </p>
                            </div>

                            <div>
                              <Label className="text-gray-300 mb-2 block">Texto da Submissão</Label>
                              <RichTextEditor
                                value={moduleForm.submission_text || ''}
                                onChange={(value) => setModuleForm({...moduleForm, submission_text: value})}
                                placeholder="Texto do ritual de submissão e aceitação..."
                                height="200px"
                              />
                              <p className="text-sm text-gray-400 mt-2">
                                Este é o ritual onde a pessoa declara e aceita o caminho do templo
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 mt-4">
                          <Checkbox 
                            id="ritual_mandatory_new"
                            checked={moduleForm.ritual_mandatory}
                            onCheckedChange={(checked) => 
                              setModuleForm({...moduleForm, ritual_mandatory: checked as boolean})
                            }
                          />
                          <Label htmlFor="ritual_mandatory_new" className="text-gray-300">
                            Ritual Obrigatório
                          </Label>
                        </div>

                        {moduleForm.ritual_mandatory && (
                          <div>
                            <Label className="text-gray-300 mb-2 block">Instruções do Ritual</Label>
                            <RichTextEditor
                              value={moduleForm.ritual_text || ''}
                              onChange={(value) => setModuleForm({...moduleForm, ritual_text: value})}
                              placeholder="Instruções detalhadas do ritual obrigatório..."
                              height="200px"
                            />
                            <p className="text-sm text-gray-400 mt-2">
                              Instruções específicas que o estudante deve seguir
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="completion" className="space-y-4">
                        <div className="text-center py-8 text-gray-400">
                          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Sistema de requisitos de conclusão</p>
                          <p className="text-sm">Em desenvolvimento - será implementado na próxima versão</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="preview" className="space-y-4">
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-4">Preview do Módulo</h3>
                          
                          {moduleForm.requires_submission && moduleForm.submission_position === 'before' && (
                            <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-lg">
                              <h4 className="text-red-200 font-medium mb-2">Submissão Inicial (Bloqueia Acesso)</h4>
                              <div 
                                className="prose prose-invert prose-sm"
                                dangerouslySetInnerHTML={{ __html: moduleForm.submission_text || 'Texto da submissão...' }}
                              />
                            </div>
                          )}

                          <div className="mb-6">
                            <h4 className="text-white font-medium mb-2">Conteúdo Principal</h4>
                            <div 
                              className="prose prose-invert"
                              dangerouslySetInnerHTML={{ __html: moduleForm.html_content || 'Conteúdo do módulo...' }}
                            />
                          </div>

                          {moduleForm.ritual_mandatory && (
                            <div className="border-t border-gray-700 pt-4">
                              <h4 className="text-amber-200 font-medium mb-2">Ritual Obrigatório</h4>
                              <div 
                                className="prose prose-invert prose-sm text-amber-100"
                                dangerouslySetInnerHTML={{ __html: moduleForm.ritual_text || 'Instruções do ritual...' }}
                              />
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div>
                      <Label className="text-gray-300">Ordem do Módulo</Label>
                      <Input
                        type="number"
                        value={moduleForm.order_number}
                        onChange={(e) => setModuleForm({...moduleForm, order_number: parseInt(e.target.value) || 1})}
                        min="1"
                        className="bg-black/30 border-green-500/50 text-white"
                      />
                    </div>



                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Forjar Módulo
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Módulos */}
              <Card className="bg-black/40 border-purple-500/30 backdrop-blur-sm shadow-xl shadow-purple-900/30">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                    <BookOpen className="w-5 h-5 mr-2" />
                    Capítulos Existentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {modulesLoading ? (
                    <div className="text-center py-8">
                      <Flame className="w-8 h-8 mx-auto text-purple-400 animate-pulse mb-4" />
                      <p className="text-gray-400">Consultando os registros arcanos...</p>
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                      <p className="text-gray-400" style={{ fontFamily: 'EB Garamond' }}>
                        Nenhum módulo foi forjado ainda para este curso.
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Comece criando o primeiro capítulo da jornada.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {modules.map((module) => (
                        <div 
                          key={module.id} 
                          className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <Badge 
                                variant="outline" 
                                className="mr-3 text-xs text-purple-300 border-purple-400"
                              >
                                #{module.order_number}
                              </Badge>
                              <h3 className="font-semibold text-purple-200" style={{ fontFamily: 'EB Garamond' }}>
                                {module.title}
                              </h3>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingModule(module)}
                                className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteModule(module.id)}
                                className="text-red-400 border-red-400 hover:bg-red-400/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div 
                            className="text-sm text-gray-300 line-clamp-2"
                            dangerouslySetInnerHTML={{ 
                              __html: module.html_content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modal de Edição */}
          {editingModule && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-gray-900 border-purple-600/30 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Editar Módulo: {editingModule.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Título do Módulo</Label>
                      <Input
                        value={editingModule.title}
                        onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
                        className="bg-black/30 border-purple-500/50 text-white"
                        placeholder="Ex: Introdução aos Mistérios"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Ordem do Módulo</Label>
                      <Input
                        type="number"
                        value={editingModule.order_number}
                        onChange={(e) => setEditingModule({...editingModule, order_number: parseInt(e.target.value) || 1})}
                        className="bg-black/30 border-purple-500/50 text-white"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Conteúdo do Módulo</Label>
                    <div className="mt-2">
                      <RichTextEditor
                        value={editingModule.html_content}
                        onChange={(value) => setEditingModule({...editingModule, html_content: value})}
                        placeholder="Escreva o conteúdo do módulo..."
                        className="bg-black/30 border-purple-500/50"
                        height="400px"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_requires_submission"
                        checked={editingModule.requires_submission || false}
                        onChange={(e) => setEditingModule({...editingModule, requires_submission: e.target.checked})}
                      />
                      <Label htmlFor="edit_requires_submission" className="text-gray-300">
                        Requer Submissão
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_ritual_mandatory"
                        checked={editingModule.ritual_mandatory || false}
                        onChange={(e) => setEditingModule({...editingModule, ritual_mandatory: e.target.checked})}
                      />
                      <Label htmlFor="edit_ritual_mandatory" className="text-gray-300">
                        Ritual Obrigatório
                      </Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-6 border-t border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setEditingModule(null)}
                      className="text-gray-400 border-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleUpdateModule(editingModule)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}