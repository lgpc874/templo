import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { PageTransition } from '@/components/page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, Plus, Edit, Trash2, Save, X, Settings, Eye, Flame, 
  Droplets, Shield, Sparkles, DollarSign, Users, Palette,
  Key, Brain, MessageSquare, ArrowUp, ArrowDown
} from 'lucide-react';
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
}

const roles = [
  'buscador', 'iniciado', 'portador_veu', 'discipulo_chamas',
  'guardiao_nome', 'arauto_queda', 'portador_coroa', 'magus_supremo'
];

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
      return <Crown className="w-5 h-5" />;
  }
};

export default function AdminOraculum() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [editingOracle, setEditingOracle] = useState<Oracle | null>(null);
  const [showOracleForm, setShowOracleForm] = useState(false);
  const [activeTab, setActiveTab] = useState('oracles');

  // Estados para formulários
  const [oracleForm, setOracleForm] = useState({
    name: '',
    latin_name: '',
    description: '',
    icon_url: '',
    theme_color: '#8B5CF6',
    is_active: true,
    is_paid: true,
    price: 0,
    free_roles: [] as string[],
    restricted_roles: [] as string[],
    role_discounts: {} as any,
    sort_order: 1,
    ai_personality: '',
    ai_instructions: '',
    auto_presentation: true,
    custom_presentation: ''
  });

  const [configForm, setConfigForm] = useState({
    openai_api_key: '',
    default_model: 'gpt-4',
    max_tokens: 500,
    temperature: 0.8
  });

  // Queries
  const { data: oracles = [], refetch: refetchOracles } = useQuery({
    queryKey: ['/api/admin/oracles'],
    enabled: isAuthenticated && user?.role === 'magus_supremo'
  });

  const { data: config } = useQuery({
    queryKey: ['/api/admin/oracles/config'],
    enabled: isAuthenticated && user?.role === 'magus_supremo',
    onSuccess: (data: OracleConfig) => {
      if (data) {
        setConfigForm({
          openai_api_key: data.openai_api_key || '',
          default_model: data.default_model,
          max_tokens: data.max_tokens,
          temperature: data.temperature
        });
      }
    }
  });

  // Mutations
  const createOracleMutation = useMutation({
    mutationFn: async (data: typeof oracleForm) => {
      const response = await fetch('/api/admin/oracles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao criar oráculo');
      return response.json();
    },
    onSuccess: () => {
      refetchOracles();
      resetForm();
    }
  });

  const updateOracleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof oracleForm }) => {
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
      refetchOracles();
      resetForm();
    }
  });

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
      refetchOracles();
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof configForm) => {
      const response = await fetch('/api/admin/oracles/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/oracles/config'] });
    }
  });

  // Funções auxiliares
  const resetForm = () => {
    setOracleForm({
      name: '',
      latin_name: '',
      description: '',
      icon_url: '',
      theme_color: '#8B5CF6',
      is_active: true,
      is_paid: true,
      price: 0,
      free_roles: [],
      restricted_roles: [],
      role_discounts: {},
      sort_order: oracles.length + 1,
      ai_personality: '',
      ai_instructions: '',
      auto_presentation: true,
      custom_presentation: ''
    });
    setEditingOracle(null);
    setShowOracleForm(false);
  };

  const handleCreateOracle = () => {
    setEditingOracle(null);
    resetForm();
    setShowOracleForm(true);
  };

  const handleEditOracle = (oracle: Oracle) => {
    setEditingOracle(oracle);
    setOracleForm({
      name: oracle.name,
      latin_name: oracle.latin_name,
      description: oracle.description || '',
      icon_url: oracle.icon_url || '',
      theme_color: oracle.theme_color,
      is_active: oracle.is_active,
      is_paid: oracle.is_paid,
      price: oracle.price,
      free_roles: oracle.free_roles || [],
      restricted_roles: oracle.restricted_roles || [],
      role_discounts: oracle.role_discounts || {},
      sort_order: oracle.sort_order,
      ai_personality: oracle.ai_personality || '',
      ai_instructions: oracle.ai_instructions || '',
      auto_presentation: oracle.auto_presentation,
      custom_presentation: oracle.custom_presentation || ''
    });
    setShowOracleForm(true);
  };

  const handleSaveOracle = () => {
    if (editingOracle) {
      updateOracleMutation.mutate({ id: editingOracle.id, data: oracleForm });
    } else {
      createOracleMutation.mutate(oracleForm);
    }
  };

  const handleDeleteOracle = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este oráculo?')) {
      deleteOracleMutation.mutate(id);
    }
  };

  const toggleRoleInArray = (role: string, array: string[], setter: (roles: string[]) => void) => {
    if (array.includes(role)) {
      setter(array.filter(r => r !== role));
    } else {
      setter([...array, role]);
    }
  };

  const updateRoleDiscount = (role: string, discount: number) => {
    setOracleForm({
      ...oracleForm,
      role_discounts: {
        ...oracleForm.role_discounts,
        [role]: discount
      }
    });
  };

  if (!isAuthenticated || user?.role !== 'magus_supremo') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900/80 border-purple-500/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-purple-300">Acesso Restrito</CardTitle>
              <CardDescription className="text-gray-400">
                Apenas o Magus Supremo pode acessar esta área
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <ContentProtection>
        <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black">
          {/* Header */}
          <div className="border-b border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-black/80">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Oraculum</h1>
                  <p className="text-gray-400">Administração dos Oráculos Infernais</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900/60">
                <TabsTrigger value="oracles" className="data-[state=active]:bg-purple-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Oráculos
                </TabsTrigger>
                <TabsTrigger value="config" className="data-[state=active]:bg-purple-600">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oracles" className="space-y-6">
                {!showOracleForm ? (
                  <>
                    {/* Botão Criar */}
                    <Card className="bg-gray-900/60 border-purple-500/30">
                      <CardContent className="p-4">
                        <Button onClick={handleCreateOracle} className="bg-purple-600 hover:bg-purple-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Novo Oráculo
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Lista de Oráculos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {oracles.map((oracle: Oracle) => (
                        <Card 
                          key={oracle.id} 
                          className="bg-gray-900/60 border-purple-500/30 hover:border-purple-400/50 transition-colors"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${oracle.theme_color}40, ${oracle.theme_color}60)`
                                  }}
                                >
                                  {oracle.icon_url ? (
                                    <img src={oracle.icon_url} alt={oracle.name} className="w-5 h-5" />
                                  ) : (
                                    <div style={{ color: oracle.theme_color }}>
                                      {getOracleIcon(oracle.name)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-lg text-white">{oracle.name}</CardTitle>
                                  <p className="text-sm text-gray-400 italic">{oracle.latin_name}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {oracle.is_active ? (
                                  <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="bg-red-600/20 text-red-400">
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <p className="text-gray-300 text-sm">{oracle.description}</p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="text-gray-300">
                                    {oracle.is_paid ? `R$ ${oracle.price.toFixed(2)}` : 'Gratuito'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <ArrowUp className="w-4 h-4 text-purple-400" />
                                  <span className="text-gray-300">Ordem: {oracle.sort_order}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditOracle(oracle)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteOracle(oracle.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Formulário de Edição/Criação */
                  <Card className="bg-gray-900/60 border-purple-500/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-white">
                          {editingOracle ? 'Editar Oráculo' : 'Criar Novo Oráculo'}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetForm}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <Tabs defaultValue="basic" className="space-y-4">
                        <TabsList className="grid grid-cols-4 bg-gray-800">
                          <TabsTrigger value="basic">Básico</TabsTrigger>
                          <TabsTrigger value="pricing">Preços</TabsTrigger>
                          <TabsTrigger value="ai">IA</TabsTrigger>
                          <TabsTrigger value="advanced">Avançado</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-gray-300">Nome do Oráculo</Label>
                              <Input
                                value={oracleForm.name}
                                onChange={(e) => setOracleForm({...oracleForm, name: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Nome em Latim</Label>
                              <Input
                                value={oracleForm.latin_name}
                                onChange={(e) => setOracleForm({...oracleForm, latin_name: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-300">Descrição</Label>
                            <Textarea
                              value={oracleForm.description}
                              onChange={(e) => setOracleForm({...oracleForm, description: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-gray-300">URL do Ícone</Label>
                              <Input
                                value={oracleForm.icon_url}
                                onChange={(e) => setOracleForm({...oracleForm, icon_url: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="https://..."
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Cor do Tema</Label>
                              <Input
                                type="color"
                                value={oracleForm.theme_color}
                                onChange={(e) => setOracleForm({...oracleForm, theme_color: e.target.value})}
                                className="bg-gray-800 border-gray-600 h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Ordem</Label>
                              <Input
                                type="number"
                                value={oracleForm.sort_order}
                                onChange={(e) => setOracleForm({...oracleForm, sort_order: parseInt(e.target.value) || 1})}
                                className="bg-gray-800 border-gray-600 text-white"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={oracleForm.is_active}
                                onCheckedChange={(checked) => setOracleForm({...oracleForm, is_active: checked})}
                              />
                              <Label className="text-gray-300">Ativo</Label>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4">
                          <div className="flex items-center space-x-2 mb-4">
                            <Switch
                              checked={oracleForm.is_paid}
                              onCheckedChange={(checked) => setOracleForm({...oracleForm, is_paid: checked})}
                            />
                            <Label className="text-gray-300">Consulta Paga</Label>
                          </div>

                          {oracleForm.is_paid && (
                            <>
                              <div>
                                <Label className="text-gray-300">Preço por Consulta (R$)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={oracleForm.price}
                                  onChange={(e) => setOracleForm({...oracleForm, price: parseFloat(e.target.value) || 0})}
                                  className="bg-gray-800 border-gray-600 text-white"
                                />
                              </div>

                              <div>
                                <Label className="text-gray-300 mb-3 block">Roles com Acesso Gratuito</Label>
                                <div className="grid grid-cols-4 gap-2">
                                  {roles.map(role => (
                                    <div key={role} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={oracleForm.free_roles.includes(role)}
                                        onChange={() => toggleRoleInArray(role, oracleForm.free_roles, (roles) => 
                                          setOracleForm({...oracleForm, free_roles: roles})
                                        )}
                                        className="rounded"
                                      />
                                      <Label className="text-xs text-gray-400">{role}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-gray-300 mb-3 block">Descontos por Role (%)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {roles.map(role => (
                                    <div key={role} className="flex items-center space-x-2">
                                      <Label className="text-xs text-gray-400 w-20">{role}:</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={oracleForm.role_discounts[role] || 0}
                                        onChange={(e) => updateRoleDiscount(role, parseInt(e.target.value) || 0)}
                                        className="bg-gray-800 border-gray-600 text-white text-xs h-8"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          <div>
                            <Label className="text-gray-300 mb-3 block">Roles Restritos (deixe vazio para permitir todos)</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {roles.map(role => (
                                <div key={role} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={oracleForm.restricted_roles.includes(role)}
                                    onChange={() => toggleRoleInArray(role, oracleForm.restricted_roles, (roles) => 
                                      setOracleForm({...oracleForm, restricted_roles: roles})
                                    )}
                                    className="rounded"
                                  />
                                  <Label className="text-xs text-gray-400">{role}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="ai" className="space-y-4">
                          <div>
                            <Label className="text-gray-300">Personalidade da IA</Label>
                            <Input
                              value={oracleForm.ai_personality}
                              onChange={(e) => setOracleForm({...oracleForm, ai_personality: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              placeholder="Ex: Bruxa mestre na magia da divinação"
                            />
                          </div>

                          <div>
                            <Label className="text-gray-300">Instruções para IA</Label>
                            <Textarea
                              value={oracleForm.ai_instructions}
                              onChange={(e) => setOracleForm({...oracleForm, ai_instructions: e.target.value})}
                              className="bg-gray-800 border-gray-600 text-white"
                              rows={6}
                              placeholder="Instruções detalhadas sobre como a IA deve se comportar..."
                            />
                          </div>

                          <Separator className="bg-gray-700" />

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={oracleForm.auto_presentation}
                              onCheckedChange={(checked) => setOracleForm({...oracleForm, auto_presentation: checked})}
                            />
                            <Label className="text-gray-300">Apresentação Automática</Label>
                          </div>

                          {!oracleForm.auto_presentation && (
                            <div>
                              <Label className="text-gray-300">Mensagem de Apresentação Personalizada</Label>
                              <Textarea
                                value={oracleForm.custom_presentation}
                                onChange={(e) => setOracleForm({...oracleForm, custom_presentation: e.target.value})}
                                className="bg-gray-800 border-gray-600 text-white"
                                rows={4}
                                placeholder="Mensagem fixa de apresentação..."
                              />
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="advanced" className="space-y-4">
                          <div className="text-center py-8">
                            <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">Configurações avançadas serão implementadas em versões futuras</p>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={handleSaveOracle}
                          disabled={createOracleMutation.isPending || updateOracleMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {(createOracleMutation.isPending || updateOracleMutation.isPending) ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {editingOracle ? 'Salvar Alterações' : 'Criar Oráculo'}
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="config" className="space-y-6">
                <Card className="bg-gray-900/60 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center space-x-2">
                      <Key className="w-5 h-5" />
                      <span>Configurações da IA</span>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure as credenciais e parâmetros da inteligência artificial
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Chave API OpenAI</Label>
                      <Input
                        type="password"
                        value={configForm.openai_api_key}
                        onChange={(e) => setConfigForm({...configForm, openai_api_key: e.target.value})}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="sk-..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300">Modelo da IA</Label>
                        <Input
                          value={configForm.default_model}
                          onChange={(e) => setConfigForm({...configForm, default_model: e.target.value})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Max Tokens</Label>
                        <Input
                          type="number"
                          value={configForm.max_tokens}
                          onChange={(e) => setConfigForm({...configForm, max_tokens: parseInt(e.target.value) || 500})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-300">Temperature</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={configForm.temperature}
                          onChange={(e) => setConfigForm({...configForm, temperature: parseFloat(e.target.value) || 0.8})}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => updateConfigMutation.mutate(configForm)}
                      disabled={updateConfigMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {updateConfigMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar Configurações
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}