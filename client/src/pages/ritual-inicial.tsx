import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Eye, Crown, ChevronLeft } from 'lucide-react';
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

export default function RitualInicial() {
  const { curso_id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isAccepting, setIsAccepting] = useState(false);
  const queryClient = useQueryClient();

  // Buscar dados do curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['/api/courses', curso_id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/courses/${curso_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!curso_id && !!user,
  });

  const createProgressMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return apiRequest('/api/user/course-progress', {
        method: 'POST',
        body: {
          course_id: courseId,
          current_module: 1,
          is_completed: false,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/course-progress'] });
      toast({ 
        title: 'Ritual de Iniciação Concluído!', 
        description: 'Você agora tem acesso aos ensinamentos sagrados.' 
      });
      if (course) {
        setLocation(`/cursus-leitor/${course.slug}`);
      }
    },
    onError: () => {
      toast({ 
        title: 'Erro no Ritual', 
        description: 'Houve um problema ao iniciar o curso. Tente novamente.',
        variant: 'destructive'
      });
    },
  });

  const handleAcceptRitual = async () => {
    if (!course) return;
    
    setIsAccepting(true);
    
    // Pequeno delay para efeito dramático
    setTimeout(() => {
      createProgressMutation.mutate(course.id);
      setIsAccepting(false);
    }, 2000);
  };

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl" style={{ fontFamily: 'EB Garamond' }}>
          Preparando ritual...
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

  // Definir ícone baseado na seção
  const getSectionIcon = () => {
    switch (course.course_sections.name) {
      case 'Discípulo das Chamas':
        return <Flame className="w-16 h-16 mx-auto text-amber-400 mb-4" />;
      case 'Portador do Véu':
        return <Eye className="w-16 h-16 mx-auto text-amber-400 mb-4" />;
      case 'Portador da Coroa':
        return <Crown className="w-16 h-16 mx-auto text-amber-400 mb-4" />;
      default:
        return <Flame className="w-16 h-16 mx-auto text-amber-400 mb-4" />;
    }
  };

  return (
    <div className="min-h-screen text-white" style={sectionStyles as any}>
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/curso-detalhe/${course.id}`)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/50 border-amber-600 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center space-y-8">
                {/* Ícone e Título */}
                <div className="mb-8">
                  {getSectionIcon()}
                  <h1 className="text-4xl font-bold text-amber-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Ritual de Iniciação
                  </h1>
                  <Badge 
                    variant="secondary" 
                    className="text-lg px-4 py-2"
                    style={{ backgroundColor: sectionColor + '20', color: sectionColor }}
                  >
                    {course.course_sections.name}
                  </Badge>
                </div>

                {/* Título do Curso */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                    {course.title}
                  </h2>
                </div>

                {/* Texto Ritual */}
                <div className="space-y-6 text-gray-200 max-w-2xl mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  <p className="text-xl italic leading-relaxed">
                    "Que as sombras se afastem e a luz do conhecimento ilumine meu caminho através dos mistérios sagrados."
                  </p>
                  
                  <div className="border-t border-b border-amber-600 py-8 my-8">
                    <p className="text-lg leading-relaxed mb-4">
                      Antes de adentrar os ensinamentos de <strong className="text-amber-400">{course.title}</strong>, 
                      é necessário realizar o ritual de iniciação. Este momento sagrado marca o início de sua 
                      transformação espiritual e seu comprometimento com a busca do conhecimento oculto.
                    </p>
                    
                    <p className="text-base leading-relaxed mb-4">
                      Os mistérios que você está prestes a desvendar foram preservados através dos séculos 
                      pelos iniciados que vieram antes de você. Ao aceitar este chamado, você se junta a 
                      uma linhagem ancestral de buscadores da verdade.
                    </p>
                    
                    <p className="text-base leading-relaxed">
                      Este ritual simboliza sua disposição em transcender as limitações do conhecimento 
                      mundano e abraçar os ensinamentos que transformarão sua compreensão da realidade.
                    </p>
                  </div>

                  <p className="text-sm text-gray-400">
                    Ao aceitar o chamado deste curso, você declara estar preparado para receber os conhecimentos 
                    sagrados e aplicá-los com sabedoria, responsabilidade e reverência aos mistérios do Templo.
                  </p>
                </div>

                {/* Juramento */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-amber-600/30 max-w-2xl mx-auto">
                  <h3 className="text-lg font-bold text-amber-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Juramento do Iniciado
                  </h3>
                  <p className="text-base italic leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    "Eu, <strong className="text-white">{user?.spiritual_name || user?.username}</strong>, 
                    aceito o chamado para adentrar os mistérios de <strong className="text-amber-400">{course.title}</strong>. 
                    Prometo abordar estes ensinamentos com mente aberta, coração sincero e espírito dedicado à busca da verdade. 
                    Que este conhecimento me transforme e me guie em minha jornada evolutiva."
                  </p>
                </div>

                {/* Botão de Aceite */}
                <div className="flex justify-center space-x-6 mt-12">
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/curso-detalhe/${course.id}`)}
                    className="px-8 py-3 text-gray-300 border-gray-600 hover:bg-gray-800"
                  >
                    Reconsiderar
                  </Button>
                  
                  <Button
                    onClick={handleAcceptRitual}
                    disabled={isAccepting || createProgressMutation.isPending}
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-700 text-black font-bold px-12 py-3"
                    style={{ fontFamily: 'Cinzel Decorative' }}
                  >
                    {isAccepting ? 'Realizando Ritual...' : 'Aceito o Chamado do Curso'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}