import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, ArrowLeft, Sparkles } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function OracleChamasInfernais() {
  const { user, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartConsultation = async () => {
    if (!userName || !birthDate) return;
    
    setIsStarting(true);
    try {
      const response = await fetch('/api/oracles/3/session', {
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
                <Flame className="w-16 h-16 text-golden-amber mx-auto mb-4" />
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
        <div className="min-h-screen bg-gradient-to-b from-black via-orange-950 to-black text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-orange-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 border-b border-orange-500/30 bg-transparent">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <Link href="/oraculum">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-black font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-6xl font-bold text-golden-amber mb-6" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Flammae Infernales
                  </h1>
                  <p className="text-gray-300 leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    As chamas eternas do inferno revelam paixões ocultas e desejos ardentes. 
                    Deixe que o fogo sagrado ilumine os caminhos de sua alma.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
            <div className="border border-orange-500/50 rounded-lg p-6 shadow-2xl shadow-orange-900/30">
              <div className="text-center pb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Flame className="w-12 h-12 text-white" />
                  <Sparkles className="w-6 h-6 text-orange-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <CardTitle className="text-3xl text-white mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Consulta às Chamas
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para que as chamas infernais possam revelar seus segredos mais ardentes, 
                  é necessário oferecer sua essência ao fogo sagrado.
                </CardDescription>
              </div>
              
              <div className="space-y-6">
                <div className="grid gap-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-orange-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Seu Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="bg-gray-800/50 border-orange-500/30 text-white placeholder-gray-400 focus:border-orange-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-orange-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-gray-800/50 border-orange-500/30 text-white focus:border-orange-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-12 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Flame className="w-5 h-5 mr-2 animate-pulse" />
                        Acendendo as Chamas...
                      </>
                    ) : (
                      <>
                        <Flame className="w-5 h-5 mr-2" />
                        Consultar as Chamas Infernais
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center pt-6 space-y-2">
                  <div className="flex justify-center mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent w-48"></div>
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