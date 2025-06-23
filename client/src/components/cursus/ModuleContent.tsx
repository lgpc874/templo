import { BookOpen } from "lucide-react";

interface ModuleContentProps {
  courseSlug: string;
  moduleNumber: number;
}

export default function ModuleContent({ courseSlug, moduleNumber }: ModuleContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-golden-amber/50" />
            <h3 className="text-2xl font-cinzel text-golden-amber mb-4">
              Módulo {moduleNumber}
            </h3>
            <p className="text-ritualistic-beige/70 mb-6">
              Conteúdo do módulo será implementado aqui
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}