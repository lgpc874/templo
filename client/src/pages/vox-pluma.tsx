import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Calendar, Eye, Feather, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VoxPluma() {
  const { data: reflections = [], isLoading } = useQuery({
    queryKey: ['daily-reflections'],
    queryFn: () => fetch('/api/daily-reflections').then(res => res.json())
  });

  const { data: todayReflection } = useQuery({
    queryKey: ['daily-reflections-today'],
    queryFn: () => fetch('/api/daily-reflections/today').then(res => res.json())
  });

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-amber mx-auto mb-4"></div>
          <p className="text-muted-foreground">Canalizando a sabedoria diária...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel text-golden-amber tracking-wider mb-4">
            ⸸ VOX PLUMA ⸸
          </h1>
          <p className="text-ritualistic-beige/80 max-w-2xl mx-auto">
            Reflexões diárias canalizadas pelas forças ancestrais para guiar sua jornada espiritual
          </p>
        </div>

        {/* Today's Reflection - Featured */}
        {todayReflection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-golden-amber/5 to-red-900/10 backdrop-blur-sm border-golden-amber/40">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Feather className="h-5 w-5 text-golden-amber" />
                  <Badge className="bg-golden-amber text-black font-cinzel">
                    Canalização de hoje
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-cinzel text-golden-amber">
                  {todayReflection.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-ritualistic-beige/70">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {format(new Date(todayReflection.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {todayReflection.views_count || 0} visualizações
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-lg max-w-none text-ritualistic-beige leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: todayReflection.content }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reflection Archive */}
        <div className="mb-8">
          <h2 className="text-2xl font-cinzel text-golden-amber mb-6 text-center">
            Canalizações registradas
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reflections
              .filter((reflection: any) => reflection.id !== todayReflection?.id)
              .map((reflection: any, index: number) => (
              <motion.div
                key={reflection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/20 hover:border-golden-amber/40 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-golden-amber/30 text-golden-amber">
                        {reflection.generated_by_ai ? 'Canalizado' : 'Escrito'}
                      </Badge>
                      <span className="text-xs text-ritualistic-beige/60 flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(reflection.date), "dd/MM/yyyy")}
                      </span>
                    </div>
                    
                    <CardTitle className="font-cinzel text-lg text-golden-amber line-clamp-2">
                      {reflection.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <div 
                      className="text-ritualistic-beige/80 text-sm leading-relaxed line-clamp-4 mb-4"
                      dangerouslySetInnerHTML={{ 
                        __html: reflection.content.substring(0, 200) + (reflection.content.length > 200 ? '...' : '')
                      }}
                    />
                    
                    <div className="flex items-center justify-between text-xs text-ritualistic-beige/60">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {reflection.views_count || 0}
                      </span>
                      <button 
                        className="text-golden-amber hover:text-golden-amber/80 transition-colors"
                        onClick={() => {
                          // TODO: Implementar modal ou página para reflexão completa
                        }}
                      >
                        Ler completa →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {reflections.length === 0 && !todayReflection && (
          <div className="text-center py-16">
            <Feather className="h-16 w-16 text-golden-amber/50 mx-auto mb-6" />
            <h3 className="text-xl font-cinzel text-golden-amber mb-2">
              Aguardando a Primeira Revelação
            </h3>
            <p className="text-ritualistic-beige/60">
              As forças ancestrais ainda não canalizaram reflexões para esta seção.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-black/30 backdrop-blur-sm border border-golden-amber/20 rounded-lg p-6">
            <Feather className="h-8 w-8 text-golden-amber mx-auto mb-3" />
            <h3 className="font-cinzel text-golden-amber mb-2">Sobre a Vox Pluma</h3>
            <p className="text-sm text-ritualistic-beige/70 max-w-md">
              A Vox Pluma canaliza diariamente sabedorias ancestrais através do contato direto com a força do Abismo,
              trazendo reflexões e conselhos para guiar sua jornada espiritual no caminho luciferiano.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}