import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, Flame } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function OracleTarotInfernal() {
  const { user, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartConsultation = async () => {
    if (!userName || !birthDate) return;
    
    setIsStarting(true);
    try {
      const response = await fetch('/api/oracles/2/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userName, birthDate })
      });

      if (response.ok) {
        const session = await response.json();
        window.location.href = `/oracle-chat?session=${session.session_token}`;
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        alert('Erro ao iniciar consulta: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao iniciar consulta:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <ContentProtection>
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-black/80 border-golden-amber/30">
              <CardHeader className="text-center">
                <Sparkles className="w-16 h-16 text-golden-amber mx-auto mb-4" />
                <CardTitle className="text-golden-amber">Acesso Restrito</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/auth">
                  <Button className="w-full bg-golden-amber text-black">
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
      <ContentProtection enableScreenshotProtection>
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          {/* Background rotating seal */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <img 
              src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
              alt="Templo do Abismo" 
              className="w-96 h-96 opacity-5 animate-spin"
              style={{ animationDuration: '120s' }}
            />
          </div>
          {/* Efeitos místicos de fundo */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-900/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          {/* Header */}
          <div className="relative z-10 border-b border-red-500/30 bg-black/40">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link href="/oraculum">
                    <Button variant="ghost" size="sm" className="text-ritualistic-beige hover:text-red-400 transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar aos Oráculos
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center relative overflow-hidden">
                  <Sparkles className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-6xl font-bold text-red-400 mb-6" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Tarotum Infernalis
                  </h1>
                  <p className="text-gray-300 leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    As cartas infernais revelam os mistérios do destino através das chamas eternas. 
                    Descubra o que os arcanos sombrios têm a lhe dizer sobre seu futuro.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
            <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-red-500/30 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Sparkles className="w-12 h-12 text-white" />
                  <Flame className="w-6 h-6 text-red-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <CardTitle className="text-3xl text-white mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Consulta ao Tarot
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para que as cartas infernais possam revelar seu verdadeiro destino, 
                  precisamos conectar sua essência às energias místicas dos arcanos.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="grid gap-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-red-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Seu Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="bg-gray-800/50 border-red-500/30 text-white placeholder-gray-400 focus:border-red-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-red-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-gray-800/50 border-red-500/30 text-white focus:border-red-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-12 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Flame className="w-5 h-5 mr-2 animate-pulse" />
                        Embaralhando as Cartas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Consultar o Tarot Infernal
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-400 pt-4" style={{ fontFamily: 'EB Garamond' }}>
                  <p>As cartas infernais revelam verdades que podem mudar seu destino.</p>
                  <p>Esteja preparado para receber a sabedoria dos arcanos sombrios.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}