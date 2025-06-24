import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTransition } from '@/components/page-transition';
import ContentProtection from '@/components/content-protection';
import { Shield, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function OracleGuardiaoAbismo() {
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
      
      const response = await fetch('/api/oracles/10/session', {
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
        <div className="min-h-screen bg-gradient-to-b from-black via-slate-950/20 to-black relative overflow-hidden">
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-slate-900/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-zinc-900/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          {/* Botão Voltar */}
          <div className="relative z-10 p-4">
            <Link href="/oraculum">
              <Button size="sm" className="bg-slate-500 hover:bg-slate-600 text-black font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
            <div className="border border-slate-500/50 rounded-lg p-6 shadow-2xl shadow-slate-900/30">
              <div className="text-center pb-6">
                <div className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-500/50">
                  <Shield className="w-10 h-10 text-slate-400" />
                </div>
                
                <CardTitle className="text-2xl text-slate-400 mb-3" style={{ fontFamily: 'Cinzel Decorative' }}>
                  Custos Abyssi
                </CardTitle>
                <CardDescription className="text-ritualistic-beige text-xs max-w-md mx-auto" style={{ fontFamily: 'EB Garamond' }}>
                  Para consultar o Custos Abyssi, ofereça sua identidade verdadeira e o momento de sua manifestação neste plano.
                </CardDescription>
                
                {/* Citação mística */}
                <div className="mt-4 p-3 bg-transparent border-l-2 border-slate-500/50 rounded-r">
                  <p className="text-slate-300 italic text-xs" style={{ fontFamily: 'EB Garamond' }}>
                    "Custos sapientia aeterna"
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-4 max-w-sm mx-auto">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-slate-400 text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Nome Verdadeiro
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Revele sua identidade..."
                      className="bg-transparent border-slate-500/30 text-white placeholder-ritualistic-beige/60 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-slate-400 text-sm" style={{ fontFamily: 'Cinzel' }}>
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-transparent border-slate-500/30 text-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400/50 h-10 text-sm"
                      style={{ fontFamily: 'EB Garamond' }}
                    />
                  </div>
                </div>
                
                <div className="text-center pt-6">
                  <Button
                    onClick={handleStartConsultation}
                    disabled={!userName || !birthDate || isStarting}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-black font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-slate-900/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {isStarting ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Invocando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Consultar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-xs text-ritualistic-beige/70 pt-6 space-y-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-400/50 to-transparent w-32 mx-auto mb-3"></div>
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