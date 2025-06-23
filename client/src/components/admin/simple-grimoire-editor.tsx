import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import type { LibrarySection, Grimoire } from '@shared/schema';

interface SimpleGrimoireEditorProps {
  grimoire?: Grimoire;
  onClose: () => void;
}

export default function SimpleGrimoireEditor({ grimoire, onClose }: SimpleGrimoireEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(grimoire?.title || '');
  const [content, setContent] = useState(grimoire?.content || '');
  const [excerpt, setExcerpt] = useState(grimoire?.excerpt || '');
  const [sectionId, setSectionId] = useState(grimoire?.section_id || 1);

  // Buscar seções
  const { data: sections = [] } = useQuery<LibrarySection[]>({
    queryKey: ['/api/library-sections'],
  });

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = grimoire ? `/api/admin/grimoires/${grimoire.id}` : '/api/admin/grimoires';
      const method = grimoire ? 'PUT' : 'POST';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          section_id: sectionId,
          is_published: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar grimório');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: grimoire ? "Grimório atualizado!" : "Grimório criado!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/grimoires'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar grimório",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header com botão voltar */}
        <div className="mb-6 flex items-center gap-4">
          <Button 
            onClick={onClose} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 
            className="text-2xl font-bold font-cinzel text-amber-400"
          >
            {grimoire ? 'Editar Grimório' : 'Criar Grimório'}
          </h1>
        </div>

        {/* Formulário */}
        <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg p-6 space-y-6">
          
          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-2 text-amber-200">
              Título do Grimório
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título..."
              className="w-full bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
            />
          </div>

          {/* Seção */}
          <div>
            <label className="block text-sm font-medium mb-2 text-amber-200">
              Seção da Biblioteca
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-md border bg-black/50 border-amber-500/30 text-amber-100"
            >
              {sections.map(section => (
                <option key={section.id} value={section.id} className="bg-black text-amber-100">
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium mb-2 text-amber-200">
              Descrição/Sinopse
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descrição do grimório..."
              className="w-full h-20 resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-sm font-medium mb-2 text-amber-200">
              Conteúdo HTML
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo HTML do grimório..."
              className="w-full h-96 font-mono text-sm resize-none bg-black/50 border-amber-500/30 text-amber-100 placeholder:text-amber-300/50"
            />
            <p className="text-xs text-amber-300/70 mt-1">
              Use HTML para formatação. Exemplo: &lt;h2&gt;Capítulo&lt;/h2&gt; &lt;p&gt;texto&lt;/p&gt;
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-black"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}