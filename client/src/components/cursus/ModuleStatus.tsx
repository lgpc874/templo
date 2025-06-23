import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ModuleStatusProps {
  courseSlug: string;
  activeModule: number;
}

export default function ModuleStatus({ courseSlug, activeModule }: ModuleStatusProps) {
  return (
    <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-golden-amber/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-golden-amber hover:text-golden-amber/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-cinzel text-golden-amber">
                Curso {courseSlug}
              </h1>
              <div className="text-xs text-ritualistic-beige/60">
                Módulo {activeModule}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-24">
                <Progress value={50} className="h-2" />
              </div>
              <span className="text-xs text-ritualistic-beige/70">
                50%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}