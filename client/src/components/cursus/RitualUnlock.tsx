import { Flame, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RitualUnlockProps {
  moduleId: number;
  ritual?: {
    title: string;
    description: string;
    requirements: string[];
  };
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

export default function RitualUnlock({ 
  moduleId, 
  ritual, 
  isUnlocked = false,
  onUnlock 
}: RitualUnlockProps) {
  if (!ritual) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-500/30 mt-6">
      <CardHeader>
        <CardTitle className="text-purple-300 font-cinzel flex items-center">
          {isUnlocked ? (
            <Flame className="w-5 h-5 mr-2" />
          ) : (
            <Lock className="w-5 h-5 mr-2" />
          )}
          Ritual de Desbloqueio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg text-ritualistic-beige mb-2">{ritual.title}</h3>
        <p className="text-ritualistic-beige/70 mb-4">{ritual.description}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-purple-300 mb-2">Requisitos:</h4>
          <ul className="text-sm text-ritualistic-beige/70 space-y-1">
            {ritual.requirements.map((req, index) => (
              <li key={index} className="flex items-center">
                <Sparkles className="w-3 h-3 mr-2 text-purple-400" />
                {req}
              </li>
            ))}
          </ul>
        </div>
        
        {!isUnlocked && onUnlock && (
          <Button
            onClick={onUnlock}
            className="bg-purple-600 text-white hover:bg-purple-600/90"
          >
            <Flame className="w-4 h-4 mr-2" />
            Iniciar Ritual
          </Button>
        )}
        
        {isUnlocked && (
          <div className="text-purple-300 flex items-center">
            <Flame className="w-4 h-4 mr-2" />
            Ritual Completado - Módulo Desbloqueado
          </div>
        )}
      </CardContent>
    </Card>
  );
}