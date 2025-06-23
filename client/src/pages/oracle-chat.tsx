import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Flame, Droplets, Shield, Sparkles, Send, CreditCard, ArrowLeft, Calendar, User } from 'lucide-react';
import ContentProtection from '@/components/content-protection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Oracle {
  id: number;
  name: string;
  latin_name: string;
  description?: string;
  icon_url?: string;
  theme_color: string;
  is_active: boolean;
  is_paid: boolean;
  price: number;
  free_roles: string[];
  restricted_roles: string[];
  role_discounts: any;
  sort_order: number;
  ai_personality?: string;
  ai_instructions?: string;
  auto_presentation: boolean;
  custom_presentation?: string;
}

interface OracleMessage {
  id: number;
  session_id: number;
  is_user: boolean;
  message: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

interface OracleSession {
  id: number;
  oracle_id: number;
  user_id: number;
  user_name: string;
  birth_date: string;
  session_token: string;
  started_at: string;
  last_activity: string;
  is_active: boolean;
}

const getOracleIcon = (oracleName: string) => {
  switch (oracleName.toLowerCase()) {
    case 'espelho negro':
      return <Eye className="w-6 h-6" />;
    case 'tarot infernal':
      return <Sparkles className="w-6 h-6" />;
    case 'chamas infernais':
      return <Flame className="w-6 h-6" />;
    case 'águas sombrias':
      return <Droplets className="w-6 h-6" />;
    case 'guardião do abismo':
      return <Shield className="w-6 h-6" />;
    default:
      return <Sparkles className="w-6 h-6" />;
  }
};

export default function OracleChat() {
  const [, params] = useRoute('/oraculum/:id');
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem(`oracle_session_${params?.id}`)
  );
  const [showUserForm, setShowUserForm] = useState(!sessionToken);
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Buscar dados do oráculo
  const { data: oracle, isLoading: oracleLoading } = useQuery<Oracle>({
    queryKey: [`/api/oracles/${params?.id}`],
    enabled: !!params?.id && isAuthenticated
  });

  // Buscar sessão atual
  const { data: session } = useQuery<OracleSession>({
    queryKey: [`/api/oracles/session/${sessionToken}`],
    enabled: !!sessionToken && isAuthenticated
  });

  // Buscar mensagens da sessão
  const { data: messages = [], refetch: refetchMessages } = useQuery<OracleMessage[]>({
    queryKey: [`/api/oracles/messages/${session?.id}`],
    enabled: !!session?.id && isAuthenticated
  });

  // Criar nova sessão
  const createSessionMutation = useMutation({
    mutationFn: async (data: { userName: string; birthDate: string }) => {
      const response = await fetch(`/api/oracles/${params?.id}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar sessão');
      }
      
      return response.json();
    },
    onSuccess: (session: OracleSession) => {
      setSessionToken(session.session_token);
      localStorage.setItem(`oracle_session_${params?.id}`, session.session_token);
      setShowUserForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/oracles/session/${session.session_token}`] });
    }
  });

  // Enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/oracles/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionToken,
          message
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        if (response.status === 402) {
          setIsPaymentRequired(true);
          throw new Error('Pagamento necessário');
        }
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setCurrentMessage('');
      setIsPaymentRequired(false);
      refetchMessages();
    }
  });

  // Auto scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = () => {
    if (!userName.trim() || !birthDate) return;
    
    createSessionMutation.mutate({
      userName: userName.trim(),
      birthDate
    });
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(currentMessage.trim());
  };

  const getUserPrice = (oracle: Oracle) => {
    if (!user || !oracle) return oracle?.price || 0;
    
    if (oracle.free_roles.includes(user.role || '')) {
      return 0;
    }

    const discount = oracle.role_discounts[user.role || ''] || 0;
    return oracle.price * (1 - discount / 100);
  };

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900/80 border-purple-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-purple-300">Acesso Restrito</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (oracleLoading || !oracle) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300">Carregando Oráculo...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const userPrice = getUserPrice(oracle);

  return (
    <PageTransition>
      <ContentProtection enableScreenshotProtection={true}>
        <div 
          className="min-h-screen"
          style={{
            background: `linear-gradient(145deg, ${oracle.theme_color}05, black, ${oracle.theme_color}10)`
          }}
        >
          {/* Header do Oráculo */}
          <div 
            className="border-b border-opacity-30 relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${oracle.theme_color}20, rgba(0,0,0,0.8))`,
              borderColor: oracle.theme_color
            }}
          >
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-gray-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <div className="flex-1 flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${oracle.theme_color}40, ${oracle.theme_color}60)`,
                      boxShadow: `0 4px 20px ${oracle.theme_color}30`
                    }}
                  >
                    {oracle.icon_url ? (
                      <img 
                        src={oracle.icon_url} 
                        alt={oracle.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <div style={{ color: oracle.theme_color }}>
                        {getOracleIcon(oracle.name)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-white">{oracle.name}</h1>
                    <p className="text-sm text-gray-400 italic">{oracle.latin_name}</p>
                  </div>
                </div>

                {oracle.is_paid && userPrice > 0 && (
                  <Badge 
                    variant="outline" 
                    className="border-purple-500/50 text-purple-300"
                  >
                    R$ {userPrice.toFixed(2)} por consulta
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-4">
            {showUserForm ? (
              /* Formulário de Dados Pessoais */
              <Card className="bg-gray-900/80 border-purple-500/30 mt-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-purple-300 mb-2">
                    Preparação Ritual
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    Para que as energias sejam canalizadas corretamente, 
                    informe seus dados pessoais verdadeiros
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Nome Completo Real</span>
                      </Label>
                      <Input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Seu nome completo verdadeiro"
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Data de Nascimento</span>
                      </Label>
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white mt-2"
                      />
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-400">
                      As informações são utilizadas apenas para a canalização energética 
                      e não são compartilhadas com terceiros.
                    </p>
                    
                    <Button
                      onClick={handleStartSession}
                      disabled={!userName.trim() || !birthDate || createSessionMutation.isPending}
                      className="w-full bg-gradient-to-r text-white shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${oracle.theme_color}, ${oracle.theme_color}CC)`
                      }}
                    >
                      {createSessionMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        getOracleIcon(oracle.name)
                      )}
                      Iniciar Consulta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Interface de Chat */
              <div className="space-y-4">
                {/* Informações da Sessão */}
                {session && (
                  <Card className="bg-gray-900/60 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-300">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{session.user_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(session.birth_date), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                        <div className="text-purple-300">
                          Sessão iniciada em {format(new Date(session.started_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Área de Mensagens */}
                <Card className="bg-gray-900/60 border-purple-500/30">
                  <CardContent className="p-0">
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <div className="mb-4">
                            {oracle.icon_url ? (
                              <img 
                                src={oracle.icon_url} 
                                alt={oracle.name}
                                className="w-16 h-16 object-contain mx-auto opacity-50"
                              />
                            ) : (
                              <div className="w-16 h-16 mx-auto flex items-center justify-center text-gray-500">
                                {getOracleIcon(oracle.name)}
                              </div>
                            )}
                          </div>
                          <p>Faça sua primeira pergunta para o {oracle.name}</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] p-4 rounded-lg ${
                                message.is_user
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-800 text-gray-100 border border-gray-700'
                              }`}
                              style={
                                !message.is_user
                                  ? {
                                      background: `linear-gradient(135deg, ${oracle.theme_color}10, rgba(31, 41, 55, 0.8))`,
                                      borderColor: oracle.theme_color + '30'
                                    }
                                  : {}
                              }
                            >
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.message}
                              </div>
                              <div className="text-xs opacity-60 mt-2 flex justify-between items-center">
                                <span>
                                  {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
                                </span>
                                {message.cost > 0 && (
                                  <span>R$ {message.cost.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>
                </Card>

                {/* Área de Input */}
                <Card className="bg-gray-900/60 border-purple-500/30">
                  <CardContent className="p-4">
                    {isPaymentRequired ? (
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2 text-yellow-400">
                          <CreditCard className="w-5 h-5" />
                          <span>Pagamento necessário para continuar</span>
                        </div>
                        <Button
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          onClick={() => setIsPaymentRequired(false)}
                        >
                          Processar Pagamento (R$ {userPrice.toFixed(2)})
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Textarea
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          placeholder="Digite sua pergunta para o oráculo..."
                          className="bg-gray-800 border-gray-600 text-white resize-none"
                          rows={3}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                          className="bg-gradient-to-r text-white px-6"
                          style={{
                            background: `linear-gradient(135deg, ${oracle.theme_color}, ${oracle.theme_color}CC)`
                          }}
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}