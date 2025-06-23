import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { LibrarySection, Grimoire } from '@shared/schema';
import { 
  FileText, 
  Settings, 
  Palette, 
  Sparkles, 
  CreditCard,
  Upload,
  Download,
  Save,
  FileUp,
  Image,
  Lock,
  Unlock,
  Eye,
  Wand2
} from 'lucide-react';

interface GrimoireCompleteEditorProps {
  grimoire?: Grimoire;
  onClose: () => void;
  onSave?: () => void;
}

interface GrimoireFormData {
  title: string;
  content: string;
  excerpt: string;
  section_id: number;
  price: string;
  is_paid: boolean;
  is_published: boolean;
  cover_image_url: string;
  custom_css: string;
  background_color: string;
  is_restricted: boolean;
  power_words: string;
  content_structure: string;
  display_order: number;
}

export default function GrimoireCompleteEditor({ grimoire, onClose, onSave }: GrimoireCompleteEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cssFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<GrimoireFormData>({
    title: grimoire?.title || '',
    content: grimoire?.content || '',
    excerpt: grimoire?.excerpt || '',
    section_id: grimoire?.section_id || 1,
    price: grimoire?.price || '0.00',
    is_paid: grimoire?.is_paid || false,
    is_published: grimoire?.is_published || false,
    cover_image_url: grimoire?.cover_image_url || '',
    custom_css: grimoire?.custom_css || '',
    background_color: grimoire?.background_color || '#1a0a0a',
    is_restricted: grimoire?.is_restricted || false,
    power_words: grimoire?.power_words || '',
    content_structure: grimoire?.content_structure || 'chapters',
    display_order: grimoire?.display_order || 1
  });

  const [activeTab, setActiveTab] = useState('content');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isDraft, setIsDraft] = useState(!formData.is_published);

  // Buscar seções
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library/sections'],
  });

  // Mutation para salvar/criar grimório
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<GrimoireFormData>) => {
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
      if (!response.ok) throw new Error('Erro ao salvar grimório');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: grimoire ? "Grimório atualizado com sucesso!" : "Grimório criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      onSave?.();
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

  // Mutation para geração com IA
  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/generate-grimoire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          prompt,
          section_id: formData.section_id,
          title: formData.title
        })
      });
      if (!response.ok) throw new Error('Erro ao gerar conteúdo');
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        content: data.content,
        title: data.title || prev.title,
        excerpt: data.excerpt || prev.excerpt
      }));
      toast({
        title: "IA Concluída!",
        description: "Conteúdo gerado com sucesso!",
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na IA",
        description: error.message || "Erro ao gerar conteúdo",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleInputChange = (field: keyof GrimoireFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'html' | 'css') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === 'html') {
        setFormData(prev => ({ ...prev, content }));
        toast({ title: "Arquivo HTML carregado!", description: "Conteúdo importado com sucesso." });
      } else {
        setFormData(prev => ({ ...prev, custom_css: content }));
        toast({ title: "Arquivo CSS carregado!", description: "Estilos importados com sucesso." });
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Erro", description: "Digite um prompt para a IA", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate(aiPrompt);
  };

  const handleSave = (publishNow: boolean = false) => {
    const dataToSave = {
      ...formData,
      is_published: publishNow ? true : !isDraft
    };
    saveMutation.mutate(dataToSave);
  };

  const handleDownload = () => {
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
            background: ${formData.background_color}; 
            color: #d4af37; 
            padding: 40px; 
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
        }
        h1, h2, h3 { 
            font-family: 'Cinzel', serif; 
            color: #d4af37; 
            text-align: center;
            margin: 30px 0;
        }
        h1 { font-size: 2.5em; text-shadow: 0 0 10px #d4af37; }
        h2 { font-size: 1.8em; }
        h3 { font-size: 1.3em; }
        p { margin: 15px 0; text-align: justify; }
        ${formData.custom_css || ''}
    </style>
</head>
<body>
    <h1>${formData.title}</h1>
    ${formData.content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'grimoire'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Concluído!",
      description: "Arquivo HTML gerado com sucesso.",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-black/90 border border-amber-500/30 rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header - Mobile Optimized */}
        <div className="p-3 sm:p-6 border-b border-amber-500/30 flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-amber-400 font-['Cinzel'] truncate">
            {grimoire ? '✏️ Editar Grimório' : '📜 Criar Grimório'}
          </h2>
          <div className="flex gap-1 sm:gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm" className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" className="sm:hidden">
              <Download className="w-4 h-4" />
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              ✕
            </Button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-180px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tabs - Scrollable */}
            <div className="overflow-x-auto mb-4">
              <TabsList className="flex sm:grid w-max sm:w-full sm:grid-cols-5 bg-black/50 border border-amber-500/30 min-w-full">
                <TabsTrigger value="content" className="whitespace-nowrap px-2 sm:px-4">
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Conteúdo</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="whitespace-nowrap px-2 sm:px-4">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Configurações</span>
                </TabsTrigger>
                <TabsTrigger value="style" className="whitespace-nowrap px-2 sm:px-4">
                  <Palette className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Estilo & CSS</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="whitespace-nowrap px-2 sm:px-4">
                  <Sparkles className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Geração IA</span>
                </TabsTrigger>
                <TabsTrigger value="access" className="whitespace-nowrap px-2 sm:px-4">
                  <CreditCard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Acesso</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA 1: CONTEÚDO - Mobile Responsive */}
            <TabsContent value="content" className="space-y-4 sm:space-y-6">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-amber-400 flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Conteúdo do Grimório
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  {/* Mobile: Stack vertically, Desktop: Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-amber-200 text-sm">Título</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Digite o título do grimório..."
                        className="bg-black/50 border-amber-500/30 text-amber-100 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-200 text-sm">Estrutura</Label>
                      <Select 
                        value={formData.content_structure} 
                        onValueChange={(value) => handleInputChange('content_structure', value)}
                      >
                        <SelectTrigger className="bg-black/50 border-amber-500/30 text-amber-100 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-amber-500/30">
                          <SelectItem value="chapters">📖 Por Capítulos</SelectItem>
                          <SelectItem value="single">📜 Texto Corrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-200 text-sm">Descrição/Sinopse</Label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="Breve descrição do grimório..."
                      className="bg-black/50 border-amber-500/30 text-amber-100 h-16 sm:h-20 text-sm sm:text-base resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <Label className="text-amber-200 text-sm">Conteúdo HTML</Label>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">Carregar</span>
                        <span className="hidden sm:inline">Carregar HTML</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm"
                        onChange={(e) => handleFileUpload(e, 'html')}
                        className="hidden"
                      />
                    </div>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Digite o conteúdo HTML do grimório..."
                      className="bg-black/50 border-amber-500/30 text-amber-100 h-48 sm:h-80 font-mono text-xs sm:text-sm resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: CONFIGURAÇÕES - Mobile Responsive */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-amber-400 flex items-center gap-2 text-base sm:text-lg">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    Configurações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="text-amber-200 text-sm">Seção da Biblioteca</Label>
                      <Select 
                        value={formData.section_id.toString()} 
                        onValueChange={(value) => handleInputChange('section_id', parseInt(value))}
                      >
                        <SelectTrigger className="bg-black/50 border-amber-500/30 text-amber-100 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-amber-500/30">
                          {sections.map(section => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-200 text-sm">Ordem de Exibição</Label>
                      <Input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 1)}
                        className="bg-black/50 border-amber-500/30 text-amber-100 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-amber-200 text-sm">URL da Capa</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={formData.cover_image_url}
                        onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                        placeholder="https://exemplo.com/capa.jpg"
                        className="bg-black/50 border-amber-500/30 text-amber-100 text-sm sm:text-base flex-1"
                      />
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Image className="w-4 h-4 mr-2" />
                        <span className="sm:hidden">Gerar</span>
                        <span className="hidden sm:inline">Gerar IA</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!isDraft}
                      onCheckedChange={(checked) => setIsDraft(!checked)}
                    />
                    <Label className="text-amber-200">
                      {isDraft ? '📝 Rascunho' : '🌟 Publicado'}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 3: ESTILO & CSS */}
            <TabsContent value="style" className="space-y-6">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Personalização Visual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-amber-200">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        className="w-20 h-10 bg-black/50 border-amber-500/30"
                      />
                      <Input
                        value={formData.background_color}
                        onChange={(e) => handleInputChange('background_color', e.target.value)}
                        placeholder="#1a0a0a"
                        className="bg-black/50 border-amber-500/30 text-amber-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-amber-200">CSS Customizado</Label>
                      <Button
                        onClick={() => cssFileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Carregar CSS
                      </Button>
                      <input
                        ref={cssFileInputRef}
                        type="file"
                        accept=".css"
                        onChange={(e) => handleFileUpload(e, 'css')}
                        className="hidden"
                      />
                    </div>
                    <Textarea
                      value={formData.custom_css}
                      onChange={(e) => handleInputChange('custom_css', e.target.value)}
                      placeholder="/* CSS personalizado para este grimório */
body { background: linear-gradient(45deg, #1a0a0a, #2a1a1a); }
h1 { color: #d4af37; text-shadow: 0 0 10px #d4af37; }
.ritual { border: 2px solid #8b0000; }"
                      className="bg-black/50 border-amber-500/30 text-amber-100 h-60 font-mono text-sm"
                    />
                  </div>

                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded">
                    <h4 className="text-amber-400 font-semibold mb-2">Preview da Cor</h4>
                    <div 
                      className="w-full h-20 rounded border border-amber-500/30"
                      style={{ backgroundColor: formData.background_color }}
                    >
                      <div className="p-4">
                        <span className="text-amber-400 font-['Cinzel']">Exemplo de título</span>
                        <p className="text-amber-200 text-sm">Exemplo de conteúdo com esta cor de fundo.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 4: GERAÇÃO IA */}
            <TabsContent value="ai" className="space-y-6">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Geração com Inteligência Artificial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-amber-200">Prompt para a IA</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Descreva o grimório que deseja gerar...
Exemplo: 'Crie um grimório luciferiano sobre rituais de proteção abissal com 5 capítulos, linguagem sombria e mística, incluindo invocações específicas e instruções detalhadas.'"
                      className="bg-black/50 border-amber-500/30 text-amber-100 h-32"
                    />
                  </div>

                  <Button 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar com IA
                      </>
                    )}
                  </Button>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <h4 className="text-blue-400 font-semibold mb-2">💡 Dicas para Prompts</h4>
                    <ul className="text-blue-200 text-sm space-y-1">
                      <li>• Especifique o tema e abordagem desejada</li>
                      <li>• Mencione quantos capítulos/seções</li>
                      <li>• Defina o tom (sombrio, místico, filosófico)</li>
                      <li>• Inclua elementos específicos (rituais, invocações)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 5: ACESSO & PAGAMENTO */}
            <TabsContent value="access" className="space-y-6">
              <Card className="bg-black/50 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Controle de Acesso e Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_paid}
                        onCheckedChange={(checked) => handleInputChange('is_paid', checked)}
                      />
                      <Label className="text-amber-200">
                        💰 Grimório Pago
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_restricted}
                        onCheckedChange={(checked) => handleInputChange('is_restricted', checked)}
                      />
                      <Label className="text-amber-200">
                        {formData.is_restricted ? (
                          <>
                            <Lock className="w-4 h-4 inline mr-1" />
                            Acesso Restrito
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 inline mr-1" />
                            Acesso Livre
                          </>
                        )}
                      </Label>
                    </div>
                  </div>

                  {formData.is_paid && (
                    <div>
                      <Label className="text-amber-200">Preço (R$)</Label>
                      <Input
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="29.99"
                        className="bg-black/50 border-amber-500/30 text-amber-100"
                      />
                    </div>
                  )}

                  {formData.is_restricted && (
                    <div>
                      <Label className="text-amber-200">Palavras de Poder</Label>
                      <Textarea
                        value={formData.power_words}
                        onChange={(e) => handleInputChange('power_words', e.target.value)}
                        placeholder="lúcifer, abismo, sombra, fogo
(uma palavra por linha)"
                        className="bg-black/50 border-amber-500/30 text-amber-100 h-20"
                      />
                      <p className="text-amber-400/70 text-xs mt-1">
                        🔒 Usuários precisarão digitar uma destas palavras para acessar
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <h4 className="text-green-400 font-semibold mb-2">💳 Status do Sistema</h4>
                    <div className="space-y-2 text-green-200 text-sm">
                      <div className="flex justify-between">
                        <span>Stripe:</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">Configurado</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin Bypass:</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">Ativo</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RODAPÉ COM BOTÕES DE AÇÃO */}
        <div className="p-6 border-t border-amber-500/30 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-2">
            <Badge variant={isDraft ? "secondary" : "default"} className="text-xs">
              {isDraft ? "📝 Rascunho" : "🌟 Publicado"}
            </Badge>
            {formData.is_paid && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                💰 R$ {formData.price}
              </Badge>
            )}
            {formData.is_restricted && (
              <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                🔒 Restrito
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={() => handleSave(false)} 
              disabled={saveMutation.isPending}
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              {isDraft ? 'Salvar Rascunho' : 'Salvar Mudanças'}
            </Button>
            <Button 
              onClick={() => handleSave(true)} 
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
            >
              {saveMutation.isPending ? (
                <>⏳ Salvando...</>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publicar Agora
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}