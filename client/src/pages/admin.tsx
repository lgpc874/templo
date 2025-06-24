import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Users,
  Settings,
  GraduationCap,
  FileText,
  Crown,
  Flame,
  Eye,
  Scroll,
  Zap
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Verificar se é admin
  if (user?.email !== 'admin@templodoabismo.com.br') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
          <div className="relative">
            {/* Efeito místico de fundo */}
            <div className="absolute inset-0 bg-red-900/10 blur-3xl rounded-full animate-pulse"></div>
            
            <Card className="relative bg-black/80 border-red-600/50 backdrop-blur-sm shadow-2xl shadow-red-900/50">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Crown className="w-16 h-16 mx-auto text-red-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-bold text-red-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Sanctum Clausum
                </h1>
                <p className="text-gray-300 text-lg" style={{ fontFamily: 'EB Garamond' }}>
                  Apenas o Magus Supremo pode adentrar nestes domínios sagrados
                </p>
                <div className="mt-8 flex justify-center">
                  <div className="w-16 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  const adminSections = [
    {
      id: 'cursus',
      title: 'Cursus Magistri',
      subtitle: 'Forjar os Caminhos do Conhecimento',
      description: 'Crie e molde os cursos iniciáticos que guiarão os buscadores através dos véus da sabedoria',
      icon: GraduationCap,
      color: 'from-amber-600 to-orange-600',
      borderColor: 'border-amber-500/30',
      shadowColor: 'shadow-amber-900/30',
      route: '/admin-courses',
      isPrimary: true
    },
    {
      id: 'modules',
      title: 'Libri Modulus',
      subtitle: 'Tecer os Capítulos Sagrados',
      description: 'Construa os módulos e lições que compõem cada jornada de transformação',
      icon: FileText,
      color: 'from-blue-600 to-purple-600',
      borderColor: 'border-blue-500/30',
      shadowColor: 'shadow-blue-900/30',
      route: '/admin-modules',
      isPrimary: true
    },
    {
      id: 'grimoires',
      title: 'Libri Tenebris',
      subtitle: 'Forjar os Grimórios Ancestrais',
      description: 'Administre a vasta coleção de textos ocultos e conhecimento ancestral',
      icon: BookOpen,
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500/30',
      shadowColor: 'shadow-purple-900/30',
      route: '/admin/libri'
    },
    {
      id: 'initiates',
      title: 'Ordo Initiatorum',
      subtitle: 'Guiar os Filhos das Trevas',
      description: 'Supervisione o progresso e a evolução dos iniciados em suas jornadas',
      icon: Users,
      color: 'from-green-600 to-teal-600',
      borderColor: 'border-green-500/30',
      shadowColor: 'shadow-green-900/30',
      route: '/admin-users'
    },
    {
      id: 'oracles',
      title: 'Oraculum Supremum',
      subtitle: 'Comandar as Vozes Proféticas',
      description: 'Configure os oráculos e suas personalidades místicas para consultas',
      icon: Eye,
      color: 'from-indigo-600 to-purple-600',
      borderColor: 'border-indigo-500/30',
      shadowColor: 'shadow-indigo-900/30',
      route: '/admin/oraculum'
    },
    {
      id: 'system',
      title: 'Arcana Systemata',
      subtitle: 'Moldar a Realidade Digital',
      description: 'Controle os aspectos fundamentais e configurações do templo virtual',
      icon: Settings,
      color: 'from-red-600 to-pink-600',
      borderColor: 'border-red-500/30',
      shadowColor: 'shadow-red-900/30',
      route: '/admin-settings'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
        {/* Efeitos místicos de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-amber-900/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/3 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10">
          <div className="container mx-auto px-4 py-12">
            {/* Header Místico */}
            <div className="text-center mb-16">
              <div className="mb-8">
                <div className="relative inline-block">
                  <Crown className="w-20 h-20 mx-auto text-amber-400 animate-pulse" />
                  <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full"></div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-amber-400 mb-6" style={{ fontFamily: 'Cinzel Decorative' }}>
                Sanctum Magistri
              </h1>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-xl md:text-2xl text-gray-300 mb-6" style={{ fontFamily: 'EB Garamond' }}>
                  Bem-vindo ao coração pulsante do Templo do Abismo, onde os fios da realidade digital são tecidos pelas mãos do Magus Supremo
                </p>
                
                <div className="flex justify-center mb-8">
                  <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent w-96"></div>
                </div>
                
                <div className="flex items-center justify-center text-amber-300/80">
                  <Flame className="w-5 h-5 mr-2 animate-pulse" />
                  <span style={{ fontFamily: 'EB Garamond' }}>
                    {user?.spiritual_name || user?.username}
                  </span>
                  <Flame className="w-5 h-5 ml-2 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Grid de Seções Administrativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {adminSections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <Card 
                    key={section.id}
                    className={`
                      relative bg-black/40 ${section.borderColor} backdrop-blur-sm 
                      hover:bg-black/60 transition-all duration-500 cursor-pointer group
                      ${section.shadowColor} shadow-xl hover:shadow-2xl hover:scale-105
                      ${section.isPrimary ? 'md:col-span-1 lg:col-span-1' : ''}
                    `}
                    onClick={() => setLocation(section.route)}
                  >
                    {/* Efeito de brilho no hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg`}></div>
                    
                    <CardContent className="p-8 relative">
                      {/* Ícone */}
                      <div className="mb-6">
                        <div className="relative">
                          <IconComponent className={`w-12 h-12 mx-auto text-transparent bg-gradient-to-r ${section.color} bg-clip-text group-hover:scale-110 transition-transform duration-300`} />
                          <div className={`absolute inset-0 bg-gradient-to-r ${section.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`}></div>
                        </div>
                      </div>

                      {/* Título */}
                      <h3 className="text-xl font-bold text-center mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                        <span className={`text-transparent bg-gradient-to-r ${section.color} bg-clip-text`}>
                          {section.title}
                        </span>
                      </h3>

                      {/* Subtítulo */}
                      <p className="text-center text-amber-300/80 text-sm mb-4 font-medium" style={{ fontFamily: 'EB Garamond' }}>
                        {section.subtitle}
                      </p>

                      {/* Descrição */}
                      <p className="text-center text-gray-400 text-sm leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                        {section.description}
                      </p>

                      {/* Indicador de hover */}
                      <div className="mt-6 flex justify-center">
                        <div className={`w-0 group-hover:w-16 h-px bg-gradient-to-r ${section.color} transition-all duration-500`}></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Rodapé Místico */}
            <div className="text-center mt-20">
              <div className="flex justify-center mb-6">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-96"></div>
              </div>
              
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'EB Garamond' }}>
                "Que a sabedoria flua através de suas mãos como as águas primordiais do Abismo"
              </p>
              
              <div className="mt-4 flex items-center justify-center">
                <Scroll className="w-4 h-4 text-amber-500/50 mr-2" />
                <span className="text-amber-500/50 text-xs">MAGUS SUPREMO</span>
                <Scroll className="w-4 h-4 text-amber-500/50 ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}