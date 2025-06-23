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
}

export default function AdminCoursesWorking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

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
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
          course_section_id: 1
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Preço</Label>
                      <Input
                        id="price"
                        type="number"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({...courseForm, price: parseFloat(e.target.value)})}
                        className="bg-black/30 border-gray-600"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id="is_paid"
                        checked={courseForm.is_paid}
                        onChange={(e) => setCourseForm({...courseForm, is_paid: e.target.checked})}
                      />
                      <Label htmlFor="is_paid">Curso Pago</Label>
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="bg-gray-900 border-amber-600/30 w-full max-w-md mx-4">
                <CardHeader>
                  <CardTitle className="text-amber-400">Editar Curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={editingCourse.title}
                      onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                      className="bg-black/30 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editingCourse.description}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="bg-black/30 border-gray-600"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCourse(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleUpdateCourse(editingCourse)}
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                    >
                      Salvar
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