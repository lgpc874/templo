import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [, params] = useRoute('/chat/:sessionToken');
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [sessionToken, setSessionToken] = useState<string | null>(
    params?.sessionToken || null
  );
  const [showUserForm, setShowUserForm] = useState(!sessionToken);
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isPaymentRequired, setIsPaymentRequired] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<OracleSession & { oracle: Oracle }>({
    queryKey: [`/api/oracles/session/${sessionToken}`],
    queryFn: async () => {
      const response = await fetch(`/api/oracles/session/${sessionToken}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Sessão não encontrada');
      return response.json();
    },
    enabled: !!sessionToken && isAuthenticated
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<OracleMessage[]>({
    queryKey: [`/api/oracles/messages/${session?.id}`],
    queryFn: async () => {
      const response = await fetch(`/api/oracles/messages/${session?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!session?.id && isAuthenticated
  });

  const hasSentAutoPresentation = useRef(false);

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      sessionToken
    }: {
      message: string;
      sessionToken: string;
    }) => {
      const response = await fetch(`/api/oracles/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionToken, message })
      });

      if (!response.ok) {
        if (response.status === 402) {
          setIsPaymentRequired(true);
          throw new Error('Pagamento necessário');
        }
        const error = await response.json();
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
  useEffect(() => {
    if (
      session &&
      session.oracle &&
      session.oracle.auto_presentation &&
      messages.length === 0 &&
      !sessionLoading &&
      !hasSentAutoPresentation.current
    ) {
      hasSentAutoPresentation.current = true;

      const presentationMessage = "APRESENTACAO_AUTOMATICA";

      sendMessageMutation.mutate({
        message: presentationMessage,
        sessionToken: session.session_token
      });
    }
  }, [session, messages, sessionLoading]);

  const createSessionMutation = useMutation({
    mutationFn: async (data: { userName: string; birthDate: string }) => {
      const response = await fetch(`/api/oracles/:id}/session`, {
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
      localStorage.setItem(`oracle_session_:id}`, session.session_token);
      setShowUserForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/oracles/session/${session.session_token}`] });
    }
  });

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

    sendMessageMutation.mutate({
      message: currentMessage.trim(),
      sessionToken: session?.session_token || ''
    });
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
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-black/90 border-golden-amber/40">
            <CardContent className="p-8 text-center">
              <Eye className="w-16 h-16 mx-auto text-golden-amber mb-4" />
              <CardTitle className="text-xl text-golden-amber mb-4">Acesso Restrito</CardTitle>
              <CardDescription className="text-ritualistic-beige">
                Faça login para acessar os oráculos
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (sessionLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-golden-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-golden-amber">Carregando sessão do oráculo...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!session) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="w-full max-w-md bg-black/90 border-red-500/40">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-xl text-red-400 mb-4">Sessão Inválida</CardTitle>
              <CardDescription className="text-ritualistic-beige">
                Sessão do oráculo não encontrada ou expirada
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const oracle = session.oracle;
  if (!oracle) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-golden-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-golden-amber">Carregando dados do oráculo...</p>
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
          </div>
          </ContentProtection>
          </PageTransition>
          );
          }
