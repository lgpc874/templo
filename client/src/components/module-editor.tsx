import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/rich-text-editor';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Eye, Settings, CheckCircle, Target, FileText, Zap } from 'lucide-react';

interface ModuleEditorProps {
  module: any;
  onSave: (module: any) => void;
  onCancel: () => void;
  isNew?: boolean;
}

interface CompletionRequirement {
  id: string;
  type: 'button' | 'confirmation' | 'quiz' | 'ritual' | 'challenge';
  title: string;
  description: string;
  required: boolean;
  config?: any;
}

export default function ModuleEditor({ module, onSave, onCancel, isNew = false }: ModuleEditorProps) {
  const [editingModule, setEditingModule] = useState(module);
  const [completionRequirements, setCompletionRequirements] = useState<CompletionRequirement[]>(
    module.completion_requirements ? JSON.parse(module.completion_requirements) : []
  );

  const addCompletionRequirement = (type: string) => {
    const newReq: CompletionRequirement = {
      id: Date.now().toString(),
      type: type as any,
      title: '',
      description: '',
      required: true,
      config: getDefaultConfig(type)
    };
    setCompletionRequirements([...completionRequirements, newReq]);
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'button':
        return { buttonText: 'Continuar', confirmText: 'Clique para prosseguir' };
      case 'confirmation':
        return { checkboxText: 'Eu aceito e confirmo', description: 'Confirme para continuar' };
      case 'quiz':
        return { questions: [], passingScore: 80 };
      case 'ritual':
        return { 
          instructions: '', 
          confirmationText: 'Eu realizei o ritual conforme instruído',
          evidenceRequired: false 
        };
      case 'challenge':
        return { 
          challengeText: '', 
          completionText: 'Eu completei o desafio',
          evidenceRequired: true 
        };
      default:
        return {};
    }
  };

  const updateRequirement = (id: string, updates: Partial<CompletionRequirement>) => {
    setCompletionRequirements(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const removeRequirement = (id: string) => {
    setCompletionRequirements(prev => prev.filter(req => req.id !== id));
  };

  const handleSave = () => {
    const moduleToSave = {
      ...editingModule,
      completion_requirements: JSON.stringify(completionRequirements)
    };
    onSave(moduleToSave);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'button': return <Zap className="w-4 h-4" />;
      case 'confirmation': return <CheckCircle className="w-4 h-4" />;
      case 'quiz': return <FileText className="w-4 h-4" />;
      case 'ritual': return <Target className="w-4 h-4" />;
      case 'challenge': return <Target className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            {isNew ? 'Criar Novo Módulo' : 'Editar Módulo'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure o conteúdo, submissões e requisitos de conclusão
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="submission">Submissão</TabsTrigger>
              <TabsTrigger value="completion">Conclusão</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Aba de Conteúdo */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Título do Módulo</Label>
                  <Input
                    value={editingModule.title}
                    onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Ordem</Label>
                  <Input
                    type="number"
                    value={editingModule.order_number}
                    onChange={(e) => setEditingModule({ ...editingModule, order_number: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Conteúdo HTML</Label>
                <RichTextEditor
                  value={editingModule.html_content}
                  onChange={(value) => setEditingModule({ ...editingModule, html_content: value })}
                  placeholder="Conteúdo principal do módulo..."
                  height="400px"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">CSS Customizado</Label>
                <Textarea
                  value={editingModule.custom_css || ''}
                  onChange={(e) => setEditingModule({ ...editingModule, custom_css: e.target.value })}
                  placeholder="CSS personalizado para este módulo..."
                  className="bg-gray-800 border-gray-600 text-white min-h-[100px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            {/* Aba de Submissão */}
            <TabsContent value="submission" className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="requires_submission"
                  checked={editingModule.requires_submission}
                  onCheckedChange={(checked) => 
                    setEditingModule({ ...editingModule, requires_submission: checked as boolean })
                  }
                />
                <Label htmlFor="requires_submission" className="text-gray-300">
                  Este módulo requer submissão/aceitação
                </Label>
              </div>

              {editingModule.requires_submission && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Posição da Submissão</Label>
                    <Select 
                      value={editingModule.submission_position || 'before'}
                      onValueChange={(value) => setEditingModule({ ...editingModule, submission_position: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">Antes do conteúdo (bloqueia acesso)</SelectItem>
                        <SelectItem value="after">Após o conteúdo</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-400 mt-1">
                      {editingModule.submission_position === 'before' 
                        ? 'O usuário deve aceitar antes de ver o conteúdo'
                        : 'A submissão aparece no final do módulo'
                      }
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-300 mb-2 block">Texto da Submissão</Label>
                    <RichTextEditor
                      value={editingModule.submission_text || ''}
                      onChange={(value) => setEditingModule({ ...editingModule, submission_text: value })}
                      placeholder="Texto do ritual de submissão e aceitação..."
                      height="300px"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Aba de Conclusão */}
            <TabsContent value="completion" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">Requisitos de Conclusão</h3>
                  <p className="text-gray-400">Configure o que o usuário deve fazer para completar o módulo</p>
                </div>
                
                <Select onValueChange={addCompletionRequirement}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Adicionar requisito..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Botão de Continuação</SelectItem>
                    <SelectItem value="confirmation">Confirmação com Checkbox</SelectItem>
                    <SelectItem value="quiz">Quiz/Prova</SelectItem>
                    <SelectItem value="ritual">Ritual Prático</SelectItem>
                    <SelectItem value="challenge">Desafio/Tarefa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {completionRequirements.map((req) => (
                  <Card key={req.id} className="bg-gray-800/50 border-gray-600">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(req.type)}
                          <Badge variant="outline" className="text-xs">
                            {req.type.toUpperCase()}
                          </Badge>
                          <span className="text-white font-medium">{req.title || `${req.type} sem título`}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeRequirement(req.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-300 text-xs">Título</Label>
                          <Input
                            value={req.title}
                            onChange={(e) => updateRequirement(req.id, { title: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Título do requisito..."
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-5">
                          <Checkbox 
                            checked={req.required}
                            onCheckedChange={(checked) => updateRequirement(req.id, { required: checked as boolean })}
                          />
                          <Label className="text-gray-300 text-xs">Obrigatório</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-gray-300 text-xs">Descrição</Label>
                        <Textarea
                          value={req.description}
                          onChange={(e) => updateRequirement(req.id, { description: e.target.value })}
                          className="bg-gray-700 border-gray-600 text-white"
                          placeholder="Descrição detalhada..."
                          rows={2}
                        />
                      </div>

                      {/* Configurações específicas por tipo */}
                      {req.type === 'ritual' && (
                        <div>
                          <Label className="text-gray-300 text-xs">Instruções do Ritual</Label>
                          <Textarea
                            value={req.config?.instructions || ''}
                            onChange={(e) => updateRequirement(req.id, { 
                              config: { ...req.config, instructions: e.target.value }
                            })}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Instruções detalhadas do ritual..."
                            rows={3}
                          />
                        </div>
                      )}

                      {req.type === 'challenge' && (
                        <div>
                          <Label className="text-gray-300 text-xs">Descrição do Desafio</Label>
                          <Textarea
                            value={req.config?.challengeText || ''}
                            onChange={(e) => updateRequirement(req.id, { 
                              config: { ...req.config, challengeText: e.target.value }
                            })}
                            className="bg-gray-700 border-gray-600 text-white"
                            placeholder="Descrição do desafio..."
                            rows={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {completionRequirements.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum requisito de conclusão configurado</p>
                    <p className="text-sm">Use o menu acima para adicionar requisitos</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba de Preview */}
            <TabsContent value="preview" className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Preview do Módulo</h3>
                
                {editingModule.requires_submission && editingModule.submission_position === 'before' && (
                  <div className="mb-6 p-4 bg-red-950/30 border border-red-800 rounded-lg">
                    <h4 className="text-red-200 font-medium mb-2">Submissão Inicial (Bloqueia Acesso)</h4>
                    <div 
                      className="prose prose-invert prose-sm"
                      dangerouslySetInnerHTML={{ __html: editingModule.submission_text || 'Texto da submissão...' }}
                    />
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-white font-medium mb-2">Conteúdo Principal</h4>
                  <div 
                    className="prose prose-invert"
                    dangerouslySetInnerHTML={{ __html: editingModule.html_content || 'Conteúdo do módulo...' }}
                  />
                </div>

                {completionRequirements.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-white font-medium mb-4">Área de Conclusão</h4>
                    <div className="space-y-3">
                      {completionRequirements.map((req) => (
                        <div key={req.id} className="p-3 bg-gray-800 rounded border border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTypeIcon(req.type)}
                            <span className="text-white font-medium">{req.title}</span>
                            {req.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
                          </div>
                          <p className="text-gray-300 text-sm">{req.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6 bg-gray-700" />

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              {isNew ? 'Criar Módulo' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}