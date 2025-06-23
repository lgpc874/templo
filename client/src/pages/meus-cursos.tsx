import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Award, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserCourse {
  id: number;
  user_id: number;
  course_id: number;
  current_module: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  courses: {
    id: number;
    title: string;
    slug: string;
    description: string;
    image_url?: string;
    course_sections: {
      name: string;
      color: string;
    };
  };
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

export default function MeusCursos() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar cursos do usuário
  const { data: userCourses = [], isLoading } = useQuery<UserCourse[]>({
    queryKey: ['/api/user/courses'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user courses: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user,
  });

  const handleContinueCourse = (course: UserCourse) => {
    setLocation(`/cursus-leitor/${course.courses.slug}`);
  };

  const handleViewCertificate = (course: UserCourse) => {
    // Implementar visualização/download do certificado
    console.log('View certificate for course:', course.courses.title);
  };

  const calculateProgress = (course: UserCourse) => {
    // Implementar cálculo real baseado no número de módulos
    // Por agora, estimativa baseada no module atual
    const estimatedTotalModules = 10; // Buscar do banco real
    return Math.min((course.current_module / estimatedTotalModules) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl" style={{ fontFamily: 'EB Garamond' }}>
          Carregando seus cursos...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'EB Garamond' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
            Meus Cursos
          </h1>
          <p className="text-xl text-gray-300">
            Acompanhe seu progresso nos caminhos iniciáticos do conhecimento
          </p>
        </div>

        {userCourses.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
              Nenhum Curso Iniciado
            </h2>
            <p className="text-gray-500 mb-6">
              Você ainda não iniciou nenhum curso. Explore nosso catálogo e comece sua jornada.
            </p>
            <Button 
              onClick={() => setLocation('/cursus')}
              className="bg-amber-600 hover:bg-amber-700 text-black font-semibold"
            >
              Explorar Cursos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses.map((userCourse) => {
              const course = userCourse.courses;
              const sectionColor = course.course_sections.color;
              const progress = calculateProgress(userCourse);
              
              return (
                <Card 
                  key={userCourse.id}
                  className="bg-black/30 border-gray-700 backdrop-blur-sm hover:border-amber-600/50 transition-all duration-200"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge 
                          variant="secondary" 
                          className="mb-2"
                          style={{ backgroundColor: sectionColor + '20', color: sectionColor }}
                        >
                          {course.course_sections.name}
                        </Badge>
                        <CardTitle className="text-xl text-amber-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                          {course.title}
                        </CardTitle>
                      </div>
                      {userCourse.is_completed && (
                        <Award className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Imagem do Curso */}
                    {course.image_url && (
                      <div className="w-full h-32 rounded-lg overflow-hidden">
                        <img 
                          src={course.image_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Progresso */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-amber-400">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Módulo {userCourse.current_module}</span>
                        <span>
                          {userCourse.is_completed ? 'Concluído' : 'Em andamento'}
                        </span>
                      </div>
                    </div>

                    {/* Datas */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <strong>Iniciado:</strong> {format(new Date(userCourse.started_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      {userCourse.completed_at && (
                        <div>
                          <strong>Concluído:</strong> {format(new Date(userCourse.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      {userCourse.is_completed ? (
                        <>
                          <Button
                            onClick={() => handleContinueCourse(userCourse)}
                            variant="outline"
                            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Revisar Curso
                          </Button>
                          <Button
                            onClick={() => handleViewCertificate(userCourse)}
                            className="w-full text-black font-semibold"
                            style={{ backgroundColor: sectionColor }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Ver Certificado
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleContinueCourse(userCourse)}
                          className="w-full text-white font-semibold"
                          style={{ backgroundColor: sectionColor }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Continuar Curso
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}