import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff, Book, Sparkles, Bot, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Grimoire {
  id: number;
  title: string;
  description: string;
  section_id: number;
  content: string;
  is_paid: boolean;
  price: string | null;
  is_published: boolean;
  level: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface LibrarySection {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

function CreateGrimoireForm({ 
  sections, 
  onSubmit, 
  isLoading 
}: {
  sections: LibrarySection[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    section_id: "",
    is_paid: false,
    price: "",
    level: "iniciante",
    content: "",
    cover_image_url: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      section_id: parseInt(formData.section_id),
      price: formData.is_paid ? formData.price : null,
      cover_image_url: formData.cover_image_url || null,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título do Grimório</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ex: O Caminho da Sombra"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="section">Seção da Biblioteca</Label>
          <Select value={formData.section_id} onValueChange={(value) => setFormData({...formData, section_id: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma seção" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id.toString()}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Descreva o conteúdo e objetivo deste grimório..."
          rows={3}
        />
      </div>

      {/* Editor de Conteúdo Único */}
      <Card>
        <CardHeader>
          <CardTitle className="text-golden-amber">Conteúdo do Grimório</CardTitle>
          <CardDescription>
            Digite todo o conteúdo do grimório. Use HTML para formatação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="Digite todo o conteúdo do grimório aqui usando HTML para formatação..."
            rows={20}
            className="font-mono"
          />
        </CardContent>
      </Card>

      {/* Configuração de Capa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-golden-amber flex items-center">
            <ImageIcon className="mr-2 h-5 w-5" />
            Capa do Grimório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>URL da Capa</Label>
            <Input
              value={formData.cover_image_url}
              onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
              placeholder="https://exemplo.com/capa.jpg"
            />
          </div>
          
          {formData.cover_image_url && (
            <div className="w-32 h-40 mx-auto mt-4">
              <img 
                src={formData.cover_image_url} 
                alt="Preview da capa"
                className="w-full h-full object-cover rounded-lg border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Publicação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-golden-amber">Configurações de Publicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nível de Dificuldade</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => setFormData({...formData, is_paid: checked})}
              />
              <Label htmlFor="is_paid">Conteúdo Pago</Label>
            </div>
            
            {formData.is_paid && (
              <div>
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="29.99"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isLoading || !formData.title || !formData.content || !formData.section_id}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3"
      >
        {isLoading ? "Criando..." : "Criar Grimório"}
      </Button>
    </form>
  );
}

function GrimoireViewer({ grimoire }: { grimoire: Grimoire }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-golden-amber">{grimoire.title}</CardTitle>
        <CardDescription>{grimoire.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={grimoire.is_published ? "default" : "secondary"}>
              {grimoire.is_published ? "Publicado" : "Rascunho"}
            </Badge>
            <Badge variant="outline">{grimoire.level}</Badge>
          </div>
          
          {grimoire.cover_image_url && (
            <div className="w-32 h-40 mx-auto">
              <img 
                src={grimoire.cover_image_url} 
                alt={grimoire.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: grimoire.content }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBiblioteca() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedGrimoire, setSelectedGrimoire] = useState<Grimoire | null>(null);

  // Queries
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/library/sections"],
  });

  const { data: grimoires = [], isLoading: grimoiresLoading } = useQuery({
    queryKey: ["/api/grimoires"],
  });

  // Mutations
  const createGrimoireMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/admin/grimoires", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grimoires"] });
      toast({
        title: "Sucesso",
        description: "Grimório criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar grimório",
        variant: "destructive",
      });
    },
  });

  const togglePublished = async (grimoire: Grimoire) => {
    try {
      await apiRequest(`/api/admin/grimoires/${grimoire.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_published: !grimoire.is_published }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grimoires"] });
      toast({
        title: "Sucesso",
        description: `Grimório ${grimoire.is_published ? 'despublicado' : 'publicado'} com sucesso!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar grimório",
        variant: "destructive",
      });
    }
  };

  if (sectionsLoading || grimoiresLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-golden-amber">Biblioteca</h2>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Criar Grimório</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar Grimórios</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <CreateGrimoireForm
            sections={sections}
            onSubmit={(data) => createGrimoireMutation.mutate(data)}
            isLoading={createGrimoireMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grimoires.map((grimoire: Grimoire) => (
              <Card key={grimoire.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm truncate">{grimoire.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedGrimoire(grimoire)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublished(grimoire)}
                      >
                        {grimoire.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{grimoire.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={grimoire.is_published ? "default" : "secondary"}>
                      {grimoire.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                    <Badge variant="outline">{grimoire.level}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedGrimoire && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Visualizar Grimório</h3>
            <Button variant="outline" onClick={() => setSelectedGrimoire(null)}>
              Fechar
            </Button>
          </div>
          <GrimoireViewer grimoire={selectedGrimoire} />
        </div>
      )}
    </div>
  );
}