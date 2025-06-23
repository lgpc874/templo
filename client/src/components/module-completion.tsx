import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Target, FileText, Zap, Calendar, Upload } from 'lucide-react';

interface CompletionRequirement {
  id: string;
  type: 'button' | 'confirmation' | 'quiz' | 'ritual' | 'challenge';
  title: string;
  description: string;
  required: boolean;
  config?: any;
}

interface ModuleCompletionProps {
  moduleId: number;
  requirements: CompletionRequirement[];
  onComplete: () => void;
}

export default function ModuleCompletion({ moduleId, requirements, onComplete }: ModuleCompletionProps) {
  const [completedRequirements, setCompletedRequirements] = useState<Set<string>>(new Set());
  const [requirementData, setRequirementData] = useState<{[key: string]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getRequiredCount = () => requirements.filter(req => req.required).length;
  const getCompletedRequiredCount = () => {
    return requirements.filter(req => req.required && completedRequirements.has(req.id)).length;
  };

  const canComplete = () => {
    const requiredCompleted = getCompletedRequiredCount();
    const totalRequired = getRequiredCount();
    return requiredCompleted === totalRequired;
  };

  const handleRequirementComplete = (requirementId: string, completed: boolean) => {
    const newCompleted = new Set(completedRequirements);
    if (completed) {
      newCompleted.add(requirementId);
    } else {
      newCompleted.delete(requirementId);
    }
    setCompletedRequirements(newCompleted);
  };

  const updateRequirementData = (requirementId: string, data: any) => {
    setRequirementData(prev => ({
      ...prev,
      [requirementId]: { ...prev[requirementId], ...data }
    }));
  };

  const handleSubmitCompletion = async () => {
    if (!canComplete()) {
      toast({
        title: "Requisitos incompletos",
        description: "Complete todos os requisitos obrigatórios para finalizar o módulo",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/modules/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: moduleId,
          completed_requirements: Array.from(completedRequirements),
          requirement_data: requirementData
        })
      });

      if (response.ok) {
        toast({
          title: "Módulo concluído!",
          description: "Você completou todos os requisitos com sucesso"
        });
        onComplete();
      } else {
        throw new Error('Erro ao enviar conclusão');
      }
    } catch (error) {
      toast({
        title: "Erro ao finalizar módulo",
        description: "Não foi possível registrar a conclusão",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRequirement = (requirement: CompletionRequirement) => {
    const isCompleted = completedRequirements.has(requirement.id);
    const data = requirementData[requirement.id] || {};

    switch (requirement.type) {
      case 'button':
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-300">{requirement.config?.confirmText || 'Clique para continuar'}</p>
            </div>
            <Button
              onClick={() => handleRequirementComplete(requirement.id, !isCompleted)}
              variant={isCompleted ? "default" : "outline"}
              className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Zap className="w-4 h-4 mr-2" />
              {requirement.config?.buttonText || 'Continuar'}
            </Button>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">{requirement.config?.description || requirement.description}</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={(checked) => handleRequirementComplete(requirement.id, checked as boolean)}
              />
              <Label className="text-white">
                {requirement.config?.checkboxText || 'Eu confirmo'}
              </Label>
            </div>
          </div>
        );

      case 'ritual':
        return (
          <div className="space-y-4">
            {requirement.config?.instructions && (
              <div className="p-3 bg-amber-950/30 border border-amber-800 rounded">
                <h5 className="text-amber-200 font-medium mb-2">Instruções:</h5>
                <p className="text-amber-100 text-sm whitespace-pre-wrap">{requirement.config.instructions}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Label className="text-gray-300">Data de Realização</Label>
              <Input
                type="date"
                value={data.date || ''}
                onChange={(e) => updateRequirementData(requirement.id, { date: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
              />
              
              <Label className="text-gray-300">Relato da Experiência</Label>
              <Textarea
                value={data.report || ''}
                onChange={(e) => updateRequirementData(requirement.id, { report: e.target.value })}
                placeholder="Descreva como foi a realização do ritual..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={4}
              />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={(checked) => handleRequirementComplete(requirement.id, checked as boolean)}
                />
                <Label className="text-white">
                  {requirement.config?.confirmationText || 'Eu realizei o ritual conforme instruído'}
                </Label>
              </div>
            </div>
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-4">
            {requirement.config?.challengeText && (
              <div className="p-3 bg-blue-950/30 border border-blue-800 rounded">
                <h5 className="text-blue-200 font-medium mb-2">Desafio:</h5>
                <p className="text-blue-100 text-sm whitespace-pre-wrap">{requirement.config.challengeText}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Label className="text-gray-300">Evidência/Comprovação</Label>
              <Textarea
                value={data.evidence || ''}
                onChange={(e) => updateRequirementData(requirement.id, { evidence: e.target.value })}
                placeholder="Descreva como completou o desafio ou forneça evidências..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={4}
              />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={(checked) => handleRequirementComplete(requirement.id, checked as boolean)}
                />
                <Label className="text-white">
                  {requirement.config?.completionText || 'Eu completei o desafio'}
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={(checked) => handleRequirementComplete(requirement.id, checked as boolean)}
            />
            <Label className="text-white">Marcar como concluído</Label>
          </div>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'button': return <Zap className="w-4 h-4" />;
      case 'confirmation': return <CheckCircle className="w-4 h-4" />;
      case 'quiz': return <FileText className="w-4 h-4" />;
      case 'ritual': return <Target className="w-4 h-4" />;
      case 'challenge': return <Target className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (requirements.length === 0) {
    return (
      <Card className="bg-green-950/30 border-green-800">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
          <p className="text-green-200">Este módulo não possui requisitos especiais de conclusão.</p>
          <Button onClick={onComplete} className="mt-4 bg-green-700 hover:bg-green-600">
            Finalizar Módulo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-100 flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Requisitos de Conclusão
            </span>
            <Badge variant={canComplete() ? "default" : "secondary"}>
              {getCompletedRequiredCount()}/{getRequiredCount()} obrigatórios
            </Badge>
          </CardTitle>
          <CardDescription className="text-purple-300">
            Complete os requisitos abaixo para finalizar este módulo
          </CardDescription>
        </CardHeader>
      </Card>

      {requirements.map((requirement) => {
        const isCompleted = completedRequirements.has(requirement.id);
        
        return (
          <Card 
            key={requirement.id} 
            className={`transition-all duration-300 ${
              isCompleted 
                ? 'bg-green-950/30 border-green-800' 
                : 'bg-zinc-900 border-zinc-700'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(requirement.type)}
                  <span className="text-white font-medium">{requirement.title}</span>
                  {requirement.required && (
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="default" className="text-xs bg-green-600">Concluído</Badge>
                  )}
                </div>
              </div>
              {requirement.description && (
                <p className="text-gray-300 text-sm">{requirement.description}</p>
              )}
            </CardHeader>
            
            <CardContent>
              {renderRequirement(requirement)}
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-zinc-900 border-zinc-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium mb-1">Finalizar Módulo</h3>
              <p className="text-gray-400 text-sm">
                {canComplete() 
                  ? 'Todos os requisitos obrigatórios foram atendidos'
                  : `Complete mais ${getRequiredCount() - getCompletedRequiredCount()} requisito(s) obrigatório(s)`
                }
              </p>
            </div>
            <Button
              onClick={handleSubmitCompletion}
              disabled={!canComplete() || isSubmitting}
              className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar Módulo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}