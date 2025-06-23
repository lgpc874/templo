import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Flame, 
  Crown, 
  Eye,
  Star,
  Moon,
  Shield,
  Scroll,
  Lock,
  Skull,
  Sparkles,
  Zap,
  CheckCircle,
  Circle,
  ArrowRight,
  BookOpen,
  Key
} from "lucide-react";

export default function Initiatio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [ritualAccepted, setRitualAccepted] = useState(false);
  const [oathText, setOathText] = useState('');
  const [spiritualName, setSpiritualName] = useState('');
  const [transformationPhase, setTransformationPhase] = useState(0);
  
  // Verificar se usuário já completou a iniciação baseado em dados reais
  const isInitiated = user?.initiation_completed === true;

  // Query para verificar status de iniciação
  const { data: initiationStatus } = useQuery({
    queryKey: ['/api/initiation/status'],
    enabled: !!user
  });

  // Mutation para completar iniciação
  const completeInitiationMutation = useMutation({
    mutationFn: async (data: { spiritualName: string; oathAccepted: boolean }) => {
      return apiRequest('POST', '/api/initiation/complete', data);
    },
    onSuccess: () => {
      toast({
        title: "Iniciação Completa!",
        description: "Bem-vindo aos mistérios do Templo do Abismo.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiation/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na Iniciação",
        description: error.message || "Falha ao completar a iniciação.",
        variant: "destructive",
      });
    }
  });

  const steps = [
    {
      id: 1,
      title: "Preparação",
      description: "Prepare-se para a jornada",
      icon: Eye
    },
    {
      id: 2,
      title: "Ritual Digital",
      description: "Execute o ritual de entrada",
      icon: Flame
    },
    {
      id: 3,
      title: "Juramento",
      description: "Aceite os caminhos das sombras",
      icon: Scroll
    },
    {
      id: 4,
      title: "Transformação",
      description: "Renasça como um iniciado",
      icon: Sparkles
    },
    {
      id: 5,
      title: "Acesso Concedido",
      description: "Entre no sanctum interior",
      icon: Crown
    }
  ];

  const requiredOathText = "Eu aceito os caminhos do Abismo e juro buscar o conhecimento com sabedoria";

  // Efeito de transformação
  useEffect(() => {
    if (currentStep === 4) {
      const interval = setInterval(() => {
        setTransformationPhase(prev => (prev + 1) % 4);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const transformationMessages = [
    "O fogo da transformação arde dentro de você...",
    "As chamas consomem sua antiga forma...",
    "Você renasce das cinzas do passado...",
    "A metamorfose está completa..."
  ];

  return (
    <ContentProtection>
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Flame className="h-16 w-16 text-golden-amber mx-auto mb-6" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-cinzel text-golden-amber mb-4 tracking-wide">
                INITIATIO ABYSSOS
              </h1>
              <p className="text-lg text-ritualistic-beige/80 max-w-2xl mx-auto leading-relaxed">
                O ritual sagrado de entrada nos mistérios profundos do Templo do Abismo
              </p>
            </motion.div>
          </div>

          {isInitiated ? (
            // Se já é iniciado, mostrar status
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30">
                <CardHeader className="text-center">
                  <Crown className="h-12 w-12 text-golden-amber mx-auto mb-4" />
                  <CardTitle className="text-2xl font-cinzel text-golden-amber">
                    Salve, Iniciado do Abismo
                  </CardTitle>
                  <CardDescription className="text-ritualistic-beige/70">
                    Você já passou pelos ritos sagrados e possui acesso aos mistérios ocultos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <Badge className="bg-golden-amber/20 text-golden-amber border-golden-amber/30">
                    Status: {user?.role === 'admin' ? 'Magus Supremo' : 'Iniciado Confirmado'}
                  </Badge>
                  
                  <div className="bg-black/30 border border-golden-amber/20 rounded-lg p-6">
                    <h3 className="font-cinzel text-golden-amber mb-4">Privilégios de Iniciado:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-ritualistic-beige/70">Grimórios Secretos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-ritualistic-beige/70">Cursos Avançados</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-ritualistic-beige/70">Consultas Oraculares</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-ritualistic-beige/70">Comunidade Interna</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-golden-amber text-black hover:bg-golden-amber/90"
                      onClick={() => window.location.href = '/biblioteca'}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Acessar Biblioteca Secreta
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-golden-amber/30 text-golden-amber hover:bg-golden-amber/10"
                      onClick={() => window.location.href = '/cursus'}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Continuar Estudos Avançados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Processo de iniciação
            <div className="max-w-4xl mx-auto">
              {/* Progress Steps */}
              <div className="flex justify-between mb-12 overflow-x-auto pb-4">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`flex flex-col items-center min-w-[120px] ${
                        isActive ? 'text-golden-amber' : 
                        isCompleted ? 'text-green-400' : 
                        'text-ritualistic-beige/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                        isActive ? 'border-golden-amber bg-golden-amber/20 shadow-lg shadow-golden-amber/20' : 
                        isCompleted ? 'border-green-400 bg-green-400/20' : 
                        'border-ritualistic-beige/30'
                      }`}>
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-cinzel text-center">{step.title}</span>
                      <span className="text-xs text-center opacity-70">{step.description}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Step Content */}
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30">
                <CardContent className="p-8">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center space-y-6"
                      >
                        <Eye className="h-20 w-20 text-golden-amber mx-auto" />
                        <h2 className="text-3xl font-cinzel text-golden-amber">Preparação do Espírito</h2>
                        <p className="text-ritualistic-beige/80 leading-relaxed max-w-2xl mx-auto">
                          Antes de adentrar os mistérios do Abismo, você deve preparar sua mente e espírito. 
                          Este é um caminho que requer coragem, determinação e a vontade de abraçar as sombras 
                          para encontrar a verdadeira iluminação.
                        </p>
                        <div className="bg-black/30 border border-golden-amber/20 rounded-lg p-6 my-6">
                          <h3 className="font-cinzel text-golden-amber mb-4">Requisitos para Iniciação:</h3>
                          <div className="text-left text-ritualistic-beige/70 space-y-3">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span>Mente aberta aos ensinamentos ocultos</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span>Disposição para questionar dogmas estabelecidos</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span>Coragem para enfrentar suas próprias sombras</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <span>Compromisso com o autodesenvolvimento espiritual</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setCurrentStep(2)}
                          className="bg-golden-amber text-black hover:bg-golden-amber/90 px-8 py-3"
                        >
                          Estou Preparado para Prosseguir
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center space-y-6"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <Flame className="h-20 w-20 text-red-500 mx-auto" />
                        </motion.div>
                        <h2 className="text-3xl font-cinzel text-golden-amber">Ritual Digital do Abismo</h2>
                        <div className="bg-gradient-to-b from-black/50 to-red-900/20 border border-red-500/30 rounded-lg p-8 my-8">
                          <p className="text-red-400 font-cinzel text-xl mb-6">
                            Concentre-se na chama e abra sua consciência...
                          </p>
                          <div className="text-ritualistic-beige/80 space-y-4">
                            <p className="italic">
                              "Que as barreiras entre os mundos se desfaçam,<br/>
                              Que minha mente se abra aos mistérios eternos,<br/>
                              Que eu possa ver além do véu da ilusão."
                            </p>
                          </div>
                          
                          <div className="mt-8 space-y-4">
                            <Label className="text-golden-amber font-cinzel">
                              Digite seu nome espiritual (como deseja ser conhecido nos mistérios):
                            </Label>
                            <Input
                              value={spiritualName}
                              onChange={(e) => setSpiritualName(e.target.value)}
                              placeholder="Ex: Lucius Tenebris, Sophia Arcanum..."
                              className="bg-black/30 border-golden-amber/30 text-ritualistic-beige"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-6">
                            <Checkbox 
                              id="ritual-acceptance"
                              checked={ritualAccepted}
                              onCheckedChange={setRitualAccepted}
                            />
                            <Label htmlFor="ritual-acceptance" className="text-ritualistic-beige/80">
                              Aceito participar do ritual e abrir minha consciência aos mistérios
                            </Label>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Button 
                            onClick={() => setCurrentStep(3)}
                            disabled={!ritualAccepted || !spiritualName.trim()}
                            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 disabled:opacity-50"
                          >
                            Prosseguir com o Ritual
                            <Zap className="w-4 h-4 ml-2" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            className="border-ritualistic-beige/30 text-ritualistic-beige hover:bg-ritualistic-beige/10 ml-4"
                          >
                            Voltar
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center space-y-6"
                      >
                        <Scroll className="h-20 w-20 text-golden-amber mx-auto" />
                        <h2 className="text-3xl font-cinzel text-golden-amber">O Juramento Sagrado</h2>
                        <div className="bg-black/50 border border-red-600/30 rounded-lg p-8 my-8">
                          <p className="text-red-400 font-cinzel text-lg mb-6 italic">
                            "Eu, {spiritualName || 'buscador'} dos mistérios ocultos, venho diante do Abismo com humildade e determinação."
                          </p>
                          <div className="text-ritualistic-beige/80 space-y-4 text-left max-w-2xl mx-auto">
                            <p>
                              <strong className="text-golden-amber">Juro</strong> buscar o conhecimento com sabedoria e responsabilidade,
                            </p>
                            <p>
                              <strong className="text-golden-amber">Juro</strong> respeitar os ensinamentos e guardar os segredos que me forem confiados,
                            </p>
                            <p>
                              <strong className="text-golden-amber">Juro</strong> usar este conhecimento para meu crescimento espiritual e para o bem maior,
                            </p>
                            <p>
                              <strong className="text-golden-amber">Juro</strong> honrar os caminhos do Templo do Abismo e seus mistérios eternos,
                            </p>
                            <p>
                              <strong className="text-golden-amber">Juro</strong> manter sigilo sobre os ensinamentos secretos e proteger a ordem,
                            </p>
                            <p className="text-center text-red-400 font-cinzel mt-6">
                              "Que assim seja, e que o Abismo me guie em minha jornada de iluminação."
                            </p>
                          </div>
                          
                          <div className="mt-8 space-y-4">
                            <Label className="text-golden-amber font-cinzel">
                              Para confirmar seu compromisso, digite a frase sagrada:
                            </Label>
                            <Input
                              value={oathText}
                              onChange={(e) => setOathText(e.target.value)}
                              placeholder={requiredOathText}
                              className="bg-black/30 border-golden-amber/30 text-ritualistic-beige"
                            />
                            <p className="text-xs text-ritualistic-beige/60">
                              Digite exatamente: "{requiredOathText}"
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-ritualistic-beige/70">
                            Ao aceitar este juramento sagrado, você se compromete eternamente com os caminhos do conhecimento oculto.
                          </p>
                          <Button 
                            onClick={() => setCurrentStep(4)}
                            disabled={oathText !== requiredOathText}
                            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 mr-4 disabled:opacity-50"
                          >
                            Aceito o Juramento Sagrado
                            <Skull className="w-4 h-4 ml-2" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                            className="border-ritualistic-beige/30 text-ritualistic-beige hover:bg-ritualistic-beige/10"
                          >
                            Voltar
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="text-center space-y-6"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 360]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <Sparkles className="h-20 w-20 text-purple-400 mx-auto" />
                        </motion.div>
                        <h2 className="text-3xl font-cinzel text-golden-amber">A Grande Transformação</h2>
                        <div className="bg-gradient-to-b from-purple-900/20 to-black/50 border border-purple-500/30 rounded-lg p-8 my-8">
                          <motion.p 
                            key={transformationPhase}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-purple-400 font-cinzel text-xl mb-6"
                          >
                            {transformationMessages[transformationPhase]}
                          </motion.p>
                          <div className="text-ritualistic-beige/80 space-y-4">
                            <p>
                              As energias cósmicas fluem através de seu ser, dissolvendo as barreiras da percepção limitada.
                            </p>
                            <p>
                              Você sente a presença dos antigos mestres guiando sua transformação.
                            </p>
                            <p>
                              Sua consciência se expande, abarcando dimensões antes inimagináveis.
                            </p>
                            <p className="text-golden-amber font-cinzel text-lg mt-6">
                              A metamorfose espiritual está quase completa...
                            </p>
                          </div>
                          
                          <div className="mt-8">
                            <div className="w-full bg-black/30 rounded-full h-4 mb-4">
                              <motion.div 
                                className="bg-gradient-to-r from-purple-500 to-golden-amber h-4 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                              />
                            </div>
                            <p className="text-sm text-ritualistic-beige/60">
                              Transformação em andamento...
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setCurrentStep(5)}
                          className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-3"
                        >
                          Completar Transformação
                          <Crown className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                    )}

                    {currentStep === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotateY: [0, 360]
                          }}
                          transition={{ 
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <Crown className="h-20 w-20 text-golden-amber mx-auto" />
                        </motion.div>
                        <h2 className="text-3xl font-cinzel text-golden-amber">Iniciação Completa</h2>
                        <div className="bg-gradient-to-b from-golden-amber/10 to-black/50 border border-golden-amber/30 rounded-lg p-8 my-8">
                          <p className="text-golden-amber font-cinzel text-xl mb-6">
                            Salve, {spiritualName}! Iniciado do Templo do Abismo!
                          </p>
                          <div className="text-ritualistic-beige/80 space-y-4">
                            <p>
                              Você transcendeu os véus da ignorância e agora caminha entre os iniciados.
                            </p>
                            <p>
                              As portas do conhecimento oculto se abrem diante de você, revelando segredos milenares.
                            </p>
                            <p>
                              Os grimórios sagrados e ensinamentos esotéricos aguardam sua exploração.
                            </p>
                            <p className="text-golden-amber font-cinzel">
                              Que a luz do Abismo ilumine eternamente seu caminho.
                            </p>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-black/30 border border-green-500/30 rounded p-4">
                              <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                              <p className="text-sm text-green-400">Acesso Liberado</p>
                            </div>
                            <div className="bg-black/30 border border-golden-amber/30 rounded p-4">
                              <Key className="h-6 w-6 text-golden-amber mx-auto mb-2" />
                              <p className="text-sm text-golden-amber">Privilégios Concedidos</p>
                            </div>
                          </div>
                          
                          <Badge className="bg-golden-amber/20 text-golden-amber border-golden-amber/30 mt-6 text-lg px-4 py-2">
                            🔮 Iniciado Confirmado 🔮
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          <Button 
                            className="w-full bg-golden-amber text-black hover:bg-golden-amber/90 mb-4 text-lg py-4"
                            onClick={() => {
                              completeInitiationMutation.mutate({
                                spiritualName,
                                oathAccepted: true
                              });
                            }}
                            disabled={completeInitiationMutation.isPending}
                          >
                            {completeInitiationMutation.isPending ? (
                              <>
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-5 h-5 mr-2"
                                >
                                  <Sparkles className="w-5 h-5" />
                                </motion.div>
                                Registrando Iniciação...
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-5 h-5 mr-2" />
                                Acessar Conteúdo Exclusivo de Iniciados
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-ritualistic-beige/60">
                            Sua transformação será registrada eternamente nos Arquivos Akáshicos do Templo.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageTransition>
    </ContentProtection>
  );
}