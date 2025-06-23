import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  FileText,
  ArrowLeft,
  Settings
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
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

interface CourseSection {
  id: number;
  name: string;
  description: string;
  required_role: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Estados dos formulários
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '',
    required_role: 'buscador',
    price: 0,
    is_paid: false,
    course_section_id: 1
  });

  // Verificar se é admin
  if (user?.email !== 'admin@templodoabismo.com.br') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="bg-red-900/20 border-red-600/30">
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
              <p className="text-gray-300">Apenas administradores podem acessar esta área.</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Buscar cursos
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao buscar cursos');
      return response.json();
    }
  });

  // Buscar seções
  const { data: courseSections = [] } = useQuery<CourseSection[]>({
    queryKey: ['/api/course-sections'],
    queryFn: async () => {
      const response = await fetch('/api/course-sections');
      if (!response.ok) throw new Error('Erro ao buscar seções');
      return response.json();
    }
  });

  // Mutação para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      return apiRequest('/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Curso criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setCourseForm({
        title: '',
        slug: '',
        description: '',
        image_url: '',
        required_role: 'buscador',
        price: 0,
        is_paid: false,
        course_section_id: 1
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar curso", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutação para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Course> }) => {
      return apiRequest(`/api/admin/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Curso atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      setEditingCourse(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar curso", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutação para deletar curso
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/courses/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: "Curso deletado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao deletar curso", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FRONTEND: Criando curso ===');
    console.log('Form data:', courseForm);
    
    if (!courseForm.title || !courseForm.description) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha título e descrição",
        variant: "destructive" 
      });
      return;
    }
    
    // Gerar slug automaticamente se não fornecido
    const slug = courseForm.slug || courseForm.title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log('Slug gerado:', slug);
    console.log('Dados finais:', { ...courseForm, slug });
    
    createCourseMutation.mutate({ ...courseForm, slug });
  };

  const handleUpdateCourse = (course: Course) => {
    if (!editingCourse) return;
    updateCourseMutation.mutate({ id: course.id, data: editingCourse });
  };

  const handleDeleteCourse = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este curso?')) {
      deleteCourseMutation.mutate(id);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                Gestão de Cursos
              </h1>
              <p className="text-xl text-gray-300">
                Criação e administração dos cursus iniciáticos
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setLocation('/admin')}
                variant="outline"
                className="text-gray-400 border-gray-600 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Painel
              </Button>
              <Button
                onClick={() => setLocation('/admin-modules')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Gerenciar Módulos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Criar Novo Curso */}
            <Card className="bg-gray-900/50 border-amber-600/30">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Novo Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={courseForm.slug}
                      onChange={(e) => setCourseForm({...courseForm, slug: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                      placeholder="Auto-gerado se vazio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image_url">URL da Imagem</Label>
                    <Input
                      id="image_url"
                      value={courseForm.image_url}
                      onChange={(e) => setCourseForm({...courseForm, image_url: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="required_role">Role Necessário</Label>
                      <Select value={courseForm.required_role} onValueChange={(value) => setCourseForm({...courseForm, required_role: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buscador">Buscador</SelectItem>
                          <SelectItem value="iniciado">Iniciado</SelectItem>
                          <SelectItem value="portador_veu">Portador do Véu</SelectItem>
                          <SelectItem value="discipulo_chamas">Discípulo das Chamas</SelectItem>
                          <SelectItem value="guardiao_nome">Guardião do Nome Perdido</SelectItem>
                          <SelectItem value="arauto_queda">Arauto da Queda</SelectItem>
                          <SelectItem value="portador_coroa">Portador da Coroa Flamejante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="course_section">Seção</Label>
                      <Select value={courseForm.course_section_id.toString()} onValueChange={(value) => setCourseForm({...courseForm, course_section_id: parseInt(value)})}>
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {courseSections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value) || 0})}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="is_paid"
                        checked={courseForm.is_paid}
                        onChange={(e) => setCourseForm({...courseForm, is_paid: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="is_paid">Curso Pago</Label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                    disabled={createCourseMutation.isPending}
                  >
                    {createCourseMutation.isPending ? 'Criando...' : 'Criar Curso'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Cursos */}
            <Card className="bg-gray-900/50 border-amber-600/30">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Cursos Existentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-amber-300">{course.title}</h3>
                            <p className="text-sm text-gray-400">{course.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" style={{ borderColor: course.course_sections?.color }}>
                                {course.course_sections?.name}
                              </Badge>
                              <Badge variant={course.is_paid ? "default" : "secondary"}>
                                {course.is_paid ? `R$ ${course.price}` : 'Gratuito'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/admin-modules?course=${course.id}`)}
                              className="text-blue-400 border-blue-400"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCourse(course)}
                              className="text-amber-400 border-amber-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-400 border-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Modal de Edição */}
          {editingCourse && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <Card className="bg-gray-900 border-amber-600/30 max-w-md w-full mx-4">
                <CardHeader>
                  <CardTitle className="text-amber-400">Editar Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="bg-gray-800 border-gray-600"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateCourse(editingCourse)}
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                      disabled={updateCourseMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      onClick={() => setEditingCourse(null)}
                      variant="outline"
                      className="border-gray-600"
                    >
                      Cancelar
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