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
      const token = localStorage.getItem('token');
      console.log('Token do localStorage:', token ? 'Token presente' : 'Token ausente');
      
      const response = await fetch('/api/oracles/6/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          user_name: userName, 
          birth_date: birthDate 
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Resposta completa:', data);
        const sessionToken = data.session_token || data.sessionToken;
        if (sessionToken) {
          window.location.href = `/chat/${sessionToken}`;
        } else {
          alert('Token de sessão não encontrado na resposta');
        }
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        alert('Erro ao iniciar consulta: ' + errorData.error);
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
        <div className="min-h-screen bg-transparent">
          
          {/* Botão Voltar */}
          <div className="relative z-10 p-4">
            <Link href="/oraculum">
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-black font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
            <div className="border border-purple-500/50 rounded-lg p-6 shadow-1xl shadow-purple-900/30 bg-black">
              <div className="text-center pb-6 bg-black">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 relative border border-purple-500/50 shadow-lg shadow-purple-900/50">
                  <Eye className="w-10 h-10 text-purple-400" />
                  <Sparkles className="w-5 h-5 text-purple-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <CardTitle className="text-2xl text-purple-400 mb-4" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Speculum Nigrum
            
                </CardTitle>
                <p><div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent w-48 mx-auto"></div></p>
                <CardDescription className="text-ritualistic-beige text-sm max-w-lg mx-auto leading-relaxed" style={{ fontFamily: 'EB Garamond' }}>
                  Para consultar o Speculum Nigrum, ofereça sua identidade verdadeira e o momento de sua manifestação neste plano.
                </CardDescription>
                
                {/* Citação mística */}
                <div className="mt-6 p-3 bg-black border-l-2 border-purple-500/50 rounded-r">
                  <p className="text-purple-300 italic text-sm" style={{ fontFamily: 'EB Garamond' }}>
                    "Veritas in tenebris revelatur"
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid gap-6 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-purple-400 font-medium text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Revele sua identidade..."
                      className="bg-transparent border-purple-500/30 text-white placeholder-ritualistic-beige/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-purple-400 font-medium text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-transparent border-purple-500/30 text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-black font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-purple-900/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Invocando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Aviso místico */}
                <div className="text-center pt-6 space-y-2">
                  <div className="flex justify-center mb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent w-48"></div>
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