import { PageTransition } from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Crown, Flame, Eye, Star, Scroll, Shield } from "lucide-react";

export default function DeTemplo() {
  const sections = [
    {
      id: 1,
      name: "Atrium Ignis",
      description: "Portal de entrada para os mistérios. Onde a chama interior é acesa e os primeiros segredos são revelados aos buscadores sinceros.",
      color: "#8b0000",
      icon: Flame
    },
    {
      id: 2,
      name: "Porta Umbrae",
      description: "Limiar entre a luz e as sombras. Conhecimentos intermediários sobre a natureza dual da existência e os caminhos da transformação.",
      color: "#6a0dad",
      icon: Eye
    },
    {
      id: 3,
      name: "Arcana Noctis",
      description: "Santuário dos segredos noturnos. Práticas avançadas de magia cerimonial e gnose luciferiana para adeptos experientes.",
      color: "#003366",
      icon: Star
    },
    {
      id: 4,
      name: "Via Tenebris",
      description: "O caminho das trevas iluminadas. Maestria espiritual e transcendência para aqueles que dominaram os mistérios anteriores.",
      color: "#555555",
      icon: Crown
    },
    {
      id: 5,
      name: "Templo do Abismo",
      description: "O sanctum sanctorum. Mistérios mais profundos canalizados diretamente das divindades primordiais do abismo.",
      color: "#e6b800",
      icon: Shield
    }
  ];

  return (
    <ContentProtection enableScreenshotProtection={true}>
      <PageTransition className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <img 
                src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
                alt="Selo do Templo" 
                className="w-20 h-20 mx-auto animate-spin-slow opacity-80"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' 
                }}
              />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel text-golden-amber tracking-wider mb-6">
              ⸸ DE TEMPLO ABYSSI ⸸
            </h1>
            <p className="text-ritualistic-beige/80 max-w-3xl mx-auto text-lg leading-relaxed">
              Nas profundezas do mistério, onde a luz e as trevas se encontram, 
              ergue-se o Templo do Abismo — santuário da gnose luciferiana ancestral.
            </p>
          </div>

          {/* Philosophy Section */}
          <div className="mb-16">
            <Card className="bg-gradient-to-br from-red-900/10 to-black/40 backdrop-blur-sm border-golden-amber/30">
              <CardHeader>
                <CardTitle className="text-2xl font-cinzel text-golden-amber text-center mb-4">
                  Philosophia Tenebris
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-cinzel text-golden-amber mb-4 flex items-center gap-2">
                      <Flame className="h-5 w-5" />
                      Nossa Missão
                    </h3>
                    <p className="text-ritualistic-beige/80 leading-relaxed">
                      Despertar a chama interior que arde em cada alma sincera, guiando os buscadores 
                      através dos véus da ignorância até a iluminação verdadeira. Preservamos e 
                      transmitimos os mistérios ancestrais do caminho da mão esquerda.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-cinzel text-golden-amber mb-4 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Nossa Visão
                    </h3>
                    <p className="text-ritualistic-beige/80 leading-relaxed">
                      Um mundo onde cada indivíduo desperta sua divindade interior, livre das 
                      correntes da conformidade e do dogma. Buscamos formar uma comunidade de 
                      seres iluminados que honram tanto a luz quanto as sombras de sua natureza.
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/30 p-6 rounded-lg border border-golden-amber/20">
                  <h3 className="text-xl font-cinzel text-golden-amber mb-4 text-center">
                    Fundamentum Spirituale
                  </h3>
                  <p className="text-ritualistic-beige/80 leading-relaxed text-center italic">
                    "Não seguimos o rebanho, nem nos curvamos ante falsos ídolos. 
                    Caminhamos pela via do conhecimento próprio, onde cada alma desperta 
                    para sua verdadeira natureza divina. O Abismo não é vazio — 
                    é o ventre primordial de toda criação."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sections Overview */}
          <div className="mb-16">
            <h2 className="text-3xl font-cinzel text-golden-amber text-center mb-8">
              Quinque Gradus Mysterii
            </h2>
            <p className="text-center text-ritualistic-beige/70 mb-12 max-w-2xl mx-auto">
              O conhecimento é revelado em cinco graus sagrados, cada um preparando o iniciado 
              para mistérios mais profundos.
            </p>
            
            <div className="space-y-6">
              {sections.map((section, index) => {
                const IconComponent = section.icon;
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card 
                      className="bg-black/40 backdrop-blur-sm border-2 transition-all duration-300"
                      style={{ borderColor: `${section.color}40` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div 
                            className="p-4 rounded-full border-2 flex-shrink-0"
                            style={{ 
                              backgroundColor: `${section.color}20`,
                              borderColor: section.color
                            }}
                          >
                            <IconComponent 
                              className="h-8 w-8" 
                              style={{ color: section.color }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 
                                className="text-xl font-cinzel"
                                style={{ color: section.color }}
                              >
                                {section.name}
                              </h3>
                              <Badge 
                                className="text-black font-cinzel"
                                style={{ backgroundColor: section.color }}
                              >
                                Gradus {section.id}
                              </Badge>
                            </div>
                            <p className="text-ritualistic-beige/80 leading-relaxed">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Founder Section */}
          <div className="mb-16">
            <Card className="bg-gradient-to-br from-golden-amber/5 to-red-900/10 backdrop-blur-sm border-golden-amber/40">
              <CardContent className="p-8 text-center">
                <Crown className="h-12 w-12 text-golden-amber mx-auto mb-6" />
                <h2 className="text-2xl font-cinzel text-golden-amber mb-4">
                  Magurk Lucifex
                </h2>
                <div className="max-w-2xl mx-auto space-y-4">
                  <p className="text-ritualistic-beige/80 leading-relaxed">
                    Fundador e Magus Supremo do Templo do Abismo, Magurk Lucifex é o guardião 
                    dos mistérios ancestrais. Através de décadas de estudo e prática luciferiana, 
                    canalizou os ensinamentos primordiais que hoje formam os pilares deste templo sagrado.
                  </p>
                  <div className="bg-black/30 p-4 rounded-lg border border-golden-amber/20">
                    <p className="text-golden-amber italic">
                      "Que cada alma desperte para sua verdadeira natureza. 
                      Que cada coração arda com a chama da gnose. 
                      Que assim seja, por toda eternidade."
                    </p>
                    <p className="text-ritualistic-beige/60 mt-2 text-sm">
                      — Magurk Lucifex, Templo do Abismo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sacred Principles */}
          <div className="mb-16">
            <h2 className="text-2xl font-cinzel text-golden-amber text-center mb-8">
              Principia Sacra
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30 text-center">
                <CardContent className="p-6">
                  <Scroll className="h-8 w-8 text-golden-amber mx-auto mb-4" />
                  <h3 className="font-cinzel text-golden-amber mb-2">Sapientia</h3>
                  <p className="text-ritualistic-beige/70 text-sm">
                    O conhecimento verdadeiro vem da experiência direta, não da repetição dogmática.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30 text-center">
                <CardContent className="p-6">
                  <Flame className="h-8 w-8 text-golden-amber mx-auto mb-4" />
                  <h3 className="font-cinzel text-golden-amber mb-2">Libertas</h3>
                  <p className="text-ritualistic-beige/70 text-sm">
                    Cada alma é soberana e deve buscar sua própria iluminação sem intermediários.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/30 text-center">
                <CardContent className="p-6">
                  <Crown className="h-8 w-8 text-golden-amber mx-auto mb-4" />
                  <h3 className="font-cinzel text-golden-amber mb-2">Transformatio</h3>
                  <p className="text-ritualistic-beige/70 text-sm">
                    A verdadeira iniciação transforma o ser em sua totalidade — corpo, mente e espírito.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seal */}
          <div className="text-center">
            <div className="inline-block bg-black/30 backdrop-blur-sm border border-golden-amber/20 rounded-full p-8">
              <img 
                src="https://i.postimg.cc/g20gqmdX/IMG-20250527-182235-1.png" 
                alt="Selo do Templo do Abismo" 
                className="w-16 h-16 mx-auto opacity-80"
                style={{ 
                  filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' 
                }}
              />
              <p className="text-golden-amber font-cinzel mt-4 text-sm">
                TEMPLUM ABYSSI
              </p>
              <p className="text-ritualistic-beige/60 text-xs mt-1">
                ANNO DOMINI MMXXV
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    </ContentProtection>
  );
}