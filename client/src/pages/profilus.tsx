import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Camera, 
  BookOpen, 
  GraduationCap, 
  Flame, 
  Settings,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ExternalLink
} from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  magical_name?: string;
  role: string;
  profile_image_url?: string;
}

interface Course {
  id: number;
  titulo: string;
  status: 'comprado' | 'em_andamento' | 'concluido';
  progresso?: number;
}

interface Grimoire {
  id: number;
  title: string;
  status: 'comprado' | 'lendo' | 'lido';
  progresso?: number;
}

interface Ritual {
  id: number;
  nome: string;
  tipo: 'inicial' | 'regular';
  status: 'iniciado' | 'concluido';
  data_inicio: string;
  data_conclusao?: string;
}

const getRoleTitle = (role: string): { title: string; description: string } => {
  const roleTitles = {
    'buscador': { title: 'Buscador', description: 'Aquele que procura as primeiras chamas do conhecimento' },
    'iniciado': { title: 'Iniciado', description: 'Aquele que atravessou o primeiro véu da ignorância' },
    'portador_veu': { title: 'Portador do Véu', description: 'Guardião dos mistérios menores' },
    'discipulo_chamas': { title: 'Discípulo das Chamas', description: 'Aquele que caminha entre as chamas do saber' },
    'guardiao_nome': { title: 'Guardião do Nome Perdido', description: 'Protetor dos segredos ancestrais' },
    'arauto_queda': { title: 'Arauto da Queda', description: 'Mensageiro das verdades proibidas' },
    'portador_coroa': { title: 'Portador da Coroa Flamejante', description: 'Mestre das artes supremas' },
    'magus_supremo': { title: 'Magus Supremo', description: 'Senhor absoluto dos mistérios do Abismo' }
  };
  
  return roleTitles[role as keyof typeof roleTitles] ||  { title: 'Buscador', description: 'Aquele que procura as primeiras chamas' };
};

const getRoleIcon = (role: string) => {
  const roleIcons = {
    'buscador': '🔍',
    'iniciado': '🕯️',
    'portador_veu': '👁️',
    'discipulo_chamas': '🔥',
    'guardiao_nome': '🗝️',
    'arauto_queda': '⚡',
    'portador_coroa': '👑',
    'magus_supremo': '🔱'
  };
  
  return roleIcons[role as keyof typeof roleIcons] || '🔍';
};

const getRoleColorFromHex = (hexColor: string) => {
  if (!hexColor) return 'text-gray-400 border-gray-400';
  
  // Converter cor hex para classes Tailwind aproximadas
  const colorMap: { [key: string]: string } = {
    '#dc2626': 'text-red-600 border-red-600', // Vermelho
    '#991B1B': 'text-red-800 border-red-800', // Vermelho escuro Magus Supremo
    '#ea580c': 'text-orange-600 border-orange-600', // Laranja  
    '#d97706': 'text-amber-600 border-amber-600', // Âmbar
    '#ca8a04': 'text-yellow-600 border-yellow-600', // Amarelo
    '#16a34a': 'text-green-600 border-green-600', // Verde
    '#0284c7': 'text-blue-600 border-blue-600', // Azul
    '#7c3aed': 'text-violet-600 border-violet-600', // Violeta
    '#c026d3': 'text-fuchsia-600 border-fuchsia-600', // Fúcsia
    '#6b7280': 'text-gray-500 border-gray-500', // Cinza
  };
  
  return colorMap[hexColor.toLowerCase()] || `text-[${hexColor}] border-[${hexColor}]`;
};

export default function Profilus() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cursos");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados dos formulários
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    currentPassword: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Buscar perfil do usuário - usar rota que já funciona
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token não encontrado");
      }
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.user; // A rota /api/auth/me retorna { user: {...} }
    },
    enabled: !!user,
    retry: false
  });

  // Buscar cursos
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/user/courses'],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      
      const response = await fetch('/api/user/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      return response.json();
    },
    enabled: !!user
  });

  // Buscar grimórios
  const { data: grimoires = [] } = useQuery<Grimoire[]>({
    queryKey: ['/api/user/grimoires'],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      
      const response = await fetch('/api/user/grimoires', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      return response.json();
    },
    enabled: !!user
  });

  // Buscar rituais
  const { data: rituals = [] } = useQuery<Ritual[]>({
    queryKey: ['/api/user/rituals'],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Token não encontrado");
      
      const response = await fetch('/api/user/rituals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      return response.json();
    },
    enabled: !!user
  });

  // Mutação para upload de foto
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/auth/upload-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload da foto');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar foto",
        variant: "destructive",
      });
    }
  });

  // Mutação para alterar email
  const changeEmailMutation = useMutation({
    mutationFn: async (data: { newEmail: string; currentPassword: string }) => {
      return apiRequest('/api/auth/change-email', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Email alterado",
        description: "Seu email foi alterado com sucesso.",
      });
      setEmailForm({ newEmail: '', currentPassword: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar email",
        variant: "destructive",
      });
    }
  });

  // Mutação para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha",
        variant: "destructive",
      });
    }
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Arquivo muito grande",
          description: "A foto deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo inválido",
          description: "Por favor, selecione uma imagem.",
          variant: "destructive",
        });
        return;
      }
      
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    changeEmailMutation.mutate(emailForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  };

  if (profileLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </PageTransition>
    );
  }

  if (profileError) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <Card className="bg-gray-900/95 border-amber-600/30">
            <CardContent className="p-6">
              <p className="text-amber-100">Erro ao carregar perfil: {profileError.message}</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (!profile && !profileLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="content-section">
            <CardContent className="p-6">
              <p className="text-amber-100">Perfil não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const roleInfo = {
    ...getRoleTitle(profile?.role || 'buscador'),
    icon: getRoleIcon(profile?.role || 'buscador'),
    color: getRoleColorFromHex(profile?.role_color || '#6b7280')
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header do Perfil */}
          <Card className="content-section mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Foto de Perfil */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-amber-500/50">
                    <AvatarImage 
                      src={profile?.profile_image_url} 
                      alt={profile?.spiritual_name || profile?.username || 'Usuario'} 
                    />
                    <AvatarFallback className="bg-black/40 text-amber-400 text-2xl">
                      {(profile?.spiritual_name || profile?.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 border-amber-600/30 bg-black/30 hover:bg-black/50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    <Camera className="h-4 w-4 text-amber-400" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Informações do Perfil */}
                <div className="text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <h1 className="text-4xl font-bold text-amber-400">
                      {profile?.spiritual_name || profile?.username || 'Carregando...'}
                    </h1>
                  </div>
                  <p className="text-amber-300 mb-3 text-lg">{profile?.email || 'Carregando...'}</p>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2">
                    <Badge variant="outline" className={`${roleInfo.color} text-base px-3 py-1 font-semibold`}>
                      <span className="mr-2">{roleInfo.icon}</span>
                      {roleInfo.title}
                    </Badge>
                    <Badge variant="outline" className="border-amber-500 text-amber-400 text-sm px-2 py-0.5">
                      {roleInfo.description}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs de Conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-0">
              <TabsTrigger value="cursos" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
                <GraduationCap className="w-4 h-4 mr-2" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="grimorios" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
                <BookOpen className="w-4 h-4 mr-2" />
                Grimórios
              </TabsTrigger>
              <TabsTrigger value="rituais" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
                <Flame className="w-4 h-4 mr-2" />
                Rituais
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Aba Cursos */}
            <TabsContent value="cursos" className="mt-6">
              <Card className="content-section">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-red-700">Seus Cursos</CardTitle>
                  <Button
                    onClick={() => setLocation('/meus-cursos')}
                    variant="outline"
                    size="sm"
                    className="text-amber-400 border-amber-400 hover:bg-amber-400 hover:text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Todos os Cursos
                  </Button>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-amber-400 mb-4">
                        Nenhum curso adquirido ainda.
                      </p>
                      <Button
                        onClick={() => setLocation('/cursus')}
                        className="bg-amber-600 hover:bg-amber-700 text-black font-semibold"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Explorar Cursos
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-4 content-section rounded-lg"
                        >
                          <div>
                            <h3 className="text-amber-400 font-medium">{course.titulo}</h3>
                            {course.progresso !== undefined && (
                              <div className="mt-2">
                                <div className="w-48 bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-amber-500 h-2 rounded-full transition-all"
                                    style={{ width: `${course.progresso}%` }}
                                  />
                                </div>
                                <p className="text-xs text-amber-400 mt-1">{course.progresso}% concluído</p>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={course.status === 'concluido' ? 'default' : 'outline'}
                            className={
                              course.status === 'concluido'
                                ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                : course.status === 'em_andamento'
                                ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                                : 'border-slate-500/50 text-slate-400'
                            }
                          >
                            {course.status === 'concluido' ? 'Concluído' : 
                             course.status === 'em_andamento' ? 'Em Andamento' : 'Comprado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Grimórios */}
            <TabsContent value="grimorios" className="mt-6">
              <Card className="content-section">
                <CardHeader>
                  <CardTitle className="text-red-700">Seus Grimórios</CardTitle>
                </CardHeader>
                <CardContent>
                  {grimoires.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Nenhum grimório adquirido ainda.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {grimoires.map((grimoire) => (
                        <div
                          key={grimoire.id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        >
                          <div>
                            <h3 className="text-amber-100 font-medium">{grimoire.title}</h3>
                            {grimoire.progresso !== undefined && (
                              <div className="mt-2">
                                <div className="w-48 bg-slate-700 rounded-full h-2">
                                  <div
                                    className="bg-amber-500 h-2 rounded-full transition-all"
                                    style={{ width: `${grimoire.progresso}%` }}
                                  />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{grimoire.progresso}% lido</p>
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={grimoire.status === 'lido' ? 'default' : 'outline'}
                            className={
                              grimoire.status === 'lido'
                                ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                : grimoire.status === 'lendo'
                                ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                                : 'border-slate-500/50 text-slate-400'
                            }
                          >
                            {grimoire.status === 'lido' ? 'Lido' : 
                             grimoire.status === 'lendo' ? 'Lendo' : 'Comprado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Rituais */}
            <TabsContent value="rituais" className="mt-6">
              <Card className="content-section">
                <CardHeader>
                  <CardTitle className="text-red-700">Seus Rituais</CardTitle>
                </CardHeader>
                <CardContent>
                  {rituals.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Nenhum ritual iniciado ainda.
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {rituals.map((ritual) => (
                        <div
                          key={ritual.id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        >
                          <div>
                            <h3 className="text-amber-100 font-medium">{ritual.nome}</h3>
                            <p className="text-sm text-slate-400">
                              Iniciado em: {new Date(ritual.data_inicio).toLocaleDateString('pt-BR')}
                            </p>
                            {ritual.data_conclusao && (
                              <p className="text-sm text-slate-400">
                                Concluído em: {new Date(ritual.data_conclusao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {ritual.tipo === 'inicial' && (
                              <Badge variant="outline" className="border-red-700 text-red-700">
                                Inicial
                              </Badge>
                            )}
                            <Badge
                              variant={ritual.status === 'concluido' ? 'default' : 'outline'}
                              className={
                                ritual.status === 'concluido'
                                  ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                  : 'bg-amber-600/20 text-amber-400 border-amber-500/50'
                              }
                            >
                              {ritual.status === 'concluido' ? 'Concluído' : 'Em Andamento'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Configurações */}
            <TabsContent value="configuracoes" className="mt-6">
              <div className="grid gap-6">
                {/* Alterar Email */}
                <Card className="content-section">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Alterar Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="newEmail" className="text-amber-100">Novo Email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                          className="bg-black/80 border-red-700 text-amber-100"
                          placeholder="Seu novo email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="currentPasswordEmail" className="text-amber-100">Senha Atual</Label>
                        <div className="relative">
                          <Input
                            id="currentPasswordEmail"
                            type={showCurrentPassword ? "text" : "password"}
                            value={emailForm.currentPassword}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-black/80 border-red-700 text-amber-100 pr-10"
                            placeholder="Sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={changeEmailMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {changeEmailMutation.isPending ? "Alterando..." : "Alterar Email"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Alterar Senha */}
                <Card className="content-section">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Alterar Senha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPasswordChange" className="text-amber-100">Senha Atual</Label>
                        <div className="relative">
                          <Input
                            id="currentPasswordChange"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="bg-black/80 border-red-700 text-amber-100 pr-10"
                            placeholder="Sua senha atual"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-amber-100">Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="bg-black/80 border-red-700 text-amber-100 pr-10"
                            placeholder="Sua nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-amber-100">Confirmar Nova Senha</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="bg-black/80 border-red-700 text-amber-100 pr-10"
                            placeholder="Confirme sua nova senha"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-400" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}