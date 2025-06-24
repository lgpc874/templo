import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/page-transition";
import RichTextEditor from "@/components/rich-text-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  Palette,
  DollarSign,
  Shield,
  Hash,
  ImageIcon,
  Folder,
  Settings
} from "lucide-react";

interface Grimoire {
  id: number;
  title: string;
  description: string;
  content: string;
  cover_image_url?: string;
  background_color?: string;
  is_paid: boolean;
  price: number;
  role_restrictions?: string;
  section_id: number;
  is_published: boolean;
  unlock_order: number;
  created_at: string;
  library_sections?: { name: string; color: string };
}

interface LibrarySection {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon_url?: string;
  sort_order: number;
  is_active: boolean;
}

const ROLE_OPTIONS = [
  { value: 'buscador', label: 'Buscador' },
  { value: 'iniciado', label: 'Iniciado' },
  { value: 'portador_veu', label: 'Portador do Véu' },
  { value: 'discipulo_chamas', label: 'Discípulo das Chamas' },
  { value: 'guardiao_nome', label: 'Guardião do Nome' },
  { value: 'arauto_queda', label: 'Arauto da Queda' },
  { value: 'portador_coroa', label: 'Portador da Coroa' },
  { value: 'magus_supremo', label: 'Magus Supremo' }
];

export default function AdminLibri() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [grimoires, setGrimoires] = useState<Grimoire[]>([]);
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grimoires');
  
  // Estados para grimórios
  const [editingGrimoire, setEditingGrimoire] = useState<Grimoire | null>(null);
  const [showGrimoireForm, setShowGrimoireForm] = useState(false);
  const [grimoireForm, setGrimoireForm] = useState({
    title: '',
    description: '',
    content: '',
    custom_css: '',
    cover_image_url: '',
    background_color: '#1F2937',
    is_paid: false,
    price: 0,
    role_restrictions: 'buscador',
    section_id: 1,
    is_published: false,
    unlock_order: 1
  });

  // Estados para seções
  const [editingSection, setEditingSection] = useState<LibrarySection | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    icon_url: '',
    sort_order: 1,
    is_active: true
  });

  useEffect(() => {
    if (user?.email === 'admin@templodoabismo.com.br') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Carregar grimórios
      const grimoiresResponse = await fetch('/api/user/grimoires', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (grimoiresResponse.ok) {
        const grimoiresData = await grimoiresResponse.json();
        setGrimoires(grimoiresData);
      }

      // Carregar seções
      const sectionsResponse = await fetch('/api/library/sections');
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÕES PARA GRIMÓRIOS
  const handleCreateGrimoire = () => {
    setEditingGrimoire(null);
    const maxOrder = grimoires.length > 0 ? Math.max(...grimoires.map(g => g.unlock_order)) + 1 : 1;
    setGrimoireForm({
      title: '',
      description: '',
      content: '<h2>Bem-vindo ao Grimório</h2><p>Escreva o conteúdo sagrado aqui...</p>',
      custom_css: `.grimoire-content {\n  font-family: 'EB Garamond', serif;\n  line-height: 1.8;\n  color: #f3f4f6;\n}\n\n.grimoire-content h2 {\n  color: #fbbf24;\n  text-align: center;\n  font-family: 'Cinzel', serif;\n  margin-bottom: 2rem;\n}\n\n.grimoire-content p {\n  margin-bottom: 1.5rem;\n  text-indent: 2rem;\n}`,
      cover_image_url: '',
      background_color: '#1F2937',
      is_paid: false,
      price: 0,
      role_restrictions: 'buscador',
      section_id: sections.length > 0 ? sections[0].id : 1,
      is_published: false,
      unlock_order: maxOrder
    });
    setShowGrimoireForm(true);
  };

  const handleEditGrimoire = (grimoire: Grimoire) => {
    setEditingGrimoire(grimoire);
    setGrimoireForm({
      title: grimoire.title,
      description: grimoire.description,
      content: grimoire.content,
      custom_css: (grimoire as any).custom_css || `.grimoire-content {\n  font-family: 'EB Garamond', serif;\n  line-height: 1.8;\n  color: #f3f4f6;\n}`,
      cover_image_url: grimoire.cover_image_url || '',
      background_color: grimoire.background_color || '#1F2937',
      is_paid: grimoire.is_paid,
      price: grimoire.price,
      role_restrictions: grimoire.role_restrictions || 'buscador',
      section_id: grimoire.section_id,
      is_published: grimoire.is_published,
      unlock_order: grimoire.unlock_order
    });
    setShowGrimoireForm(true);
  };

  const handleSaveGrimoire = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const method = editingGrimoire ? 'PUT' : 'POST';
      const url = editingGrimoire 
        ? `/api/admin/grimoires/${editingGrimoire.id}`
        : '/api/admin/grimoires';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(grimoireForm)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Grimório ${editingGrimoire ? 'atualizado' : 'criado'} com sucesso`
        });
        setShowGrimoireForm(false);
        loadData();
      } else {
        throw new Error('Falha ao salvar grimório');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar grimório",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGrimoire = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este grimório?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/grimoires/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Grimório excluído com sucesso" });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir grimório",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (grimoire: Grimoire) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/grimoires/${grimoire.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: !grimoire.is_published })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Grimório ${!grimoire.is_published ? 'publicado' : 'despublicado'}`
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar status de publicação",
        variant: "destructive"
      });
    }
  };

  // FUNÇÕES PARA SEÇÕES
  const handleCreateSection = () => {
    setEditingSection(null);
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 1;
    setSectionForm({
      name: '',
      description: '',
      color: '#8B5CF6',
      icon_url: '',
      sort_order: maxOrder,
      is_active: true
    });
    setShowSectionForm(true);
  };

  const handleEditSection = (section: LibrarySection) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      description: section.description || '',
      color: section.color,
      icon_url: section.icon_url || '',
      sort_order: section.sort_order,
      is_active: section.is_active
    });
    setShowSectionForm(true);
  };

  const handleSaveSection = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const method = editingSection ? 'PUT' : 'POST';
      const url = editingSection 
        ? `/api/admin/library-sections/${editingSection.id}`
        : '/api/admin/library-sections';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionForm)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Seção ${editingSection ? 'atualizada' : 'criada'} com sucesso`
        });
        setShowSectionForm(false);
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar seção",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta seção?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/library-sections/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({ title: "Sucesso", description: "Seção excluída com sucesso" });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir seção",
        variant: "destructive"
      });
    }
  };

  if (user?.email !== 'admin@templodoabismo.com.br') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
            <p className="text-gray-400">Apenas o Magus Supremo pode acessar a Forja Libri</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-amber-400">Carregando Forja Libri...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-red-600 bg-clip-text text-transparent mb-4">
              ⚒️ Forja Libri ⚒️
            </h1>
            <p className="text-gray-400 text-lg">
              Forje os grimórios que moldarão as mentes dos buscadores
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 mb-6">
              <TabsTrigger value="grimoires" className="text-white data-[state=active]:bg-amber-600">
                <BookOpen className="w-4 h-4 mr-2" />
                Grimórios
              </TabsTrigger>
              <TabsTrigger value="sections" className="text-white data-[state=active]:bg-purple-600">
                <Folder className="w-4 h-4 mr-2" />
                Seções
              </TabsTrigger>
            </TabsList>

            {/* ABA GRIMÓRIOS */}
            <TabsContent value="grimoires">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-amber-400">Gestão de Grimórios</h2>
                  <Button onClick={handleCreateGrimoire} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Grimório
                  </Button>
                </div>

                {/* Lista de Grimórios */}
                <div className="grid gap-4">
                  {grimoires.map((grimoire) => (
                    <Card key={grimoire.id} className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white flex items-center gap-2">
                              {grimoire.title}
                              {grimoire.is_paid && (
                                <Badge variant="outline" className="border-green-500 text-green-400">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  R$ {grimoire.price}
                                </Badge>
                              )}
                              <Badge 
                                variant={grimoire.is_published ? "default" : "secondary"}
                                className={grimoire.is_published ? "bg-green-600" : "bg-gray-600"}
                              >
                                {grimoire.is_published ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                                {grimoire.is_published ? 'Publicado' : 'Rascunho'}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                              {grimoire.description}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePublish(grimoire)}
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            >
                              {grimoire.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditGrimoire(grimoire)}
                              className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteGrimoire(grimoire.id)}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ABA SEÇÕES */}
            <TabsContent value="sections">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-purple-400">Gestão de Seções</h2>
                  <Button onClick={handleCreateSection} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Seção
                  </Button>
                </div>

                {/* Lista de Seções */}
                <div className="grid gap-4">
                  {sections.map((section) => (
                    <Card key={section.id} className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: section.color }}
                            />
                            <div>
                              <CardTitle className="text-white">{section.name}</CardTitle>
                              <CardDescription className="text-gray-400">
                                {section.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSection(section)}
                              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSection(section.id)}
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* MODAL FORMULÁRIO GRIMÓRIO */}
          {showGrimoireForm && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {editingGrimoire ? 'Editar Grimório' : 'Novo Grimório'}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGrimoireForm(false)}
                      className="border-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna Esquerda */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Título</Label>
                        <Input
                          value={grimoireForm.title}
                          onChange={(e) => setGrimoireForm({...grimoireForm, title: e.target.value})}
                          placeholder="Nome do grimório"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Descrição</Label>
                        <Textarea
                          value={grimoireForm.description}
                          onChange={(e) => setGrimoireForm({...grimoireForm, description: e.target.value})}
                          placeholder="Descrição breve do grimório"
                          className="bg-gray-800 border-gray-600 text-white"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          <ImageIcon className="w-4 h-4 inline mr-2" />
                          URL da Capa
                        </Label>
                        <Input
                          value={grimoireForm.cover_image_url}
                          onChange={(e) => setGrimoireForm({...grimoireForm, cover_image_url: e.target.value})}
                          placeholder="https://exemplo.com/capa.jpg"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          <Palette className="w-4 h-4 inline mr-2" />
                          Cor de Fundo
                        </Label>
                        <Input
                          type="color"
                          value={grimoireForm.background_color}
                          onChange={(e) => setGrimoireForm({...grimoireForm, background_color: e.target.value})}
                          className="bg-gray-800 border-gray-600 h-10"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_paid"
                          checked={grimoireForm.is_paid}
                          onCheckedChange={(checked) => setGrimoireForm({...grimoireForm, is_paid: checked as boolean})}
                        />
                        <Label htmlFor="is_paid" className="text-gray-300">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Grimório Pago
                        </Label>
                      </div>

                      {grimoireForm.is_paid && (
                        <div>
                          <Label className="text-gray-300">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={grimoireForm.price}
                            onChange={(e) => setGrimoireForm({...grimoireForm, price: parseFloat(e.target.value) || 0})}
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">
                          <Shield className="w-4 h-4 inline mr-2" />
                          Restrição de Role
                        </Label>
                        <Select
                          value={grimoireForm.role_restrictions}
                          onValueChange={(value) => setGrimoireForm({...grimoireForm, role_restrictions: value})}
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

                      <div>
                        <Label className="text-gray-300">
                          <Folder className="w-4 h-4 inline mr-2" />
                          Seção
                        </Label>
                        <Select
                          value={grimoireForm.section_id.toString()}
                          onValueChange={(value) => setGrimoireForm({...grimoireForm, section_id: parseInt(value)})}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
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

                      <div>
                        <Label className="text-gray-300">
                          <Hash className="w-4 h-4 inline mr-2" />
                          Ordem de Visualização
                        </Label>
                        <Input
                          type="number"
                          value={grimoireForm.unlock_order}
                          onChange={(e) => setGrimoireForm({...grimoireForm, unlock_order: parseInt(e.target.value) || 1})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_published"
                          checked={grimoireForm.is_published}
                          onCheckedChange={(checked) => setGrimoireForm({...grimoireForm, is_published: checked as boolean})}
                        />
                        <Label htmlFor="is_published" className="text-gray-300">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Publicar Imediatamente
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Editor de Conteúdo HTML e CSS */}
                  <div className="mt-6">
                    <Label className="text-gray-300 text-lg mb-4 block">
                      <BookOpen className="w-5 h-5 inline mr-2" />
                      Conteúdo do Grimório (HTML + CSS)
                    </Label>
                    
                    <Tabs defaultValue="html" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-800 mb-4">
                        <TabsTrigger value="html" className="text-white data-[state=active]:bg-blue-600">
                          HTML
                        </TabsTrigger>
                        <TabsTrigger value="css" className="text-white data-[state=active]:bg-green-600">
                          CSS
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-white data-[state=active]:bg-purple-600">
                          Preview
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="html">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Código HTML</Label>
                          <Textarea
                            value={grimoireForm.content}
                            onChange={(e) => setGrimoireForm({...grimoireForm, content: e.target.value})}
                            placeholder="<h2>Título do Grimório</h2>&#10;<p>Conteúdo sagrado aqui...</p>"
                            className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                            rows={15}
                            style={{ fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            Use HTML puro. Tags suportadas: h1-h6, p, div, span, strong, em, ul, ol, li, br, img, etc.
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="css">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Código CSS Personalizado</Label>
                          <Textarea
                            value={grimoireForm.custom_css}
                            onChange={(e) => setGrimoireForm({...grimoireForm, custom_css: e.target.value})}
                            placeholder=".grimoire-content {&#10;  font-family: 'EB Garamond', serif;&#10;  color: #f3f4f6;&#10;}&#10;&#10;.grimoire-content h2 {&#10;  color: #fbbf24;&#10;  text-align: center;&#10;}"
                            className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                            rows={15}
                            style={{ fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            CSS será aplicado dentro do contexto .grimoire-content. Use classes e seletores relativos.
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="preview">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Preview do Grimório</Label>
                          <div 
                            className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-h-96 overflow-y-auto"
                            style={{ backgroundColor: grimoireForm.background_color }}
                          >
                            <style>{grimoireForm.custom_css}</style>
                            <div 
                              className="grimoire-content"
                              dangerouslySetInnerHTML={{ __html: grimoireForm.content }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Preview em tempo real do seu grimório com HTML e CSS aplicados.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowGrimoireForm(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveGrimoire}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Grimório
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* MODAL FORMULÁRIO SEÇÃO */}
          {showSectionForm && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {editingSection ? 'Editar Seção' : 'Nova Seção'}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSectionForm(false)}
                      className="border-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Nome da Seção</Label>
                      <Input
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                        placeholder="Nome da seção"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300">Descrição</Label>
                      <Textarea
                        value={sectionForm.description}
                        onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                        placeholder="Descrição da seção"
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">
                          <Palette className="w-4 h-4 inline mr-2" />
                          Cor da Seção
                        </Label>
                        <Input
                          type="color"
                          value={sectionForm.color}
                          onChange={(e) => setSectionForm({...sectionForm, color: e.target.value})}
                          className="bg-gray-800 border-gray-600 h-10"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          <Hash className="w-4 h-4 inline mr-2" />
                          Ordem
                        </Label>
                        <Input
                          type="number"
                          value={sectionForm.sort_order}
                          onChange={(e) => setSectionForm({...sectionForm, sort_order: parseInt(e.target.value) || 1})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                  <div>
                    <Label className="text-gray-300">Descrição</Label>
                    <Textarea
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                      placeholder="Descrição da seção"
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">
                          <Palette className="w-4 h-4 inline mr-2" />
                          Cor da Seção
                        </Label>
                        <Input
                          type="color"
                          value={sectionForm.color}
                          onChange={(e) => setSectionForm({...sectionForm, color: e.target.value})}
                          className="bg-gray-800 border-gray-600 h-10"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">
                          <Hash className="w-4 h-4 inline mr-2" />
                          Ordem
                        </Label>
                        <Input
                          type="number"
                          value={sectionForm.sort_order}
                          onChange={(e) => setSectionForm({...sectionForm, sort_order: parseInt(e.target.value) || 1})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-300">
                        <ImageIcon className="w-4 h-4 inline mr-2" />
                        URL do Ícone
                      </Label>
                      <Input
                        value={sectionForm.icon_url}
                        onChange={(e) => setSectionForm({...sectionForm, icon_url: e.target.value})}
                        placeholder="https://exemplo.com/icone.svg"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={sectionForm.is_active}
                        onCheckedChange={(checked) => setSectionForm({...sectionForm, is_active: checked as boolean})}
                      />
                      <Label htmlFor="is_active" className="text-gray-300">
                        <Settings className="w-4 h-4 inline mr-1" />
                        Seção Ativa
                      </Label>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-4 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowSectionForm(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveSection}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Seção
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}