import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ChevronLeft, ChevronRight, Lock, CheckCircle, Book, Award, Flame, Eye, Crown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  required_role: string;
  is_published: boolean;
  price: number;
  is_paid: boolean;
  course_section_id: number;
  course_sections: {
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
  created_at?: string;
  updated_at?: string;
}

interface UserCourseProgress {
  id: number;
  user_id: number;
  course_id: number;
  current_module: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
}

interface Challenge {
  id: number;
  module_id: number;
  title: string;
  description: string;
  challenge_type: 'quiz' | 'text' | 'task';
  challenge_data: any;
  is_required: boolean;
}

// CSS personalizado por seção/role (similar aos grimórios)
const getSectionStyles = (sectionName: string, color: string) => {
  const baseStyles = {
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
    fontFamily: 'EB Garamond, serif',
  };

  const sectionSpecificStyles = {
    'Buscador': {
      ...baseStyles,
      '--section-color': '#10B981',
      '--section-accent': '#059669',
      '--section-dark': '#064e3b',
    },
    'Iniciado': {
      ...baseStyles,
      '--section-color': '#3B82F6',
      '--section-accent': '#2563eb',
      '--section-dark': '#1e3a8a',
    },
    'Portador do Véu': {
      ...baseStyles,
      '--section-color': '#8B5CF6',
      '--section-accent': '#7c3aed',
      '--section-dark': '#5b21b6',
    },
    'Discípulo das Chamas': {
      ...baseStyles,
      '--section-color': '#EF4444',
      '--section-accent': '#dc2626',
      '--section-dark': '#991b1b',
    },
    'Guardião do Nome': {
      ...baseStyles,
      '--section-color': '#F59E0B',
      '--section-accent': '#d97706',
      '--section-dark': '#92400e',
    },
    'Arauto da Queda': {
      ...baseStyles,
      '--section-color': '#EC4899',
      '--section-accent': '#db2777',
      '--section-dark': '#be185d',
    },
    'Portador da Coroa': {
      ...baseStyles,
      '--section-color': '#991B1B',
      '--section-accent': '#7f1d1d',
      '--section-dark': '#450a0a',
    },
  };

  return sectionSpecificStyles[sectionName as keyof typeof sectionSpecificStyles] || baseStyles;
};



export default function CursusLeitor() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);

  const queryClient = useQueryClient();

  // Buscar dados do curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', slug],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/courses/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!slug && !!user,
  });

  // Buscar módulos do curso
  const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: ['/api/courses', course?.id, 'modules'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/courses/${course?.id}/modules`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!course?.id && !!user,
  });

  // Buscar progresso do usuário
  const { data: userProgress } = useQuery<UserCourseProgress>({
    queryKey: ['/api/user/course-progress', course?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/course-progress/${course?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!course?.id && !!user,
  });

  // Buscar desafios do módulo atual
  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ['/api/modules', modules[currentModuleIndex]?.id, 'challenges'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/modules/${modules[currentModuleIndex]?.id}/challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch challenges: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!modules[currentModuleIndex]?.id && !!user,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { course_id: number; current_module: number; is_completed?: boolean }) => {
      return apiRequest('/api/user/course-progress', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/courses'] });
    },
  });

  const completeModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/modules/${moduleId}/complete`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to complete module: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/courses'] });
    },
  });

  // Verificar se o usuário tem acesso ao curso
  const hasAccess = () => {
    if (!course || !user) return false;
    
    // Admin tem acesso total
    if (user.email === 'admin@templodoabismo.com.br' || user.role === 'magus_supremo') {
      return true;
    }
    
    // Cursos gratuitos
    if (!course.is_paid) return true;
    
    // Verificar se comprou o curso (implementar lógica de purchase)
    return false;
  };

  // Verificar se o módulo está desbloqueado
  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true; // Primeiro módulo sempre desbloqueado
    
    const progress = userProgress?.current_module || 1;
    return moduleIndex < progress;
  };

  // Calcular progresso geral
  const calculateProgress = () => {
    if (!modules.length || !userProgress) return 0;
    return Math.round((userProgress.current_module / modules.length) * 100);
  };

  // Criar progresso inicial automaticamente se não existir
  useEffect(() => {
    const createInitialProgress = async () => {
      if (course && user && !userProgress) {
        await updateProgressMutation.mutateAsync({
          course_id: course.id,
          current_module: 1,
        });
      }
    };
    
    createInitialProgress();
  }, [course, user, userProgress]);

  const handleCompleteModule = async () => {
    if (!course || !modules[currentModuleIndex]) return;
    
    try {
      // Verificar se há desafios obrigatórios
      const requiredChallenges = challenges.filter(c => c.is_required);
      if (requiredChallenges.length > 0) {
        setShowChallenge(true);
        return;
      }
      
      const currentModule = modules[currentModuleIndex];
      console.log('Completing module:', currentModule.id, 'Order:', currentModule.order_number);
      
      // Marcar módulo como concluído
      const result = await completeModuleMutation.mutateAsync(currentModule.id);
      
      if (result.isLastModule) {
        // Curso completo
        toast({ 
          title: 'Parabéns! Curso concluído!', 
          description: 'Você completou todos os módulos do curso.' 
        });
        
        // Redirecionar para a página de cursos após um delay
        setTimeout(() => {
          setLocation('/cursus');
        }, 3000);
      } else {
        // Avançar para próximo módulo
        const nextModuleIndex = currentModuleIndex + 1;
        if (nextModuleIndex < modules.length) {
          setCurrentModuleIndex(nextModuleIndex);
          toast({ 
            title: 'Módulo concluído!', 
            description: `Avançando para o módulo ${nextModuleIndex + 1}.` 
          });
        }
      }
    } catch (error) {
      console.error('Error completing module:', error);
      toast({ 
        title: 'Erro ao completar módulo', 
        description: 'Tente novamente em alguns momentos.',
        variant: 'destructive'
      });
    }
  };

  const handleNavigateToModule = (moduleIndex: number) => {
    if (isModuleUnlocked(moduleIndex)) {
      setCurrentModuleIndex(moduleIndex);
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl" style={{ fontFamily: 'EB Garamond' }}>
          Carregando curso...
        </div>
      </div>
    );
  }

  if (!course || !hasAccess()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-red-950 border-red-800">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
              Acesso Negado
            </h2>
            <p className="text-red-300 mb-4" style={{ fontFamily: 'EB Garamond' }}>
              Você não tem acesso a este curso.
            </p>
            <Button onClick={() => setLocation('/cursus')} variant="outline">
              Voltar aos Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!modules.length) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
              Curso em Preparação
            </h2>
            <p className="text-gray-300 mb-4" style={{ fontFamily: 'EB Garamond' }}>
              Este curso ainda não possui módulos disponíveis.
            </p>
            <Button onClick={() => setLocation('/cursus')} variant="outline">
              Voltar aos Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const sectionColor = course.course_sections.color;
  const sectionStyles = getSectionStyles(course.course_sections.name, sectionColor);

  return (
    <div className="min-h-screen text-white" style={sectionStyles as any}>
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 md:py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/cursus')}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <ChevronLeft className="w-4 h-4 md:mr-2" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-amber-400" style={{ fontFamily: 'Cinzel Decorative' }}>
                    {course.title}
                  </h1>
                  <Badge variant="secondary" style={{ backgroundColor: sectionColor + '20', color: sectionColor }}>
                    {course.course_sections.name}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="text-sm text-gray-400" style={{ fontFamily: 'EB Garamond' }}>
                  Módulo {currentModuleIndex + 1} de {modules.length}
                </div>
                <Progress value={calculateProgress()} className="w-24 md:w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 md:py-8">
          {/* Mobile Module Navigation */}
          <div className="lg:hidden mb-4">
            <Card className="bg-black/30 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">Módulo {currentModuleIndex + 1}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                      disabled={currentModuleIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentModuleIndex(Math.min(modules.length - 1, currentModuleIndex + 1))}
                      disabled={currentModuleIndex === modules.length - 1 || !isModuleUnlocked(currentModuleIndex + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-1">
              <Card className="bg-black/30 border-gray-700 sticky top-24 backdrop-blur-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-amber-400" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Módulos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {modules.map((module, index) => {
                        const isUnlocked = isModuleUnlocked(index);
                        const isCurrent = index === currentModuleIndex;
                        const isCompleted = userProgress ? index < userProgress.current_module - 1 : false;

                        return (
                          <div
                            key={module.id}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isCurrent
                                ? 'bg-amber-900/50 border border-amber-600 shadow-lg'
                                : isUnlocked
                                ? 'bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm'
                                : 'bg-gray-900/30 opacity-50'
                            }`}
                            onClick={() => handleNavigateToModule(index)}
                          >
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : !isUnlocked ? (
                                <Lock className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Book className="w-4 h-4 text-amber-400" />
                              )}
                              <span 
                                className={`text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}`}
                                style={{ fontFamily: 'EB Garamond' }}
                              >
                                {module.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo do Módulo */}
            <div className="lg:col-span-3">
              <Card className="bg-black/30 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl text-amber-400" style={{ fontFamily: 'Cinzel Decorative' }}>
                      {currentModule.title}
                    </CardTitle>
                    {challenges.length > 0 && (
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        <Award className="w-3 h-3 mr-1" />
                        Desafio Disponível
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-invert max-w-none"
                    style={{ 
                      fontFamily: 'EB Garamond',
                      fontSize: '1.1rem',
                      lineHeight: '1.7'
                    }}
                    dangerouslySetInnerHTML={{ __html: currentModule.html_content }}
                  />
                  
                  <Separator className="my-8 border-amber-600/30" />
                  
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      disabled={currentModuleIndex === 0}
                      onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Módulo Anterior
                    </Button>
                    
                    <Button
                      onClick={handleCompleteModule}
                      disabled={completeModuleMutation.isPending}
                      style={{ backgroundColor: sectionColor }}
                      className="text-white hover:opacity-90 font-semibold"
                    >
                      {challenges.filter(c => c.is_required).length > 0 
                        ? 'Fazer Desafio' 
                        : currentModuleIndex === modules.length - 1 
                        ? 'Concluir Curso' 
                        : 'Próximo Módulo'
                      }
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
}