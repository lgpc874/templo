import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Lock, 
  Play, 
  CheckCircle, 
  Star,
  Crown,
  Eye,
  Flame,
  Shield,
  Zap,
  Target,
  Sword
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  required_role: string;
  is_paid: boolean;
  price: string;
  course_section_id: number;
  course_sections: {
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

interface UserCourseProgress {
  id: number;
  course_id: number;
  current_module: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

// Role hierarchy for access control
const getRoleLevel = (role: string): number => {
  const roles = {
    'buscador': 1,
    'iniciado': 2,
    'portador_veu': 3,
    'discipulo_chamas': 4,
    'guardiao_nome': 5,
    'arauto_queda': 6,
    'portador_coroa': 7,
    'magus_supremo': 8
  };
  return roles[role] || 0;
};

// Role icons
const getRoleIcon = (role: string) => {
  const icons = {
    'buscador': Eye,
    'iniciado': Flame,
    'portador_veu': Shield,
    'discipulo_chamas': Zap,
    'guardiao_nome': Target,
    'arauto_queda': Sword,
    'portador_coroa': Crown,
    'magus_supremo': Star
  };
  return icons[role] || BookOpen;
};

export default function Cursus() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Buscar seções dos cursos
  const { data: courseSections = [], isLoading: sectionsLoading } = useQuery<CourseSection[]>({
    queryKey: ['/api/course-sections'],
    queryFn: async () => {
      const response = await fetch('/api/course-sections');
      if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Buscar todos os cursos
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery<UserCourseProgress[]>({
    queryKey: ['/api/user/course-progress'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/course-progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Debug logs
  console.log('Course sections:', courseSections);
  console.log('Courses:', courses);
  console.log('User progress:', userProgress);
  console.log('User:', user);
  console.log('Sections loading:', sectionsLoading);
  console.log('Courses loading:', coursesLoading);

  // Definir seção ativa quando dados carregarem
  useEffect(() => {
    if (courseSections.length > 0) {
      setActiveSection(courseSections[0].id);
    }
  }, [courseSections]);

  // Função para determinar o estado do curso
  const getCourseState = (course: Course) => {
    const progress = userProgress.find(p => p.course_id === course.id);
    
    // Admin tem acesso total
    const isAdmin = user?.email === 'admin@templodoabismo.com.br' || user?.role === 'magus_supremo';
    
    // Verificar se tem progresso (qualquer progresso iniciado)
    if (progress) {
      return { 
        text: 'Continuar', 
        action: 'continue', 
        isLocked: false,
        progress: (progress.current_module / 10) * 100, // Estimativa
        icon: Play
      };
    }

    // Verificar se o usuário pode acessar baseado no role
    const userRoleLevel = getRoleLevel(user?.role || 'buscador');
    const courseRoleLevel = getRoleLevel(course.required_role);
    
    if (isAdmin || userRoleLevel >= courseRoleLevel) {
      return { 
        text: 'Iniciar', 
        action: 'start', 
        isLocked: false,
        progress: 0,
        icon: Play
      };
    }

    // Curso bloqueado por role
    return { 
      text: `Requer: ${course.required_role}`, 
      action: 'locked', 
      isLocked: true,
      progress: 0,
      icon: Lock
    };
  };

  // Filtrar cursos pela seção ativa
  const activeSectionCourses = courses.filter(course => 
    course.course_section_id === activeSection
  );

  const activeSectionData = courseSections.find(s => s.id === activeSection);

  if (sectionsLoading || coursesLoading) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-golden-amber/20 rounded mb-8 w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-card-dark rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </ContentProtection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ContentProtection>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-cinzel text-golden-amber mb-4">
              Cursus - Caminhos do Conhecimento
            </h1>
            <p className="text-ritualistic-beige/70 text-lg max-w-2xl mx-auto">
              Jornadas estruturadas de aprendizado que te guiarão através dos mistérios ancestrais do Templo do Abismo
            </p>
          </div>

          {/* Navegação de Seções */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {courseSections.map((section) => {
              const IconComponent = getRoleIcon(section.required_role);
              const isActive = activeSection === section.id;
              const userCanAccess = user?.role === 'magus_supremo' || 
                                  getRoleLevel(user?.role || 'buscador') >= getRoleLevel(section.required_role);
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  disabled={!userCanAccess}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                    isActive 
                      ? 'border-golden-amber bg-golden-amber/10 text-golden-amber'
                      : userCanAccess
                      ? 'border-ritualistic-beige/30 text-ritualistic-beige hover:border-golden-amber/50'
                      : 'border-gray-600/30 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                  style={{
                    borderColor: isActive ? section.color : undefined,
                    backgroundColor: isActive ? `${section.color}15` : undefined,
                    color: isActive ? section.color : undefined
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{section.name}</span>
                  {!userCanAccess && <Lock className="w-3 h-3" />}
                </button>
              );
            })}
          </div>

          {/* Descrição da Seção Ativa */}
          {activeSectionData && (
            <div className="text-center mb-8">
              <div 
                className="inline-block px-6 py-3 rounded-lg border"
                style={{
                  borderColor: `${activeSectionData.color}50`,
                  backgroundColor: `${activeSectionData.color}10`,
                  color: activeSectionData.color
                }}
              >
                <p className="font-medium">{activeSectionData.description}</p>
              </div>
            </div>
          )}

          {/* Grid de Cursos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSectionCourses.map((course) => {
              const courseState = getCourseState(course);
              const IconComponent = courseState.icon;
              
              return (
                <Card 
                  key={course.id} 
                  className="bg-card-dark border-ritualistic-beige/20 hover:border-golden-amber/50 transition-all duration-300 group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-golden-amber font-cinzel mb-2 group-hover:text-golden-amber/90 transition-colors">
                          {course.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge 
                            variant="outline"
                            style={{
                              borderColor: `${course.course_sections?.color}50`,
                              backgroundColor: `${course.course_sections?.color}10`,
                              color: course.course_sections?.color
                            }}
                          >
                            {course.course_sections?.name}
                          </Badge>
                          {course.is_paid && (
                            <Badge className="bg-golden-amber/20 text-golden-amber border-golden-amber/30">
                              R$ {course.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <IconComponent 
                        className={`w-6 h-6 ${courseState.isLocked ? 'text-gray-500' : 'text-golden-amber'}`}
                      />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-ritualistic-beige/70 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    
                    {courseState.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-ritualistic-beige/60 mb-1">
                          <span>Progresso</span>
                          <span>{Math.round(courseState.progress)}%</span>
                        </div>
                        <Progress value={courseState.progress} className="h-2" />
                      </div>
                    )}
                    
                    <Link href={`/curso-detalhe/${course.id}`}>
                      <Button 
                        className={`w-full ${
                          courseState.isLocked 
                            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            : courseState.action === 'continue'
                            ? 'bg-blue-600 hover:bg-blue-600/90 text-white'
                            : 'bg-golden-amber hover:bg-golden-amber/90 text-black'
                        }`}
                        disabled={courseState.isLocked}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {courseState.text}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mensagem quando não há cursos */}
          {activeSectionCourses.length === 0 && activeSection && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-golden-amber/50" />
              <h3 className="text-xl font-cinzel text-golden-amber mb-2">
                Nenhum Curso Disponível
              </h3>
              <p className="text-ritualistic-beige/70">
                Esta seção ainda não possui cursos disponíveis. Novos conteúdos serão adicionados em breve.
              </p>
            </div>
          )}
        </div>
      </ContentProtection>
    </PageTransition>
  );
}