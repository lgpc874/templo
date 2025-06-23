import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Lock, CheckCircle, Book, Star, Play, ShoppingCart } from 'lucide-react';
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
  image_url?: string;
  course_sections: {
    name: string;
    color: string;
  };
}

interface Module {
  id: number;
  course_id: number;
  title: string;
  content: string;
  sort_order: number;
  is_published: boolean;
  unlock_after_module_id?: number;
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

// CSS personalizado por seção/role
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

export default function CursoDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Buscar dados do curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!id && !!user,
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

  // Verificar se o usuário tem acesso ao curso
  const hasAccess = () => {
    if (!course || !user) return false;
    
    // Admin tem acesso total
    if (user.email === 'admin@templodoabismo.com.br' || user.role === 'magus_supremo') {
      return true;
    }
    
    // Cursos gratuitos
    if (!course.is_paid) return true;
    
    // Se já iniciou o curso, tem acesso
    if (userProgress) return true;
    
    // Verificar se comprou o curso (implementar lógica de purchase)
    return false;
  };

  // Determinar o estado do botão principal
  const getButtonState = () => {
    if (!course || !user) return { text: 'Carregando...', action: () => {}, disabled: true };
    
    // Se já iniciou o curso
    if (userProgress) {
      if (userProgress.is_completed) {
        return {
          text: 'Curso Concluído',
          action: () => setLocation(`/cursus-leitor/${course.slug}`),
          disabled: false
        };
      } else {
        return {
          text: 'Continuar Curso',
          action: () => setLocation(`/cursus-leitor/${course.slug}`),
          disabled: false
        };
      }
    }
    
    // Se é gratuito ou admin
    if (!course.is_paid || user.email === 'admin@templodoabismo.com.br' || user.role === 'magus_supremo') {
      return {
        text: 'Iniciar Curso',
        action: () => setLocation(`/ritual-inicial/${course.id}`),
        disabled: false
      };
    }
    
    // Se é pago e não comprou
    return {
      text: `Adquirir Curso - R$ ${course.price.toFixed(2)}`,
      action: () => handlePurchase(),
      disabled: false
    };
  };

  const handlePurchase = async () => {
    // Implementar lógica de compra com Stripe
    toast({ title: 'Função de compra em desenvolvimento' });
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

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-red-950 border-red-800">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
              Curso não encontrado
            </h2>
            <p className="text-red-300 mb-4" style={{ fontFamily: 'EB Garamond' }}>
              O curso solicitado não foi encontrado.
            </p>
            <Button onClick={() => setLocation('/cursus')} variant="outline">
              Voltar aos Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionColor = course.course_sections.color;
  const sectionStyles = getSectionStyles(course.course_sections.name, sectionColor);
  const buttonState = getButtonState();

  return (
    <div className="min-h-screen text-white" style={sectionStyles as any}>
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/cursus')}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar aos Cursos
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            <Card className="bg-black/30 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge 
                      variant="secondary" 
                      className="mb-4"
                      style={{ backgroundColor: sectionColor + '20', color: sectionColor }}
                    >
                      {course.course_sections.name}
                    </Badge>
                    <CardTitle className="text-3xl text-amber-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                      {course.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!course.is_paid ? (
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Gratuito
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        R$ {course.price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Imagem/Capa */}
                {course.image_url && (
                  <div className="mb-6">
                    <img 
                      src={course.image_url} 
                      alt={course.title}
                      className="w-full h-64 object-cover rounded-lg border border-gray-700"
                    />
                  </div>
                )}

                {/* Descrição */}
                <div 
                  className="prose prose-invert max-w-none mb-8"
                  style={{ 
                    fontFamily: 'EB Garamond',
                    fontSize: '1.1rem',
                    lineHeight: '1.7'
                  }}
                >
                  <p>{course.description}</p>
                </div>

                <Separator className="my-8 border-amber-600/30" />

                {/* Lista de Módulos */}
                <div>
                  <h3 className="text-xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Conteúdo do Curso
                  </h3>
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div 
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700"
                      >
                        <div className="flex-shrink-0">
                          {userProgress && index < userProgress.current_module - 1 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span 
                            className="text-white font-medium"
                            style={{ fontFamily: 'EB Garamond' }}
                          >
                            Módulo {index + 1}: {module.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de Ação */}
          <div className="lg:col-span-1">
            <Card className="bg-black/30 border-gray-700 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-amber-400" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Iniciar Jornada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progresso (se aplicável) */}
                {userProgress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progresso</span>
                      <span className="text-amber-400">
                        {Math.round((userProgress.current_module / modules.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: sectionColor,
                          width: `${(userProgress.current_module / modules.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Informações do Curso */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Módulos:</span>
                    <span className="text-white">{modules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nível:</span>
                    <span className="text-white">{course.course_sections.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-white">{course.is_paid ? 'Pago' : 'Gratuito'}</span>
                  </div>
                </div>

                <Separator className="border-amber-600/30" />

                {/* Botão Principal */}
                <Button
                  onClick={buttonState.action}
                  disabled={buttonState.disabled}
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: sectionColor }}
                  size="lg"
                >
                  {userProgress && !userProgress.is_completed ? (
                    <Play className="w-4 h-4 mr-2" />
                  ) : course.is_paid && !hasAccess() ? (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                  ) : (
                    <Star className="w-4 h-4 mr-2" />
                  )}
                  {buttonState.text}
                </Button>

                {/* Requisitos */}
                <div className="text-xs text-gray-400 mt-4">
                  <p>
                    <strong>Requisito:</strong> Nível {course.course_sections.name} ou superior
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}