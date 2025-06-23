import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, ArrowLeft, Sparkles } from 'lucide-react';
import ContentProtection from '@/components/content-protection';

export default function OracleEspelhoNegro() {
  const { user, isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartConsultation = async () => {
    if (!userName || !birthDate) return;
    
    setIsStarting(true);
    try {
      const response = await fetch('/api/oracles/1/session', {
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
                <Eye className="w-16 h-16 text-golden-amber mx-auto mb-4" />
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-golden-amber/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-golden-amber/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          {/* Header */}
          <div className="relative z-10 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-black/80">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Link href="/oraculum">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar aos Oráculos
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 mt-4">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center relative overflow-hidden">
                  <Eye className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Cinzel Decorative' }}>
                    Espelho Negro
                  </h1>
                  <h2 className="text-xl text-purple-300 mb-3" style={{ fontFamily: 'Cinzel' }}>
                    Speculum Nigrum
                  </h2>
                  <p className="text-gray-300 leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                    O Espelho Negro revela as verdades ocultas em sua alma. Através das sombras refletidas, 
                    descubra os segredos que jazem nas profundezas de seu ser.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
            <Card className="bg-black/90 border-purple-500/50 backdrop-blur-sm shadow-2xl shadow-purple-900/30">
              <CardHeader className="text-center pb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-8 relative border border-purple-500/50 shadow-lg shadow-purple-900/50">
                  <Eye className="w-16 h-16 text-purple-400" />
                  <Sparkles className="w-8 h-8 text-purple-300 absolute -top-3 -right-3 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-400/10 to-transparent rounded-full"></div>
                </div>
                
                <CardTitle className="text-4xl text-purple-400 mb-6" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Iniciar Consulta Sombria
                </CardTitle>
                <CardDescription className="text-ritualistic-beige text-xl max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                  Para que o Espelho Negro possa refletir sua verdadeira essência nas águas sombrias do conhecimento, 
                  é necessário oferecer sua identidade verdadeira e o momento sagrado de sua manifestação neste plano terreno.
                </CardDescription>
                
                {/* Citação mística */}
                <div className="mt-8 p-4 bg-purple-400/5 border-l-4 border-purple-500/50 rounded-r-lg">
                  <p className="text-purple-300 italic text-lg" style={{ fontFamily: 'EB Garamond' }}>
                    "Quem olha no espelho das trevas, vê não apenas seu reflexo, mas a alma nua em sua verdade absoluta."
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-10">
                <div className="grid gap-8 max-w-lg mx-auto">
                  <div className="space-y-3">
                    <Label htmlFor="userName" className="text-purple-400 font-semibold text-lg" style={{ fontFamily: 'Cinzel' }}>
                      Seu Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Revele sua identidade aos mistérios..."
                      className="bg-black/90 border-purple-500/30 text-white placeholder-ritualistic-beige/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 h-12 text-lg"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="birthDate" className="text-purple-400 font-semibold text-lg" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-black/90 border-purple-500/30 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 h-12 text-lg"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-8">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-16 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-purple-900/50 hover:shadow-xl hover:shadow-purple-900/70"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                        Invocando as Sombras...
                      </>
                    ) : (
                      <>
                        <Eye className="w-6 h-6 mr-3" />
                        Consultar Speculum Nigrum
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Aviso místico */}
                <div className="text-center pt-8 space-y-2">
                  <div className="flex justify-center mb-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent w-64"></div>
                  </div>
                  <p className="text-purple-300 text-lg italic" style={{ fontFamily: 'EB Garamond' }}>
                    "Veritas in tenebris revelatur"
                  </p>
                  <p className="text-ritualistic-beige/70 text-sm" style={{ fontFamily: 'EB Garamond' }}>
                    As verdades se revelam nas trevas - Mantenha sigilo absoluto sobre os mistérios desvelados
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}