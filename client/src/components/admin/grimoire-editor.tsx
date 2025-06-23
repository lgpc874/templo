import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pencil, Eye, Download, Trash2, Plus, Upload, Wand2, FileText, Save, X } from 'lucide-react';
import type { Grimoire, LibrarySection } from '@shared/schema';

interface GrimoireFormData {
  title: string;
  content: string;
  section_id: number;
  price: string;
  is_paid: boolean;
  is_published: boolean;
  cover_image_url: string;
  excerpt: string;
  custom_css: string;
  background_color: string;
  is_restricted: boolean;
  power_words: string;
  content_structure: string;
  enable_pdf_download: boolean;
  ai_prompt_used: string;
}

interface GrimoireEditorProps {
  grimoire?: Grimoire;
  onClose: () => void;
  mode: 'create' | 'edit';
}

const defaultColors = [
  { name: 'Abissal Profundo', value: '#1a0a0a' },
  { name: 'Vermelho Luciferiano', value: '#8b0000' },
  { name: 'Roxo Místico', value: '#6a0dad' },
  { name: 'Azul Arcano', value: '#003366' },
  { name: 'Dourado Âmbar', value: '#D97706' },
  { name: 'Verde Sombrio', value: '#1a3d2e' },
];

export function GrimoireEditor({ grimoire, onClose, mode }: GrimoireEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<GrimoireFormData>({
    title: grimoire?.title || '',
    content: grimoire?.content || '',
    section_id: grimoire?.section_id || 1,
    price: grimoire?.price || '0',
    is_paid: grimoire?.is_paid || false,
    is_published: grimoire?.is_published || false,
    cover_image_url: grimoire?.cover_image_url || '',
    excerpt: grimoire?.excerpt || '',
    custom_css: grimoire?.custom_css || '',
    background_color: grimoire?.background_color || '#1a0a0a',
    is_restricted: grimoire?.is_restricted || false,
    power_words: grimoire?.power_words || '',
    content_structure: grimoire?.content_structure || 'single',
    enable_pdf_download: grimoire?.enable_pdf_download || false,
    ai_prompt_used: grimoire?.ai_prompt_used || '',
  });

  const [activeTab, setActiveTab] = useState('content');
  const [generatingWithAI, setGeneratingWithAI] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Buscar seções da biblioteca
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library/sections'],
  });

  // Upload de arquivo
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedCssFile, setUploadedCssFile] = useState<File | null>(null);

  // Mutação para salvar/atualizar grimório
  const saveMutation = useMutation({
    mutationFn: async (data: GrimoireFormData) => {
      const endpoint = mode === 'create' ? '/api/admin/grimoires' : `/api/admin/grimoires/${grimoire?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      // Processar palavras de poder como array JSON
      const powerWordsArray = data.power_words
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);

      const payload = {
        ...data,
        section_id: Number(data.section_id),
        price: Number(data.price),
        power_words: JSON.stringify(powerWordsArray),
        word_count: data.content.split(' ').length,
        estimated_read_time: Math.ceil(data.content.split(' ').length / 200),
      };

      return apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: mode === 'create' ? 'Grimório criado!' : 'Grimório atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grimoires'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar grimório.',
        variant: 'destructive',
      });
    },
  });

  // Geração com IA
  const generateWithAI = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest('POST', '/api/admin/generate-grimoire', {
        prompt,
        section_id: formData.section_id,
        title: formData.title || 'Grimório Gerado',
      });
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        content: data.content,
        title: data.title || prev.title,
        excerpt: data.excerpt || prev.excerpt,
        ai_prompt_used: formData.ai_prompt_used,
      }));
      toast({
        title: 'Conteúdo gerado!',
        description: 'O grimório foi gerado com IA com sucesso.',
      });
      setGeneratingWithAI(false);
      setActiveTab('content');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na geração',
        description: error.message || 'Erro ao gerar conteúdo com IA.',
        variant: 'destructive',
      });
      setGeneratingWithAI(false);
    },
  });

  // Processar upload de arquivo
  const handleFileUpload = async (file: File, type: 'content' | 'css') => {
    const text = await file.text();
    
    if (type === 'content') {
      setFormData(prev => ({ ...prev, content: text }));
      toast({
        title: 'Arquivo carregado!',
        description: 'Conteúdo do arquivo foi inserido.',
      });
    } else {
      setFormData(prev => ({ ...prev, custom_css: text }));
      toast({
        title: 'CSS carregado!',
        description: 'Estilos CSS foram inseridos.',
      });
    }
  };

  // Download como HTML
  const downloadAsHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${formData.title}</title>
    <style>
        body {
            font-family: 'EB Garamond', serif;
            background-color: ${formData.background_color};
            color: #f4f1e8;
            line-height: 1.7;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2, h3 { 
            font-family: 'Cinzel', serif; 
            color: #D97706;
        }
        .grimoire-content { 
            font-size: 16px; 
        }
        ${formData.custom_css}
    </style>
</head>
<body>
    <h1>${formData.title}</h1>
    <div class="grimoire-content">
        ${formData.content}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-amber-400">
            {mode === 'create' ? 'Criar Novo Grimório' : 'Editar Grimório'}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Editar' : 'Visualizar'}
            </Button>
            {formData.content && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsHTML}
              >
                <Download className="w-4 h-4 mr-2" />
                Download HTML
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview Mode */}
        {previewMode ? (
          <div className="flex-1 overflow-auto p-6">
            <div 
              className="prose prose-invert max-w-none"
              style={{ backgroundColor: formData.background_color }}
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        ) : (
          /* Editor Mode */
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 bg-gray-800">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
                <TabsTrigger value="style">Estilo & CSS</TabsTrigger>
                <TabsTrigger value="ai">Geração IA</TabsTrigger>
                <TabsTrigger value="access">Acesso & Pagamento</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto px-6 pb-6">
                {/* Aba Conteúdo */}
                <TabsContent value="content" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Título do grimório..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="section">Seção</Label>
                      <Select value={formData.section_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, section_id: Number(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
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
                    <Label htmlFor="excerpt">Descrição</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Breve descrição do grimório..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Estrutura do Conteúdo</Label>
                      <Select value={formData.content_structure} onValueChange={(value) => setFormData(prev => ({ ...prev, content_structure: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Texto Corrido</SelectItem>
                          <SelectItem value="chapters">Por Capítulos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="file-upload">Upload de Arquivo</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".txt,.html,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'content');
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Conteúdo HTML</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Digite ou cole o conteúdo HTML do grimório..."
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                {/* Aba Configurações */}
                <TabsContent value="settings" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Publicação</CardTitle>
                      <CardDescription>Controle de visibilidade e status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_published"
                          checked={formData.is_published}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                        />
                        <Label htmlFor="is_published">Publicar imediatamente</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enable_pdf"
                          checked={formData.enable_pdf_download}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_pdf_download: checked }))}
                        />
                        <Label htmlFor="enable_pdf">Permitir download em PDF</Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Imagem de Capa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="cover_url">URL da Imagem de Capa</Label>
                        <Input
                          id="cover_url"
                          value={formData.cover_image_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                          placeholder="https://exemplo.com/capa.jpg"
                        />
                      </div>
                      {formData.cover_image_url && (
                        <div className="mt-4">
                          <img 
                            src={formData.cover_image_url} 
                            alt="Preview da capa" 
                            className="w-32 h-48 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Estilo & CSS */}
                <TabsContent value="style" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cor de Fundo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        {defaultColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setFormData(prev => ({ ...prev, background_color: color.value }))}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              formData.background_color === color.value ? 'border-amber-400' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            <div className="text-white font-medium text-sm">{color.name}</div>
                            <div className="text-gray-300 text-xs">{color.value}</div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="custom_color">Cor Personalizada (HEX)</Label>
                        <Input
                          id="custom_color"
                          value={formData.background_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                          placeholder="#1a0a0a"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>CSS Personalizado</CardTitle>
                      <CardDescription>Estilos específicos para este grimório</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="css-upload">Upload de Arquivo CSS</Label>
                        <Input
                          id="css-upload"
                          type="file"
                          accept=".css"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'css');
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom_css">CSS</Label>
                        <Textarea
                          id="custom_css"
                          value={formData.custom_css}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_css: e.target.value }))}
                          placeholder="/* CSS personalizado */&#10;.custom-style { color: #D97706; }"
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Geração IA */}
                <TabsContent value="ai" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Geração com Inteligência Artificial</CardTitle>
                      <CardDescription>Crie conteúdo automaticamente usando IA</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="ai_prompt">Prompt para a IA</Label>
                        <Textarea
                          id="ai_prompt"
                          value={formData.ai_prompt_used}
                          onChange={(e) => setFormData(prev => ({ ...prev, ai_prompt_used: e.target.value }))}
                          placeholder="Descreva o tipo de grimório que deseja gerar..."
                          rows={6}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (!formData.ai_prompt_used.trim()) {
                            toast({
                              title: 'Prompt necessário',
                              description: 'Por favor, insira um prompt para a IA.',
                              variant: 'destructive',
                            });
                            return;
                          }
                          setGeneratingWithAI(true);
                          generateWithAI.mutate(formData.ai_prompt_used);
                        }}
                        disabled={generateWithAI.isPending}
                        className="w-full"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {generateWithAI.isPending ? 'Gerando...' : 'Gerar Conteúdo com IA'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Acesso & Pagamento */}
                <TabsContent value="access" className="mt-4 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_paid"
                          checked={formData.is_paid}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_paid: checked }))}
                        />
                        <Label htmlFor="is_paid">Grimório pago</Label>
                      </div>
                      
                      {formData.is_paid && (
                        <div>
                          <Label htmlFor="price">Preço (R$)</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Acesso Restrito</CardTitle>
                      <CardDescription>Palavras de poder necessárias para acessar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_restricted"
                          checked={formData.is_restricted}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_restricted: checked }))}
                        />
                        <Label htmlFor="is_restricted">Requer palavras de poder</Label>
                      </div>
                      
                      {formData.is_restricted && (
                        <div>
                          <Label htmlFor="power_words">Palavras de Poder (separadas por vírgula)</Label>
                          <Input
                            id="power_words"
                            value={formData.power_words}
                            onChange={(e) => setFormData(prev => ({ ...prev, power_words: e.target.value }))}
                            placeholder="lucifel, astaroth, baphomet"
                          />
                          <p className="text-sm text-gray-400 mt-1">
                            Usuários precisarão inserir uma dessas palavras para acessar o grimório
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <div className="flex gap-2">
            <Badge variant={formData.is_published ? "default" : "secondary"}>
              {formData.is_published ? 'Publicado' : 'Rascunho'}
            </Badge>
            {formData.is_paid && (
              <Badge variant="outline">R$ {formData.price}</Badge>
            )}
            {formData.is_restricted && (
              <Badge variant="destructive">Restrito</Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending || !formData.title.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Grimório'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}