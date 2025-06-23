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
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  FileText,
  ArrowLeft,
  Settings,
  RefreshCw
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
  sequential_order?: number;
  is_sequential?: boolean;
  reward_role_id?: string;
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
}

export default function AdminCoursesFinal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '',
    required_role: 'buscador',
    price: 0,
    is_paid: false,
    course_section_id: 1,
    sequential_order: 1,
    is_sequential: false,
    reward_role_id: 'none'
  });

  // Verificar se é admin
  if (user?.email !== 'admin@templodoabismo.com.br') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
          <Card className="bg-black/80 border-red-600/50 backdrop-blur-sm shadow-2xl shadow-red-900/50">
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 mx-auto text-red-500 animate-pulse mb-6" />
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

  // Carregar dados
  const loadData = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // Buscar cursos
      const coursesResponse = await fetch('/api/admin/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Buscar seções
      const sectionsResponse = await fetch('/api/course-sections');
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setCourseSections(sectionsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os cursos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // Inicializar dados automaticamente
  if (!initialized && !loading) {
    loadData();
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const slug = courseForm.slug || courseForm.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...courseForm, slug })
      });

      if (response.ok) {
        const newCourse = await response.json();
        setCourses([newCourse, ...courses]);
        setCourseForm({
          title: '',
          slug: '',
          description: '',
          image_url: '',
          required_role: 'buscador',
          price: 0,
          is_paid: false,
          course_section_id: 1,
          sequential_order: 1,
          is_sequential: false,
          reward_role_id: 'none'
        });
        toast({ title: "Curso criado com sucesso!" });
      } else {
        throw new Error('Erro ao criar curso');
      }
    } catch (error: any) {
      toast({ 
        title: "Erro ao criar curso", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleUpdateCourse = async (course: Course) => {
    if (!editingCourse) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingCourse)
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(courses.map(c => c.id === course.id ? updatedCourse : c));
        setEditingCourse(null);
        toast({ title: "Curso atualizado com sucesso!" });
      } else {
        throw new Error('Erro ao atualizar curso');
      }
    } catch (error: any) {
      toast({ 
        title: "Erro ao atualizar curso", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este curso?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== id));
        toast({ title: "Curso deletado com sucesso!" });
      } else {
        throw new Error('Erro ao deletar curso');
      }
    } catch (error: any) {
      toast({ 
        title: "Erro ao deletar curso", 
        description: error.message,
        variant: "destructive" 
      });
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
                onClick={loadData}
                variant="outline"
                className="text-amber-400 border-amber-600 hover:bg-amber-600/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Criação */}
            <Card className="bg-gray-900/50 border-amber-600/30">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Forjar Novo Cursus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título do Curso</Label>
                    <Input
                      id="title"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      required
                      className="bg-black/30 border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug (opcional)</Label>
                    <Input
                      id="slug"
                      value={courseForm.slug}
                      onChange={(e) => setCourseForm({...courseForm, slug: e.target.value})}
                      className="bg-black/30 border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      required
                      className="bg-black/30 border-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="course_section_id">Seção do Curso</Label>
                      <Select 
                        value={courseForm.course_section_id.toString()} 
                        onValueChange={(value) => setCourseForm({...courseForm, course_section_id: parseInt(value)})}
                      >
                        <SelectTrigger className="bg-black/30 border-gray-600">
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
                    <div>
                      <Label htmlFor="required_role">Role Necessário</Label>
                      <Select 
                        value={courseForm.required_role} 
                        onValueChange={(value) => setCourseForm({...courseForm, required_role: value})}
                      >
                        <SelectTrigger className="bg-black/30 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buscador">Buscador</SelectItem>
                          <SelectItem value="iniciado">Iniciado</SelectItem>
                          <SelectItem value="portador_veu">Portador do Véu</SelectItem>
                          <SelectItem value="discipulo_chamas">Discípulo das Chamas</SelectItem>
                          <SelectItem value="guardiao_nome">Guardião do Nome</SelectItem>
                          <SelectItem value="arauto_queda">Arauto da Queda</SelectItem>
                          <SelectItem value="portador_coroa">Portador da Coroa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reward_role_id">Role Recompensa (após conclusão)</Label>
                    <Select 
                      value={courseForm.reward_role_id || 'none'} 
                      onValueChange={(value) => setCourseForm({...courseForm, reward_role_id: value === 'none' ? '' : value})}
                    >
                      <SelectTrigger className="bg-black/30 border-gray-600">
                        <SelectValue placeholder="Selecione um role de recompensa (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="iniciado">Iniciado</SelectItem>
                        <SelectItem value="portador_veu">Portador do Véu</SelectItem>
                        <SelectItem value="discipulo_chamas">Discípulo das Chamas</SelectItem>
                        <SelectItem value="guardiao_nome">Guardião do Nome</SelectItem>
                        <SelectItem value="arauto_queda">Arauto da Queda</SelectItem>
                        <SelectItem value="portador_coroa">Portador da Coroa</SelectItem>
                        <SelectItem value="magus_supremo">Magus Supremo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço</Label>
                      <Input
                        id="price"
                        type="number"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value) || 0})}
                        className="bg-black/30 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sequential_order">Ordem Sequencial</Label>
                      <Input
                        id="sequential_order"
                        type="number"
                        value={courseForm.sequential_order}
                        onChange={(e) => setCourseForm({...courseForm, sequential_order: parseInt(e.target.value) || 1})}
                        className="bg-black/30 border-gray-600"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_paid"
                        checked={courseForm.is_paid}
                        onChange={(e) => setCourseForm({...courseForm, is_paid: e.target.checked})}
                      />
                      <Label htmlFor="is_paid">Curso Pago</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_sequential"
                        checked={courseForm.is_sequential}
                        onChange={(e) => setCourseForm({...courseForm, is_sequential: e.target.checked})}
                      />
                      <Label htmlFor="is_sequential">Bloqueio Sequencial</Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold">
                    <Save className="w-4 h-4 mr-2" />
                    Forjar Cursus
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Cursos */}
            <Card className="bg-gray-900/50 border-amber-600/30">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Cursus Existentes ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto"></div>
                    <p className="mt-2 text-gray-400">Carregando cursus...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhum curso criado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course.id} className="p-4 bg-black/30 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-amber-300">{course.title}</h3>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCourse(course)}
                              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{course.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              color: course.course_sections?.color,
                              borderColor: course.course_sections?.color 
                            }}
                          >
                            {course.course_sections?.name}
                          </Badge>
                          {course.is_paid && (
                            <span className="text-green-400 text-sm font-medium">
                              R$ {course.price.toFixed(2)}
                            </span>
                          )}
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-gray-900 border-amber-600/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center">
                    <Edit className="w-5 h-5 mr-2" />
                    Editar Curso: {editingCourse.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Título</Label>
                      <Input
                        value={editingCourse.title}
                        onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                        className="bg-black/30 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={editingCourse.slug}
                        onChange={(e) => setEditingCourse({...editingCourse, slug: e.target.value})}
                        className="bg-black/30 border-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="bg-black/30 border-gray-600"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>URL da Imagem (opcional)</Label>
                    <Input
                      value={editingCourse.image_url || ''}
                      onChange={(e) => setEditingCourse({...editingCourse, image_url: e.target.value})}
                      className="bg-black/30 border-gray-600"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div>
                    <Label>Seção do Curso</Label>
                    <Select 
                      value={editingCourse.course_section_id.toString()} 
                      onValueChange={(value) => setEditingCourse({...editingCourse, course_section_id: parseInt(value)})}
                    >
                      <SelectTrigger className="bg-black/30 border-gray-600">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Role Necessário</Label>
                      <Select 
                        value={editingCourse.required_role} 
                        onValueChange={(value) => setEditingCourse({...editingCourse, required_role: value})}
                      >
                        <SelectTrigger className="bg-black/30 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buscador">Buscador</SelectItem>
                          <SelectItem value="iniciado">Iniciado</SelectItem>
                          <SelectItem value="portador_veu">Portador do Véu</SelectItem>
                          <SelectItem value="discipulo_chamas">Discípulo das Chamas</SelectItem>
                          <SelectItem value="guardiao_nome">Guardião do Nome</SelectItem>
                          <SelectItem value="arauto_queda">Arauto da Queda</SelectItem>
                          <SelectItem value="portador_coroa">Portador da Coroa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Role Recompensa</Label>
                      <Select 
                        value={editingCourse.reward_role_id || 'none'} 
                        onValueChange={(value) => setEditingCourse({...editingCourse, reward_role_id: value === 'none' ? undefined : value})}
                      >
                        <SelectTrigger className="bg-black/30 border-gray-600">
                          <SelectValue placeholder="Nenhum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="iniciado">Iniciado</SelectItem>
                          <SelectItem value="portador_veu">Portador do Véu</SelectItem>
                          <SelectItem value="discipulo_chamas">Discípulo das Chamas</SelectItem>
                          <SelectItem value="guardiao_nome">Guardião do Nome</SelectItem>
                          <SelectItem value="arauto_queda">Arauto da Queda</SelectItem>
                          <SelectItem value="portador_coroa">Portador da Coroa</SelectItem>
                          <SelectItem value="magus_supremo">Magus Supremo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Preço</Label>
                      <Input
                        type="number"
                        value={editingCourse.price}
                        onChange={(e) => setEditingCourse({...editingCourse, price: parseFloat(e.target.value) || 0})}
                        className="bg-black/30 border-gray-600"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Ordem de Exibição</Label>
                      <Input
                        type="number"
                        value={editingCourse.sort_order}
                        onChange={(e) => setEditingCourse({...editingCourse, sort_order: parseInt(e.target.value) || 0})}
                        className="bg-black/30 border-gray-600"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Ordem Sequencial</Label>
                      <Input
                        type="number"
                        value={editingCourse.sequential_order || 1}
                        onChange={(e) => setEditingCourse({...editingCourse, sequential_order: parseInt(e.target.value) || 1})}
                        className="bg-black/30 border-gray-600"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_is_paid"
                        checked={editingCourse.is_paid}
                        onChange={(e) => setEditingCourse({...editingCourse, is_paid: e.target.checked})}
                      />
                      <Label htmlFor="edit_is_paid">Curso Pago</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_is_published"
                        checked={editingCourse.is_published}
                        onChange={(e) => setEditingCourse({...editingCourse, is_published: e.target.checked})}
                      />
                      <Label htmlFor="edit_is_published">Curso Publicado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_is_sequential"
                        checked={editingCourse.is_sequential || false}
                        onChange={(e) => setEditingCourse({...editingCourse, is_sequential: e.target.checked})}
                      />
                      <Label htmlFor="edit_is_sequential">Bloqueio Sequencial</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-6 border-t border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCourse(null)}
                      className="text-gray-400 border-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleUpdateCourse(editingCourse)}
                      className="bg-amber-600 hover:bg-amber-700 text-black font-bold"
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