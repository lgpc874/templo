import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Flame
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
}

export default function AdminModules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    html_content: '',
    order_number: 1
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

  // Buscar cursos  
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/admin/courses']
  });

  // Buscar módulos do curso selecionado
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: [`/api/courses/${selectedCourseId}/modules`],
    enabled: !!selectedCourseId
  });

  // Mutação para criar módulo
  const createModuleMutation = useMutation({
    mutationFn: async (data: typeof moduleForm & { course_id: number }) => {
      const response = await apiRequest('/api/admin/modules', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Módulo forjado com sucesso!", 
        description: "Um novo capítulo foi adicionado ao grimório do conhecimento"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourseId, 'modules'] });
      setModuleForm({
        title: '',
        html_content: '',
        order_number: 1
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Falha na criação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutação para atualizar módulo
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Module> }) => {
      const response = await apiRequest(`/api/admin/modules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Módulo transmutado!", 
        description: "As alterações foram seladas nos registros arcanos"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourseId, 'modules'] });
      setEditingModule(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Falha na transmutação", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutação para deletar módulo
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/modules/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Módulo banido!", 
        description: "O capítulo foi removido dos registros do templo"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourseId, 'modules'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Falha no banimento", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !moduleForm.title || !moduleForm.html_content) {
      toast({ 
        title: "Ritual incompleto", 
        description: "Selecione um curso e preencha todos os campos sagrados",
        variant: "destructive" 
      });
      return;
    }
    
    createModuleMutation.mutate({ 
      ...moduleForm, 
      course_id: selectedCourseId 
    });
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;
    updateModuleMutation.mutate({ 
      id: editingModule.id, 
      data: editingModule 
    });
  };

  const handleDeleteModule = (id: number) => {
    if (confirm('Tem certeza que deseja banir este módulo dos registros arcanos?')) {
      deleteModuleMutation.mutate(id);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* Efeitos místicos de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          <div className="container mx-auto px-4 py-8">
            {/* Header Místico */}
            <div className="text-center mb-12">
              <div className="mb-6">
                <div className="relative inline-block">
                  <FileText className="w-16 h-16 mx-auto text-blue-400 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                Libri Modulus
              </h1>
              
              <p className="text-xl text-gray-300 mb-8" style={{ fontFamily: 'EB Garamond' }}>
                Teça os capítulos sagrados que compõem cada jornada de transformação
              </p>

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

                <Button
                  onClick={() => setLocation('/admin-courses')}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black font-bold"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Gerenciar Cursos
                </Button>
              </div>
            </div>

            {/* Seleção do Curso */}
            <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm shadow-xl shadow-blue-900/30 mb-8">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                  <Scroll className="w-5 h-5 mr-2" />
                  Escolha o Grimório Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCourseId?.toString() || ""} onValueChange={(value) => setSelectedCourseId(parseInt(value))}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um curso para tecer seus módulos..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            style={{ borderColor: course.course_sections?.color }}
                            className="text-xs"
                          >
                            {course.course_sections?.name}
                          </Badge>
                          {course.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedCourseId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Formulário de Criação */}
                <Card className="bg-black/40 border-green-500/30 backdrop-blur-sm shadow-xl shadow-green-900/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                      <Plus className="w-5 h-5 mr-2" />
                      Forjar Novo Módulo
                    </CardTitle>
                    {selectedCourse && (
                      <p className="text-gray-400 text-sm" style={{ fontFamily: 'EB Garamond' }}>
                        Para o curso: <span className="text-blue-300">{selectedCourse.title}</span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateModule} className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-gray-300">Título do Capítulo *</Label>
                        <Input
                          id="title"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                          className="bg-gray-800/50 border-gray-600 text-white mt-2"
                          placeholder="Nome místico do módulo..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="content" className="text-gray-300">Conteúdo Arcano *</Label>
                        <Textarea
                          id="content"
                          value={moduleForm.html_content}
                          onChange={(e) => setModuleForm({...moduleForm, html_content: e.target.value})}
                          className="bg-gray-800/50 border-gray-600 text-white mt-2 min-h-[200px]"
                          placeholder="<h2>Bem-vindo ao módulo...</h2>
<p>Conteúdo HTML do módulo com formatação rica...</p>"
                        />
                      </div>

                      <div>
                        <Label htmlFor="order" className="text-gray-300">Ordem no Grimório</Label>
                        <Input
                          id="order"
                          type="number"
                          value={moduleForm.order_number}
                          onChange={(e) => setModuleForm({...moduleForm, order_number: parseInt(e.target.value) || 1})}
                          className="bg-gray-800/50 border-gray-600 text-white mt-2"
                          min="1"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3"
                        disabled={createModuleMutation.isPending}
                      >
                        {createModuleMutation.isPending ? (
                          <>
                            <Flame className="w-4 h-4 mr-2 animate-spin" />
                            Forjando nas Chamas...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Forjar Módulo
                          </>
                        )}
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
                            className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-purple-300 mb-1" style={{ fontFamily: 'Cinzel Decorative' }}>
                                  {module.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                                    Ordem: {module.order_number}
                                  </Badge>
                                  <span>•</span>
                                  <span>{module.html_content.length} caracteres</span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingModule(module)}
                                  className="text-amber-400 border-amber-400/50 hover:bg-amber-400/10"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteModule(module.id)}
                                  className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
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
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <Card className="bg-gray-900/95 border-amber-600/50 max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-amber-400 flex items-center" style={{ fontFamily: 'Cinzel Decorative' }}>
                      <Edit className="w-5 h-5 mr-2" />
                      Transmutação do Módulo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 overflow-y-auto">
                    <div>
                      <Label className="text-gray-300">Título</Label>
                      <Input
                        value={editingModule.title}
                        onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
                        className="bg-gray-800/50 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Conteúdo</Label>
                      <Textarea
                        value={editingModule.html_content}
                        onChange={(e) => setEditingModule({...editingModule, html_content: e.target.value})}
                        className="bg-gray-800/50 border-gray-600 text-white mt-2 min-h-[300px]"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Ordem</Label>
                      <Input
                        type="number"
                        value={editingModule.order_number}
                        onChange={(e) => setEditingModule({...editingModule, order_number: parseInt(e.target.value) || 1})}
                        className="bg-gray-800/50 border-gray-600 text-white mt-2"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleUpdateModule}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-black font-bold flex-1"
                        disabled={updateModuleMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Selar Transmutação
                      </Button>
                      <Button
                        onClick={() => setEditingModule(null)}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Cancelar Ritual
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}