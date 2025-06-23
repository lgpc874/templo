import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Search, Eye, Calendar, Scroll, Feather, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Bibliotheca() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => fetch('/api/articles').then(res => res.json())
  });

  const categories = [
    { id: "all", name: "Omnia", icon: BookOpen },
    { id: "textos", name: "Textus", icon: Scroll },
    { id: "poemas", name: "Carmina", icon: Feather },
    { id: "escrituras", name: "Scriptura", icon: Crown }
  ];

  const filteredArticles = articles.filter((article: any) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory && article.is_published;
  });

  const featuredArticles = articles.filter((article: any) => article.is_featured && article.is_published);

  if (isLoading) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-golden-amber mx-auto mb-4"></div>
          <p className="text-muted-foreground">Acessando a biblioteca sagrada...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel text-golden-amber tracking-wider mb-4">
            ⸸ BIBLIOTHECA SACRA ⸸
          </h1>
          <p className="text-ritualistic-beige/80 max-w-2xl mx-auto">
            Textos sagrados, poemas místicos e escrituras ancestrais do Templo do Abismo
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-golden-amber/60" />
            <Input
              placeholder="Buscar textos sagrados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/50 border-golden-amber/30 text-ritualistic-beige"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto bg-black/30">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col items-center gap-1 data-[state=active]:bg-golden-amber/20 data-[state=active]:text-golden-amber"
                  >
                    <IconComponent size={16} />
                    <span className="text-xs font-cinzel">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && selectedCategory === "all" && !searchTerm && (
          <div className="mb-12">
            <h2 className="text-2xl font-cinzel text-golden-amber mb-6 text-center">
              Scripturas Destacadas
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((article: any, index: number) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-golden-amber/5 to-red-900/10 backdrop-blur-sm border-golden-amber/40 hover:border-golden-amber/60 transition-all duration-300 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-golden-amber text-black font-cinzel text-xs">
                          Destaque
                        </Badge>
                        <Badge variant="outline" className="text-xs border-golden-amber/30 text-golden-amber">
                          {article.category}
                        </Badge>
                      </div>
                      <CardTitle className="font-cinzel text-xl text-golden-amber line-clamp-2">
                        {article.title}
                      </CardTitle>
                      {article.excerpt && (
                        <CardDescription className="text-ritualistic-beige/70 line-clamp-2">
                          {article.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-ritualistic-beige/60 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(article.created_at), "dd/MM/yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {article.views_count || 0}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full border-golden-amber/30 text-golden-amber hover:bg-golden-amber/10"
                        onClick={() => {
                          // TODO: Abrir modal ou página do artigo
                        }}
                      >
                        Ler Scriptura
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article: any, index: number) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-black/40 backdrop-blur-sm border-golden-amber/20 hover:border-golden-amber/40 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs border-golden-amber/30 text-golden-amber">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-ritualistic-beige/60">
                      {format(new Date(article.created_at), "dd/MM")}
                    </span>
                  </div>
                  
                  {article.cover_image_url && (
                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={article.cover_image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardTitle className="font-cinzel text-lg text-golden-amber line-clamp-2">
                    {article.title}
                  </CardTitle>
                  
                  {article.excerpt && (
                    <CardDescription className="text-ritualistic-beige/70 line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-ritualistic-beige/60 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {article.views_count || 0} leituras
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(article.created_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-golden-amber/30 text-golden-amber hover:bg-golden-amber/10"
                    onClick={() => {
                      // TODO: Abrir modal ou página do artigo
                    }}
                  >
                    Ler Completo
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-golden-amber/50 mx-auto mb-6" />
            <h3 className="text-xl font-cinzel text-golden-amber mb-2">
              {searchTerm ? "Nenhum Texto Encontrado" : "Biblioteca em Construção"}
            </h3>
            <p className="text-ritualistic-beige/60">
              {searchTerm 
                ? "Tente usar termos diferentes em sua busca."
                : "Os textos sagrados estão sendo preparados pelos escribas do templo."
              }
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-black/30 backdrop-blur-sm border border-golden-amber/20 rounded-lg p-6">
            <BookOpen className="h-8 w-8 text-golden-amber mx-auto mb-3" />
            <h3 className="font-cinzel text-golden-amber mb-2">Bibliotheca Sacra</h3>
            <p className="text-sm text-ritualistic-beige/70 max-w-md">
              Repositório de conhecimentos ancestrais, textos filosóficos e poemas místicos
              do Templo do Abismo, disponíveis gratuitamente para todos os buscadores.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}