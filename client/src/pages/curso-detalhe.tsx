import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Lock, Trophy, Clock, Star, BookOpen, Flame, Crown, Eye, Key, Shield, Zap, Target, Sword, ArrowLeft, Play, CheckCircle, Circle } from "lucide-react";
import PageTransition from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: number;
  course_id: number;
  title: string;
  html_content: string;
  order: number;
  requires_submission: boolean;
  ritual_mandatory: boolean;
}

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

interface CursoDetalheProps {
  courseSlug: string;
}

export default function CursoDetalhe({ courseSlug }: CursoDetalheProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState<number>(1);

  // Buscar dados do curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses/slug', courseSlug],
    enabled: !!user,
  });

  // Buscar módulos do curso
  const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ['/api/courses', course?.id, 'modules'],
    enabled: !!course?.id,
  });

  // Buscar progresso do usuário
  const { data: userProgress } = useQuery<UserCourseProgress>({
    queryKey: ['/api/user/course-progress', course?.id],
    enabled: !!course?.id,
  });

  // Mutation para iniciar progresso
  const startProgressMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/user/course-progress', {
        course_id: course?.id,
        current_module: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
      toast({
        title: "Curso Iniciado",
        description: "Sua jornada no curso começou!",
      });
    },
  });

  // Mutation para completar módulo
  const completeModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return apiRequest('POST', '/api/user/module-complete', {
        course_id: course?.id,
        module_id: moduleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress', course?.id] });
      toast({
        title: "Módulo Completo",
        description: "Módulo finalizado com sucesso!",
      });
    },
  });

  if (courseLoading || modulesLoading) {
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

  if (!course) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-cinzel text-golden-amber mb-4">Curso não encontrado</h1>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </ContentProtection>
      </PageTransition>
    );
  }

  const activeModuleData = modules.find(m => m.order === activeModule);
  const currentProgress = userProgress?.current_module || 0;
  const totalModules = modules.length;
  const progressPercent = totalModules > 0 ? (currentProgress / totalModules) * 100 : 0;

  return (
    <PageTransition>
      <ContentProtection>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="mb-4 text-golden-amber hover:text-golden-amber/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Cursos
            </Button>
            
            <div className="bg-card-dark border border-golden-amber/30 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-cinzel text-golden-amber mb-2">
                    {course.title}
                  </h1>
                  <p className="text-ritualistic-beige/70 mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                      {totalModules} módulos
                    </Badge>
                    {course.is_paid && (
                      <Badge className="bg-golden-amber/20 text-golden-amber border-golden-amber/30">
                        R$ {course.price}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-golden-amber mb-1">
                    {Math.round(progressPercent)}%
                  </div>
                  <div className="text-sm text-ritualistic-beige/70">
                    {currentProgress} de {totalModules} módulos
                  </div>
                  <Progress value={progressPercent} className="w-32 mt-2" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar com lista de módulos */}
            <div className="lg:col-span-1">
              <Card className="bg-card-dark border-golden-amber/30">
                <CardHeader>
                  <CardTitle className="text-golden-amber font-cinzel">
                    Módulos do Curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {modules.map((module) => {
                    const isCompleted = currentProgress >= module.order;
                    const isCurrent = activeModule === module.order;
                    const isAccessible = module.order <= (currentProgress + 1);

                    return (
                      <button
                        key={module.id}
                        onClick={() => isAccessible && setActiveModule(module.order)}
                        disabled={!isAccessible}
                        className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                          isCurrent
                            ? 'border-golden-amber bg-golden-amber/10 text-golden-amber'
                            : isCompleted
                            ? 'border-green-600/50 bg-green-600/10 text-green-400 hover:bg-green-600/20'
                            : isAccessible
                            ? 'border-ritualistic-beige/30 text-ritualistic-beige hover:border-golden-amber/50'
                            : 'border-gray-600/30 text-gray-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Play className="w-5 h-5" />
                            ) : isAccessible ? (
                              <Circle className="w-5 h-5" />
                            ) : (
                              <Lock className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {module.title}
                            </div>
                            <div className="text-xs opacity-70">
                              Módulo {module.order}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo principal */}
            <div className="lg:col-span-3">
              {activeModuleData ? (
                <Card className="bg-card-dark border-golden-amber/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-golden-amber font-cinzel">
                        {activeModuleData.title}
                      </CardTitle>
                      <Badge variant="outline">
                        Módulo {activeModuleData.order} de {totalModules}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-invert max-w-none text-ritualistic-beige"
                      dangerouslySetInnerHTML={{ __html: activeModuleData.html_content }}
                    />
                    
                    <div className="mt-8 pt-6 border-t border-golden-amber/20">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={() => setActiveModule(Math.max(1, activeModule - 1))}
                          disabled={activeModule === 1}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Anterior
                        </Button>
                        
                        <div className="flex space-x-4">
                          {!userProgress && (
                            <Button
                              onClick={() => startProgressMutation.mutate()}
                              disabled={startProgressMutation.isPending}
                              className="bg-golden-amber text-black hover:bg-golden-amber/90"
                            >
                              {startProgressMutation.isPending ? (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                  Iniciando...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Iniciar Curso
                                </>
                              )}
                            </Button>
                          )}
                          
                          {userProgress && activeModuleData && currentProgress >= activeModule && !userProgress.is_completed && (
                            <Button
                              onClick={() => completeModuleMutation.mutate(activeModuleData.id)}
                              disabled={completeModuleMutation.isPending}
                              className="bg-green-600 text-white hover:bg-green-600/90"
                            >
                              {completeModuleMutation.isPending ? (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                  Completando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Concluir Módulo
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => setActiveModule(Math.min(totalModules, activeModule + 1))}
                          disabled={activeModule === totalModules}
                        >
                          Próximo
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card-dark border-golden-amber/30">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-golden-amber/50 mx-auto mb-4" />
                    <h3 className="text-xl font-cinzel text-golden-amber mb-2">
                      Selecione um Módulo
                    </h3>
                    <p className="text-ritualistic-beige/70">
                      Escolha um módulo na barra lateral para começar seus estudos
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}