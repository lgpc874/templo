import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";

interface CursusDetalheProps {
  courseSlug: string;
}

export default function CursusDetalhe({ courseSlug }: CursusDetalheProps) {
  return (
    <PageTransition>
      <ContentProtection>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-cinzel text-golden-amber mb-8">
            Detalhes do Curso: {courseSlug}
          </h1>
          <p className="text-ritualistic-beige/70">
            Página de detalhes do curso será implementada aqui
          </p>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}