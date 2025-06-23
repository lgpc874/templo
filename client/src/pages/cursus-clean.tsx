import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

export default function CursusClean() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('buscador');

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

  // Agrupar cursos por role
  const coursesByRole = courseSections.reduce((acc, section) => {
    acc[section.required_role] = courses.filter(course => course.required_role === section.required_role);
    return acc;
  }, {} as Record<string, Course[]>);

  // Definir seção ativa quando dados carregarem
  useEffect(() => {
    if (user?.role && courseSections.length > 0) {
      if (user.role === 'magus_supremo' || user.email === 'admin@templodoabismo.com.br') {
        setActiveSection('buscador');
      } else {
        const userSection = courseSections.find(s => s.required_role === user.role);
        setActiveSection(userSection ? user.role : 'buscador');
      }
    }
  }, [user?.role, user?.email, courseSections]);

  // Verificar se curso está desbloqueado
  const isCourseUnlocked = (course: Course): boolean => {
    const userRoleLevel = getRoleLevel(user?.role || 'buscador');
    const courseRoleLevel = getRoleLevel(course.required_role);
    return userRoleLevel >= courseRoleLevel;
  };

  // Lidar com clique no curso
  const handleCourseClick = (course: Course) => {
    if (isCourseUnlocked(course)) {
      window.location.href = `/cursus/${course.slug}`;
    } else {
      alert(`Este curso requer o nível "${course.required_role}" ou superior. Continue progredindo nos cursos disponíveis para desbloquear este conteúdo.`);
    }
  };

  // Renderizar card do curso
  const renderCourseCard = (course: Course) => {
    const isUnlocked = isCourseUnlocked(course);
    const progress = userProgress.find(p => p.course_id === course.id);
    const isCompleted = progress?.is_completed === true;
    const isStarted = !!progress && !isCompleted;

    return (
      <Card 
        key={course.id}
        className={`bg-card-dark border-golden-amber/30 hover:border-golden-amber/60 transition-all cursor-pointer ${
          !isUnlocked ? 'opacity-60' : ''
        }`}
        onClick={() => handleCourseClick(course)}
      >
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-golden-amber text-xl mb-2 font-cinzel">
                {course.title}
              </CardTitle>
              <CardDescription className="text-ritualistic-beige/70 text-sm">
                {course.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end ml-4">
              {isCompleted && (
                <Badge variant="default" className="bg-green-900/20 text-green-400 border-green-400/30">
                  Concluído
                </Badge>
              )}
              {isStarted && (
                <Badge variant="secondary" className="bg-blue-900/20 text-blue-400 border-blue-400/30">
                  Em Progresso
                </Badge>
              )}
              {!isUnlocked && (
                <Badge variant="destructive" className="bg-red-900/20 text-red-400 border-red-400/30">
                  Requer: {course.required_role}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {course.is_paid && (
                <span className="text-golden-amber font-semibold">
                  R$ {Number(course.price).toFixed(2)}
                </span>
              )}
              {!course.is_paid && (
                <span className="text-green-400 font-semibold">Gratuito</span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className={`border-golden-amber/30 ${
                isUnlocked 
                  ? 'text-golden-amber hover:bg-golden-amber/10' 
                  : 'text-ritualistic-beige/50 cursor-not-allowed'
              }`}
              disabled={!isUnlocked}
            >
              {isCompleted ? 'Revisar' : isStarted ? 'Continuar' : 'Iniciar'}
            </Button>
          </div>
          {progress && (
            <div className="mt-3">
              <Progress 
                value={progress.progress_percentage || 0} 
                className="h-2"
              />
              <p className="text-xs text-ritualistic-beige/50 mt-1">
                {progress.progress_percentage || 0}% concluído
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-dark-background flex items-center justify-center">
          <p className="text-ritualistic-beige/50">Carregando...</p>
        </div>
      </PageTransition>
    );
  }

  const currentSection = courseSections.find(s => s.required_role === activeSection) || courseSections[0];

  return (
    <PageTransition>
      <ContentProtection>
        <div className="min-h-screen bg-dark-background">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-cinzel-decorative text-golden-amber mb-4">
                Cursus Mysticus
              </h1>
              <p className="text-ritualistic-beige/80 text-lg max-w-2xl mx-auto">
                A jornada do conhecimento através dos véus da realidade
              </p>
            </div>

            {/* Course Sections Tabs */}
            {sectionsLoading ? (
              <div className="text-center py-8">
                <p className="text-ritualistic-beige/50">Carregando seções...</p>
              </div>
            ) : courseSections.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ritualistic-beige/50">Nenhuma seção encontrada</p>
              </div>
            ) : (
              <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 bg-card-dark/50 mb-8">
                  {courseSections.map((section) => (
                    <TabsTrigger 
                      key={section.id} 
                      value={section.required_role}
                      className="data-[state=active]:bg-golden-amber/20 data-[state=active]:text-golden-amber"
                    >
                      {section.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {courseSections.map((section) => (
                  <TabsContent key={section.id} value={section.required_role}>
                    <Card className="bg-card-dark/50 border-golden-amber/30 mb-8">
                      <CardHeader>
                        <CardTitle className="text-golden-amber text-2xl font-cinzel flex items-center gap-2">
                          <span style={{ color: section.color }}>●</span>
                          {section.name}
                        </CardTitle>
                        <CardDescription className="text-ritualistic-beige/70">
                          {section.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <div className="grid gap-6">
                      {coursesByRole[section.required_role]?.length ? (
                        coursesByRole[section.required_role].map(course => renderCourseCard(course))
                      ) : (
                        <Card className="bg-card-dark border-golden-amber/30">
                          <CardContent className="p-8 text-center">
                            <p className="text-ritualistic-beige/50">
                              {coursesLoading ? "Carregando cursos..." : "Nenhum curso disponível para este nível"}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

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
        </div>
      </ContentProtection>
    </PageTransition>
  );
}