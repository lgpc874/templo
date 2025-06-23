import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import MysticalFooter from "@/components/mystical-footer";
import { extractAndTruncateHTML } from "@/lib/text-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PlayCircle
} from "lucide-react";

// Ícones customizados
const InvertedCross = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20M8 18h8"/>
  </svg>
);

const InvertedStar = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20l-2.5-7.5H2l6.5-4.5L6 0l6 4.5L18 0l-2.5 8.5L22 12.5h-7.5L12 20z"/>
  </svg>
);

const MysticalFlame = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2c-1 3-3 5-3 8s2 5 3 5 3-2 3-5-2-5-3-8z"/>
    <path d="M9 8c0 2 1 3 2 3s2-1 2-3c0-1-1-2-2-2s-2 1-2 2z"/>
    <path d="M6 15c0 2 2 4 6 4s6-2 6-4c0-1-1-2-2-2H8c-1 0-2 1-2 2z"/>
  </svg>
);

const DarkCrown = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 18h18l-2-8-4 3-3-6-3 6-4-3-2 8z"/>
    <circle cx="7" cy="10" r="1"/>
    <circle cx="12" cy="4" r="1"/>
    <circle cx="17" cy="10" r="1"/>
  </svg>
);

const TemploLogo = ({ size = 20, className = "" }) => (
  <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
    <img 
      src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
      alt="Templo do Abismo" 
      className="w-full h-full object-contain"
      style={{ 
        filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' 
      }}
    />
  </div>
);


export default function Biblioteca() {
  const [activeSection, setActiveSection] = useState(1);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: sections = [], isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ['library-sections'],
    queryFn: () => fetch('/api/library/sections').then(res => {
      if (!res.ok) throw new Error('Failed to fetch sections');
      return res.json();
    })
  });

  const { data: allGrimoires = [], isLoading: grimoiresLoading, error: grimoiresError } = useQuery({
    queryKey: ['grimoires'],
    queryFn: () => fetch('/api/grimoires').then(res => {
      if (!res.ok) throw new Error('Failed to fetch grimoires');
      return res.json();
    })
  });

  // Buscar progresso do usuário
  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/user/progress'],
    enabled: isAuthenticated,
  });

  // Função para determinar o estado do grimório e botão
  const getGrimoireState = (grimoire: any) => {
    const progress = (userProgress as any)?.find((p: any) => p.grimoire_id === grimoire.id);
    const progressPercentage = progress ? parseFloat(progress.progress_percentage || '0') : 0;
    
    // Admin/Magus Supremo tem acesso total
    const isAdmin = user?.email === 'admin@templodoabismo.com.br' || user?.isAdmin;
    
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

    // Para admin ou grimórios gratuitos - acesso liberado
    if (isAdmin || !grimoire.is_paid || !parseFloat(grimoire.price || '0')) {
      return { 
        text: 'Ler', 
        action: 'read', 
        isLocked: false,
        progress: 0,
        icon: BookOpen
      };
    }

    // Grimório pago sem acesso
    return { 
      text: `R$ ${parseFloat(grimoire.price || '0').toFixed(2)}`, 
      action: 'purchase', 
      isLocked: true,
      progress: 0,
      icon: Lock
    };
  };

  // Função para lidar com ações do grimório
  const handleGrimoireAction = (grimoire: any) => {
    const grimoireState = getGrimoireState(grimoire);
    
    switch (grimoireState.action) {
      case 'read':
      case 'continue':
      case 'completed':
        // Navegar para o leitor do grimório
        setLocation(`/lector-grimorio/${grimoire.id}`);
        break;
      case 'purchase':
        // Admin tem acesso mesmo em grimórios pagos
        const isAdmin = user?.email === 'admin@templodoabismo.com.br' || user?.isAdmin;
        if (isAdmin) {
          setLocation(`/lector-grimorio/${grimoire.id}`);
        } else {
          toast({
            title: "Em desenvolvimento",
            description: "Sistema de compra será implementado em breve",
          });
        }
        break;
      default:
        console.log(`Ação não reconhecida: ${grimoireState.action}`);
    }
  };

  const getSectionIcon = (section: any) => {
    // Se há uma URL de ícone personalizada, retorna um componente de imagem
    if (section.icon_url) {
      return ({ size = 20, className = "" }) => (
        <img 
          src={section.icon_url} 
          alt={section.name}
          width={size} 
          height={size}
          className={`${className} object-contain`}
          onError={(e) => {
            // Fallback para emoji se a imagem falhar
            const target = e.currentTarget;
            target.style.display = 'none';
            const next = target.nextElementSibling as HTMLElement;
            if (next) next.style.display = 'inline';
          }}
        />
      );
    }
    
    // Se há um emoji personalizado, usa ele
    if (section.icon_name && section.icon_name !== '📚') {
      return ({ size = 20, className = "" }) => (
        <span 
          className={`${className} inline-block`}
          style={{ fontSize: `${size}px`, lineHeight: 1 }}
        >
          {section.icon_name}
        </span>
      );
    }
    
    // Fallback para ícones padrão baseados no ID
    switch (section.id) {
      case 1: return InvertedCross; // Atrium Ignis - Cruz invertida
      case 2: return InvertedStar;  // Porta Umbrae - Estrela invertida
      case 3: return MysticalFlame; // Arcana Noctis - Chama mística
      case 4: return DarkCrown; // Via Tenebris - Coroa sombria
      case 5: return TemploLogo; // Templo do Abismo - Logo em vermelho
      case 6: return Brain;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-500/20 text-green-300 border-green-500/30";
      case 2: return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case 3: return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case 4: return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // Função para obter a classe CSS da seção
  const getSectionCSSClass = (sectionName: string) => {
    switch (sectionName.toLowerCase()) {
      case 'atrium ignis': return 'atrium-ignis';
      case 'porta umbrae': return 'porta-umbrae';
      case 'arcana noctis': return 'arcana-noctis';
      case 'via tenebris': return 'via-tenebris';
      case 'templo do abismo': return 'templo-do-abismo';
      default: return 'atrium-ignis'; // Fallback
    }
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return "Iniciante";
      case 2: return "Intermediário";
      case 3: return "Avançado";
      case 4: return "Mestre";
      default: return "Indefinido";
    }
  };

  if (sectionsLoading || grimoiresLoading) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-amber mx-auto mb-4"></div>
          <p className="text-ritualistic-beige/70">Carregando biblioteca arcana...</p>
        </div>
      </PageTransition>
    );
  }



  return (
    <ContentProtection enableScreenshotProtection={true}>
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
          
          {/* Título e frase */}
          <div className="text-center mb-8">
            <h1 
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-cinzel tracking-wider mb-4 transition-colors duration-500 ${
                getSectionCSSClass((sections as LibrarySection[]).find(s => s.id === activeSection)?.name || 'Atrium Ignis')
              }`}
            >
              LIBRI TENEBRIS
            </h1>
            <p className="text-sm sm:text-base text-ritualistic-beige/80 max-w-2xl mx-auto px-4">
              Nos corredores silenciosos repousam os segredos do conhecimento proibido
            </p>
          </div>

          {/* Abas */}
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeSection.toString()} onValueChange={(value) => setActiveSection(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 bg-transparent h-auto p-1">
                {(sections as LibrarySection[]).map((section: LibrarySection) => {
                  const IconComponent = getSectionIcon(section);
                  const grimoireCount = (allGrimoires as Grimoire[]).filter((g: Grimoire) => g.section_id === section.id).length;
                  const sectionColor = section.color || '#D97706';
                  const isActive = activeSection === section.id;
                  
                  return (
                    <TabsTrigger
                      key={section.id}
                      value={section.id.toString()}
                      className={`flex flex-col items-center p-3 sm:p-4 space-y-2 data-[state=active]:bg-red-900/50 hover:bg-red-900/30 transition-all duration-300 border rounded-lg bg-black/30 backdrop-blur-sm ${
                        isActive ? getSectionCSSClass(section.name) : ''
                      }`}
                    >
                      <IconComponent 
                        size={20} 
                        className={`transition-colors duration-300 ${isActive ? getSectionCSSClass(section.name) : ''}`}
                      />
                      <span className={`text-xs font-cinzel text-center leading-tight transition-colors duration-300 ${isActive ? getSectionCSSClass(section.name) : ''}`}>
                        {section.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs transition-colors duration-300 ${isActive ? getSectionCSSClass(section.name) : ''}`}
                      >
                        {grimoireCount}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(sections as LibrarySection[]).map((section) => {
                const sectionGrimoires = (allGrimoires as Grimoire[]).filter((g: Grimoire) => g.section_id === section.id);
                const sectionColor = section.color || '#D97706';
                
                return (
                  <TabsContent key={section.id} value={section.id.toString()} className="mt-8">
                    <div className="mb-6">
                      <h3 
                        className={`text-xl sm:text-2xl font-cinzel mb-2 text-center transition-colors duration-300 ${getSectionCSSClass(section.name)}`}
                      >
                        {section.name}
                      </h3>
                      <p className="text-sm text-ritualistic-beige/70 text-center max-w-2xl mx-auto">
                        {section.description}
                      </p>
                    </div>
                    
                    {sectionGrimoires.length > 0 ? (
                      <div className="space-y-3">
                        {sectionGrimoires.map((grimoire) => (
                          <motion.div
                            key={grimoire.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="group"
                          >
                            <Card 
                              className={`bg-black/40 backdrop-blur-sm hover:scale-[1.02] cursor-pointer transition-all duration-300 ${getSectionCSSClass(section.name)}`}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = `${sectionColor}60`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = `${sectionColor}30`;
                              }}
                            >
                              <div className="flex p-4">
                                {/* Capa à esquerda */}
                                <div className="relative overflow-hidden rounded-lg mr-4 flex-shrink-0">
                                  {grimoire.cover_image_url ? (
                                    <div className="w-20 h-28 bg-gradient-to-b from-red-900/20 to-black/60">
                                      <img 
                                        src={grimoire.cover_image_url} 
                                        alt={grimoire.title}
                                        className="w-full h-full object-cover opacity-80 rounded-lg"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-20 h-28 bg-gradient-to-b from-red-900/20 to-black/60 flex items-center justify-center rounded-lg">
                                      <BookOpen 
                                        className={`h-6 w-6 opacity-50 ${getSectionCSSClass(section.name)}`}
                                      />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Conteúdo à direita */}
                                <div className="flex-1 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between mb-2">
                                      <h3 
                                        className={`font-cinzel text-lg font-semibold line-clamp-2 flex-1 mr-2 transition-colors duration-300 ${getSectionCSSClass(section.name)}`}
                                      >
                                        {grimoire.title}
                                      </h3>
                                      {grimoire.is_paid && grimoire.price && (
                                        <Badge 
                                          className="text-black font-semibold text-sm"
                                          style={{ backgroundColor: `${sectionColor}E6` }}
                                        >
                                          R$ {grimoire.price}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <p className="text-ritualistic-beige/70 text-sm line-clamp-2 mb-3">
                                      {extractAndTruncateHTML(grimoire.content, 100)}
                                    </p>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-ritualistic-beige/60 mb-3">
                                      <div className="flex items-center space-x-1">
                                        <Clock size={12} />
                                        <span>{grimoire.estimated_read_time || 0} min</span>
                                      </div>
                                      <Badge className={`text-xs ${getDifficultyColor(1)}`}>
                                        {grimoire.difficulty_level || "iniciante"}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {/* Botão dinâmico */}
                                  <div className="flex justify-end">
                                    <Button 
                                      size="sm" 
                                      className="bg-red-900/50 hover:bg-red-900/70 px-6 transition-colors duration-300"
                                      style={{
                                        color: sectionColor,
                                        borderColor: `${sectionColor}30`
                                      }}
                                      onClick={() => handleGrimoireAction(grimoire)}
                                    >
                                      {getGrimoireState(grimoire).text}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="mx-auto h-12 w-12 text-golden-amber/30 mb-4" />
                        <p className="text-ritualistic-beige/50">Nenhum grimório encontrado nesta seção</p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

        </div>
      </PageTransition>
    </ContentProtection>
  );
}