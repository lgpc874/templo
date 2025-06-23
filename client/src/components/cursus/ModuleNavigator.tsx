import { BookOpen, CheckCircle, Lock, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModuleNavigatorProps {
  courseSlug: string;
  activeModule: number;
  onModuleSelect: (moduleNumber: number) => void;
}

export default function ModuleNavigator({ 
  courseSlug, 
  activeModule, 
  onModuleSelect 
}: ModuleNavigatorProps) {
  return (
    <div className="w-80 bg-black/40 border-r border-golden-amber/20 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-cinzel text-golden-amber mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Módulos
        </h2>
        
        <div className="space-y-2">
          <p className="text-ritualistic-beige/70 text-sm">
            Navegador de módulos será implementado aqui
          </p>
        </div>
      </div>
    </div>
  );
}