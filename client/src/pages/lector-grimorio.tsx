import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Grimoire {
  id: number;
  title: string;
  description: string;
  content: string;
  section_id: number;
  section_name: string;
  section_color: string;
  price: number;
}

interface UserProgress {
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  status: string;
}

export default function LectorGrimorio() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Buscar dados do grimório
  const { data: grimoire, isLoading: grimoireLoading, error: grimoireError } = useQuery({
    queryKey: ['/api/grimoires', id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/grimoires/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Grimório não encontrado');
      }
      
      return response.json() as Promise<Grimoire>;
    },
    enabled: !!id,
    retry: 1
  });

  // Buscar progresso do usuário
  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/user/grimoire-progress', id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/grimoire-progress/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) return null;
      return response.json() as Promise<UserProgress>;
    },
    enabled: !!id && !!grimoire
  });

  // Salvar progresso
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { page: number; totalPages: number; progress: number }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/user/grimoire-progress/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao salvar progresso');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/grimoire-progress', id] });
    },
    onError: (error) => {
      console.error('Erro ao salvar progresso:', error);
    }
  });



  // Dividir conteúdo em páginas baseado em divs
  useEffect(() => {
    if (grimoire?.content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = grimoire.content;
      
      // Procurar divs que podem servir como páginas
      const divs = tempDiv.querySelectorAll('div');
      const pageContent: string[] = [];
      
      if (divs.length > 0) {
        // Se há divs, cada uma é uma página
        divs.forEach(div => {
          if (div.innerHTML.trim()) {
            pageContent.push(div.outerHTML);
          }
        });
      } else {
        // Se não há divs, dividir por parágrafos (cada 3-4 parágrafos = 1 página)
        const paragraphs = tempDiv.querySelectorAll('p');
        const paragraphsPerPage = 4;
        
        for (let i = 0; i < paragraphs.length; i += paragraphsPerPage) {
          const pageDiv = document.createElement('div');
          pageDiv.className = 'grimorio-pagina';
          
          for (let j = i; j < Math.min(i + paragraphsPerPage, paragraphs.length); j++) {
            pageDiv.appendChild(paragraphs[j].cloneNode(true));
          }
          
          pageContent.push(pageDiv.outerHTML);
        }
      }
      
      // Se ainda não há conteúdo, usar o HTML completo como uma página
      if (pageContent.length === 0) {
        pageContent.push(grimoire.content);
      }
      
      setPages(pageContent);
      setTotalPages(pageContent.length);
    }
  }, [grimoire?.content]);

  // Restaurar progresso do usuário
  useEffect(() => {
    if (userProgress && userProgress.current_page > 0) {
      setCurrentPage(userProgress.current_page);
    }
  }, [userProgress]);

  // Salvar progresso quando mudar de página
  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      const progress = Math.round((currentPage / totalPages) * 100);
      saveProgressMutation.mutate({
        page: currentPage,
        totalPages: totalPages,
        progress: progress
      });
    }
  }, [currentPage, totalPages]);

  // Rolar para o topo quando mudar de página
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Navegação por páginas
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Navegação por teclado (apenas desktop)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return; // Não usar navegação por teclado no mobile
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setLocation('/libri-tenebris');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Navegação por swipe (mobile) - apenas se tiver mais de uma página
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!isMobile || totalPages <= 1) return; // Não usar swipe se mobile com página única
    
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = startX - endX;
      const deltaY = startY - endY;

      // Detectar swipe horizontal (não vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        e.preventDefault();
        if (deltaX > 0) {
          goToNextPage(); // Swipe left = próxima página
        } else {
          goToPreviousPage(); // Swipe right = página anterior
        }
      }

      startX = 0;
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, totalPages]);

  // Navegação por clique nas bordas (desktop)
  const handleContentClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX;
    const leftBoundary = rect.left + rect.width * 0.3; // 30% da esquerda
    const rightBoundary = rect.left + rect.width * 0.7; // 70% da direita
    
    if (clickX < leftBoundary) {
      goToPreviousPage();
    } else if (clickX > rightBoundary) {
      goToNextPage();
    }
  };



  if (grimoireLoading || progressLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-amber-400">
          <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando grimório...</p>
        </div>
      </div>
    );
  }

  if (grimoireError || (!grimoireLoading && !grimoire)) {
    console.error('Erro ao carregar grimório:', grimoireError);
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-red-400 text-center">
          <h1 className="text-2xl mb-4">Grimório não encontrado</h1>
          <p className="text-gray-400 mb-4">ID: {id}</p>
          {grimoireError && (
            <p className="text-gray-500 mb-4 text-sm">{grimoireError.message}</p>
          )}
          <Button onClick={() => setLocation('/libri-tenebris')} variant="outline">
            Voltar à Biblioteca
          </Button>
        </div>
      </div>
    );
  }

  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const sectionColor = grimoire.section_color || '#D6342C';

  return (
    <div className="fixed inset-0 bg-black text-amber-100 z-50 overflow-hidden">
      {/* Botão de fechar (X) no canto superior direito */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          onClick={() => setLocation('/libri-tenebris')}
          variant="ghost"
          size="sm"
          className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 rounded-full p-2"
          title="Fechar leitor (ESC)"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>



      {/* Conteúdo principal em tela cheia */}
      <div className="flex-1 h-full flex relative">
        {/* Áreas clicáveis apenas no desktop e se houver múltiplas páginas */}
        {totalPages > 1 && (
          <>
            {/* Área clicável esquerda (desktop) */}
            <div 
              className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer hidden md:block hover:bg-amber-900/5 transition-colors"
              onClick={goToPreviousPage}
              title="Página anterior (←)"
            />
            
            {/* Área clicável direita (desktop) */}
            <div 
              className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer hidden md:block hover:bg-amber-900/5 transition-colors"
              onClick={goToNextPage}
              title="Próxima página (→)"
            />
          </>
        )}

        {/* Conteúdo da página centralizado */}
        <div 
          ref={contentRef}
          className="flex-1 p-4 md:p-8 max-w-4xl mx-auto overflow-y-auto"
        >
          <div 
            className="prose prose-amber prose-invert max-w-none text-base md:text-lg leading-relaxed"
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              textAlign: 'justify'
            }}
            dangerouslySetInnerHTML={{ 
              __html: pages[currentPage - 1] || '' 
            }}
          />
        </div>
      </div>


    </div>
  );
}