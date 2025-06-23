import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Droplets, ArrowLeft, Sparkles } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function OracleAguasSombrias() {
  const { user, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartConsultation = async () => {
    if (!userName || !birthDate) return;
    
    setIsStarting(true);
    try {
      const response = await fetch('/api/oracles/4/session', {
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
                <Droplets className="w-16 h-16 text-golden-amber mx-auto mb-4" />
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
        <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 border-b border-blue-500/30 bg-gradient-to-r from-blue-900/50 to-black/80">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <Link href="/oraculum">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Oraculum
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                  <Droplets className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Águas Sombrias
                  </h1>
                  <h2 className="text-xl text-blue-300 mb-3" style={{ fontFamily: 'Cinzel' }}>
                    Aquae Tenebrosae
                  </h2>
                  <p className="text-gray-300 leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    As águas profundas dos abismos refletem os mistérios do inconsciente. 
                    Mergulhe nas correntes sombrias para descobrir verdades submersas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
            <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-blue-500/30 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Droplets className="w-12 h-12 text-white" />
                  <Sparkles className="w-6 h-6 text-blue-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <CardTitle className="text-3xl text-white mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Consulta às Águas
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para que as águas sombrias possam revelar os segredos do inconsciente, 
                  é preciso deixar sua essência fluir nas correntes místicas.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="grid gap-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-blue-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Seu Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="bg-gray-800/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-blue-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-gray-800/50 border-blue-500/30 text-white focus:border-blue-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-12 py-3 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Droplets className="w-5 h-5 mr-2 animate-pulse" />
                        Mergulhando nas Águas...
                      </>
                    ) : (
                      <>
                        <Droplets className="w-5 h-5 mr-2" />
                        Consultar as Águas Sombrias
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-400 pt-4" style={{ fontFamily: 'EB Garamond' }}>
                  <p>As águas sombrias revelam os mistérios que fluem no inconsciente.</p>
                  <p>Deixe-se levar pelas correntes da sabedoria ancestral.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}