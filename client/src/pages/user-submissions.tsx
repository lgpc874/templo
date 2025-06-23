import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Star, CheckCircle } from 'lucide-react';

interface Module {
  id: number;
  title: string;
  html_content: string;
  requires_submission: boolean;
  ritual_mandatory: boolean;
  submission_text?: string;
  ritual_text?: string;
  custom_css?: string;
}

interface Submission {
  id?: number;
  module_id: number;
  submission_text: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  submitted_at?: string;
  reviewer_notes?: string;
}

interface Ritual {
  id?: number;
  module_id: number;
  challenge_description: string;
  challenge_date: string;
  challenge_notes?: string;
  status: 'completed' | 'verified' | 'rejected';
  completed_at?: string;
  verifier_notes?: string;
}

export default function UserSubmissions() {
  const { courseId } = useParams();
  const [modules, setModules] = useState<Module[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estados para formulários
  const [submissionText, setSubmissionText] = useState<{[key: number]: string}>({});
  const [ritualData, setRitualData] = useState<{[key: number]: {description: string, date: string, notes: string}}>({});

  useEffect(() => {
    loadModulesAndProgress();
  }, [courseId]);

  const loadModulesAndProgress = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Carregar módulos do curso
      const modulesResponse = await fetch(`/api/courses/${courseId}/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setModules(modulesData);
        
        // Carregar submissões e rituais do usuário
        const [submissionsRes, ritualsRes] = await Promise.all([
          fetch(`/api/user/submissions/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/user/rituals/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData);
        }
        
        if (ritualsRes.ok) {
          const ritualsData = await ritualsRes.json();
          setRituals(ritualsData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os módulos e progresso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitSubmission = async (moduleId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: moduleId,
          submission_text: submissionText[moduleId] || ''
        })
      });

      if (response.ok) {
        toast({
          title: "Submissão enviada",
          description: "Sua submissão foi enviada para avaliação"
        });
        loadModulesAndProgress();
        setSubmissionText(prev => ({ ...prev, [moduleId]: '' }));
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar submissão",
        description: "Não foi possível enviar sua submissão",
        variant: "destructive"
      });
    }
  };

  const submitRitual = async (moduleId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const ritualInfo = ritualData[moduleId];
      
      if (!ritualInfo?.description || !ritualInfo?.date) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha a descrição e data do ritual",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/user/ritual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: moduleId,
          ritual_description: ritualInfo.description,
          ritual_date: ritualInfo.date,
          ritual_notes: ritualInfo.notes || ''
        })
      });

      if (response.ok) {
        toast({
          title: "Ritual registrado",
          description: "Seu ritual foi registrado com sucesso"
        });
        loadModulesAndProgress();
        setRitualData(prev => ({ 
          ...prev, 
          [moduleId]: { description: '', date: '', notes: '' }
        }));
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar ritual",
        description: "Não foi possível registrar seu ritual",
        variant: "destructive"
      });
    }
  };

  const getSubmissionStatus = (moduleId: number) => {
    return submissions.find(s => s.module_id === moduleId);
  };

  const getRitualStatus = (moduleId: number) => {
    return rituals.find(r => r.module_id === moduleId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      needs_revision: { label: 'Revisar', variant: 'secondary' as const },
      completed: { label: 'Completo', variant: 'default' as const },
      verified: { label: 'Verificado', variant: 'default' as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-red-100 font-['Cinzel_Decorative']">
          Submissões e Rituais
        </h1>
        <p className="text-red-300 mt-2">
          Complete as submissões e rituais obrigatórios para progredir no curso
        </p>
      </div>

      {modules.map((module) => {
        const submission = getSubmissionStatus(module.id);
        const ritual = getRitualStatus(module.id);
        const needsSubmission = module.requires_submission && !submission;
        const needsRitual = module.ritual_mandatory && !ritual;

        return (
          <Card key={module.id} className="bg-zinc-900 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-100 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {module.title}
              </CardTitle>
              <CardDescription className="text-red-300">
                {module.requires_submission && (
                  <span className="inline-flex items-center gap-1 mr-4">
                    <FileText className="w-4 h-4" />
                    Submissão Obrigatória
                  </span>
                )}
                {module.ritual_mandatory && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Ritual Obrigatório
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Conteúdo do módulo */}
              <div className="module-content">
                {module.custom_css && (
                  <style dangerouslySetInnerHTML={{ __html: module.custom_css }} />
                )}
                <div 
                  className="prose prose-invert max-w-none text-red-100"
                  dangerouslySetInnerHTML={{ __html: module.html_content }}
                />
              </div>

              <Separator className="bg-red-800" />

              {/* Submissão */}
              {module.requires_submission && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-red-100">Ritual de Submissão e Aceitação</h3>
                    {submission && getStatusBadge(submission.status)}
                  </div>
                  
                  {/* Texto da submissão criado pelo admin */}
                  {module.submission_text && (
                    <div className="bg-red-950/30 p-4 rounded-lg border border-red-800">
                      <h4 className="text-red-200 font-medium mb-2">Declaração de Submissão:</h4>
                      <div 
                        className="prose prose-invert prose-sm text-red-100"
                        dangerouslySetInnerHTML={{ __html: module.submission_text }}
                      />
                    </div>
                  )}
                  
                  {submission ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <p className="text-red-200 mb-2">Enviado em: {new Date(submission.submitted_at!).toLocaleDateString()}</p>
                      <p className="text-red-100">{submission.submission_text}</p>
                      {submission.reviewer_notes && (
                        <div className="mt-4 p-3 bg-zinc-700 rounded">
                          <p className="text-sm font-medium text-red-200">Comentários do revisor:</p>
                          <p className="text-red-100">{submission.reviewer_notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        value={submissionText[module.id] || ''}
                        onChange={(e) => setSubmissionText(prev => ({ ...prev, [module.id]: e.target.value }))}
                        placeholder="Declare sua aceitação e submissão ao caminho do templo..."
                        className="bg-zinc-800 border-red-700 text-red-100"
                        rows={6}
                      />
                      <p className="text-sm text-red-400">
                        Esta é sua declaração formal de aceitação e submissão aos ensinamentos do templo.
                      </p>
                      <Button 
                        onClick={() => submitSubmission(module.id)}
                        disabled={!submissionText[module.id]?.trim()}
                        className="bg-red-700 hover:bg-red-600"
                      >
                        Realizar Submissão ao Templo
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Ritual */}
              {module.ritual_mandatory && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-red-100">Ritual Obrigatório</h3>
                    {ritual && getStatusBadge(ritual.status)}
                  </div>
                  
                  {/* Instruções do ritual criadas pelo admin */}
                  {module.ritual_text && (
                    <div className="bg-amber-950/30 p-4 rounded-lg border border-amber-800">
                      <h4 className="text-amber-200 font-medium mb-2">Instruções do Ritual:</h4>
                      <div 
                        className="prose prose-invert prose-sm text-amber-100"
                        dangerouslySetInnerHTML={{ __html: module.ritual_text }}
                      />
                    </div>
                  )}
                  
                  {ritual ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <p className="text-red-200 mb-2">Realizado em: {new Date(ritual.challenge_date).toLocaleDateString()}</p>
                      <p className="text-red-100 mb-2"><strong>Descrição:</strong> {ritual.challenge_description}</p>
                      {ritual.challenge_notes && (
                        <p className="text-red-100 mb-2"><strong>Observações:</strong> {ritual.challenge_notes}</p>
                      )}
                      {ritual.verifier_notes && (
                        <div className="mt-4 p-3 bg-zinc-700 rounded">
                          <p className="text-sm font-medium text-red-200">Comentários do verificador:</p>
                          <p className="text-red-100">{ritual.verifier_notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-red-200">Descrição do Ritual *</Label>
                        <Textarea
                          value={ritualData[module.id]?.description || ''}
                          onChange={(e) => setRitualData(prev => ({ 
                            ...prev, 
                            [module.id]: { ...(prev[module.id] || {}), description: e.target.value }
                          }))}
                          placeholder="Descreva como foi realizado o ritual..."
                          className="bg-zinc-800 border-red-700 text-red-100"
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-red-200">Data do Ritual *</Label>
                        <Input
                          type="date"
                          value={ritualData[module.id]?.date || ''}
                          onChange={(e) => setRitualData(prev => ({ 
                            ...prev, 
                            [module.id]: { ...(prev[module.id] || {}), date: e.target.value }
                          }))}
                          className="bg-zinc-800 border-red-700 text-red-100"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-red-200">Observações Adicionais</Label>
                        <Textarea
                          value={ritualData[module.id]?.notes || ''}
                          onChange={(e) => setRitualData(prev => ({ 
                            ...prev, 
                            [module.id]: { ...(prev[module.id] || {}), notes: e.target.value }
                          }))}
                          placeholder="Observações sobre o ritual (opcional)..."
                          className="bg-zinc-800 border-red-700 text-red-100"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => submitRitual(module.id)}
                        disabled={!ritualData[module.id]?.description || !ritualData[module.id]?.date}
                        className="bg-red-700 hover:bg-red-600"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Registrar Ritual
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}