import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Lock, CheckCircle, Circle, Crown, Star, Flame, Shield, Eye, Moon, Skull } from "lucide-react";

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  required_role: string;
  is_paid: boolean;
  price: string;
  sort_order: number;
  reward_role_id?: string;
}

interface UserCourseProgress {
  id: number;
  course_id: number;
  current_module: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

interface CourseSection {
  id: number;
  name: string;
  description: string;
  required_role: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  icon?: string;
}

// Definir ordem hierárquica dos roles
const roleHierarchy = [
  { key: 'buscador', title: 'Buscador', icon: Eye, level: 1 },
  { key: 'iniciado', title: 'Iniciado', icon: Flame, level: 2 },
  { key: 'portador_veu', title: 'Portador do Véu', icon: Moon, level: 3 },
  { key: 'discipulo_chamas', title: 'Discípulo das Chamas', icon: Star, level: 4 },
  { key: 'guardiao_nome', title: 'Guardião do Nome Perdido', icon: Shield, level: 5 },
  { key: 'arauto_queda', title: 'Arauto da Queda', icon: Skull, level: 6 },
  { key: 'portador_coroa', title: 'Portador da Coroa Flamejante', icon: Crown, level: 7 },
  { key: 'magus_supremo', title: 'Magus Supremo', icon: Crown, level: 8 }
];

const getRoleLevel = (role: string): number => {
  const found = roleHierarchy.find(r => r.key === role);
  return found?.level || 1;
};

const canAccessRole = (userRole: string, targetRole: string): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(targetRole);
};

// Função para obter classes CSS específicas por seção (igual libri)
const getSectionCSSClass = (sectionName: string): string => {
  switch (sectionName) {
    case 'Buscador':
      return 'text-green-400 border-green-400/50';
    case 'Iniciado':
      return 'text-blue-400 border-blue-400/50';
    case 'Portador do Véu':
      return 'text-purple-400 border-purple-400/50';
    case 'Discípulo das Chamas':
      return 'text-red-400 border-red-400/50';
    case 'Guardião do Nome':
      return 'text-yellow-400 border-yellow-400/50';
    case 'Arauto da Queda':
      return 'text-red-600 border-red-600/50';
    case 'Portador da Coroa':
      return 'text-orange-600 border-orange-600/50';
    case 'Magus Supremo':
      return 'text-red-800 border-red-800/50';
    default:
      return 'text-golden-amber border-golden-amber/50';
  }
};

// Função para obter ícone específico por role (baseado na hierarquia existente)
const getRoleIcon = (roleName: string) => {
  const roleIcons: Record<string, string> = {
    'buscador': '🎯',
    'iniciado': '🔑', 
    'portador_veu': '👁️',
    'discipulo_chamas': '🔥',
    'guardiao_nome': '🛡️',
    'arauto_queda': '⚡',
    'portador_coroa': '👑',
  };
  
  return roleIcons[roleName] || '⭐';
};

// Mapear nome da seção para o role
const getSectionRole = (sectionName: string): string => {
  const sectionToRole: Record<string, string> = {
    'Buscador': 'buscador',
    'Iniciado': 'iniciado',
    'Portador do Véu': 'portador_veu',
    'Discípulo das Chamas': 'discipulo_chamas',
    'Guardião do Nome': 'guardiao_nome',
    'Arauto da Queda': 'arauto_queda',
    'Portador da Coroa': 'portador_coroa',
  };
  
  return sectionToRole[sectionName] || 'buscador';
};

export default function CursusNew() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('buscador');

  // Buscar seções dos cursos  
  const { data: courseSections = [], isLoading: sectionsLoading, error: sectionsError } = useQuery<CourseSection[]>({
    queryKey: ['/api/course-sections'],
    queryFn: async () => {
      const response = await fetch('/api/course-sections');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return response.json();
    },
    retry: false,
    enabled: !!user,
  });




  


  // Buscar todos os cursos
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses', user?.role],
    retry: false,
    enabled: !!user,
    staleTime: 0,
  });

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery<UserCourseProgress[]>({
    queryKey: ['/api/user/course-progress'],
    retry: false,
    enabled: !!user,
  });

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-cinzel text-golden-amber mb-4">Acesso Restrito</h1>
            <p className="text-ritualistic-beige/70">Entre para acessar os cursos do templo</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const userRoleLevel = getRoleLevel(user.role || 'buscador');

  // Agrupar cursos por role
  const coursesByRole = courseSections.reduce((acc, section) => {
    acc[section.required_role] = courses.filter(course => course.required_role === section.required_role);
    return acc;
  }, {} as Record<string, Course[]>);

  // Debug log - only show in development
  if (import.meta.env.DEV) {
    console.log('Courses data:', courses);
    console.log('Course sections:', courseSections);
    console.log('Courses by role:', coursesByRole);
    console.log('User role:', user?.role);
  }

  // Encontrar seção ativa - começar com o role do usuário
  useEffect(() => {
    if (user?.role && courseSections.length > 0) {
      // Verificar se existe seção para o role do usuário
      const userSection = courseSections.find(s => s.required_role === user.role);
      if (userSection) {
        setActiveSection(user.role);
      } else {
        // Se não encontrar, usar buscador como padrão
        setActiveSection('buscador');
      }
    }
  }, [user?.role, courseSections]);

  // Encontrar seção ativa
  const currentSection = courseSections.find(s => s.required_role === activeSection) || courseSections[0];

  // Verificar se curso está liberado baseado na sequência
  const isCourseUnlocked = (course: Course, roleKey: string): boolean => {
    // Para buscador, todos os 3 cursos são liberados
    if (roleKey === 'buscador') {
      return true;
    }

    // Para outras abas, verificar sequência
    const coursesInRole = coursesByRole[roleKey] || [];
    const courseIndex = coursesInRole.findIndex(c => c.id === course.id);
    
    // Primeiro curso da aba sempre liberado se usuário tem o role
    if (courseIndex === 0 && canAccessRole(user.role || 'buscador', roleKey)) {
      return true;
    }

    // Verificar se curso anterior foi completado
    if (courseIndex > 0) {
      const previousCourse = coursesInRole[courseIndex - 1];
      const previousProgress = userProgress.find(p => p.course_id === previousCourse.id);
      return previousProgress?.is_completed === true;
    }

    return false;
  };

  const handleCourseClick = (course: Course) => {
    if (isCourseUnlocked(course, course.required_role)) {
      // Navegar para o curso
      window.location.href = `/cursus/${course.slug}`;
    }
  };

  const renderCourseCard = (course: Course, roleKey: string) => {
    const isUnlocked = isCourseUnlocked(course, roleKey);
    const progress = userProgress.find(p => p.course_id === course.id);
    const isCompleted = progress?.is_completed === true;
    const isStarted = !!progress && !isCompleted;

    return (
      <Card 
        key={course.id}
        className={`bg-card-dark border-golden-amber/30 hover:border-golden-amber/60 transition-all cursor-pointer ${
          !isUnlocked ? 'opacity-50' : ''
        }`}
        onClick={() => handleCourseClick(course)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-golden-amber font-cinzel text-lg flex items-center gap-2">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : isStarted ? (
                  <Circle className="w-5 h-5 text-blue-400" />
                ) : !isUnlocked ? (
                  <Lock className="w-5 h-5 text-ritualistic-beige/50" />
                ) : (
                  <Circle className="w-5 h-5 text-ritualistic-beige/50" />
                )}
                {course.title}
              </CardTitle>
              <CardDescription className="text-ritualistic-beige/70 mt-2">
                {course.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {course.is_paid ? (
                <Badge variant="outline" className="border-golden-amber/50 text-golden-amber">
                  R$ {course.price}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-400/50 text-green-400">
                  Gratuito
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-green-400/20 text-green-400 border-green-400/30">
                  Concluído
                </Badge>
              )}
              {isStarted && (
                <Badge className="bg-blue-400/20 text-blue-400 border-blue-400/30">
                  Em Progresso
                </Badge>
              )}
            </div>
            {!isUnlocked && (
              <Badge variant="destructive" className="bg-red-900/20 text-red-400 border-red-400/30">
                Bloqueado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (coursesLoading || sectionsLoading) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-golden-amber border-t-transparent rounded-full" />
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
            <h1 className="text-5xl font-cinzel text-golden-amber mb-4">
              ∆ CURSUS INITIATIONIS ∆
            </h1>
            <p className="text-ritualistic-beige/80 text-lg max-w-3xl mx-auto">
              Cursos Iniciáticos do Templo do Abismo
            </p>
            <div className="mt-6 p-4 bg-card-dark/50 border border-golden-amber/30 rounded-lg inline-block">
              <p className="text-sm text-golden-amber">
                Nível: {roleHierarchy.find(r => r.key === user.role)?.title || 'Desconhecido'}
              </p>
            </div>
          </div>

          {/* Navegação por Seções - Estilo Libri */}
          <div className="mb-12">
            <h3 className="text-xl font-cinzel text-golden-amber mb-4">Seções dos Cursos ({courseSections.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-2 bg-black/30 backdrop-blur-sm border border-golden-amber/20 rounded-lg">
              {Array.isArray(courseSections) && courseSections.length > 0 ? courseSections.map((section) => {
                const canAccess = canAccessRole(user.role || 'buscador', section.required_role);
                const isActive = activeSection === section.required_role;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => canAccess && setActiveSection(section.required_role)}
                    disabled={!canAccess}
                    className={`flex flex-col items-center p-3 space-y-2 transition-all duration-300 border rounded-lg bg-black/30 backdrop-blur-sm hover:bg-red-900/30 ${
                      isActive 
                        ? getSectionCSSClass(section.name)
                        : canAccess
                        ? 'border-golden-amber/20 hover:border-golden-amber/30'
                        : 'opacity-50 cursor-not-allowed border-gray-600/30'
                    }`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                        isActive ? getSectionCSSClass(section.name) : 'text-ritualistic-beige/70'
                      }`}
                    >
                      <span className="text-lg">
                        {getRoleIcon(getSectionRole(section.name))}
                      </span>
                    </div>
                    <span 
                      className={`text-xs font-cinzel text-center leading-tight transition-colors duration-300 ${
                        isActive ? getSectionCSSClass(section.name) : 'text-ritualistic-beige/70'
                      }`}
                    >
                      {section.name}
                    </span>
                    {!canAccess && (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                );
              }) : (
                <div className="col-span-full text-center p-8">
                  <p className="text-ritualistic-beige/50">Nenhuma seção encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo da Seção Ativa */}
          {currentSection && (
            <div className="mb-8">
              <div className="p-6 rounded-lg border-2 mb-6 border-golden-amber/30 bg-card-dark/50">
                <h2 className={`text-3xl font-cinzel mb-2 ${getSectionCSSClass(currentSection.name)}`}>
                  {currentSection.name}
                </h2>
                <p className="text-ritualistic-beige/70">
                  {currentSection.description}
                </p>
                <p className="text-sm text-ritualistic-beige/50 mt-2">
                  {currentSection.required_role === 'buscador' 
                    ? 'Cursos introdutórios - todos liberados para iniciantes'
                    : 'Sequência progressiva - complete os cursos em ordem'
                  }
                </p>
              </div>

              <div className="grid gap-6">
                {coursesByRole[currentSection?.required_role]?.length ? (
                  coursesByRole[currentSection.required_role].map(course => renderCourseCard(course, currentSection.required_role))
                ) : (
                  <Card className="bg-card-dark border-golden-amber/30">
                    <CardContent className="p-8 text-center">
                      <p className="text-ritualistic-beige/50">
                        {coursesLoading ? "Carregando cursos..." : "Nenhum curso disponível para este nível"}
                      </p>
                      {import.meta.env.DEV && (
                        <p className="text-xs text-ritualistic-beige/30 mt-2">
                          Debug: Role atual: {user?.role}, Seção ativa: {currentSection?.required_role}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

        </div>
      </ContentProtection>
    </PageTransition>
  );
}