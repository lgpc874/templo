import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Star, Eye, Crown, Flame, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Oraculum() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOracle, setSelectedOracle] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const { data: oracles = [], isLoading } = useQuery({
    queryKey: ['oracles'],
    queryFn: () => fetch('/api/oracles').then(res => res.json()),
    enabled: isAuthenticated
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ['/api/oracle-consultations'],
    enabled: isAuthenticated && selectedOracle
  });

  const askOracleMutation = useMutation({
    mutationFn: async (data: { oracleId: number; question: string }) => {
      return apiRequest('POST', '/api/oracle/consult', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Consulta Realizada",
        description: "O oráculo respondeu sua pergunta.",
      });
      setQuestion("");
      setIsAsking(false);
      queryClient.invalidateQueries({ queryKey: ['/api/oracle-consultations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Consulta",
        description: error.message || "Erro ao consultar o oráculo.",
        variant: "destructive",
      });
      setIsAsking(false);
    }
  });

  const getOracleIcon = (oracleName: string) => {
    switch (oracleName.toLowerCase()) {
      case 'lucifer': return Flame;
      case 'lilith': return Crown;
      case 'samael': return Star;
      case 'hecate': return Eye;
      case 'abismo': return Sparkles;
      default: return MessageCircle;
    }
  };

  if (!isAuthenticated) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-cinzel text-golden-amber mb-4">Acesso Restrito</h1>
          <p className="text-ritualistic-beige/70">Apenas membros podem consultar os oráculos.</p>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-amber mx-auto mb-4"></div>
          <p className="text-muted-foreground">Conectando com os oráculos...</p>
        </div>
      </PageTransition>
    );
  }

  if (!selectedOracle) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel text-golden-amber tracking-wider mb-4">
              ⸸ ORACULUM MYSTICUM ⸸
            </h1>
            <p className="text-ritualistic-beige/80 max-w-2xl mx-auto">
              Consulte as entidades ancestrais e receba sabedoria dos mistérios ocultos
            </p>
          </div>

          {/* Oracle Selection */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {oracles.map((oracle: any) => {
              const IconComponent = getOracleIcon(oracle.name);
              
              return (
                <motion.div
                  key={oracle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedOracle(oracle)}
                >
                  <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30 hover:border-golden-amber/60 transition-all duration-300 h-full">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div 
                          className="p-4 rounded-full border-2 transition-all duration-300"
                          style={{ 
                            backgroundColor: `${oracle.color}20`,
                            borderColor: `${oracle.color}60`
                          }}
                        >
                          <IconComponent 
                            className="h-8 w-8" 
                            style={{ color: oracle.color }}
                          />
                        </div>
                      </div>
                      <CardTitle 
                        className="text-2xl font-cinzel mb-2"
                        style={{ color: oracle.color }}
                      >
                        {oracle.name}
                      </CardTitle>
                      <CardDescription className="text-ritualistic-beige/70">
                        {oracle.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <Badge 
                          className="text-black font-semibold"
                          style={{ backgroundColor: oracle.color }}
                        >
                          R$ {parseFloat(oracle.price_per_question).toFixed(2)} por pergunta
                        </Badge>
                      </div>
                      
                      {oracle.avatar_url && (
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-golden-amber/30">
                          <img 
                            src={oracle.avatar_url} 
                            alt={oracle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <Button 
                        className="w-full font-cinzel"
                        style={{ 
                          backgroundColor: oracle.color,
                          color: '#000'
                        }}
                      >
                        Consultar {oracle.name}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </PageTransition>
    );
  }

  // Oracle Chat Interface
  const IconComponent = getOracleIcon(selectedOracle.name);

  return (
    <ContentProtection enableScreenshotProtection={true}>
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {/* Oracle Header */}
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedOracle(null)}
              className="mb-4 text-golden-amber hover:text-golden-amber/80"
            >
              ← Voltar aos Oráculos
            </Button>
            
            <div className="flex justify-center mb-4">
              <div 
                className="p-6 rounded-full border-2"
                style={{ 
                  backgroundColor: `${selectedOracle.color}20`,
                  borderColor: `${selectedOracle.color}60`
                }}
              >
                <IconComponent 
                  className="h-12 w-12" 
                  style={{ color: selectedOracle.color }}
                />
              </div>
            </div>
            
            <h1 
              className="text-3xl font-cinzel mb-2"
              style={{ color: selectedOracle.color }}
            >
              {selectedOracle.name}
            </h1>
            <p className="text-ritualistic-beige/70">
              {selectedOracle.description}
            </p>
          </div>

          {/* Chat Interface */}
          <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30">
            <CardHeader>
              <div 
                className="p-4 rounded-lg border-l-4"
                style={{ 
                  backgroundColor: `${selectedOracle.color}10`,
                  borderLeftColor: selectedOracle.color
                }}
              >
                <p className="text-ritualistic-beige italic">
                  {selectedOracle.introduction_message}
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Previous Consultations */}
              {consultations.length > 0 && (
                <div className="mb-6 space-y-4 max-h-60 overflow-y-auto">
                  <h3 className="text-lg font-cinzel text-golden-amber">Consultas Anteriores</h3>
                  {consultations.map((consultation: any) => (
                    <div key={consultation.id} className="space-y-2">
                      <div className="bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-blue-200 text-sm">Você perguntou:</p>
                        <p className="text-white">{consultation.question}</p>
                      </div>
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${selectedOracle.color}20` }}
                      >
                        <p 
                          className="text-sm"
                          style={{ color: selectedOracle.color }}
                        >
                          {selectedOracle.name} respondeu:
                        </p>
                        <p className="text-white">{consultation.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Question Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-golden-amber mb-2">
                    Sua Pergunta ao {selectedOracle.name}
                  </label>
                  <Textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Faça sua pergunta com clareza e respeito..."
                    className="bg-black/50 border-golden-amber/30 text-ritualistic-beige min-h-[100px]"
                    disabled={isAsking || askOracleMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    className="text-black font-semibold"
                    style={{ backgroundColor: selectedOracle.color }}
                  >
                    Custo: R$ {parseFloat(selectedOracle.price_per_question).toFixed(2)}
                  </Badge>
                  
                  <Button
                    onClick={() => {
                      if (question.trim()) {
                        setIsAsking(true);
                        askOracleMutation.mutate({
                          oracleId: selectedOracle.id,
                          question: question.trim()
                        });
                      }
                    }}
                    disabled={!question.trim() || isAsking || askOracleMutation.isPending}
                    className="font-cinzel"
                    style={{ 
                      backgroundColor: selectedOracle.color,
                      color: '#000'
                    }}
                  >
                    {isAsking || askOracleMutation.isPending ? (
                      "Consultando..."
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Fazer Pergunta
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-ritualistic-beige/60">
                  * Apenas uma pergunta por vez. Aguarde a resposta antes de fazer nova consulta.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    </ContentProtection>
  );
}