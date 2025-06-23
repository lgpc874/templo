import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Save, FileText } from 'lucide-react';
import type { LibrarySection, Grimoire } from '@shared/schema';

interface GrimoireEditorProps {
  grimoire?: Grimoire;
  onClose: () => void;
}

interface FormData {
  title: string;
  content: string;
  excerpt: string;
  section_id: number;
  is_published: boolean;
  cover_image_url: string;
}

export default function GrimoireEditorFixed({ grimoire, onClose }: GrimoireEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FormData>(() => ({
    title: grimoire?.title || '',
    content: grimoire?.content || '',
    excerpt: grimoire?.excerpt || '',
    section_id: grimoire?.section_id || 1,
    is_published: grimoire?.is_published || false,
    cover_image_url: grimoire?.cover_image_url || ''
  }));

  // Buscar seções
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library-sections'],
  });

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = grimoire ? `/api/admin/grimoires/${grimoire.id}` : '/api/admin/grimoires';
      const method = grimoire ? 'PUT' : 'POST';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro ao salvar: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: grimoire ? "Grimório atualizado!" : "Grimório criado!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar grimório",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-red-950/90 to-black/95 border border-golden-amber/30 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-golden-amber/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-golden-amber font-cinzel">
            {grimoire ? 'Editar Grimório' : 'Criar Grimório'}
          </h2>
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            
            {/* Informações Básicas */}
            <Card className="bg-black/50 border-golden-amber/20">
              <CardHeader>
                <CardTitle className="text-golden-amber flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Título */}
                <div>
                  <Label className="text-ritualistic-beige">Título do Grimório</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Digite o título..."
                    className="bg-black/50 border-golden-amber/30 text-ritualistic-beige mt-1"
                  />
                </div>

                {/* Seção */}
                <div>
                  <Label className="text-ritualistic-beige">Seção da Biblioteca</Label>
                  <Select 
                    value={formData.section_id.toString()} 
                    onValueChange={(value) => handleInputChange('section_id', parseInt(value))}
                  >
                    <SelectTrigger className="bg-black/50 border-golden-amber/30 text-ritualistic-beige mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-golden-amber/30">
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id.toString()} className="text-ritualistic-beige">
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div>
                  <Label className="text-ritualistic-beige">Descrição/Sinopse</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Breve descrição do grimório..."
                    className="bg-black/50 border-golden-amber/30 text-ritualistic-beige h-20 mt-1"
                  />
                </div>

                {/* URL da Capa */}
                <div>
                  <Label className="text-ritualistic-beige">URL da Capa (opcional)</Label>
                  <Input
                    value={formData.cover_image_url}
                    onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    className="bg-black/50 border-golden-amber/30 text-ritualistic-beige mt-1"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleInputChange('is_published', checked)}
                  />
                  <Label className="text-ritualistic-beige">
                    {formData.is_published ? 'Publicado' : 'Rascunho'}
                  </Label>
                </div>

              </CardContent>
            </Card>

            {/* Conteúdo */}
            <Card className="bg-black/50 border-golden-amber/20">
              <CardHeader>
                <CardTitle className="text-golden-amber">Conteúdo HTML</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Digite o conteúdo HTML do grimório..."
                  className="bg-black/50 border-golden-amber/30 text-ritualistic-beige h-80 font-mono text-sm"
                />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-golden-amber/30 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="bg-golden-amber hover:bg-golden-amber/80 text-black"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

      </div>
    </div>
  );
}