import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import ContentProtection from "@/components/content-protection";

export default function Cursus() {
  return (
    <PageTransition>
      <ContentProtection>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-cinzel text-golden-amber mb-8">
            Cursus - Templo do Abismo
          </h1>
          <p className="text-ritualistic-beige/70">
            Página de cursos será implementada aqui
          </p>
        </div>
      </ContentProtection>
    </PageTransition>
  );
}