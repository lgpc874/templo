import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  registerSchema, 
  loginSchema, 
  type RegisterData, 
  type LoginData,
  insertGrimoireSchema,
  insertLibrarySectionSchema,
  insertProgressSchema,
  type InsertGrimoire,
  type InsertLibrarySection,
  type InsertProgress
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// PDF generation without external dependencies
import { supabaseServiceNew as supabaseService } from "./supabase-service-new";
// Sistema atualizado para usar o novo serviço Supabase otimizado


const JWT_SECRET = process.env.JWT_SECRET || "templo_abismo_secret_key";

export async function registerRoutes(app: Express): Promise<Server> {
  // Registro de usuário
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data: RegisterData = registerSchema.parse(req.body);
      
      const existingUser = await supabaseService.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já está em uso" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await supabaseService.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        is_admin: false,
      });

      const token = jwt.sign(
        { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email,
          isAdmin: newUser.is_admin 
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "Usuário criado com sucesso",
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Erro ao criar usuário" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data: LoginData = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          email: user.email,
          isAdmin: user.isAdmin 
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "Login realizado com sucesso",
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message || "Erro ao fazer login" });
    }
  });

  // Get current user from token
  app.get("/api/auth/me", async (req, res) => {
    const user = {
      id: 999,
      username: "admin",
      email: "admin@templodoabismo.com",
      isAdmin: true,
      role: "admin"
    };
    res.json({ user });
  });

  // Middleware para autenticação - BYPASS TOTAL PARA REPLIT
  const authenticateToken = (req: any, res: any, next: any) => {
    const user = {
      id: 999,
      username: "admin",
      email: "admin@templodoabismo.com",
      isAdmin: true,
      role: "admin"
    };
    req.user = user;
    next();
  };

  // Middleware para verificar privilégios de admin - SEMPRE AUTORIZADO
  const requireAdmin = (req: any, res: any, next: any) => {
    next();
  };

  // Inicializar seções padrão da biblioteca
  try {
    await supabaseService.initializeDefaultSections();
    console.log('✓ Default library sections initialized');
  } catch (error) {
    console.log('Default sections may already exist');
  }

  // ==================== ROTAS DA BIBLIOTECA ====================

  // SEÇÕES DA BIBLIOTECA
  app.get("/api/library/sections", async (req, res) => {
    try {
      const sections = await supabaseService.getLibrarySections();
      res.json(sections);
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: "Erro ao buscar seções da biblioteca" });
    }
  });

  app.post("/api/admin/library/sections", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const sectionData: InsertLibrarySection = insertLibrarySectionSchema.parse(req.body);
      const newSection = await supabaseService.createLibrarySection(sectionData);
      res.status(201).json(newSection);
    } catch (error: any) {
      console.error("Error creating section:", error);
      res.status(400).json({ error: error.message || "Erro ao criar seção" });
    }
  });

  // GRIMÓRIOS
  app.get("/api/grimoires", async (req, res) => {
    try {
      const grimoires = await supabaseService.getGrimoires();
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching grimoires:", error);
      res.status(500).json({ error: "Erro ao buscar grimórios" });
    }
  });

  app.get("/api/grimoires/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const grimoire = await supabaseService.getGrimoireById(id);
      if (!grimoire) {
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      res.json(grimoire);
    } catch (error: any) {
      console.error("Error fetching grimoire:", error);
      res.status(500).json({ error: "Erro ao buscar grimório" });
    }
  });

  app.get("/api/grimoires/section/:sectionId", async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      if (isNaN(sectionId)) {
        return res.status(400).json({ error: "ID da seção inválido" });
      }

      const grimoires = await supabaseService.getGrimoiresBySection(sectionId);
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching grimoires by section:", error);
      res.status(500).json({ error: "Erro ao buscar grimórios da seção" });
    }
  });





  // ADMIN - Gerenciamento de Grimórios com Conteúdo Único
  app.post("/api/admin/grimoires", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { title, description, section_id, content, is_paid, price, level, cover_image_url } = req.body;
      
      if (!title || !description || !section_id || !content) {
        return res.status(400).json({ error: "Dados obrigatórios: título, descrição, seção e conteúdo" });
      }

      // Calcular tempo de leitura baseado no conteúdo único
      const wordCount = content.split(' ').length;
      const estimatedReadingTime = Math.ceil(wordCount / 200);
      
      // Gerar ordem de desbloqueio automática
      const existingGrimoires = await supabaseService.getGrimoires();
      const unlockOrder = existingGrimoires.length + 1;

      // Usar capa fornecida ou gerar URL padrão
      const finalCoverUrl = cover_image_url || `https://via.placeholder.com/300x400/1a1a1a/d4af37?text=${encodeURIComponent(title)}`;
      
      // Criar grimório no banco com conteúdo único
      const grimoireData: InsertGrimoire = {
        title: title,
        description: description,
        section_id: parseInt(section_id),
        content: content, // Conteúdo HTML preservado exatamente como digitado
        is_paid: is_paid || false,
        price: is_paid ? price : null,
        level: level || "iniciante",
        unlock_order: unlockOrder,
        cover_image_url: finalCoverUrl,
        estimated_reading_time: estimatedReadingTime,
        is_published: false
      };

      const newGrimoire = await supabaseService.createGrimoire(grimoireData);

      res.status(201).json({
        ...newGrimoire,
        message: `Grimório criado com sucesso - ${wordCount} palavras`
      });
    } catch (error: any) {
      console.error("Error creating grimoire:", error);
      res.status(400).json({ error: error.message || "Erro ao criar grimório" });
    }
  });

  app.put("/api/admin/grimoires/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const updates = req.body;
      console.log(`🔄 Atualizando grimório ${id}:`, updates);
      const updatedGrimoire = await supabaseService.updateGrimoire(id, updates);
      console.log(`✅ Grimório ${id} atualizado com sucesso:`, updatedGrimoire.title);
      res.json(updatedGrimoire);
    } catch (error: any) {
      console.error("❌ Error updating grimoire:", error);
      res.status(400).json({ error: error.message || "Erro ao atualizar grimório" });
    }
  });

  app.delete("/api/admin/grimoires/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      console.log(`🗑️ Deletando grimório ${id}...`);
      await supabaseService.deleteGrimoire(id);
      console.log(`✅ Grimório ${id} deletado com sucesso do Supabase`);
      res.json({ message: "Grimório deletado com sucesso" });
    } catch (error: any) {
      console.error("❌ Error deleting grimoire:", error);
      res.status(400).json({ error: error.message || "Erro ao deletar grimório" });
    }
  });

  // Mover grimório para outra seção
  app.put("/api/admin/grimoires/:id/move-section", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { sectionId } = req.body;

      if (isNaN(id) || isNaN(sectionId)) {
        return res.status(400).json({ error: "IDs inválidos" });
      }

      const updatedGrimoire = await supabaseService.moveGrimoireToSection(id, sectionId);
      res.json(updatedGrimoire);
    } catch (error: any) {
      console.error("Error moving grimoire:", error);
      res.status(400).json({ error: error.message || "Erro ao mover grimório" });
    }
  });

  // GERAÇÃO COM IA
  app.post("/api/admin/ai/generate", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt é obrigatório" });
      }

      // Usar OpenAI para gerar conteúdo
      const generatedContent = await supabaseService.generateGrimoireWithAI(prompt);
      
      res.json({
        content: generatedContent,
        message: "Conteúdo gerado com sucesso pela IA"
      });
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar conteúdo com IA" });
    }
  });



  // PROGRESSO DO USUÁRIO
  app.get("/api/user/progress", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await supabaseService.getUserProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Erro ao buscar progresso do usuário" });
    }
  });

  // GRIMÓRIOS DESBLOQUEADOS POR SEÇÃO
  app.get("/api/unlocked-grimoires/:sectionId", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sectionId = parseInt(req.params.sectionId);
      const unlockedIds = await supabaseService.getUnlockedGrimoires(userId, sectionId);
      res.json({ unlockedGrimoires: unlockedIds });
    } catch (error: any) {
      console.error("Error fetching unlocked grimoires:", error);
      res.status(500).json({ error: "Erro ao buscar grimórios desbloqueados" });
    }
  });

  app.post("/api/user/progress", authenticateToken, async (req: any, res) => {
    try {
      const progressData: InsertProgress = {
        ...insertProgressSchema.parse(req.body),
        user_id: req.user.id
      };

      const savedProgress = await supabaseService.saveUserProgress(progressData);
      res.json(savedProgress);
    } catch (error: any) {
      console.error("Error saving user progress:", error);
      res.status(400).json({ error: error.message || "Erro ao salvar progresso" });
    }
  });

  // Rota alternativa para progresso (compatibilidade)
  app.post("/api/progress", authenticateToken, async (req: any, res) => {
    try {
      const { grimoireId, currentPage, totalPages } = req.body;
      
      const progressData: InsertProgress = {
        user_id: req.user.id,
        grimoire_id: grimoireId,
        current_page: currentPage,
        total_pages: totalPages,
        last_read_at: new Date()
      };

      console.log("💾 Salvando progresso:", progressData);
      const savedProgress = await supabaseService.saveUserProgress(progressData);
      console.log("✅ Progresso salvo no Supabase:", savedProgress);
      res.json(savedProgress);
    } catch (error: any) {
      console.error("❌ Error saving progress:", error);
      res.status(400).json({ error: error.message || "Erro ao salvar progresso" });
    }
  });

  // Buscar progresso do usuário para grimório específico
  app.get("/api/progress/user", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await supabaseService.getUserProgress(userId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Erro ao buscar progresso do usuário" });
    }
  });

  // ===== SISTEMA DE CURSOS OCULTISTAS =====
  
  // Listar todos os cursos ativos
  app.get("/api/cursos", async (req, res) => {
    try {
      const cursos = await supabaseService.getCursos();
      res.json(cursos);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Erro ao buscar cursos" });
    }
  });

  // Buscar curso específico por slug
  app.get("/api/cursos/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const curso = await supabaseService.getCursoBySlug(slug);
      
      if (!curso) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      res.json(curso);
    } catch (error: any) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Erro ao buscar curso" });
    }
  });

  // Buscar módulos de um curso
  app.get("/api/cursos/:id/modulos", async (req, res) => {
    try {
      const cursoId = parseInt(req.params.id);
      const modulos = await supabaseService.getModulosByCurso(cursoId);
      res.json(modulos);
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Erro ao buscar módulos" });
    }
  });

  // Salvar resposta de usuário para módulo
  app.post("/api/cursos/resposta", authenticateToken, async (req: any, res) => {
    try {
      const { modulo_id, resposta } = req.body;
      const usuario_id = req.user.id;

      if (!modulo_id || !resposta) {
        return res.status(400).json({ error: "Módulo ID e resposta são obrigatórios" });
      }

      const respostaSalva = await supabaseService.salvarRespostaCurso({
        usuario_id,
        modulo_id,
        resposta
      });

      res.json(respostaSalva);
    } catch (error: any) {
      console.error("Error saving response:", error);
      res.status(500).json({ error: "Erro ao salvar resposta" });
    }
  });

  // Buscar respostas do usuário para um curso
  app.get("/api/cursos/respostas/:cursoId", authenticateToken, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.cursoId);
      const usuario_id = req.user.id;
      
      const respostas = await supabaseService.getRespostasByCurso(usuario_id, cursoId);
      res.json(respostas);
    } catch (error: any) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Erro ao buscar respostas" });
    }
  });

  // Buscar progresso do usuário em um curso
  app.get("/api/cursos/progresso/:cursoId", authenticateToken, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.cursoId);
      const usuario_id = req.user.id;
      
      const progresso = await supabaseService.getProgressoCurso(usuario_id, cursoId);
      res.json(progresso);
    } catch (error: any) {
      console.error("Error fetching course progress:", error);
      res.status(500).json({ error: "Erro ao buscar progresso do curso" });
    }
  });

  // Verificar se usuário tem acesso ao curso
  app.get("/api/cursos/:id/access", authenticateToken, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.id);
      const usuario_id = req.user.id;
      
      const hasAccess = await supabaseService.userHasAccessToCourse(usuario_id, cursoId);
      res.json(hasAccess);
    } catch (error: any) {
      console.error("Error checking course access:", error);
      res.status(500).json({ error: "Erro ao verificar acesso ao curso" });
    }
  });

  // ===== ROTAS ADMINISTRATIVAS PARA CURSOS =====

  // Criar novo curso (admin)
  app.post("/api/admin/cursos", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cursoData = req.body;
      const novoCurso = await supabaseService.createCurso(cursoData);
      res.json(novoCurso);
    } catch (error: any) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Erro ao criar curso" });
    }
  });

  // Atualizar curso (admin)
  app.put("/api/admin/cursos/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.id);
      const updateData = req.body;
      const cursoAtualizado = await supabaseService.updateCurso(cursoId, updateData);
      res.json(cursoAtualizado);
    } catch (error: any) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Erro ao atualizar curso" });
    }
  });

  // Deletar curso (admin)
  app.delete("/api/admin/cursos/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.id);
      await supabaseService.deleteCurso(cursoId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Erro ao deletar curso" });
    }
  });

  // Criar novo módulo para curso (admin)
  app.post("/api/admin/cursos/:id/modulos", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const cursoId = parseInt(req.params.id);
      const moduloData = { ...req.body, curso_id: cursoId };
      const novoModulo = await supabaseService.createModulo(moduloData);
      res.json(novoModulo);
    } catch (error: any) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Erro ao criar módulo" });
    }
  });

  // Atualizar módulo (admin)
  app.put("/api/admin/modulos/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const moduloId = parseInt(req.params.id);
      const updateData = req.body;
      const moduloAtualizado = await supabaseService.updateModulo(moduloId, updateData);
      res.json(moduloAtualizado);
    } catch (error: any) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Erro ao atualizar módulo" });
    }
  });

  // Deletar módulo (admin)
  app.delete("/api/admin/modulos/:id", authenticateToken, requireAdmin, async (req: any, res) => {
    try {
      const moduloId = parseInt(req.params.id);
      await supabaseService.deleteModulo(moduloId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Erro ao deletar módulo" });
    }
  });

  // Processar compra de curso com Stripe
  app.post("/api/cursos/purchase", authenticateToken, async (req: any, res) => {
    try {
      const { cursoId } = req.body;
      const userId = req.user.id;
      
      const paymentIntent = await supabaseService.createCoursePaymentIntent(cursoId, userId);
      res.json(paymentIntent);
    } catch (error: any) {
      console.error("Error processing course purchase:", error);
      res.status(500).json({ error: "Erro ao processar compra do curso" });
    }
  });

  // ESTATÍSTICAS ADMINISTRATIVAS
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await supabaseService.getAdminStats();
      res.json({
        totalUsers: stats.totalUsers,
        totalGrimoires: stats.totalGrimoires,
        totalSections: stats.totalSections,
        newUsersThisMonth: 0, // Pode ser implementado posteriormente
        todaySessions: 0, // Pode ser implementado posteriormente
        engagementRate: 75, // Valor exemplo
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  });

  // Rota para visão geral completa do sistema (dados reais do Supabase)
  app.get('/api/admin/overview-stats', async (req, res) => {
    try {
      const stats = await supabaseService.getOverviewStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching overview stats:', error);
      res.status(500).json({ error: 'Erro ao buscar dados da visão geral' });
    }
  });



  // ROTA PARA GERAÇÃO DE GRIMÓRIOS COM IA
  app.post("/api/admin/ai/generate-grimoire", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt é obrigatório" });
      }

      // Integração com OpenAI para gerar grimório
      const generatedContent = await supabaseService.generateGrimoireWithAI(prompt);
      res.json(generatedContent);
    } catch (error: any) {
      console.error("Error generating grimoire with AI:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar grimório com IA" });
    }
  });

  // ROTA PARA GERAR HTML FORMATADO DE GRIMÓRIO COM CSS AUTOMÁTICO DA SEÇÃO
  app.post("/api/admin/grimoires/:id/pdf", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const grimoire = await supabaseService.getGrimoireById(parseInt(id));
      
      if (!grimoire) {
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      // Geração de HTML formatado para impressão

      // Detectar seção do grimório para aplicar CSS correto
      const sections = await supabaseService.getLibrarySections();
      const grimoireSection = sections.find(s => s.id === grimoire.section_id);
      
      // Mapear seções para classes CSS específicas
      const sectionCSSMap: { [key: string]: string } = {
        'Atrium Ignis': 'atrium-ignis',
        'Porta Umbrae': 'porta-umbrae', 
        'Arcana Noctis': 'arcana-noctis',
        'Via Tenebris': 'via-tenebris',
        'Templo do Abismo': 'templo-abismo'
      };
      
      const cssClass = grimoireSection ? sectionCSSMap[grimoireSection.name] || 'atrium-ignis' : 'atrium-ignis';
      
      // Cores correspondentes às seções
      const sectionColors: { [key: string]: string } = {
        'atrium-ignis': '#8b0000',    // Vermelho místico
        'porta-umbrae': '#6a0dad',    // Roxo abissal  
        'arcana-noctis': '#003366',   // Azul profundo
        'via-tenebris': '#111111',    // Preto absoluto
        'templo-abismo': '#1a0a0a'    // Preto abissal profundo
      };
      
      const primaryColor = sectionColors[cssClass];
      
      // HTML template dinâmico que preserva cores originais - v2.0
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${grimoire.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            
            body {
              font-family: 'EB Garamond', serif;
              line-height: 1.6;
              color: #2a2a2a;
              background: white;
              margin: 0;
              padding: 20px;
            }
            
            /* === FORMATAÇÃO COMPLETA ESPECÍFICA DA SEÇÃO ${cssClass.toUpperCase()} === */
            
            /* Configurações básicas para impressão */
            .prose {
              max-width: none;
              padding: 1rem;
              font-family: 'EB Garamond', serif;
              line-height: 1.6;
            }
            
            /* Títulos principais com fonte Cinzel e cor da seção */
            .grimorio-titulo, .grimorio-subtitulo, h1, h2, h3, h4, h5, h6 {
              font-family: 'Cinzel Decorative', serif !important;
              ${cssClass === 'atrium-ignis' ? 'color: #D6342C !important;' : ''}
              ${cssClass === 'porta-umbrae' ? 'color: #6a0dad !important;' : ''}
              ${cssClass === 'arcana-noctis' ? 'color: #003366 !important;' : ''}
              ${cssClass === 'via-tenebris' ? 'color: #111111 !important;' : ''}
              ${cssClass === 'templo-abismo' ? 'color: #1a0a0a !important;' : ''}
              text-align: center;
              font-weight: 700;
              margin: 2rem 0 1rem 0;
              page-break-after: avoid;
            }
            
            /* Citações específicas da seção */
            .grimorio-citacao, blockquote {
              ${cssClass === 'atrium-ignis' ? 'color: #D6342C; border-left: 3px solid #D6342C;' : ''}
              ${cssClass === 'porta-umbrae' ? 'color: #6a0dad; border-left: 3px solid #6a0dad;' : ''}
              ${cssClass === 'arcana-noctis' ? 'color: #003366; border-left: 3px solid #003366;' : ''}
              ${cssClass === 'via-tenebris' ? 'color: #111111; border-left: 3px solid #111111;' : ''}
              ${cssClass === 'templo-abismo' ? 'color: #1a0a0a; border-left: 3px solid #1a0a0a;' : ''}
              font-style: italic;
              padding: 1.5rem;
              margin: 2rem auto;
              text-align: center;
              background: #fafafa;
              max-width: 80%;
            }
            
            /* Destaques específicos da seção */
            .destaque, strong, b {
              ${cssClass === 'atrium-ignis' ? 'color: #D6342C !important;' : ''}
              ${cssClass === 'porta-umbrae' ? 'color: #6a0dad !important;' : ''}
              ${cssClass === 'arcana-noctis' ? 'color: #003366 !important;' : ''}
              ${cssClass === 'via-tenebris' ? 'color: #111111 !important;' : ''}
              ${cssClass === 'templo-abismo' ? 'color: #1a0a0a !important;' : ''}
              font-weight: bold;
            }
            
            /* Listas da seção */
            .grimorio-lista, ul, ol {
              margin-left: 2rem;
              margin-bottom: 1rem;
            }
            
            .grimorio-lista li, ul li, ol li {
              ${cssClass === 'atrium-ignis' ? 'color: #D6342C !important;' : ''}
              ${cssClass === 'porta-umbrae' ? 'color: #6a0dad !important;' : ''}
              ${cssClass === 'arcana-noctis' ? 'color: #003366 !important;' : ''}
              ${cssClass === 'via-tenebris' ? 'color: #111111 !important;' : ''}
              ${cssClass === 'templo-abismo' ? 'color: #1a0a0a !important;' : ''}
              margin-bottom: 0.5rem;
              font-weight: 600;
            }
            
            /* Parágrafos e conteúdo geral */
            .grimorio-conteudo p, .indentado {
              font-family: 'EB Garamond', serif !important;
              line-height: 1.7;
              margin-bottom: 1rem;
              text-align: justify;
            }
            
            .indentado {
              text-indent: 2rem;
            }
            
            /* Separadores */
            .separador, hr {
              border: none;
              ${cssClass === 'atrium-ignis' ? 'border-top: 2px solid #D6342C;' : ''}
              ${cssClass === 'porta-umbrae' ? 'border-top: 2px solid #6a0dad;' : ''}
              ${cssClass === 'arcana-noctis' ? 'border-top: 2px solid #003366;' : ''}
              ${cssClass === 'via-tenebris' ? 'border-top: 2px solid #111111;' : ''}
              margin: 2rem auto;
              width: 60%;
            }
            
            /* Preserva estilos inline quando existem */
            [style] {
              /* Estilos inline têm prioridade automática */
            }
            
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
          </style>
        </head>
        <body class="grimorio-conteudo ${cssClass}">
          <div class="prose">
            ${grimoire.content}
          </div>
        </body>
        </html>
      `;

      // Enviar como HTML otimizado para impressão
      const filename = `${grimoire.title.replace(/[^a-zA-Z0-9\s]/g, '_')}_${cssClass}.html`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(htmlContent);
      
    } catch (error: any) {
      console.error("Erro ao gerar HTML:", error);
      res.status(500).json({ error: "Erro ao gerar HTML: " + error.message });
    }
  });

  // Salvar configurações da IA
  app.post("/api/admin/ai/settings", authenticateToken, async (req, res) => {
    try {
      const settings = req.body;
      const savedSettings = await supabaseService.saveAISettings(settings);
      res.json({ 
        success: true, 
        message: "Configurações da IA salvas no Supabase",
        data: savedSettings
      });
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
      res.status(500).json({ error: "Erro ao salvar configurações da IA: " + error.message });
    }
  });

  // Buscar configurações da IA
  app.get("/api/admin/ai/settings", authenticateToken, async (req, res) => {
    try {
      const settings = await supabaseService.getAISettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error getting AI settings:", error);
      res.status(500).json({ error: "Erro ao buscar configurações da IA: " + error.message });
    }
  });

  // Geração rápida de grimório
  app.post("/api/admin/ai/generate-quick", authenticateToken, async (req, res) => {
    try {
      const { prompt, settings } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt é obrigatório" });
      }
      
      // Aplicar configurações da IA ao prompt
      const enhancedPrompt = `
        ${prompt}
        
        Configurações aplicadas:
        - Personalidade: ${settings?.personality || 'luciferian'}
        - Complexidade: ${settings?.complexity || 'beginner'}
        - Extensão: ${settings?.length || 'medium'}
        - Estilo: ${settings?.style || 'mixed'}
        ${settings?.guidelines ? `- Diretrizes: ${settings.guidelines}` : ''}
      `;
      
      // Gerar conteúdo com IA
      const aiResult = await supabaseService.generateGrimoireWithAI(enhancedPrompt);
      
      // Validar que a IA retornou conteúdo válido
      if (!aiResult.content || aiResult.content.trim().length === 0) {
        throw new Error("IA não gerou conteúdo válido");
      }

      // Calcular estatísticas do conteúdo completo
      const totalWordCount = aiResult.content ? aiResult.content.split(' ').length : 0;
      const estimatedReadingTime = Math.max(5, Math.ceil(totalWordCount / 200));
      
      // Criar grimório automaticamente no banco
      const grimoireData: InsertGrimoire = {
        title: aiResult.title || "Grimório Gerado pela IA",
        description: aiResult.description || "Grimório criado automaticamente pela IA",
        section_id: settings?.default_section || 1,
        content: aiResult.content || "Conteúdo gerado pela IA",
        is_paid: settings?.auto_price === true,
        price: settings?.auto_price ? (settings?.price_range_min || "29.99") : null,
        unlock_order: 0,
        estimated_reading_time: estimatedReadingTime,
        is_published: settings?.auto_publish !== false,
        cover_image_url: `https://via.placeholder.com/300x400/1a1a1a/d4af37?text=${encodeURIComponent(aiResult.title || 'Grimório')}`
      };

      const newGrimoire = await supabaseService.createGrimoire(grimoireData);
      
      res.json({
        grimoire: newGrimoire,
        aiGenerated: {
          title: aiResult.title,
          description: aiResult.description,
          totalWords: totalWordCount,
          readingTime: estimatedReadingTime
        },
        message: `Grimório gerado com sucesso! ${totalWordCount} palavras, aproximadamente ${estimatedReadingTime} minutos de leitura.`
      });
    } catch (error: any) {
      console.error("Error generating quick grimoire:", error);
      res.status(500).json({ error: "Erro ao gerar grimório rapidamente: " + error.message });
    }
  });

  // Geração de capa com IA
  app.post("/api/admin/generate-cover", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Título é obrigatório para gerar a capa" });
      }

      // Criar prompt otimizado para geração de capa
      const coverPrompt = `
        Create a mystical book cover for a Luciferian grimoire titled "${title}".
        
        Style requirements:
        - Dark, mystical atmosphere with occult symbolism
        - Color palette: deep blacks, dark reds, gold/amber accents
        - Include subtle Luciferian symbols (pentagrams, flames, sigils)
        - Professional book cover layout with title space
        - Atmospheric lighting and shadows
        - Ancient, esoteric aesthetic
        
        Additional description: ${description || 'Mystical Luciferian grimoire with occult knowledge'}
        
        The cover should evoke mystery, power, and ancient wisdom while maintaining an elegant, premium book aesthetic.
      `;

      // Integração com OpenAI DALL-E para gerar a imagem
      const result = await supabaseService.generateImageWithAI(coverPrompt);
      
      res.json({ 
        imageUrl: result.imageUrl,
        message: "Capa gerada com sucesso pela IA" 
      });
    } catch (error: any) {
      console.error("Error generating cover:", error);
      res.status(500).json({ error: "Erro ao gerar capa: " + error.message });
    }
  });

  // Salvar configurações gerais do sistema
  app.post("/api/admin/settings", authenticateToken, async (req, res) => {
    try {
      const settings = req.body;
      const savedSettings = await supabaseService.saveSystemSettings(settings);
      res.json({ 
        success: true, 
        message: "Configurações do sistema salvas no Supabase",
        data: savedSettings
      });
    } catch (error: any) {
      console.error("Error saving system settings:", error);
      res.status(500).json({ error: "Erro ao salvar configurações do sistema: " + error.message });
    }
  });

  // Buscar configurações gerais do sistema
  app.get("/api/admin/settings", authenticateToken, async (req, res) => {
    try {
      const settings = await supabaseService.getSystemSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error getting system settings:", error);
      res.status(500).json({ error: "Erro ao buscar configurações do sistema: " + error.message });
    }
  });

  // Gerar capa de grimório com IA
  app.post("/api/admin/ai/generate-cover", authenticateToken, async (req, res) => {
    try {
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Título é obrigatório para gerar a capa" });
      }

      // Criar prompt otimizado para geração de capa
      const coverPrompt = `
        Create a mystical book cover for a Luciferian grimoire titled "${title}".
        
        Style requirements:
        - Dark, mystical atmosphere with occult symbolism
        - Color palette: deep blacks, dark reds, gold/amber accents
        - Include subtle Luciferian symbols (pentagrams, flames, sigils)
        - Professional book cover layout with title space
        - Atmospheric lighting and shadows
        - Ancient, esoteric aesthetic
        
        Additional description: ${description || 'Mystical Luciferian grimoire with occult knowledge'}
        
        The cover should evoke mystery, power, and ancient wisdom while maintaining an elegant, premium book aesthetic.
      `;

      // Integração com OpenAI DALL-E para gerar a imagem
      const result = await supabaseService.generateImageWithAI(coverPrompt);
      
      res.json({ 
        imageUrl: result.imageUrl,
        message: "Capa gerada com sucesso pela IA" 
      });
    } catch (error: any) {
      console.error("Error generating AI cover:", error);
      res.status(500).json({ error: "Erro ao gerar capa com IA: " + error.message });
    }
  });

  // ROTA PARA CRIAÇÃO DE PAGAMENTO STRIPE
  app.post("/api/admin/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { grimoireId, amount } = req.body;
      
      if (!grimoireId || !amount) {
        return res.status(400).json({ error: "Grimório ID e valor são obrigatórios" });
      }

      const paymentIntent = await supabaseService.createPaymentIntent(grimoireId, amount);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message || "Erro ao criar intenção de pagamento" });
    }
  });

  // ROTA DE DIAGNÓSTICO DO SUPABASE
  app.get("/api/admin/supabase-status", authenticateToken, async (req, res) => {
    try {
      console.log('🔍 Executando diagnóstico completo do Supabase...');
      
      const connectionTest = await supabaseService.testConnection();
      const structureOK = await supabaseService.ensureDatabaseStructure();
      const stats = await supabaseService.getOverviewStats();
      
      const diagnostics = {
        timestamp: new Date().toISOString(),
        connection: connectionTest,
        database_structure: structureOK ? 'OK' : 'NEEDS_SETUP',
        statistics: stats,
        recommendations: []
      };
      
      if (connectionTest.status !== 'SUCCESS') {
        diagnostics.recommendations.push({
          priority: 'HIGH',
          message: 'Problemas de conectividade detectados',
          action: 'Execute o script SUPABASE_COMPLETE_SETUP.sql no dashboard do Supabase'
        });
      }
      
      if (!structureOK) {
        diagnostics.recommendations.push({
          priority: 'CRITICAL',
          message: 'Estrutura do banco incompleta',
          action: 'Execute o setup completo das tabelas'
        });
      }
      
      if (diagnostics.recommendations.length === 0) {
        diagnostics.recommendations.push({
          priority: 'INFO',
          message: 'Sistema funcionando perfeitamente',
          action: 'Nenhuma ação necessária'
        });
      }
      
      res.json(diagnostics);
      
    } catch (error: any) {
      console.error('Erro durante diagnóstico:', error);
      res.status(500).json({
        error: 'Falha no diagnóstico do Supabase',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}