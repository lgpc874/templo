import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  Shield,
  Code,
  Layout,
  Settings,
  ArrowLeft,
  Globe,
  Lock,
  Users
} from "lucide-react";

interface Page {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
  html_content: string;
  css_content: string;
  js_content?: string;
  meta_description?: string;
  meta_keywords?: string;
  required_role: string;
  is_active: boolean;
  is_public: boolean;
  custom_layout: boolean;
  route_path: string;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS = [
  { value: 'public', label: 'Público (Sem Login)' },
  { value: 'buscador', label: 'Buscador' },
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'portador_veu', label: 'Portador do Véu' },
  { value: 'discipulo_chamas', label: 'Discípulo das Chamas' },
  { value: 'guardiao_nome', label: 'Guardião do Nome' },
  { value: 'arauto_queda', label: 'Arauto da Queda' },
  { value: 'portador_coroa', label: 'Portador da Coroa' },
  { value: 'magus_supremo', label: 'Magus Supremo' }
];

export default function AdminPages() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (user?.role !== 'magus_supremo') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Card className="w-full max-w-md bg-black/90 border-red-500/40">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-xl text-red-400 mb-4">Acesso Negado</CardTitle>
              <CardDescription className="text-ritualistic-beige">
                Apenas o Magus Supremo pode administrar as páginas.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Estados
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [pageForm, setPageForm] = useState({
    name: '',
    slug: '',
    title: '',
    description: '',
    html_content: '<div class="page-content">\n  <h1>Nova Página</h1>\n  <p>Conteúdo da página...</p>\n</div>',
    css_content: '.page-content {\n  font-family: "EB Garamond", serif;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 2rem;\n  color: #f3f4f6;\n}\n\n.page-content h1 {\n  color: #fbbf24;\n  text-align: center;\n  font-family: "Cinzel", serif;\n  margin-bottom: 2rem;\n}',
    js_content: '// JavaScript personalizado para a página\nconsole.log("Página carregada");',
    meta_description: '',
    meta_keywords: '',
    required_role: 'buscador',
    is_active: true,
    is_public: false,
    custom_layout: false,
    route_path: ''
  });

  useEffect(() => {
    if (user?.role === 'magus_supremo') {
      loadPages();
    }
  }, [user]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/pages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const pagesData = await response.json();
        setPages(pagesData);
      }
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
      toast({
        title: "Erro ao carregar páginas",
        description: "Não foi possível carregar as páginas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = () => {
    setEditingPage(null);
    setPageForm({
      name: '',
      slug: '',
      title: '',
      description: '',
      html_content: '<div class="page-content">\n  <h1>Nova Página</h1>\n  <p>Conteúdo da página...</p>\n</div>',
      css_content: '.page-content {\n  font-family: "EB Garamond", serif;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 2rem;\n  color: #f3f4f6;\n}\n\n.page-content h1 {\n  color: #fbbf24;\n  text-align: center;\n  font-family: "Cinzel", serif;\n  margin-bottom: 2rem;\n}',
      js_content: '// JavaScript personalizado para a página\nconsole.log("Página carregada");',
      meta_description: '',
      meta_keywords: '',
      required_role: 'buscador',
      is_active: true,
      is_public: false,
      custom_layout: false,
      route_path: ''
    });
    setShowPageForm(true);
  };

  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setPageForm({
      name: page.name,
      slug: page.slug,
      title: page.title,
      description: page.description,
      html_content: page.html_content,
      css_content: page.css_content,
      js_content: page.js_content || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords || '',
      required_role: page.required_role,
      is_active: page.is_active,
      is_public: page.is_public,
      custom_layout: page.custom_layout,
      route_path: page.route_path
    });
    setShowPageForm(true);
  };

  const handleSavePage = async () => {
    try {
      // Gerar slug automaticamente se não fornecido
      if (!pageForm.slug && pageForm.name) {
        pageForm.slug = pageForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      }

      // Gerar route_path automaticamente se não fornecido
      if (!pageForm.route_path && pageForm.slug) {
        pageForm.route_path = `/${pageForm.slug}`;
      }

      const token = localStorage.getItem('auth_token');
      const method = editingPage ? 'PUT' : 'POST';
      const url = editingPage 
        ? `/api/admin/pages/${editingPage.id}`
        : '/api/admin/pages';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageForm)
      });

      if (response.ok) {
        const savedPage = await response.json();
        if (editingPage) {
          setPages(pages.map(p => p.id === editingPage.id ? savedPage : p));
          toast({ title: "Página atualizada com sucesso!" });
        } else {
          setPages([...pages, savedPage]);
          toast({ title: "Página criada com sucesso!" });
        }
        setShowPageForm(false);
        setEditingPage(null);
      } else {
        throw new Error('Erro ao salvar página');
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar página",
        description: "Não foi possível salvar a página",
        variant: "destructive"
      });
    }
  };

  const handleDeletePage = async (pageId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPages(pages.filter(p => p.id !== pageId));
        toast({ title: "Página excluída com sucesso!" });
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir página",
        description: "Não foi possível excluir a página",
        variant: "destructive"
      });
    }
  };

  const generatePreview = () => {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pageForm.title}</title>
        <meta name="description" content="${pageForm.meta_description}">
        <meta name="keywords" content="${pageForm.meta_keywords}">
        <style>
          body { 
            margin: 0; 
            background: linear-gradient(to bottom, #000000, #1a1a1a);
            min-height: 100vh;
          }
          ${pageForm.css_content}
        </style>
      </head>
      <body>
        ${pageForm.html_content}
        <script>
          ${pageForm.js_content}
        </script>
      </body>
      </html>
    `;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/sanctum-magistri'}
                className="bg-black/30 border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sanctum
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-golden-amber font-cinzel">
                  Configuração de Páginas
                </h1>
                <p className="text-ritualistic-beige/80">
                  Gerencie páginas customizadas com controle de acesso
                </p>
              </div>
            </div>
            <Button 
              onClick={handleCreatePage}
              className="bg-golden-amber hover:bg-golden-amber/80 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Página
            </Button>
          </div>

          {/* Lista de Páginas */}
          {!showPageForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="w-8 h-8 border-2 border-golden-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-ritualistic-beige">Carregando páginas...</p>
                </div>
              ) : pages.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">Nenhuma página encontrada</p>
                  <p className="text-gray-500 text-sm">Clique em "Nova Página" para criar a primeira</p>
                </div>
              ) : (
                pages.map((page) => (
                  <Card 
                    key={page.id} 
                    className="bg-black/60 border-gray-700 hover:border-golden-amber/50 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-5 h-5 text-golden-amber" />
                          <CardTitle className="text-lg text-white">{page.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {page.is_active ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-red-500" />
                          )}
                          {page.is_public ? (
                            <Globe className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-gray-400">
                        {page.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Rota:</span>
                          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                            {page.route_path}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Acesso:</span>
                          <Badge 
                            variant="outline" 
                            className={`${
                              page.required_role === 'public' 
                                ? 'text-green-400 border-green-400/30'
                                : 'text-amber-400 border-amber-400/30'
                            }`}
                          >
                            {ROLE_OPTIONS.find(r => r.value === page.required_role)?.label}
                          </Badge>
                        </div>
                        <div className="flex space-x-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPage(page)}
                            className="flex-1 border-golden-amber/30 text-golden-amber hover:bg-golden-amber/10"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePage(page.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Formulário de Criação/Edição */}
          {showPageForm && (
            <Card className="bg-black/60 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-golden-amber">
                    {editingPage ? 'Editar Página' : 'Nova Página'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPageForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 bg-gray-800">
                    <TabsTrigger value="config" className="data-[state=active]:bg-golden-amber data-[state=active]:text-black">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuração
                    </TabsTrigger>
                    <TabsTrigger value="html" className="data-[state=active]:bg-golden-amber data-[state=active]:text-black">
                      <Code className="w-4 h-4 mr-2" />
                      HTML
                    </TabsTrigger>
                    <TabsTrigger value="css" className="data-[state=active]:bg-golden-amber data-[state=active]:text-black">
                      <Layout className="w-4 h-4 mr-2" />
                      CSS
                    </TabsTrigger>
                    <TabsTrigger value="js" className="data-[state=active]:bg-golden-amber data-[state=active]:text-black">
                      <Code className="w-4 h-4 mr-2" />
                      JavaScript
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="data-[state=active]:bg-golden-amber data-[state=active]:text-black">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Nome da Página</Label>
                        <Input
                          value={pageForm.name}
                          onChange={(e) => setPageForm({...pageForm, name: e.target.value})}
                          placeholder="Ex: Sobre Nós"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Slug (URL)</Label>
                        <Input
                          value={pageForm.slug}
                          onChange={(e) => setPageForm({...pageForm, slug: e.target.value})}
                          placeholder="Ex: sobre-nos"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Título (SEO)</Label>
                        <Input
                          value={pageForm.title}
                          onChange={(e) => setPageForm({...pageForm, title: e.target.value})}
                          placeholder="Título para SEO"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Rota Customizada</Label>
                        <Input
                          value={pageForm.route_path}
                          onChange={(e) => setPageForm({...pageForm, route_path: e.target.value})}
                          placeholder="Ex: /sobre"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">Descrição</Label>
                      <Textarea
                        value={pageForm.description}
                        onChange={(e) => setPageForm({...pageForm, description: e.target.value})}
                        placeholder="Descrição da página"
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Meta Descrição (SEO)</Label>
                        <Textarea
                          value={pageForm.meta_description}
                          onChange={(e) => setPageForm({...pageForm, meta_description: e.target.value})}
                          placeholder="Descrição para motores de busca"
                          className="bg-gray-800 border-gray-600 text-white"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Palavras-chave (SEO)</Label>
                        <Textarea
                          value={pageForm.meta_keywords}
                          onChange={(e) => setPageForm({...pageForm, meta_keywords: e.target.value})}
                          placeholder="palavra1, palavra2, palavra3"
                          className="bg-gray-800 border-gray-600 text-white"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Role Necessária
                        </Label>
                        <Select
                          value={pageForm.required_role}
                          onValueChange={(value) => setPageForm({...pageForm, required_role: value})}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={pageForm.is_active}
                          onCheckedChange={(checked) => setPageForm({...pageForm, is_active: checked})}
                        />
                        <Label htmlFor="is_active" className="text-gray-300">Página Ativa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_public"
                          checked={pageForm.is_public}
                          onCheckedChange={(checked) => setPageForm({...pageForm, is_public: checked})}
                        />
                        <Label htmlFor="is_public" className="text-gray-300">Acesso Público</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="custom_layout"
                          checked={pageForm.custom_layout}
                          onCheckedChange={(checked) => setPageForm({...pageForm, custom_layout: checked})}
                        />
                        <Label htmlFor="custom_layout" className="text-gray-300">Layout Customizado</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="html" className="mt-6">
                    <div>
                      <Label className="text-gray-300">Conteúdo HTML</Label>
                      <Textarea
                        value={pageForm.html_content}
                        onChange={(e) => setPageForm({...pageForm, html_content: e.target.value})}
                        placeholder="Digite o HTML da página..."
                        className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                        rows={20}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="css" className="mt-6">
                    <div>
                      <Label className="text-gray-300">Estilos CSS</Label>
                      <Textarea
                        value={pageForm.css_content}
                        onChange={(e) => setPageForm({...pageForm, css_content: e.target.value})}
                        placeholder="Digite o CSS da página..."
                        className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                        rows={20}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="js" className="mt-6">
                    <div>
                      <Label className="text-gray-300">JavaScript</Label>
                      <Textarea
                        value={pageForm.js_content}
                        onChange={(e) => setPageForm({...pageForm, js_content: e.target.value})}
                        placeholder="Digite o JavaScript da página..."
                        className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                        rows={20}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="mt-6">
                    <div className="bg-white rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={generatePreview()}
                        className="w-full h-96 border-0"
                        title="Preview da Página"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowPageForm(false)}
                    className="text-gray-400 border-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePage}
                    className="bg-golden-amber hover:bg-golden-amber/80 text-black"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPage ? 'Atualizar Página' : 'Criar Página'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageTransition>
  );
}