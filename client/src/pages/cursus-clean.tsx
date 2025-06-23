import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Flame, 
  Crown, 
  Skull, 
  FileText, 
  Brain,
  Clock,
  Eye,
  Lock,
  CheckCircle,
  PlayCircle,
  Target,
  Key,
  Shield
} from "lucide-react";
import { Course, CourseSection, UserCourseProgress } from "@/shared/schema-new";

// Hierarquia de roles
const getRoleLevel = (role: string): number => {
  const roleLevels: Record<string, number> = {
    'buscador': 1,
    'iniciado': 2,
    'portador_veu': 3,
    'discipulo_chamas': 4,
    'guardiao_nome': 5,
    'arauto_queda': 6,
    'portador_coroa': 7,
    'magus_supremo': 8,
    'admin': 9
  };
  return roleLevels[role] || 0;
};

// Função para obter ícone do role
const getRoleIcon = (role: string) => {
  const roleIcons: Record<string, any> = {
    'buscador': Target,
    'iniciado': Key, 
    'portador_veu': Eye,
    'discipulo_chamas': Flame,
    'guardiao_nome': Shield,
    'arauto_queda': Crown,
    'portador_coroa': Crown,
  };
  return roleIcons[role] || BookOpen;
};

// Função para obter classes CSS do role (baseado na cor do supabase)
const getRoleCSSClass = (role: string, color?: string) => {
  if (color) {
    return `text-[${color}] border-[${color}]/30`;
  }
  
  switch (role) {
    case 'buscador': return 'text-emerald-400 border-emerald-400/30';
    case 'iniciado': return 'text-blue-400 border-blue-400/30';
    case 'portador_veu': return 'text-purple-400 border-purple-400/30';
    case 'discipulo_chamas': return 'text-red-400 border-red-400/30';
    case 'guardiao_nome': return 'text-amber-400 border-amber-400/30';
    case 'arauto_queda': return 'text-red-600 border-red-600/30';
    case 'portador_coroa': return 'text-orange-800 border-orange-800/30';
    default: return 'text-golden-amber border-golden-amber/30';
  }
};

export default function CursusClean() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState(1);

  // Buscar seções dos cursos
  const { data: courseSections = [], isLoading: sectionsLoading } = useQuery<CourseSection[]>({
    queryKey: ['/api/course-sections'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/course-sections', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
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
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Debug logs
  console.log('Course sections:', courseSections);
  console.log('Courses:', courses);
  console.log('Sections loading:', sectionsLoading);
  console.log('Courses loading:', coursesLoading);

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery<UserCourseProgress[]>({
    queryKey: ['/api/user/course-progress'],
    enabled: !!user,
  });

  // Definir seção ativa quando dados carregarem
  useEffect(() => {
    if (courseSections.length > 0) {
      setActiveSection(courseSections[0].id);
    }
  }, [courseSections]);

  // Função para determinar o estado do curso
  const getCourseState = (course: Course) => {
    const progress = userProgress.find(p => p.course_id === course.id);
    const progressPercentage = progress ? parseFloat(progress.progress_percentage?.toString() || '0') : 0;
    
    // Admin tem acesso total
    const isAdmin = user?.email === 'admin@templodoabismo.com.br' || user?.role === 'magus_supremo';
    
    // Verificar se foi completado (>=80%)
    if (progressPercentage >= 80) {
      return { 
        text: 'Completado', 
        action: 'completed', 
        isLocked: false,
        progress: progressPercentage,
        icon: CheckCircle
      };
    }

    // Verificar se tem progresso
    if (progressPercentage > 0) {
      return { 
        text: 'Continuar', 
        action: 'continue', 
        isLocked: false,
        progress: progressPercentage,
        icon: PlayCircle
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
        icon: PlayCircle
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

  // Lidar com ações do curso
  const handleCourseAction = (course: Course) => {
    const courseState = getCourseState(course);
    
    switch (courseState.action) {
      case 'start':
      case 'continue':
      case 'completed':
        setLocation(`/cursus/${course.slug}`);
        break;
      case 'locked':
        // Curso bloqueado, não fazer nada
        break;
      default:
        console.log(`Ação não reconhecida: ${courseState.action}`);
    }
  };



  if (sectionsLoading || coursesLoading) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-amber mx-auto mb-4"></div>
          <p className="text-ritualistic-beige/70">Carregando cursos místicos...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <ContentProtection enableScreenshotProtection={true}>
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-cinzel tracking-wider mb-4 text-golden-amber">
              CURSUS MYSTICUS
            </h1>
            <p className="text-sm sm:text-base text-ritualistic-beige/80 max-w-2xl mx-auto px-4">
              A jornada do conhecimento através dos véus da realidade
            </p>
          </div>

          {/* Abas */}
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeSection.toString()} onValueChange={(value) => setActiveSection(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-2 bg-transparent h-auto p-1">
                {courseSections.map((section) => {
                  const IconComponent = getRoleIcon(section.required_role);
                  const courseCount = courses.filter(c => c.required_role === section.required_role).length;
                  const sectionColor = section.color || '#D97706';
                  const isActive = activeSection === section.id;
                  
                  return (
                    <TabsTrigger
                      key={section.id}
                      value={section.id.toString()}
                      className={`flex flex-col items-center p-3 sm:p-4 space-y-2 data-[state=active]:bg-red-900/50 hover:bg-red-900/30 transition-all duration-300 border rounded-lg bg-black/30 backdrop-blur-sm ${
                        isActive ? getRoleCSSClass(section.required_role, sectionColor) : ''
                      }`}
                      style={isActive ? { borderColor: `${sectionColor}60` } : {}}
                    >
                      <IconComponent 
                        size={20} 
                        className={`transition-colors duration-300 ${isActive ? '' : 'text-ritualistic-beige/60'}`}
                        style={isActive ? { color: sectionColor } : {}}
                      />
                      <span 
                        className={`text-xs font-cinzel text-center leading-tight transition-colors duration-300 ${isActive ? '' : 'text-ritualistic-beige/70'}`}
                        style={isActive ? { color: sectionColor } : {}}
                      >
                        {section.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs transition-colors duration-300"
                        style={isActive ? { borderColor: `${sectionColor}60`, color: sectionColor } : {}}
                      >
                        {courseCount}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {courseSections.map((section) => {
                const sectionCourses = courses.filter(c => c.required_role === section.required_role);
                const sectionColor = section.color || '#D97706';
                
                return (
                  <TabsContent key={section.id} value={section.id.toString()} className="mt-8">
                    <div className="mb-6">
                      <h3 
                        className="text-xl sm:text-2xl font-cinzel mb-2 text-center transition-colors duration-300"
                        style={{ color: sectionColor }}
                      >
                        {section.name}
                      </h3>
                      <p className="text-sm text-ritualistic-beige/70 text-center max-w-2xl mx-auto">
                        {section.description}
                      </p>
                    </div>
                    
                    {sectionCourses.length > 0 ? (
                      <div className="space-y-3">
                        {sectionCourses.map((course) => {
                          const courseState = getCourseState(course);
                          const IconComponent = courseState.icon;
                          
                          return (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="group"
                            >
                              <Card 
                                className={`bg-black/40 backdrop-blur-sm hover:scale-[1.02] cursor-pointer transition-all duration-300 ${
                                  courseState.isLocked ? 'opacity-60' : ''
                                }`}
                                style={{ borderColor: `${sectionColor}30` }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = `${sectionColor}60`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = `${sectionColor}30`;
                                }}
                                onClick={() => handleCourseAction(course)}
                              >
                                <div className="flex p-4">
                                  {/* Ícone/imagem à esquerda */}
                                  <div className="relative overflow-hidden rounded-lg mr-4 flex-shrink-0">
                                    <div className="w-20 h-28 bg-gradient-to-b from-red-900/20 to-black/60 flex items-center justify-center rounded-lg">
                                      <BookOpen 
                                        className="h-6 w-6 opacity-50"
                                        style={{ color: sectionColor }}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Conteúdo à direita */}
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-start justify-between mb-2">
                                        <h3 
                                          className="font-cinzel text-lg font-semibold line-clamp-2 flex-1 mr-2 transition-colors duration-300"
                                          style={{ color: sectionColor }}
                                        >
                                          {course.title}
                                        </h3>
                                        {course.is_paid && course.price && (
                                          <Badge 
                                            className="text-black font-semibold text-sm"
                                            style={{ backgroundColor: `${sectionColor}E6` }}
                                          >
                                            R$ {course.price}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <p className="text-ritualistic-beige/70 text-sm line-clamp-2 mb-3">
                                        {course.description}
                                      </p>
                                      
                                      {/* Progresso */}
                                      {courseState.progress > 0 && (
                                        <div className="mb-3">
                                          <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                              className="h-2 rounded-full transition-all duration-300"
                                              style={{ 
                                                width: `${courseState.progress}%`,
                                                backgroundColor: sectionColor 
                                              }}
                                            ></div>
                                          </div>
                                          <p className="text-xs text-ritualistic-beige/60 mt-1">
                                            {courseState.progress.toFixed(0)}% completo
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botão de ação */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <IconComponent size={16} style={{ color: sectionColor }} />
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`border-opacity-60 hover:bg-opacity-20 transition-all duration-300 ${
                                          courseState.isLocked ? 'cursor-not-allowed' : ''
                                        }`}
                                        style={{ 
                                          borderColor: sectionColor,
                                          color: sectionColor,
                                          backgroundColor: courseState.isLocked ? 'transparent' : `${sectionColor}10`
                                        }}
                                        disabled={courseState.isLocked}
                                      >
                                        {courseState.text}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" style={{ color: sectionColor }} />
                        <p className="text-ritualistic-beige/50 text-lg">
                          {coursesLoading ? "Carregando cursos..." : "Nenhum curso disponível para este nível"}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
          
          {/* Footer Quote */}
          <div className="text-center mt-16 border-t border-golden-amber/20 pt-8">
            <blockquote className="text-ritualistic-beige/70 italic text-lg mb-4 font-cardo">
              "O que foi selado no silêncio permanecerá guardado até que os preparados o aproveitem. Nos véus do Abismo, aguardamos aqueles que ousaram a verdade além do véu."
            </blockquote>
            <p className="text-golden-amber font-cinzel-decorative text-sm tracking-wider">
              "SCIENTIA POTENTIA EST"
            </p>
          </div>
        </div>
      </PageTransition>
    </ContentProtection>
  );
}