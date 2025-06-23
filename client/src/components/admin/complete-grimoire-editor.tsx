import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, FileText, Code, Palette } from 'lucide-react';
import type { LibrarySection, Grimoire } from '@shared/schema';

interface CompleteGrimoireEditorProps {
  grimoire?: Grimoire;
  onClose: () => void;
}

export default function CompleteGrimoireEditor({ grimoire, onClose }: CompleteGrimoireEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(grimoire?.title || '');
  const [content, setContent] = useState(grimoire?.content || '');
  const [excerpt, setExcerpt] = useState(grimoire?.excerpt || '');
  const [sectionId, setSectionId] = useState(grimoire?.section_id || 1);
  const [customCss, setCustomCss] = useState(grimoire?.custom_css || '');
  const [isPublished, setIsPublished] = useState(grimoire?.is_published || false);
  const [coverImageUrl, setCoverImageUrl] = useState(grimoire?.cover_image_url || '');
  const [activeTab, setActiveTab] = useState<'content' | 'css' | 'background' | 'cover' | 'ai' | 'preview'>('content');
  
  // Estados para configuração de fundo
  const [backgroundType, setBackgroundType] = useState<'color' | 'image' | 'css'>('color');
  const [backgroundColor, setBackgroundColor] = useState(grimoire?.background_color || '#1a0a0a');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundCss, setBackgroundCss] = useState('');
  
  // Estados para IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Buscar seções
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library-sections'],
  });

  // Função para ler arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'html' | 'txt' | 'css' | 'image' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      // Para imagens de fundo
      const imageUrl = URL.createObjectURL(file);
      setBackgroundImageUrl(imageUrl);
      setBackgroundType('image');
      setActiveTab('background');
      toast({
        title: "Imagem de fundo carregada!",
        description: `Arquivo ${file.name} foi carregado como fundo.`,
      });
    } else if (type === 'cover') {
      // Para capa do grimório
      const imageUrl = URL.createObjectURL(file);
      setCoverImageUrl(imageUrl);
      setActiveTab('cover');
      toast({
        title: "Capa carregada!",
        description: `Arquivo ${file.name} foi carregado como capa.`,
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        
        if (type === 'css') {
          setCustomCss(text);
          setActiveTab('css');
          toast({
            title: "CSS carregado!",
            description: `Arquivo ${file.name} foi carregado com sucesso.`,
          });
        } else {
          setContent(text);
          setActiveTab('content');
          toast({
            title: `${type.toUpperCase()} carregado!`,
            description: `Arquivo ${file.name} foi carregado com sucesso.`,
          });
        }
      };
      reader.readAsText(file);
    }
    
    // Limpar o input
    event.target.value = '';
  };

  // Função para gerar grimório com IA
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite um prompt para a IA",
        variant: "destructive",
      });
      return;
    }

    setAiGenerating(true);
    
    try {
      console.log('Iniciando geração com IA:', { prompt: aiPrompt, sectionId, title });
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/generate-grimoire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          section_id: sectionId,
          title: title || 'Grimório Gerado por IA'
        })
      });

      console.log('Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API:', errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      setContent(data.content);
      if (!title) setTitle(data.title || 'Grimório Gerado por IA');
      if (data.excerpt) setExcerpt(data.excerpt);
      setActiveTab('content');
      
      toast({
        title: "Grimório gerado!",
        description: "Conteúdo criado pela IA com sucesso.",
      });
      
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast({
        title: "Erro ao gerar grimório",
        description: error.message || "Erro desconhecido ao comunicar com a IA",
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // Gerar CSS de fundo baseado nas configurações
  const generateBackgroundCss = () => {
    switch (backgroundType) {
      case 'color':
        return `body, .grimoire-content { background: ${backgroundColor} !important; }`;
      case 'image':
        if (backgroundImageUrl) {
          return `body, .grimoire-content { 
            background: url('${backgroundImageUrl}') center/cover no-repeat fixed !important;
            background-color: ${backgroundColor} !important;
          }`;
        }
        return '';
      case 'css':
        return backgroundCss;
      default:
        return '';
    }
  };

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = grimoire ? `/api/admin/grimoires/${grimoire.id}` : '/api/admin/grimoires';
      const method = grimoire ? 'PUT' : 'POST';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title,
          content,
          description: excerpt?.trim() || title?.trim() || 'Grimório sem descrição',
          section_id: sectionId,
          is_published: isPublished,
          cover_image_url: coverImageUrl,
          custom_css: customCss + '\n' + generateBackgroundCss(),
          background_color: backgroundColor
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar grimório');
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

  const handleSave = () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanExcerpt = excerpt.trim();
    
    if (!cleanTitle) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!cleanContent) {
      toast({
        title: "Erro",
        description: "Conteúdo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    console.log('Salvando com dados:', {
      title: cleanTitle,
      content: cleanContent,
      description: cleanExcerpt || cleanTitle,
      section_id: sectionId
    });
    
    saveMutation.mutate();
  };

  const renderPreview = () => {
    const combinedCss = customCss + '\n' + generateBackgroundCss();
    const previewContent = `
      <style>
        ${combinedCss}
        body { 
          font-family: 'EB Garamond', serif; 
          color: #f5f5dc; 
          padding: 20px;
          line-height: 1.6;
          margin: 0;
        }
        .grimoire-content {
          min-height: 100vh;
          padding: 20px;
        }
      </style>
      <div class="grimoire-content">
        <h1 style="color: #d4af37; font-family: 'Cinzel', serif;">${title}</h1>
        ${content}
      </div>
    `;
    
    return (
      <div className="w-full h-96 border border-amber-500/30 rounded-lg overflow-hidden">
        <iframe
          srcDoc={previewContent}
          className="w-full h-full"
          title="Preview do Grimório"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button 
            onClick={onClose} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold font-cinzel text-amber-400">
            {grimoire ? 'Editar Grimório' : 'Criar Grimório'}
          </h1>
        </div>

        {/* Informações básicas */}
        <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Título */}
            <div>
              <label className="block text-sm font-medium mb-2 text-amber-200">
                Título do Grimório
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título..."
                className="bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
              />
            </div>

            {/* Seção */}
            <div>
              <label className="block text-sm font-medium mb-2 text-amber-200">
                Seção da Biblioteca
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border bg-black/50 border-amber-500/30 text-amber-100"
              >
                {sections.map(section => (
                  <option key={section.id} value={section.id} className="bg-black text-amber-100">
                    {section.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Descrição */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2 text-amber-200">
              Descrição/Sinopse
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descrição do grimório..."
              className="w-full h-20 resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
            />
          </div>
        </div>

        {/* Upload de arquivos */}
        <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-amber-400 mb-4">Upload de Arquivos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Upload HTML */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={(e) => handleFileUpload(e, 'html')}
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 text-sm">HTML</span>
                </div>
              </label>
            </div>

            {/* Upload TXT */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => handleFileUpload(e, 'txt')}
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 text-sm">TXT</span>
                </div>
              </label>
            </div>

            {/* Upload CSS */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".css"
                  onChange={(e) => handleFileUpload(e, 'css')}
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 text-sm">CSS</span>
                </div>
              </label>
            </div>

            {/* Upload Imagem de Fundo */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 text-sm">Fundo</span>
                </div>
              </label>
            </div>

            {/* Upload Capa */}
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-3 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-200 text-sm">Capa</span>
                </div>
              </label>
            </div>

          </div>
        </div>

        {/* Opção de publicação */}
        <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-amber-400">Status de Publicação</h3>
              <p className="text-sm text-amber-200/70 mt-1">
                {isPublished ? 'Este grimório será publicado e visível para usuários' : 'Este grimório será salvo como rascunho'}
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-amber-200 text-sm">
                {isPublished ? 'Publicado' : 'Rascunho'}
              </span>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5 rounded border-amber-500/30 bg-black/50 text-amber-500 focus:ring-amber-500/20"
              />
            </label>
          </div>
        </div>

        {/* Tabs de edição */}
        <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg overflow-hidden">
          
          {/* Tab Headers */}
          <div className="flex border-b border-amber-500/30">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'content' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Code className="w-4 h-4" />
              Conteúdo
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'css' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Palette className="w-4 h-4" />
              CSS Personalizado
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'background' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Upload className="w-4 h-4" />
              Fundo
            </button>
            <button
              onClick={() => setActiveTab('cover')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'cover' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Upload className="w-4 h-4" />
              Capa
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'ai' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Code className="w-4 h-4" />
              IA
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 flex items-center gap-2 transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-500' 
                  : 'text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              Preview
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            
            {activeTab === 'content' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-amber-200">
                  Conteúdo HTML
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Digite o conteúdo HTML do grimório usando o formato correto:

<div class="grimorio-conteudo">
  <h2 class="grimorio-titulo">Título do Grimório</h2>
  <p class="grimorio-subtitulo">Subtítulo opcional</p>
  
  <div class="section">
    <h3>Capítulo 1</h3>
    <p>Conteúdo do capítulo...</p>
  </div>
  
  <div class="section">
    <h3>Capítulo 2</h3>
    <p>Mais conteúdo...</p>
  </div>
</div>`}
                  className="w-full h-96 font-mono text-sm resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-amber-300/70">
                    Use o formato de grimório com classes CSS específicas para paginação correta
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const template = `<div class="grimorio-conteudo">
  <h2 class="grimorio-titulo">${title || 'Título do Grimório'}</h2>
  <p class="grimorio-subtitulo">Subtítulo opcional</p>
  
  <div class="section">
    <h3>Introdução</h3>
    <p>Conteúdo introdutório do grimório...</p>
  </div>
  
  <div class="section">
    <h3>Capítulo 1 - Primeiros Passos</h3>
    <p>Conteúdo do primeiro capítulo...</p>
    <p>Mais parágrafos com ensinamentos...</p>
  </div>
  
  <div class="section">
    <h3>Capítulo 2 - Práticas Avançadas</h3>
    <p>Conteúdo do segundo capítulo...</p>
  </div>
  
  <div class="section">
    <h3>Conclusão</h3>
    <p>Palavras finais e reflexões...</p>
  </div>
</div>`;
                        setContent(template);
                      }}
                      className="text-xs border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                    >
                      Usar Template
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'css' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-amber-200">
                  CSS Personalizado
                </label>
                <Textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder="Digite CSS personalizado ou faça upload de um arquivo .css..."
                  className="w-full h-96 font-mono text-sm resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
                />
                <p className="text-xs text-amber-300/70 mt-2">
                  CSS será aplicado ao grimório. Exemplo: h1 {'{color: #d4af37; font-size: 2rem;}'}
                </p>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-amber-200">
                    Tipo de Fundo
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setBackgroundType('color')}
                      className={`p-3 border rounded-lg transition-colors ${
                        backgroundType === 'color'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10'
                      }`}
                    >
                      Cor Sólida
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackgroundType('image')}
                      className={`p-3 border rounded-lg transition-colors ${
                        backgroundType === 'image'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10'
                      }`}
                    >
                      Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setBackgroundType('css')}
                      className={`p-3 border rounded-lg transition-colors ${
                        backgroundType === 'css'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10'
                      }`}
                    >
                      CSS Avançado
                    </button>
                  </div>
                </div>

                {backgroundType === 'color' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-200">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-12 border border-amber-500/30 rounded cursor-pointer"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#1a0a0a"
                        className="flex-1 bg-black/50 border-amber-500/30 text-amber-100"
                      />
                    </div>
                    <p className="text-xs text-amber-300/70 mt-1">
                      Use códigos hex (#000000) ou nomes de cores CSS
                    </p>
                  </div>
                )}

                {backgroundType === 'image' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-amber-200">
                        URL da Imagem
                      </label>
                      <Input
                        value={backgroundImageUrl}
                        onChange={(e) => setBackgroundImageUrl(e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="bg-black/50 border-amber-500/30 text-amber-100"
                      />
                      <p className="text-xs text-amber-300/70 mt-1">
                        Cole a URL de uma imagem ou faça upload usando o botão "Imagem" acima
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-amber-200">
                        Cor de Fundo (fallback)
                      </label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-12 border border-amber-500/30 rounded cursor-pointer"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#1a0a0a"
                          className="flex-1 bg-black/50 border-amber-500/30 text-amber-100"
                        />
                      </div>
                      <p className="text-xs text-amber-300/70 mt-1">
                        Cor exibida enquanto a imagem carrega
                      </p>
                    </div>

                    {backgroundImageUrl && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-amber-200">
                          Preview da Imagem
                        </label>
                        <div 
                          className="w-full h-32 border border-amber-500/30 rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {backgroundType === 'css' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-200">
                      CSS de Fundo Personalizado
                    </label>
                    <Textarea
                      value={backgroundCss}
                      onChange={(e) => setBackgroundCss(e.target.value)}
                      placeholder="background: linear-gradient(135deg, #1a0a0a 0%, #2d0b00 100%);"
                      className="w-full h-32 font-mono text-sm resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
                    />
                    <p className="text-xs text-amber-300/70 mt-2">
                      Escreva CSS personalizado para o fundo. Exemplos:<br/>
                      • <code>background: linear-gradient(45deg, #8B0000, #000000);</code><br/>
                      • <code>background: radial-gradient(circle, #4A0E4E, #000000);</code><br/>
                      • <code>background: url('imagem.jpg') center/cover, #1a0a0a;</code>
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cover' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-200">
                    URL da Capa
                  </label>
                  <Input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    className="bg-black/50 border-amber-500/30 text-amber-100"
                  />
                  <p className="text-xs text-amber-300/70 mt-1">
                    Cole a URL de uma imagem ou faça upload usando o botão "Capa" acima
                  </p>
                </div>

                {coverImageUrl && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-amber-200">
                      Preview da Capa
                    </label>
                    <div className="border border-amber-500/30 rounded-lg overflow-hidden">
                      <img 
                        src={coverImageUrl}
                        alt="Preview da capa"
                        className="w-full h-64 object-cover"
                        onError={() => {
                          toast({
                            title: "Erro",
                            description: "Não foi possível carregar a imagem da capa",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <h4 className="text-amber-300 font-medium mb-2">Dicas para Capa:</h4>
                  <ul className="text-sm text-amber-200/80 space-y-1">
                    <li>• Resolução recomendada: 300x400px ou proporção 3:4</li>
                    <li>• Formatos aceitos: JPG, PNG, WebP</li>
                    <li>• Use imagens relacionadas ao tema do grimório</li>
                    <li>• Evite texto na imagem (use o título do grimório)</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-amber-200">
                    Prompt para IA
                  </label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Descreva o tipo de grimório que deseja criar. Ex: 'Crie um grimório sobre magia lunar com rituais de proteção e meditação'"
                    className="w-full h-32 resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
                  />
                  <p className="text-xs text-amber-300/70 mt-1">
                    Seja específico sobre o tema, estilo e conteúdo desejado
                  </p>
                </div>

                <Button 
                  onClick={generateWithAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-black font-semibold"
                >
                  {aiGenerating ? 'Gerando...' : 'Gerar Grimório com IA'}
                </Button>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-purple-300 font-medium mb-2">Como usar a IA:</h4>
                  <ul className="text-sm text-purple-200/80 space-y-1">
                    <li>• Seja específico sobre o tema desejado</li>
                    <li>• Inclua detalhes sobre rituais, práticas ou ensinamentos</li>
                    <li>• Mencione o nível de experiência (iniciante, intermediário, avançado)</li>
                    <li>• A IA gerará conteúdo HTML formatado automaticamente</li>
                    <li>• Você pode editar o conteúdo gerado depois</li>
                  </ul>
                </div>

                {aiGenerating && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-amber-300">
                      <div className="w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando conteúdo com IA...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-amber-200">
                  Preview do Grimório
                </label>
                {renderPreview()}
                <p className="text-xs text-amber-300/70 mt-2">
                  Visualização de como o grimório aparecerá com o CSS aplicado
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            onClick={onClose} 
            variant="outline"
            className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-black font-semibold"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Grimório'}
          </Button>
        </div>

      </div>
    </div>
  );
}