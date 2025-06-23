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
          <div className="relative z-10 border-b border-red-500/30 bg-transparent">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link href="/oraculum">
                    <Button size="sm" className="bg-red-500 hover:bg-red-600 text-black font-medium">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
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
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
            <div className="border border-red-500/50 rounded-lg p-6 shadow-2xl shadow-red-900/30">
              <div className="text-center pb-8">
                <div className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center mx-auto mb-6 relative border border-red-500/50 shadow-lg shadow-red-900/50">
                  <Spade className="w-10 h-10 text-red-400" />
                  <Sparkles className="w-5 h-5 text-red-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <h2 className="text-2xl text-red-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Iniciar Consulta
                </h2>
                <p className="text-ritualistic-beige text-sm max-w-lg mx-auto leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                  Para consultar o Tarotum Infernalis, ofereça sua identidade verdadeira e o momento de sua manifestação neste plano.
                </p>
                
                {/* Citação mística */}
                <div className="mt-6 p-3 bg-transparent border-l-2 border-red-500/50 rounded-r">
                  <p className="text-red-300 italic text-sm" style={{ fontFamily: 'EB Garamond' }}>
                    "Fatum per ignem revelatur"
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid gap-6 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-red-400 font-medium text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Revele sua identidade..."
                      className="bg-transparent border-red-500/30 text-white placeholder-ritualistic-beige/60 focus:border-red-400 focus:ring-1 focus:ring-red-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-red-400 font-medium text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-transparent border-red-500/30 text-white focus:border-red-400 focus:ring-1 focus:ring-red-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-red-900/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Invocando...
                      </>
                    ) : (
                      <>
                        <Spade className="w-4 h-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center pt-6 space-y-2">
                  <div className="flex justify-center mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent w-48"></div>
                  </div>
                  <p className="text-ritualistic-beige/70 text-xs" style={{ fontFamily: 'EB Garamond' }}>
                    Mantenha sigilo absoluto sobre os mistérios revelados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}