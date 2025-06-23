import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Sparkles, Flame, Droplets, Shield } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function Oraculum() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-golden-amber text-xl" style={{ fontFamily: 'Cinzel' }}>
            Carregando...
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen bg-black flex items-center justify-center">
            <Card className="w-full max-w-md bg-black/90 border-golden-amber/40">
              <CardContent className="p-8 text-center">
                <Eye className="w-16 h-16 mx-auto text-golden-amber mb-4" />
                <CardTitle className="text-xl text-golden-amber mb-4" style={{ fontFamily: 'Cinzel' }}>
                  Acesso Restrito
                </CardTitle>
                <CardDescription className="text-ritualistic-beige mb-6">
                  Faça login para acessar os Oráculos Infernais
                </CardDescription>
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
        <div className="min-h-screen bg-black">
          {/* Background image */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
              alt="Templo do Abismo" 
              className="w-96 h-96 opacity-5"
            />
          </div>

          {/* Header */}
          <div className="relative container mx-auto px-4 py-8">
            <div className="text-center mb-12">
              <Eye className="w-16 h-16 mx-auto text-golden-amber mb-4" />
              <h1 className="text-5xl font-bold text-golden-amber mb-6" style={{ fontFamily: 'Cinzel' }}>
                ORACULUM INFERNALE
              </h1>
              <p className="text-ritualistic-beige/70 max-w-3xl mx-auto px-4 mb-6">
                Adentre os mistérios ancestrais através dos cinco oráculos sagrados do Templo do Abismo.
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-golden-amber to-transparent w-96 mx-auto"></div>
            </div>

            {/* Oracle Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              
              {/* Speculum Nigrum */}
              <Link href="/speculum-nigrum">
                <Card className="bg-black/80 border-purple-500/50 hover:border-purple-400/70 cursor-pointer h-48">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-3">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-purple-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                      Speculum Nigrum
                    </CardTitle>
                    <CardDescription className="text-ritualistic-beige text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Espelho que revela verdades ocultas
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Tarotum Infernalis */}
              <Link href="/tarotum-infernalis">
                <Card className="bg-black/80 border-red-500/50 hover:border-red-400/70 cursor-pointer h-48">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-red-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                      Tarotum Infernalis
                    </CardTitle>
                    <CardDescription className="text-ritualistic-beige text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Cartas que revelam o destino
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Flammae Infernales */}
              <Link href="/flammae-infernales">
                <Card className="bg-black/80 border-orange-500/50 hover:border-orange-400/70 cursor-pointer h-48">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-3">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-orange-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                      Flammae Infernales
                    </CardTitle>
                    <CardDescription className="text-ritualistic-beige text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Chamas que mostram paixões
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Aquae Tenebrosae */}
              <Link href="/aquae-tenebrosae">
                <Card className="bg-black/80 border-blue-500/50 hover:border-blue-400/70 cursor-pointer h-48">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mb-3">
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-blue-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                      Aquae Tenebrosae
                    </CardTitle>
                    <CardDescription className="text-ritualistic-beige text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Águas que refletem o inconsciente
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {/* Custos Abyssi */}
              <Link href="/custos-abyssi">
                <Card className="bg-black/80 border-slate-500/50 hover:border-slate-400/70 cursor-pointer h-48">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-full flex items-center justify-center mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-400 mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                      Custos Abyssi
                    </CardTitle>
                    <CardDescription className="text-ritualistic-beige text-xs" style={{ fontFamily: 'EB Garamond' }}>
                      Guardião dos segredos profundos
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

            </div>

            {/* Footer */}
            <div className="text-center mt-12">
              <div className="h-px bg-gradient-to-r from-transparent via-golden-amber/50 to-transparent w-64 mx-auto mb-4"></div>
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