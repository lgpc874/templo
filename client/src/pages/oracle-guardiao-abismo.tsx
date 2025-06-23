import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft, Sparkles } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function OracleGuardiaoAbismo() {
  const { user, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartConsultation = async () => {
    if (!userName || !birthDate) return;
    
    setIsStarting(true);
    try {
      const response = await fetch('/api/oracles/5/session', {
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
                <Shield className="w-16 h-16 text-golden-amber mx-auto mb-4" />
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
        <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-slate-800/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-800/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative z-10 border-b border-slate-500/30 bg-transparent">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <Link href="/oraculum">
                  <Button size="sm" className="bg-slate-500 hover:bg-slate-600 text-black font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-gray-700 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                
                <div className="flex-1">
                  <h1 className="text-6xl font-bold text-golden-amber mb-6" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Custos Abyssi
                  </h1>
                  <p className="text-gray-300 leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    O Guardião ancestral do abismo protege os segredos mais profundos. 
                    Apenas os dignos podem acessar sua sabedoria milenár e receber sua proteção.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
            <Card className="bg-transparent border-slate-500/50 shadow-2xl shadow-slate-900/30">
              <CardHeader className="text-center pb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Shield className="w-12 h-12 text-white" />
                  <Sparkles className="w-6 h-6 text-slate-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <CardTitle className="text-3xl text-white mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Audiência com o Guardião
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para ser admitido na presença do Guardião do Abismo, 
                  é necessário apresentar sua identidade verdadeira e provar sua sinceridade.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                <div className="grid gap-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-slate-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Seu Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="bg-gray-800/50 border-slate-500/30 text-white placeholder-gray-400 focus:border-slate-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-slate-300 font-medium" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-gray-800/50 border-slate-500/30 text-white focus:border-slate-400"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-12 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Shield className="w-5 h-5 mr-2 animate-pulse" />
                        Despertando o Guardião...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Consultar o Guardião do Abismo
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-400 pt-4" style={{ fontFamily: 'EB Garamond' }}>
                  <p>O Guardião protege os segredos mais profundos do abismo.</p>
                  <p>Seja respeitoso e sincero em sua abordagem ancestral.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}