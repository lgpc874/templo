import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/page-transition';
import ContentProtection from '@/components/content-protection';
import { Flame, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function OracleChamasInfernais() {
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
      
      const response = await fetch('/api/oracles/3/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userName, birthDate })
      });

      if (response.ok) {
        const { sessionToken } = await response.json();
        window.location.href = `/chat/${sessionToken}`;
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        alert('Erro ao iniciar consulta: ' + errorData.error);
      }
    } catch (error) {
      console.error('Erro ao iniciar consulta:', error);
      alert('Erro ao iniciar consulta: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Acesso Restrito</h1>
            <p className="text-gray-400">Você precisa estar logado para consultar os oráculos.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ContentProtection enableScreenshotProtection={true}>
        <div className="min-h-screen bg-gradient-to-b from-black via-orange-950/20 to-black relative overflow-hidden">
          {/* Selo rotativo de fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img 
              src="/assets/templo-seal.svg" 
              alt="Selo do Templo" 
              className="w-96 h-96 opacity-5 animate-spin"
              style={{ animationDuration: '120s' }}
            />
          </div>
          {/* Efeitos místicos de fundo */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-96 h-96 bg-orange-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-red-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-900/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          {/* Botão Voltar */}
          <div className="relative z-10 p-4">
            <Link href="/oraculum">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-black font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
            <div className="border border-orange-500/50 rounded-lg p-6 shadow-2xl shadow-orange-900/30">
              <div className="text-center pb-6">
                <div className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/50">
                  <Flame className="w-10 h-10 text-orange-400" />
                </div>
                
                <CardTitle className="text-2xl text-orange-400 mb-3" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Flammae Infernales
                </CardTitle>
                <CardDescription className="text-ritualistic-beige text-xs max-w-md mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para consultar o Flammae Infernales, ofereça sua identidade verdadeira e o momento de sua manifestação neste plano.
                </CardDescription>
                
                {/* Citação mística */}
                <div className="mt-4 p-3 bg-transparent border-l-2 border-orange-500/50 rounded-r">
                  <p className="text-orange-300 italic text-xs" style={{ fontFamily: 'EB Garamond' }}>
                    "Ignis animam revelat"
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-4 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-orange-400 text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Revele sua identidade..."
                      className="bg-transparent border-orange-500/30 text-white placeholder-ritualistic-beige/60 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-orange-400 text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-transparent border-orange-500/30 text-white focus:border-orange-400 focus:ring-1 focus:ring-orange-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-black font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange-900/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Invocando...
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-xs text-ritualistic-beige/70 pt-6 space-y-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent w-32 mx-auto mb-3"></div>
                  <p style={{ fontFamily: 'EB Garamond' }}>
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