import { Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleChallengeProps {
  moduleId: number;
  challenge?: {
    title: string;
    description: string;
    type: 'reflection' | 'practice' | 'ritual';
  };
  isCompleted?: boolean;
  onComplete?: () => void;
}

export default function ModuleChallenge({ 
  moduleId, 
  challenge, 
  isCompleted = false,
  onComplete 
}: ModuleChallengeProps) {
  if (!challenge) return null;

  return (
    <Card className="bg-card-dark border-golden-amber/30 mt-6">
      <CardHeader>
        <CardTitle className="text-golden-amber font-cinzel flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Desafio do Módulo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg text-ritualistic-beige mb-2">{challenge.title}</h3>
        <p className="text-ritualistic-beige/70 mb-4">{challenge.description}</p>
        
        {!isCompleted && onComplete && (
          <Button
            onClick={onComplete}
            className="bg-golden-amber text-black hover:bg-golden-amber/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Completar Desafio
          </Button>
        )}
        
        {isCompleted && (
          <div className="text-green-400 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Desafio Completado
          </div>
        )}
      </CardContent>
    </Card>
  );
}