import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";
import ModuleNavigator from "@/components/cursus/ModuleNavigator";
import ModuleContent from "@/components/cursus/ModuleContent";
import ModuleStatus from "@/components/cursus/ModuleStatus";

interface CursusLeitorProps {
  courseSlug: string;
}

export default function CursusLeitor({ courseSlug }: CursusLeitorProps) {
  const [activeModule, setActiveModule] = useState(1);

  return (
    <PageTransition>
      <ContentProtection>
        <div className="min-h-screen bg-transparent">
          <ModuleStatus courseSlug={courseSlug} activeModule={activeModule} />
          
          <div className="flex min-h-[calc(100vh-80px)]">
            <ModuleNavigator 
              courseSlug={courseSlug}
              activeModule={activeModule}
              onModuleSelect={setActiveModule}
            />
            
            <ModuleContent 
              courseSlug={courseSlug}
              moduleNumber={activeModule}
            />
          </div>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}