import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Eye, Flame, Droplets, Shield } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

interface Oracle {
  id: number;
  name: string;
  latin_name: string;
  description?: string;
  icon_url?: string;
  theme_color: string;
  is_active: boolean;
  is_paid: boolean;
  price: number;
  free_roles: string[];
  restricted_roles: string[];
  role_discounts: any;
  sort_order: number;
}

const getOracleIcon = (oracleName: string) => {
  switch (oracleName.toLowerCase()) {
    case 'espelho negro':
      return <Eye className="w-8 h-8" />;
    case 'tarot infernal':
      return <Sparkles className="w-8 h-8" />;
    case 'chamas infernais':
      return <Flame className="w-8 h-8" />;
    case 'águas sombrias':
      return <Droplets className="w-8 h-8" />;
    case 'guardião do abismo':
      return <Shield className="w-8 h-8" />;
    default:
      return <Crown className="w-8 h-8" />;
  }
};

const roleHierarchy = {
  'buscador': 1,
  'iniciado': 2,
  'portador_veu': 3,
  'discipulo_chamas': 4,
  'guardiao_nome': 5,
  'arauto_queda': 6,
  'portador_coroa': 7,
  'magus_supremo': 8
};

export default function Oraculum() {
  const { user, isAuthenticated } = useAuth();

  // Removido sistema dinâmico - usando 5 botões fixos em latim

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
            {/* Background rotating seal */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <img 
                src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
                alt="Templo do Abismo" 
                className="w-96 h-96 opacity-5 animate-spin"
                style={{ animationDuration: '120s' }}
              />
            </div>
            
            <Card className="w-full max-w-md bg-black/80 border-golden-amber/30 backdrop-blur-sm relative">
              <CardHeader className="text-center">
                <Eye className="w-16 h-16 text-golden-amber mx-auto mb-4 animate-pulse" />
                <CardTitle className="text-2xl text-golden-amber" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Acesso Restrito
                </CardTitle>
                <CardDescription className="text-ritualistic-beige" style={{ fontFamily: 'EB Garamond' }}>
                  Faça login para acessar os Oráculos Infernais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth">
                  <Button 
                    className="w-full bg-gradient-to-r from-golden-amber/80 to-golden-amber hover:from-golden-amber hover:to-golden-amber/80 text-black font-bold"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    Fazer Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </ContentProtection>
      </PageTransition>
    );
  }



  return (
    <PageTransition>
      <ContentProtection enableScreenshotProtection={true}>
        <div className="min-h-screen bg-black relative">
          {/* Background rotating seal */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
              alt="Templo do Abismo" 
              className="w-96 h-96 opacity-5"
            />
          </div>

          {/* Header místico */}
          <div className="relative">
            <div className="container mx-auto px-4 py-8">
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <div className="relative inline-block">
                    <Eye className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 mx-auto text-golden-amber" />
                    <div className="absolute inset-0 bg-golden-amber/20 blur-xl rounded-full"></div>
                  </div>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-golden-amber mb-6" style={{ fontFamily: 'Cinzel' }}>
                  ORACULUM INFERNALE
                </h1>
                
                <div className="max-w-4xl mx-auto">
                  <p className="text-xs sm:text-sm text-ritualistic-beige/70 max-w-3xl mx-auto px-4 mb-6">
                    Adentre os mistérios ancestrais através dos cinco oráculos sagrados do Templo do Abismo. 
                    Cada portal revela segredos únicos através de artes divinatórias milenares, 
                    guiados por mestres especializados em suas respectivas tradições esotéricas.
                  </p>
                  
                  <div className="flex justify-center mb-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-golden-amber to-transparent w-96"></div>
                  </div>
                  
                  <div className="flex items-center justify-center text-golden-amber/80 space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Visões Reveladoras</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Sabedoria Ancestral</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 animate-pulse" />
                      <span>Proteção Ritual</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Oráculos */}
          <div className="relative container mx-auto px-4 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Espelho Negro */}
              <Card className="group relative bg-black/60 border-purple-500/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-purple-900/20 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30">
                      <Eye className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-golden-amber mb-2" style={{ fontFamily: 'Cinzel' }}>
                    Espelho Negro
                  </CardTitle>
                  
                  <div className="text-xs text-golden-amber/60 italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                    Speculum Nigrum
                  </div>
                  
                  <CardDescription className="text-ritualistic-beige text-xs leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    Revela as verdades ocultas refletidas nas sombras da alma
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link href="/speculum-nigrum">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold transition-all duration-300" style={{ fontFamily: 'Cinzel' }}>
                      <Eye className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Tarot Infernal */}
              <Card className="group relative bg-black/60 border-red-500/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-red-900/20 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30">
                      <Sparkles className="w-8 h-8 text-red-400" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-golden-amber mb-2" style={{ fontFamily: 'Cinzel' }}>
                    Tarot Infernal
                  </CardTitle>
                  
                  <div className="text-xs text-golden-amber/60 italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                    Tarotum Infernalis
                  </div>
                  
                  <CardDescription className="text-ritualistic-beige text-xs leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    As cartas infernais desvelam os mistérios do destino
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link href="/tarotum-infernalis">
                    <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold transition-all duration-300" style={{ fontFamily: 'Cinzel' }}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Chamas Infernais */}
              <Card className="group relative bg-black/60 border-orange-500/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-orange-900/20 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30">
                      <Flame className="w-8 h-8 text-orange-400" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-golden-amber mb-2" style={{ fontFamily: 'Cinzel' }}>
                    Chamas Infernais
                  </CardTitle>
                  
                  <div className="text-xs text-golden-amber/60 italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                    Flammae Infernales
                  </div>
                  
                  <CardDescription className="text-ritualistic-beige text-xs leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    O fogo eterno revela paixões e desejos ardentes da alma
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link href="/flammae-infernales">
                    <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold transition-all duration-300" style={{ fontFamily: 'Cinzel' }}>
                      <Flame className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Águas Sombrias */}
              <Card className="group relative bg-black/60 border-blue-500/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-blue-900/20 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600/20 to-teal-600/20 border border-blue-500/30">
                      <Droplets className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-golden-amber mb-2" style={{ fontFamily: 'Cinzel' }}>
                    Águas Sombrias
                  </CardTitle>
                  
                  <div className="text-xs text-golden-amber/60 italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                    Aquae Tenebrosae
                  </div>
                  
                  <CardDescription className="text-ritualistic-beige text-xs leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    As águas profundas refletem os mistérios do inconsciente
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link href="/aquae-tenebrosae">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold transition-all duration-300" style={{ fontFamily: 'Cinzel' }}>
                      <Droplets className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Guardião do Abismo */}
              <Card className="group relative bg-black/60 border-slate-500/30 backdrop-blur-sm hover:bg-black/80 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-slate-900/20 hover:scale-105 md:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-slate-600/20 to-gray-700/20 border border-slate-500/30">
                      <Shield className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg text-golden-amber mb-2" style={{ fontFamily: 'Cinzel' }}>
                    Guardião do Abismo
                  </CardTitle>
                  
                  <div className="text-xs text-golden-amber/60 italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                    Custos Abyssi
                  </div>
                  
                  <CardDescription className="text-ritualistic-beige text-xs leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    O protetor ancestral dos segredos mais profundos do abismo
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Link href="/custos-abyssi">
                    <Button className="w-full bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-bold transition-all duration-300" style={{ fontFamily: 'Cinzel' }}>
                      <Shield className="w-4 h-4 mr-2" />
                      Consultar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Footer místico */}
            <div className="text-center mt-12">
              <div className="flex justify-center mb-4">
                <div className="h-px bg-gradient-to-r from-transparent via-golden-amber/50 to-transparent w-64"></div>
              </div>
              
              <p className="text-ritualistic-beige/60 text-sm italic mb-3" style={{ fontFamily: 'EB Garamond' }}>
                "Os mistérios se revelam àqueles que buscam com sinceridade e reverência aos antigos caminhos."
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-golden-amber/60 text-xs">
                <span style={{ fontFamily: 'Cinzel' }}>TEMPLO DO ABISMO</span>
                <span>•</span>
                <span style={{ fontFamily: 'Cinzel' }}>ORÁCULOS INFERNAIS</span>
                <span>•</span>
                <span style={{ fontFamily: 'Cinzel' }}>TRADIÇÕES ANCESTRAIS</span>
              </div>
            </div>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}