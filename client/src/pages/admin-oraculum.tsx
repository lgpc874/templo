import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Sparkles, 
  Flame, 
  Droplets, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Save,
  Key,
  Brain,
  Palette,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContentProtection from '@/components/content-protection';

interface Oracle {
  id: number;
  name: string;
  latin_name: string;
  description?: string;
  icon_url?: string;
  theme_color: string;
  is_active: boolean;
  is_paid: boolean;
  price: number;
  free_roles: string[];
  restricted_roles: string[];
  role_discounts: any;
  sort_order: number;
  ai_personality?: string;
  ai_instructions?: string;
  auto_presentation: boolean;
  custom_presentation?: string;
}

interface OracleConfig {
  id: number;
  openai_api_key?: string;
  default_model: string;
  max_tokens: number;
  temperature: number;
  updated_at: string;
}

const getOracleIcon = (oracleName: string) => {
  switch (oracleName.toLowerCase()) {
    case 'espelho negro':
      return <Eye className="w-5 h-5" />;
    case 'tarot infernal':
      return <Sparkles className="w-5 h-5" />;
    case 'chamas infernais':
      return <Flame className="w-5 h-5" />;
    case 'águas sombrias':
      return <Droplets className="w-5 h-5" />;
    case 'guardião do abismo':
      return <Shield className="w-5 h-5" />;
    default:
      return <Brain className="w-5 h-5" />;
  }
};

const rolesList = [
  'buscador', 'iniciado', 'portador_veu', 'discipulo_chamas', 
  'guardiao_nome', 'arauto_queda', 'portador_coroa', 'magus_supremo'
];

export default function AdminOraculum() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedOracle, setSelectedOracle] = useState<Oracle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('oracles');

  // Buscar oráculos
  const { data: oracles = [], isLoading: oraclesLoading, error: oraclesError } = useQuery<Oracle[]>({
    queryKey: ['/api/admin/oracles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/oracles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar oráculos');
      return response.json();
    },
    enabled: user?.role === 'magus_supremo',
    retry: 1
  });

  // Buscar configuração
  const { data: config, error: configError } = useQuery<OracleConfig>({
    queryKey: ['/api/admin/oracles/config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/oracles/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao carregar configuração');
      return response.json();
    },
    enabled: user?.role === 'magus_supremo',
    retry: 1
  });

  // Criar oráculo
  const createOracleMutation = useMutation({
    mutationFn: async (oracleData: Partial<Oracle>) => {
      const response = await fetch('/api/admin/oracles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(oracleData)
      });
      if (!response.ok) throw new Error('Erro ao criar oráculo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles'] });
      setShowCreateForm(false);
      toast({ title: 'Oráculo criado com sucesso!' });
    }
  });

  // Atualizar oráculo
  const updateOracleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Oracle> }) => {
      const response = await fetch(`/api/admin/oracles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar oráculo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles'] });
      setIsEditing(false);
      setSelectedOracle(null);
      toast({ title: 'Oráculo atualizado com sucesso!' });
    }
  });

  // Deletar oráculo
  const deleteOracleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/oracles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erro ao deletar oráculo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles'] });
      setSelectedOracle(null);
      toast({ title: 'Oráculo deletado com sucesso!' });
    }
  });

  // Atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: Partial<OracleConfig>) => {
      const response = await fetch('/api/admin/oracles/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(configData)
      });
      if (!response.ok) throw new Error('Erro ao atualizar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles/config'] });
      toast({ title: 'Configuração atualizada com sucesso!' });
    }
  });



  return (
    <PageTransition>
      <ContentProtection>
        <div className="min-h-screen bg-black">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="w-8 h-8 text-golden-amber" />
                <h1 className="text-3xl font-bold text-golden-amber" style={{ fontFamily: 'Cinzel' }}>
                  ADMINISTRAÇÃO ORACULUM
                </h1>
              </div>
              <p className="text-ritualistic-beige/70">
                Gerencie os oráculos infernais e suas configurações de IA
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900/50 border border-golden-amber/20">
                <TabsTrigger 
                  value="oracles" 
                  className="data-[state=active]:bg-golden-amber/20 data-[state=active]:text-golden-amber"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Oráculos
                </TabsTrigger>
                <TabsTrigger 
                  value="config" 
                  className="data-[state=active]:bg-golden-amber/20 data-[state=active]:text-golden-amber"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuração IA
                </TabsTrigger>
              </TabsList>

              {/* Aba Oráculos */}
              <TabsContent value="oracles" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-golden-amber">Oráculos Cadastrados</h2>
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-golden-amber hover:bg-golden-amber/80 text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Oráculo
                  </Button>
                </div>

                {oraclesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-golden-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-ritualistic-beige">Carregando oráculos...</p>
                  </div>
                ) : oraclesError ? (
                  <div className="text-center py-8">
                    <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <p className="text-red-400 mb-2">Erro ao carregar oráculos</p>
                    <p className="text-gray-400 text-sm">{oraclesError.message}</p>
                    <Button 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles'] })}
                      className="mt-4 bg-golden-amber hover:bg-golden-amber/80 text-black"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                ) : oracles.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhum oráculo encontrado</p>
                    <p className="text-gray-500 text-sm">Clique em "Novo Oráculo" para criar o primeiro</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {oracles.map((oracle) => (
                      <Card 
                        key={oracle.id} 
                        className="bg-black/60 border-gray-700 hover:border-golden-amber/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedOracle(oracle)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: oracle.theme_color + '20', color: oracle.theme_color }}
                              >
                                {getOracleIcon(oracle.name)}
                              </div>
                              <div>
                                <CardTitle className="text-golden-amber text-sm">{oracle.name}</CardTitle>
                                <p className="text-xs text-gray-400 italic">{oracle.latin_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {oracle.is_active ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Ativo</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Inativo</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-ritualistic-beige/70 mb-3 line-clamp-2">
                            {oracle.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">
                              {oracle.is_paid ? `R$ ${oracle.price}` : 'Gratuito'}
                            </span>
                            <span className="text-gray-400">Ordem: {oracle.sort_order}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Aba Configuração */}
              <TabsContent value="config" className="space-y-6">
                <Card className="bg-black/60 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-golden-amber flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Configuração OpenAI
                    </CardTitle>
                    <CardDescription>
                      Configure as credenciais e parâmetros da IA para os oráculos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openai_key" className="text-ritualistic-beige">Chave OpenAI</Label>
                        <Input
                          id="openai_key"
                          type="password"
                          placeholder="sk-..."
                          defaultValue={config?.openai_api_key || ''}
                          className="bg-gray-900/50 border-gray-600 text-white"
                          onBlur={(e) => {
                            if (e.target.value !== config?.openai_api_key) {
                              updateConfigMutation.mutate({ openai_api_key: e.target.value });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="model" className="text-ritualistic-beige">Modelo</Label>
                        <Select 
                          defaultValue={config?.default_model || 'gpt-4'}
                          onValueChange={(value) => updateConfigMutation.mutate({ default_model: value })}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="max_tokens" className="text-ritualistic-beige">Max Tokens</Label>
                        <Input
                          id="max_tokens"
                          type="number"
                          defaultValue={config?.max_tokens || 1000}
                          className="bg-gray-900/50 border-gray-600 text-white"
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (value !== config?.max_tokens) {
                              updateConfigMutation.mutate({ max_tokens: value });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="temperature" className="text-ritualistic-beige">Temperature</Label>
                        <Input
                          id="temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          defaultValue={config?.temperature || 0.8}
                          className="bg-gray-900/50 border-gray-600 text-white"
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value !== config?.temperature) {
                              updateConfigMutation.mutate({ temperature: value });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Modal de Detalhes do Oráculo */}
            {selectedOracle && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-golden-amber/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: selectedOracle.theme_color + '20', color: selectedOracle.theme_color }}
                        >
                          {getOracleIcon(selectedOracle.name)}
                        </div>
                        <div>
                          <CardTitle className="text-golden-amber">{selectedOracle.name}</CardTitle>
                          <p className="text-sm text-gray-400 italic">{selectedOracle.latin_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(!isEditing)}
                          className="border-golden-amber/50 text-golden-amber hover:bg-golden-amber/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja deletar este oráculo?')) {
                              deleteOracleMutation.mutate(selectedOracle.id);
                            }
                          }}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOracle(null)}
                          className="text-gray-400"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <OracleEditForm 
                        oracle={selectedOracle} 
                        onSave={(data) => updateOracleMutation.mutate({ id: selectedOracle.id, data })}
                        onCancel={() => setIsEditing(false)}
                      />
                    ) : (
                      <OracleDetails oracle={selectedOracle} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modal de Criação */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-golden-amber/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-golden-amber">Criar Novo Oráculo</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCreateForm(false)}
                        className="text-gray-400"
                      >
                        ✕
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <OracleCreateForm 
                      onSave={(data) => createOracleMutation.mutate(data)}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}

// Componente de detalhes do oráculo
function OracleDetails({ oracle }: { oracle: Oracle }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-ritualistic-beige">Status</Label>
          <div className="mt-1">
            {oracle.is_active ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Ativo</Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Inativo</Badge>
            )}
          </div>
        </div>
        <div>
          <Label className="text-ritualistic-beige">Preço</Label>
          <p className="text-white mt-1">
            {oracle.is_paid ? `R$ ${oracle.price.toFixed(2)}` : 'Gratuito'}
          </p>
        </div>
      </div>
      
      <div>
        <Label className="text-ritualistic-beige">Descrição</Label>
        <p className="text-white mt-1">{oracle.description}</p>
      </div>
      
      <div>
        <Label className="text-ritualistic-beige">Personalidade IA</Label>
        <p className="text-white mt-1">{oracle.ai_personality}</p>
      </div>
      
      <div>
        <Label className="text-ritualistic-beige">Instruções IA</Label>
        <p className="text-white mt-1 whitespace-pre-wrap">{oracle.ai_instructions}</p>
      </div>

      <div>
        <Label className="text-ritualistic-beige">Apresentação Personalizada</Label>
        <p className="text-white mt-1">{oracle.custom_presentation}</p>
      </div>
      
      <div>
        <Label className="text-ritualistic-beige">Roles Gratuitos</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {oracle.free_roles.map(role => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de edição do oráculo
function OracleEditForm({ oracle, onSave, onCancel }: { 
  oracle: Oracle; 
  onSave: (data: Partial<Oracle>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(oracle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-ritualistic-beige">Nome</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="latin_name" className="text-ritualistic-beige">Nome Latino</Label>
          <Input
            id="latin_name"
            value={formData.latin_name}
            onChange={(e) => setFormData({ ...formData, latin_name: e.target.value })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-ritualistic-beige">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="theme_color" className="text-ritualistic-beige">Cor do Tema</Label>
          <Input
            id="theme_color"
            type="color"
            value={formData.theme_color}
            onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
            className="bg-gray-900/50 border-gray-600 h-10"
          />
        </div>
        <div>
          <Label htmlFor="price" className="text-ritualistic-beige">Preço</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="sort_order" className="text-ritualistic-beige">Ordem</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active" className="text-ritualistic-beige">Ativo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_paid"
            checked={formData.is_paid}
            onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
          />
          <Label htmlFor="is_paid" className="text-ritualistic-beige">Pago</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="auto_presentation"
            checked={formData.auto_presentation}
            onCheckedChange={(checked) => setFormData({ ...formData, auto_presentation: checked })}
          />
          <Label htmlFor="auto_presentation" className="text-ritualistic-beige">Auto Apresentação</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="ai_personality" className="text-ritualistic-beige">Personalidade IA</Label>
        <Input
          id="ai_personality"
          value={formData.ai_personality || ''}
          onChange={(e) => setFormData({ ...formData, ai_personality: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
        />
      </div>

      <div>
        <Label htmlFor="ai_instructions" className="text-ritualistic-beige">Prompt/Instruções para IA</Label>
        <Textarea
          id="ai_instructions"
          value={formData.ai_instructions || ''}
          onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
          placeholder="Digite aqui o prompt/personalidade que será enviado para a IA. A IA receberá automaticamente o nome, data de nascimento e pergunta da pessoa."
          className="bg-gray-900/50 border-gray-600 text-white min-h-[150px]"
          rows={6}
        />
        <p className="text-xs text-gray-400 mt-1">
          A IA recebe automaticamente: nome da pessoa, data de nascimento e pergunta/situação
        </p>
      </div>

      <div>
        <Label htmlFor="custom_presentation" className="text-ritualistic-beige">Apresentação Personalizada</Label>
        <Textarea
          id="custom_presentation"
          value={formData.custom_presentation || ''}
          onChange={(e) => setFormData({ ...formData, custom_presentation: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-golden-amber hover:bg-golden-amber/80 text-black">
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </form>
  );
}

// Componente de criação do oráculo
function OracleCreateForm({ onSave, onCancel }: { 
  onSave: (data: Partial<Oracle>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    latin_name: '',
    description: '',
    theme_color: '#8b5cf6',
    is_active: true,
    is_paid: false,
    price: 0,
    free_roles: rolesList,
    restricted_roles: [],
    role_discounts: {},
    sort_order: 1,
    ai_personality: '',
    ai_instructions: '',
    auto_presentation: true,
    custom_presentation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-ritualistic-beige">Nome *</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="latin_name" className="text-ritualistic-beige">Nome Latino *</Label>
          <Input
            id="latin_name"
            required
            value={formData.latin_name}
            onChange={(e) => setFormData({ ...formData, latin_name: e.target.value })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-ritualistic-beige">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="theme_color" className="text-ritualistic-beige">Cor do Tema</Label>
          <Input
            id="theme_color"
            type="color"
            value={formData.theme_color}
            onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
            className="bg-gray-900/50 border-gray-600 h-10"
          />
        </div>
        <div>
          <Label htmlFor="price" className="text-ritualistic-beige">Preço</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="sort_order" className="text-ritualistic-beige">Ordem</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            className="bg-gray-900/50 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active" className="text-ritualistic-beige">Ativo</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_paid"
            checked={formData.is_paid}
            onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
          />
          <Label htmlFor="is_paid" className="text-ritualistic-beige">Pago</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="ai_personality" className="text-ritualistic-beige">Personalidade IA</Label>
        <Input
          id="ai_personality"
          value={formData.ai_personality}
          onChange={(e) => setFormData({ ...formData, ai_personality: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          placeholder="Ex: Mestre místico do tarot infernal"
        />
      </div>

      <div>
        <Label htmlFor="ai_instructions" className="text-ritualistic-beige">Instruções IA</Label>
        <Textarea
          id="ai_instructions"
          value={formData.ai_instructions}
          onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          rows={4}
          placeholder="Instruções detalhadas para a personalidade da IA..."
        />
      </div>

      <div>
        <Label htmlFor="custom_presentation" className="text-ritualistic-beige">Apresentação Personalizada</Label>
        <Textarea
          id="custom_presentation"
          value={formData.custom_presentation}
          onChange={(e) => setFormData({ ...formData, custom_presentation: e.target.value })}
          className="bg-gray-900/50 border-gray-600 text-white"
          rows={3}
          placeholder="Mensagem de apresentação que o oráculo mostrará..."
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-golden-amber hover:bg-golden-amber/80 text-black">
          <Plus className="w-4 h-4 mr-2" />
          Criar Oráculo
        </Button>
      </div>
    </form>
  );
}