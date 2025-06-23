import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Eye, Flame, Droplets, Shield, Lock } from 'lucide-react';
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

  const { data: oracles = [], isLoading } = useQuery({
    queryKey: ['/api/oracles/active'],
    enabled: isAuthenticated
  });

  const getUserPrice = (oracle: Oracle) => {
    if (!user) return oracle.price;
    
    // Verificar se o role tem acesso gratuito
    if (oracle.free_roles.includes(user.role || '')) {
      return 0;
    }

    // Verificar desconto por role
    const discount = oracle.role_discounts[user.role || ''] || 0;
    return oracle.price * (1 - discount / 100);
  };

  const canAccess = (oracle: Oracle) => {
    if (!user) return false;
    
    // Verificar se o role está restrito
    if (oracle.restricted_roles.length > 0 && !oracle.restricted_roles.includes(user.role || '')) {
      return false;
    }

    return true;
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-900/80 border-purple-500/30">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-purple-300">Acesso Restrito</CardTitle>
                <CardDescription className="text-gray-400">
                  Faça login para acessar os Oráculos Infernais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
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

  if (isLoading) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-300">Carregando os Mistérios...</p>
            </div>
          </div>
        </ContentProtection>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ContentProtection enableScreenshotProtection={true}>
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black">
          {/* Header místico */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/50 to-black/80 border-b border-purple-500/30">
            <div className="absolute inset-0 opacity-50" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%238B5CF6\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
            <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
              <div className="mb-6">
                <Crown className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  ORACULUM INFERNALE
                </h1>
                <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto"></div>
              </div>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Adentre os mistérios ancestrais através dos cinco oráculos sagrados do Templo do Abismo. 
                Cada portal revela segredos únicos através de artes divinatórias milenares, 
                guiados por mestres especializados em suas respectivas tradições esotéricas.
              </p>
              
              <div className="mt-8 flex justify-center items-center space-x-4 text-purple-300">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Visões Reveladoras</span>
                </div>
                <div className="w-1 h-6 bg-purple-500/50"></div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm">Sabedoria Ancestral</span>
                </div>
                <div className="w-1 h-6 bg-purple-500/50"></div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Proteção Ritual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Oráculos */}
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {oracles.map((oracle) => {
                const userPrice = getUserPrice(oracle);
                const hasAccess = canAccess(oracle);
                
                return (
                  <Card 
                    key={oracle.id} 
                    className="group relative overflow-hidden bg-gray-900/60 border-2 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                    style={{
                      borderColor: oracle.theme_color + '40',
                      background: `linear-gradient(145deg, ${oracle.theme_color}10, rgba(17, 24, 39, 0.8))`
                    }}
                  >
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:shadow-xl transition-all duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${oracle.theme_color}30, ${oracle.theme_color}60)`,
                            boxShadow: `0 8px 32px ${oracle.theme_color}40`
                          }}
                        >
                          {oracle.icon_url ? (
                            <img 
                              src={oracle.icon_url} 
                              alt={oracle.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div style={{ color: oracle.theme_color }}>
                              {getOracleIcon(oracle.name)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl text-white mb-2">
                        {oracle.name}
                      </CardTitle>
                      
                      <div className="text-sm text-gray-400 italic mb-3">
                        {oracle.latin_name}
                      </div>
                      
                      <CardDescription className="text-gray-300 text-sm leading-relaxed">
                        {oracle.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Preço e badges */}
                        <div className="flex justify-between items-center">
                          {oracle.is_paid ? (
                            <div className="flex items-center space-x-2">
                              {userPrice === 0 ? (
                                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-400/30">
                                  Gratuito para seu role
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className="border-purple-500/50 text-purple-300"
                                >
                                  R$ {userPrice.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-400/30">
                              Gratuito
                            </Badge>
                          )}
                          
                          {!hasAccess && (
                            <Badge variant="destructive" className="bg-red-600/20 text-red-400 border-red-400/30">
                              <Lock className="w-3 h-3 mr-1" />
                              Restrito
                            </Badge>
                          )}
                        </div>

                        {/* Botão de acesso */}
                        {hasAccess ? (
                          <Link href={`/oraculum/${oracle.id}`}>
                            <Button 
                              className="w-full bg-gradient-to-r hover:scale-105 transition-all duration-300 shadow-lg"
                              style={{
                                background: `linear-gradient(135deg, ${oracle.theme_color}, ${oracle.theme_color}CC)`,
                                boxShadow: `0 4px 20px ${oracle.theme_color}30`
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Consultar Oráculo
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            disabled 
                            className="w-full bg-gray-700 text-gray-400 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Acesso Restrito
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Footer místico */}
          <div className="border-t border-purple-500/30 bg-black/50 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-400 text-sm">
                "Os mistérios se revelam àqueles que buscam com sinceridade e reverência aos antigos caminhos."
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Templo do Abismo • Oráculos Infernais • Tradições Ancestrais
              </div>
            </div>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}