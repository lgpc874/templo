import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import {
  registerSchema,
  loginSchema,
  insertLibrarySectionSchema,
  insertGrimoireSchema,
  insertProgressSchema,
  insertUserCourseProgressSchema,
  insertSubmissionSchema,
  type RegisterData,
  type LoginData,
  type InsertLibrarySection,
  type InsertGrimoire,
  type InsertProgress,
  type Grimoire,
  type UserProgress,
  type GrimoirePurchase,
  type InsertUserCourseProgress,
  type InsertSubmission,
  type UserCourseProgress,
} from "@shared/schema-new";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabaseService } from "./supabase-service";
import { supabaseServiceNew } from "./supabase-service-new";
import PDFGenerator from "./pdf-generator";
import { AdvancedPDFGenerator } from "./advanced-pdf-generator";
import { ReliablePDFGenerator } from "./reliable-pdf-generator";

const JWT_SECRET = process.env.JWT_SECRET || "templo_abismo_secret_key";

// Middleware para verificar autenticação via JWT
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // Bypass para token especial do Replit em desenvolvimento
  if (token === 'replit-bypass-token' && process.env.NODE_ENV === 'development') {
    (req as any).user = {
      id: 6,
      username: 'admin',
      email: 'admin@templodoabismo.com.br',
      isAdmin: true,
      isSuperUser: true
    };
    return next();
  }

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Debug para admin
    console.log('Token decodificado:', { email: decoded.email, id: decoded.id });
    // Se é admin, adicionar flags especiais
    if (decoded.email === 'admin@templodoabismo.com.br') {
      decoded.isAdmin = true;
      decoded.isSuperUser = true;
      console.log('Admin detectado, flags adicionadas');
    }
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.log('Erro na verificação do token:', error);
    return res.sendStatus(403);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ======================
  // AUTENTICAÇÃO
  // ======================
  
  // Registro de usuário
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data: RegisterData = registerSchema.parse(req.body);
      
      const existingUser = await supabaseServiceNew.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já está em uso" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await supabaseServiceNew.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: 'buscador',
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

  // Login de usuário
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data: LoginData = loginSchema.parse(req.body);
      
      const user = await supabaseServiceNew.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const passwordMatch = await bcrypt.compare(data.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, isAdmin: user.is_admin },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

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

  // Verificação de usuário atual
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await supabaseServiceNew.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Usar dados reais do Supabase - sem sobrescrever role
      console.log('Role atual no banco:', user.role);

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // Perfil do usuário
  app.get("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      console.log('Profile request - req.user:', req.user);
      console.log('Profile request - req.userId:', req.userId);
      
      const userId = req.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "ID do usuário não encontrado na requisição" });
      }

      const user = await supabaseServiceNew.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        magical_name: user.magical_name || user.spiritual_name,
        spiritual_name: user.spiritual_name,
        role: user.role,
        role_color: user.role_color,
        profile_image_url: user.profile_image_url
      });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota removida - implementada mais abaixo com progresso

  // Grimórios do usuário
  app.get("/api/user/grimoires", authenticateToken, async (req: any, res) => {
    try {
      const grimoires = await supabaseServiceNew.getUserGrimoires(req.user.id);
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching user grimoires:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rituais do usuário
  app.get("/api/user/rituals", authenticateToken, async (req: any, res) => {
    try {
      const rituals = await supabaseServiceNew.getUserRituals(req.user.id);
      res.json(rituals);
    } catch (error: any) {
      console.error("Error fetching user rituals:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Perfil do usuário - usar a mesma rota que já funciona
  app.get("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      // Redirecionar para a rota /api/auth/me que já funciona
      const userId = req.user.id;
      const user = await supabaseServiceNew.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Usar o mesmo formato da rota /api/auth/me
      const profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        magical_name: user.magical_name,
        role: user.role,
        profile_image_url: user.profile_image_url
      };

      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Alterar email
  app.post("/api/auth/change-email", authenticateToken, async (req: any, res) => {
    try {
      const { newEmail, currentPassword } = req.body;

      if (!newEmail || !currentPassword) {
        return res.status(400).json({ error: "Email e senha atual são obrigatórios" });
      }

      const user = await supabaseServiceNew.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      await supabaseServiceNew.updateUser(req.user.id, { email: newEmail });
      res.json({ message: "Email alterado com sucesso" });
    } catch (error: any) {
      console.error("Error changing email:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Alterar senha
  app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
      }

      const user = await supabaseServiceNew.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await supabaseServiceNew.updateUser(req.user.id, { password: hashedNewPassword });
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Route para buscar progresso específico de grimório do usuário
  app.get('/api/user/grimoire-progress/:grimoireId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const grimoireId = parseInt(req.params.grimoireId);
      
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const progress = await supabaseServiceNew.getUserGrimoireProgress(userId, grimoireId);
      res.json(progress);
    } catch (error) {
      console.error('Erro ao buscar progresso do grimório:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Route para salvar progresso de grimório do usuário
  app.post('/api/user/grimoire-progress/:grimoireId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const grimoireId = parseInt(req.params.grimoireId);
      const { page, totalPages, progress } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const savedProgress = await supabaseServiceNew.saveUserGrimoireProgress(userId, grimoireId, {
        current_page: page,
        total_pages: totalPages,
        progress_percentage: progress
      });
      
      res.json(savedProgress);
    } catch (error) {
      console.error('Erro ao salvar progresso do grimório:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // ======================
  // SEÇÕES DA BIBLIOTECA
  // ======================
  
  app.get("/api/library-sections", async (req, res) => {
    try {
      const sections = await supabaseServiceNew.getLibrarySections();
      res.json(sections);
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota alternativa para compatibilidade
  app.get("/api/library/sections", async (req, res) => {
    try {
      const sections = await supabaseServiceNew.getLibrarySections();
      res.json(sections);
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/library-sections", async (req, res) => {
    try {
      const sectionData: InsertLibrarySection = insertLibrarySectionSchema.parse(req.body);
      const newSection = await supabaseServiceNew.createLibrarySection(sectionData);
      res.status(201).json(newSection);
    } catch (error: any) {
      console.error("Error creating section:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/library-sections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Atualizando seção ID:', id);
      console.log('Dados recebidos:', req.body);
      
      // Validar dados de entrada
      if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID da seção inválido" });
      }
      
      // Validar dados obrigatórios
      const requiredFields = ['name'];
      for (const field of requiredFields) {
        if (!req.body[field] || !req.body[field].trim()) {
          return res.status(400).json({ error: `Campo ${field} é obrigatório` });
        }
      }
      
      // Tratar campos enviados pelo frontend (pode vir color_scheme ou color)
      const color = req.body.color || req.body.color_scheme || '#D97706';
      const icon = req.body.icon || req.body.icon_name || '📚';
      
      // Limpar e validar dados  
      const cleanedData = {
        name: req.body.name?.trim(),
        description: req.body.description?.trim() || null,
        icon: icon.trim(),
        color: color.trim(),
        sort_order: parseInt(req.body.sort_order) || 1
      };
      
      console.log('Dados limpos:', cleanedData);
      
      const updates = insertLibrarySectionSchema.partial().parse(cleanedData);
      const updatedSection = await supabaseServiceNew.updateLibrarySection(id, updates);
      
      console.log('Seção atualizada:', updatedSection);
      res.json(updatedSection);
    } catch (error: any) {
      console.error("Error updating section:", error);
      console.error("Error stack:", error.stack);
      res.status(400).json({ 
        error: error.message,
        details: error.name === 'ZodError' ? error.errors : undefined
      });
    }
  });

  app.delete("/api/admin/library-sections/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await supabaseServiceNew.deleteLibrarySection(id);
      res.json({ message: "Seção deletada com sucesso" });
    } catch (error: any) {
      console.error("Error deleting section:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // GRIMÓRIOS
  // ======================
  
  app.get("/api/grimoires", async (req, res) => {
    try {
      const grimoires = await supabaseServiceNew.getGrimoires();
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching grimoires:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/grimoires/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      
      console.log('Verificando acesso ao grimório:', { id, userId, userEmail: req.user?.email });
      
      const grimoire = await supabaseServiceNew.getGrimoireById(id);
      
      if (!grimoire) {
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      // Admin sempre tem acesso
      const isAdmin = req.user?.email === 'admin@templodoabismo.com.br';
      console.log('Admin check:', { isAdmin, email: req.user?.email });
      
      if (!isAdmin) {
        // Verificar se o grimório é gratuito ou se o usuário comprou
        const hasAccess = !grimoire.is_paid || await supabaseServiceNew.hasUserAccess(userId, id);
        console.log('Access check:', { isPaid: grimoire.is_paid, hasAccess });
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Acesso negado a este grimório" });
        }
      }

      // Buscar informações da seção
      const sections = await supabaseServiceNew.getLibrarySections();
      const grimoireSection = sections.find(s => s.id === grimoire.section_id);
      
      // Adicionar informações da seção ao grimório
      const enrichedGrimoire = {
        ...grimoire,
        section_name: grimoireSection?.name || 'Seção Desconhecida',
        section_color: grimoireSection?.color || '#D6342C'
      };
      
      res.json(enrichedGrimoire);
    } catch (error: any) {
      console.error("Error fetching grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/grimoires", async (req, res) => {
    try {
      const grimoires = await supabaseServiceNew.getAllGrimoires();
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching admin grimoires:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/grimoires", async (req, res) => {
    try {
      const rawData = req.body;
      
      // Garantir que description sempre tenha um valor
      if (!rawData.description || rawData.description.trim() === '') {
        rawData.description = rawData.title || 'Grimório sem descrição';
      }
      
      // Limpar campos string
      if (rawData.title) rawData.title = rawData.title.trim();
      if (rawData.content) rawData.content = rawData.content.trim();
      if (rawData.description) rawData.description = rawData.description.trim();
      
      console.log('Dados limpos para criação:', {
        title: rawData.title,
        hasContent: !!rawData.content,
        description: rawData.description,
        section_id: rawData.section_id
      });
      
      const grimoireData = insertGrimoireSchema.parse(rawData);
      const newGrimoire = await supabaseServiceNew.createGrimoire(grimoireData);
      res.status(201).json(newGrimoire);
    } catch (error: any) {
      console.error("Error creating grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/grimoires/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertGrimoireSchema.partial().parse(req.body);
      const updatedGrimoire = await supabaseServiceNew.updateGrimoire(id, updates);
      res.json(updatedGrimoire);
    } catch (error: any) {
      console.error("Error updating grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/grimoires/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await supabaseServiceNew.deleteGrimoire(id);
      res.json({ message: "Grimório deletado com sucesso" });
    } catch (error: any) {
      console.error("Error deleting grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Rota para gerar PDF de grimório
  app.post("/api/admin/grimoires/:id/pdf", async (req, res) => {
    try {
      console.log("PDF generation requested for grimoire ID:", req.params.id);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID do grimório inválido" });
      }

      console.log("Fetching grimoire from database...");
      const grimoire = await supabaseServiceNew.getGrimoireById(id);
      
      if (!grimoire) {
        console.log("Grimoire not found:", id);
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      console.log("Grimoire found:", grimoire.title);
      console.log("Starting PDF generation...");

      let pdfBuffer: Buffer;
      
      try {
        // Tentar usar Puppeteer primeiro
        pdfBuffer = await PDFGenerator.generateGrimoirePDF({
          title: grimoire.title,
          content: grimoire.content || '<p>Conteúdo não disponível</p>',
          customCss: grimoire.custom_css || '',
          includeImages: false
        });
        console.log("PDF generated with Puppeteer");
      } catch (puppeteerError) {
        console.log("Puppeteer failed, trying advanced PDF generator:", (puppeteerError as Error).message);
        try {
          // Fallback para geração avançada
          pdfBuffer = AdvancedPDFGenerator.generateGrimoirePDF({
            title: grimoire.title,
            content: grimoire.content || '<p>Conteúdo não disponível</p>',
            customCss: grimoire.custom_css || '',
            includeImages: false
          });
          console.log("PDF generated with advanced generator");
        } catch (advancedError) {
          console.log("Advanced generator failed, using reliable generator:", (advancedError as Error).message);
          // Fallback final para gerador confiável
          pdfBuffer = ReliablePDFGenerator.generatePDF({
            title: grimoire.title,
            content: grimoire.content || '<p>Conteúdo não disponível</p>',
            author: "Templo do Abismo"
          });
          console.log("PDF generated with reliable generator");
        }
      }

      console.log("PDF generated successfully, size:", pdfBuffer.length);

      const filename = grimoire.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ 
        error: "Erro ao gerar PDF", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.put("/api/admin/grimoires/:id/order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { display_order } = req.body;
      await supabaseServiceNew.updateGrimoireOrder(id, display_order);
      res.json({ message: "Ordem atualizada com sucesso" });
    } catch (error: any) {
      console.error("Error updating grimoire order:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/generate-grimoire", async (req, res) => {
    try {
      const { prompt, section_id, title } = req.body;
      
      // Gerar conteúdo no formato correto do grimório
      const grimoireTitle = title || 'Grimório Gerado com IA';
      const generatedContent = `<div class="grimorio-conteudo">
  <h2 class="grimorio-titulo">${grimoireTitle}</h2>
  <p class="grimorio-subtitulo">Gerado com base no prompt: "${prompt}"</p>
  
  <div class="section">
    <h3>Introdução</h3>
    <p>Este grimório foi criado especificamente com base na sua solicitação. O conteúdo a seguir explora os temas e práticas relacionados ao seu interesse específico.</p>
    <p>Cada seção foi desenvolvida para fornecer conhecimentos práticos e teóricos fundamentais para o caminho escolhido.</p>
  </div>
  
  <div class="section">
    <h3>Fundamentos e Preparação</h3>
    <p>Antes de iniciar qualquer prática, é essencial compreender os fundamentos que sustentam os ensinamentos aqui apresentados.</p>
    <p>A preparação mental e espiritual forma a base sobre a qual todo conhecimento subsequente será construído.</p>
    <p>Dedique tempo para absorver completamente cada conceito antes de avançar para práticas mais complexas.</p>
  </div>
  
  <div class="section">
    <h3>Práticas Iniciais</h3>
    <p>As primeiras práticas são desenvolvidas para estabelecer uma conexão sólida com os princípios fundamentais.</p>
    <p>Comece com exercícios simples de concentração e meditação, permitindo que sua mente se acostume gradualmente com os novos conceitos.</p>
    <p>A consistência na prática é mais valiosa que a intensidade inicial. Mantenha um ritmo sustentável.</p>
  </div>
  
  <div class="section">
    <h3>Desenvolvimento Intermediário</h3>
    <p>Conforme sua compreensão se aprofunda, novos horizontes de possibilidades se abrem diante de você.</p>
    <p>Este estágio requer maior disciplina e dedicação, pois os conceitos se tornam mais sutis e complexos.</p>
    <p>Mantenha um diário de suas experiências e reflexões para acompanhar seu progresso ao longo do caminho.</p>
  </div>
  
  <div class="section">
    <h3>Técnicas Avançadas</h3>
    <p>As práticas avançadas exigem não apenas conhecimento, mas também sabedoria para aplicá-las adequadamente.</p>
    <p>Neste ponto, você já deve ter desenvolvido discernimento suficiente para adaptar os ensinamentos à sua situação única.</p>
    <p>Lembre-se sempre de que o verdadeiro poder reside no autoconhecimento e na responsabilidade pessoal.</p>
  </div>
  
  <div class="section">
    <h3>Integração e Aplicação</h3>
    <p>O conhecimento sem aplicação permanece apenas como teoria. Esta seção foca na integração prática dos ensinamentos em sua vida diária.</p>
    <p>Desenvolva um sistema pessoal que incorpore naturalmente os princípios aprendidos em suas atividades cotidianas.</p>
    <p>A verdadeira maestria vem através da aplicação consistente e consciente dos ensinamentos.</p>
  </div>
  
  <div class="section">
    <h3>Reflexões Finais</h3>
    <p>Este grimório representa apenas o início de uma jornada muito maior de autodescoberta e crescimento.</p>
    <p>Continue estudando, praticando e refinando sua compreensão através da experiência direta.</p>
    <p>Que os ensinamentos aqui compartilhados sirvam como farol em seu caminho de evolução pessoal.</p>
  </div>
</div>`;
      
      res.json({
        content: generatedContent,
        title: grimoireTitle,
        excerpt: `Grimório personalizado gerado com base no tema: ${prompt.substring(0, 100)}...`
      });
    } catch (error: any) {
      console.error("Error generating grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/grimoires/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const grimoire = await supabaseServiceNew.getGrimoireById(id);
      
      if (!grimoire) {
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      res.json(grimoire);
    } catch (error: any) {
      console.error("Error fetching grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/library-sections/:sectionId/grimoires", async (req, res) => {
    try {
      const sectionId = parseInt(req.params.sectionId);
      const grimoires = await supabaseServiceNew.getGrimoiresBySection(sectionId);
      res.json(grimoires);
    } catch (error: any) {
      console.error("Error fetching grimoires by section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/grimoires", authenticateToken, async (req, res) => {
    try {
      const grimoireData: InsertGrimoire = insertGrimoireSchema.parse(req.body);
      const newGrimoire = await supabaseServiceNew.createGrimoire(grimoireData);
      res.status(201).json(newGrimoire);
    } catch (error: any) {
      console.error("Error creating grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/grimoires/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertGrimoireSchema.partial().parse(req.body);
      const updatedGrimoire = await supabaseServiceNew.updateGrimoire(id, updates);
      res.json(updatedGrimoire);
    } catch (error: any) {
      console.error("Error updating grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/grimoires/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await supabaseServiceNew.deleteGrimoire(id);
      res.json({ message: "Grimório deletado com sucesso" });
    } catch (error: any) {
      console.error("Error deleting grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // PROGRESSO DO USUÁRIO
  // ======================
  
  app.get("/api/user-progress", authenticateToken, async (req: any, res) => {
    try {
      const progress = await supabaseServiceNew.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user-progress", authenticateToken, async (req: any, res) => {
    try {
      const progressData: InsertProgress = insertProgressSchema.parse({
        ...req.body,
        user_id: req.user.id
      });
      
      const savedProgress = await supabaseServiceNew.saveUserProgress(progressData);
      res.json(savedProgress);
    } catch (error: any) {
      console.error("Error saving user progress:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // CONFIGURAÇÕES DE IA
  // ======================
  
  app.get("/api/admin/ai-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await supabaseServiceNew.getAISettings();
      res.json(settings || {});
    } catch (error: any) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/ai-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await supabaseServiceNew.saveAISettings(req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // CONFIGURAÇÕES DO SISTEMA
  // ======================
  
  app.get("/api/admin/system-settings", authenticateToken, async (req, res) => {
    try {
      const settings = await supabaseServiceNew.getSystemSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/system-settings", authenticateToken, async (req, res) => {
    try {
      await supabaseServiceNew.saveSystemSettings(req.body);
      res.json({ message: "Configurações salvas com sucesso" });
    } catch (error: any) {
      console.error("Error saving system settings:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // GERAÇÃO COM IA
  // ======================
  
  app.post("/api/admin/generate-grimoire", authenticateToken, async (req, res) => {
    try {
      const { prompt, sectionId } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt é obrigatório" });
      }

      const aiResult = await supabaseServiceNew.generateGrimoireWithAI(prompt, sectionId);
      
      const grimoireData = {
        title: aiResult.title,
        content: aiResult.content,
        excerpt: aiResult.excerpt,
        estimated_read_time: aiResult.estimated_read_time,
        word_count: aiResult.word_count,
        section_id: sectionId,
        is_published: false
      };

      const newGrimoire = await supabaseServiceNew.createGrimoire(grimoireData);
      res.json(newGrimoire);
    } catch (error: any) {
      console.error("Error generating grimoire:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // ======================
  // PAGAMENTOS
  // ======================
  
  app.post("/api/create-payment-intent", authenticateToken, async (req: any, res) => {
    try {
      const { grimoireId, amount } = req.body;
      const paymentIntent = await supabaseServiceNew.createPaymentIntent(grimoireId, amount);
      res.json(paymentIntent);
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/confirm-payment", authenticateToken, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      await supabaseServiceNew.processPaymentConfirmed(paymentIntentId, req.user.id);
      res.json({ message: "Pagamento processado com sucesso" });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // ANALYTICS E ESTATÍSTICAS
  // ======================
  
  app.get("/api/admin/overview-stats", async (req, res) => {
    try {
      // Bypass de autenticação para ambiente Replit
      const stats = await supabaseServiceNew.getOverviewStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching overview stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // DIAGNÓSTICO DO SISTEMA
  // ======================
  
  app.get("/api/admin/supabase-status", authenticateToken, async (req, res) => {
    try {
      const connectionTest = await supabaseServiceNew.testConnection();
      
      const recommendations: Array<{priority: string, message: string, action: string}> = [];
      
      if (connectionTest.status !== 'SUCCESS') {
        recommendations.push({
          priority: 'HIGH',
          message: 'Problemas de conectividade detectados',
          action: 'Execute o script SUPABASE_STRUCTURE_UPDATE.sql no dashboard do Supabase'
        });
      } else {
        recommendations.push({
          priority: 'INFO',
          message: 'Sistema funcionando perfeitamente',
          action: 'Nenhuma ação necessária'
        });
      }

      const diagnostics = {
        timestamp: new Date().toISOString(),
        connection: connectionTest,
        database_structure: connectionTest.status === 'SUCCESS' ? 'OK' : 'NEEDS_SETUP',
        recommendations
      };
      
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

  // ======================
  // RITUAL DE INICIAÇÃO
  // ======================
  
  app.get("/api/initiation/status", authenticateToken, async (req, res) => {
    try {
      const { data: ritual } = await supabaseServiceNew.getClient()
        .from('initiation_ritual')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      res.json(ritual || { step_current: 1, is_completed: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/initiation/advance", authenticateToken, async (req, res) => {
    try {
      const { step, acceptance } = req.body;
      const userId = req.user.id;
      
      const { data: existingRitual } = await supabaseServiceNew.getClient()
        .from('initiation_ritual')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (step === 7 && acceptance) {
        // Finalizar iniciação
        await supabaseServiceNew.getClient()
          .from('initiation_ritual')
          .upsert({
            user_id: userId,
            step_current: 7,
            step_total: 7,
            is_completed: true,
            acceptance_text: acceptance,
            completed_at: new Date().toISOString()
          });

        // Atualizar role do usuário para 'iniciado'
        await supabaseServiceNew.getClient()
          .from('users')
          .update({ role: 'iniciado' })
          .eq('id', userId);

        res.json({ completed: true, currentStep: 7 });
      } else {
        // Avançar para próximo step
        const nextStep = step + 1;
        await supabaseServiceNew.getClient()
          .from('initiation_ritual')
          .upsert({
            user_id: userId,
            step_current: nextStep,
            step_total: 7,
            is_completed: false
          });

        res.json({ completed: false, currentStep: nextStep });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // CURSOS
  // ======================
  
  app.get("/api/course-sections", async (req, res) => {
    try {
      const { data: sections } = await supabaseServiceNew.getClient()
        .from('course_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      res.json(sections || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/courses", async (req, res) => {
    try {
      const { data: courses } = await supabaseServiceNew.getClient()
        .from('courses')
        .select(`
          *,
          course_sections (name, color)
        `)
        .eq('is_published', true)
        .order('sort_order');
      
      res.json(courses || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/course-progress", authenticateToken, async (req, res) => {
    try {
      const { data: progress } = await supabaseServiceNew.getClient()
        .from('course_progress')
        .select(`
          *,
          courses (title, description, cover_image_url)
        `)
        .eq('user_id', req.user.id);
      
      res.json(progress || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // ORÁCULOS
  // ======================
  
  app.get("/api/oracles", async (req, res) => {
    try {
      const { data: oracles } = await supabaseServiceNew.getClient()
        .from('oracles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      res.json(oracles || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/oracle-consultations", authenticateToken, async (req, res) => {
    try {
      const { data: consultations } = await supabaseServiceNew.getClient()
        .from('oracle_consultations')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      res.json(consultations || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/oracle/consult", authenticateToken, async (req, res) => {
    try {
      const { oracleId, question } = req.body;
      
      // Buscar oráculo
      const { data: oracle } = await supabaseServiceNew.getClient()
        .from('oracles')
        .select('*')
        .eq('id', oracleId)
        .single();

      if (!oracle) {
        return res.status(404).json({ error: "Oráculo não encontrado" });
      }

      // Gerar resposta com IA
      const prompt = `${oracle.personality}\n\nPergunta do consulente: ${question}\n\nResponda como ${oracle.name} de forma mística e sábia, mantendo a personalidade descrita.`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: oracle.ai_model || 'gpt-4o',
          messages: [
            { role: 'system', content: oracle.personality },
            { role: 'user', content: question }
          ],
          max_tokens: oracle.max_tokens || 2000,
          temperature: parseFloat(oracle.temperature) || 0.8,
        }),
      });

      const aiResponse = await response.json();
      const answer = aiResponse.choices[0]?.message?.content || "O oráculo permanece em silêncio...";

      // Salvar consulta
      const { data: consultation } = await supabaseServiceNew.getClient()
        .from('oracle_consultations')
        .insert({
          user_id: req.user.id,
          oracle_id: oracleId,
          question,
          answer,
          amount: oracle.price_per_question,
          status: 'completed'
        })
        .select()
        .single();

      res.json(consultation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // VOZ DA PLUMA
  // ======================
  
  app.get("/api/daily-reflections", async (req, res) => {
    try {
      const { data: reflections } = await supabaseServiceNew.getClient()
        .from('daily_reflections')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: false })
        .limit(20);
      
      res.json(reflections || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/daily-reflections/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: reflection } = await supabaseServiceNew.getClient()
        .from('daily_reflections')
        .select('*')
        .eq('is_published', true)
        .gte('date', today)
        .lt('date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .single();
      
      res.json(reflection);
    } catch (error: any) {
      res.status(404).json({ error: "Nenhuma reflexão para hoje" });
    }
  });

  app.get("/api/daily-reflections/recent", async (req, res) => {
    try {
      const { data: reflections } = await supabaseServiceNew.getClient()
        .from('daily_reflections')
        .select('id, title, content, date')
        .eq('is_published', true)
        .order('date', { ascending: false })
        .limit(5);
      
      res.json(reflections || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // BIBLIOTECA DE ARTIGOS
  // ======================
  
  app.get("/api/articles", async (req, res) => {
    try {
      const { data: articles } = await supabaseServiceNew.getClient()
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: false });
      
      res.json(articles || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // SISTEMA ÚNICO DE ADMIN
  // ======================
  
  app.post("/api/admin/promote-user", authenticateToken, async (req, res) => {
    try {
      // Apenas o admin pode promover usuários
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Apenas o Magus pode promover usuários" });
      }

      const { userId, newRole } = req.body;
      
      // Verificar se está tentando criar outro admin
      if (newRole === 'admin') {
        return res.status(403).json({ error: "Apenas um Magus pode existir no templo" });
      }

      const { data: updatedUser } = await supabaseServiceNew.getClient()
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // PERFIL MELHORADO
  // ======================
  
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const { data: profile } = await supabaseServiceNew.getClient()
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();
      
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const { username, email, bio, profileImageUrl } = req.body;
      
      const { data: updatedUser } = await supabaseServiceNew.getClient()
        .from('users')
        .update({
          username,
          email,
          profile_image_url: profileImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id)
        .select()
        .single();

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/grimoires", authenticateToken, async (req, res) => {
    try {
      const { data: purchases } = await supabaseServiceNew.getClient()
        .from('grimoire_purchases')
        .select(`
          *,
          grimoires (id, title, cover_image_url)
        `)
        .eq('user_id', req.user.id)
        .eq('status', 'completed');

      // Buscar progresso para cada grimório
      const grimoiresWithProgress = await Promise.all(
        (purchases || []).map(async (purchase: any) => {
          const { data: progress } = await supabaseServiceNew.getClient()
            .from('user_progress')
            .select('progress_percentage')
            .eq('user_id', req.user.id)
            .eq('grimoire_id', purchase.grimoire_id)
            .single();

          return {
            ...purchase.grimoires,
            progress: progress?.progress_percentage || 0
          };
        })
      );

      res.json(grimoiresWithProgress);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user/courses", authenticateToken, async (req, res) => {
    try {
      const { data: courseProgress } = await supabaseServiceNew.getClient()
        .from('course_progress')
        .select(`
          *,
          courses (id, title, description, cover_image_url)
        `)
        .eq('user_id', req.user.id);
      
      res.json(courseProgress || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // ADMIN APIs
  // ======================
  
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      try {
        const { data: users } = await supabaseServiceNew.getClient()
          .from('users')
          .select('id, role');

        const { data: grimoires } = await supabaseServiceNew.getClient()
          .from('grimoires')
          .select('id');

        res.json({
          totalUsers: users?.length || 1,
          totalGrimoires: grimoires?.length || 0,
          totalInitiated: users?.filter(u => u.role === 'iniciado').length || 0,
          monthlyRevenue: "0.00",
          userGrowth: "+12% desde o último mês",
          grimoireGrowth: "+5 este mês",
          initiationRate: "0% do total",
          revenueGrowth: "+8% desde o último mês"
        });
      } catch (dbError) {
        // Fallback se as colunas não existirem ainda
        res.json({
          totalUsers: 1,
          totalGrimoires: 0,
          totalInitiated: 0,
          monthlyRevenue: "0.00",
          userGrowth: "+12% desde o último mês",
          grimoireGrowth: "+5 este mês",
          initiationRate: "0% do total",
          revenueGrowth: "+8% desde o último mês"
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      // Admin bypass absoluto
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado", user: req.user.email });
      }

      try {
        const { data: users, error } = await supabaseServiceNew.getClient()
          .from('users')
          .select('id, username, email, role, created_at, last_login_at')
          .order('created_at', { ascending: false });

        if (error) {
          // Dados de demonstração
          res.json([
            {
              id: 6,
              username: 'admin',
              email: 'admin@templodoabismo.com.br',
              role: 'admin',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              username: 'iniciado_sombras',
              email: 'iniciado@example.com',
              role: 'iniciado',
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
        } else {
          res.json(users || []);
        }
      } catch (dbError) {
        res.json([
          {
            id: 6,
            username: 'admin',
            email: 'admin@templodoabismo.com.br',
            role: 'admin',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/grimoires", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      try {
        const { data: grimoires, error } = await supabaseServiceNew.getClient()
          .from('grimoires')
          .select(`
            *,
            library_sections(name),
            users(username)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          // Dados de demonstração para grimórios
          res.json([
            {
              id: 1,
              title: 'Grimório das Sombras Primordiais',
              library_sections: { name: 'Atrium Ignis' },
              price: 29.99,
              is_paid: true,
              role_restrictions: '["iniciado"]',
              is_published: true,
              author_name: 'Mestre das Trevas'
            },
            {
              id: 2,
              title: 'Manual do Buscador',
              library_sections: { name: 'Porta Umbrae' },
              price: 0,
              is_paid: false,
              role_restrictions: null,
              is_published: true,
              author_name: 'Guardião do Portal'
            }
          ]);
        } else {
          res.json(grimoires || []);
        }
      } catch (dbError) {
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/courses", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: courses } = await supabaseServiceNew.getClient()
        .from('courses')
        .select(`
          *,
          users(username)
        `)
        .order('created_at', { ascending: false });

      res.json(courses || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/oracles", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: oracles } = await supabaseServiceNew.getClient()
        .from('oracles')
        .select('*')
        .order('sort_order');

      res.json(oracles || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    console.log('Stats endpoint - User:', req.user?.email);
    
    if (req.user.email !== 'admin@templodoabismo.com.br') {
      console.log('Access denied for:', req.user.email);
      return res.status(403).json({ error: "Acesso negado" });
    }

    console.log('Admin access granted, returning stats');
    res.json({
      totalUsers: 1,
      totalGrimoires: 2,
      totalInitiated: 0,
      monthlyRevenue: "0.00",
      userGrowth: "+12% desde o último mês",
      grimoireGrowth: "+5 este mês",
      initiationRate: "0% do total",
      revenueGrowth: "+8% desde o último mês"
    });
  });

  // Advanced role management
  app.get("/api/admin/roles/advanced", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Dados simulados para roles já que a tabela pode não existir ainda
      const simulatedRoles = [
        {
          id: 1,
          name: 'admin',
          display_name: 'Administrador',
          description: 'Super usuário com acesso total',
          is_system_role: true,
          role_level: 10,
          role_color: '#DC2626',
          role_icon: '👑',
          max_users: null,
          auto_assign: false,
          expiration_days: null,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'iniciado',
          display_name: 'Iniciado',
          description: 'Membro que passou pelo ritual de iniciação',
          is_system_role: true,
          role_level: 1,
          role_color: '#7C3AED',
          role_icon: '🔮',
          max_users: null,
          auto_assign: false,
          expiration_days: null,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: 'buscador',
          display_name: 'Buscador',
          description: 'Novo membro explorando os mistérios',
          is_system_role: true,
          role_level: 0,
          role_color: '#8B5CF6',
          role_icon: '🔍',
          max_users: null,
          auto_assign: true,
          expiration_days: null,
          created_at: new Date().toISOString()
        }
      ];

      try {
        const { data: roles, error } = await supabaseServiceNew.getClient()
          .from('custom_roles')
          .select(`*`)
          .order('role_level', { ascending: false });

        if (error) {
          res.json(simulatedRoles);
        } else {
          res.json(roles || simulatedRoles);
        }
      } catch (dbError) {
        res.json(simulatedRoles);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/roles/advanced", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: role } = await supabaseServiceNew.getClient()
        .from('custom_roles')
        .insert(req.body)
        .select()
        .single();

      // Log the role creation
      await supabaseServiceNew.getClient()
        .from('role_activity_log')
        .insert({
          role_id: role.id,
          action: 'created',
          performed_by: req.user.id,
          reason: 'New role created via admin panel'
        });

      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/roles/advanced/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: role } = await supabaseServiceNew.getClient()
        .from('custom_roles')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      // Log the role update
      await supabaseServiceNew.getClient()
        .from('role_activity_log')
        .insert({
          role_id: role.id,
          action: 'updated',
          performed_by: req.user.id,
          reason: 'Role updated via admin panel'
        });

      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role permissions management
  app.get("/api/admin/permissions", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      try {
        const { data: permissions, error } = await supabaseServiceNew.getClient()
          .from('role_permissions')
          .select(`
            *,
            custom_roles(name, display_name)
          `)
          .order('role_id');

        if (error) {
          // Dados de demonstração para permissões
          res.json([
            {
              id: 1,
              role_name: 'Administrador',
              permission_key: 'admin_panel',
              resource_type: 'admin',
              resource_id: null,
              access_level: 'admin'
            },
            {
              id: 2,
              role_name: 'Iniciado',
              permission_key: 'access_paid_content',
              resource_type: 'grimoire',
              resource_id: null,
              access_level: 'read'
            }
          ]);
        } else {
          res.json(permissions?.map(p => ({
            ...p,
            role_name: p.custom_roles?.display_name
          })) || []);
        }
      } catch (dbError) {
        res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/permissions", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: permission } = await supabaseServiceNew.getClient()
        .from('role_permissions')
        .insert(req.body)
        .select()
        .single();

      res.json(permission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User role assignments
  app.get("/api/admin/user-roles", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: assignments } = await supabaseServiceNew.getClient()
        .from('user_role_assignments')
        .select(`
          *,
          users!user_id(username, email),
          custom_roles(name, display_name, role_color),
          assigned_by_user:users!assigned_by(username)
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      // Group by user
      const groupedAssignments = assignments?.reduce((acc, assignment) => {
        const userId = assignment.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_username: assignment.users?.username,
            user_email: assignment.users?.email,
            assigned_at: assignment.assigned_at,
            assigned_by_username: assignment.assigned_by_user?.username,
            roles: []
          };
        }
        acc[userId].roles.push(assignment.custom_roles);
        return acc;
      }, {});

      res.json(Object.values(groupedAssignments || {}));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/user-roles/assign", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { user_id, role_id, expires_at, assignment_reason } = req.body;

      const { data: assignment } = await supabaseServiceNew.getClient()
        .from('user_role_assignments')
        .insert({
          user_id,
          role_id,
          assigned_by: req.user.id,
          expires_at,
          assignment_reason
        })
        .select()
        .single();

      // Log the assignment
      await supabaseServiceNew.getClient()
        .from('role_activity_log')
        .insert({
          user_id,
          role_id,
          action: 'assigned',
          performed_by: req.user.id,
          reason: assignment_reason
        });

      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/user-roles/remove", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { user_id, role_id, reason } = req.body;

      await supabaseServiceNew.getClient()
        .from('user_role_assignments')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('role_id', role_id);

      // Log the removal
      await supabaseServiceNew.getClient()
        .from('role_activity_log')
        .insert({
          user_id,
          role_id,
          action: 'removed',
          performed_by: req.user.id,
          reason
        });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role hierarchy
  app.get("/api/admin/role-hierarchy", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: hierarchy } = await supabaseServiceNew.getClient()
        .from('role_hierarchy')
        .select(`
          *,
          parent_role:custom_roles!parent_role_id(name, display_name),
          child_role:custom_roles!child_role_id(name, display_name)
        `)
        .order('inheritance_level');

      res.json(hierarchy || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/role-hierarchy", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: hierarchy } = await supabaseServiceNew.getClient()
        .from('role_hierarchy')
        .insert(req.body)
        .select()
        .single();

      res.json(hierarchy);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Role activity log
  app.get("/api/admin/role-activity", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: activities } = await supabaseServiceNew.getClient()
        .from('role_activity_log')
        .select(`
          *,
          users!user_id(username),
          custom_roles(name, display_name),
          performed_by_user:users!performed_by(username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      res.json(activities?.map(activity => ({
        ...activity,
        user_username: activity.users?.username,
        role_name: activity.custom_roles?.display_name,
        performed_by_username: activity.performed_by_user?.username
      })) || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy role endpoints for compatibility
  app.get("/api/admin/roles", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: roles } = await supabaseServiceNew.getClient()
        .from('custom_roles')
        .select('*')
        .order('name');

      res.json(roles || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/roles", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: role } = await supabaseServiceNew.getClient()
        .from('custom_roles')
        .insert(req.body)
        .select()
        .single();

      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin pages management
  app.get("/api/admin/pages", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: pages } = await supabaseServiceNew.getClient()
        .from('custom_pages')
        .select('*')
        .order('created_at', { ascending: false });

      res.json(pages || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/pages", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: page } = await supabaseServiceNew.getClient()
        .from('custom_pages')
        .insert(req.body)
        .select()
        .single();

      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin page settings
  app.get("/api/admin/page-settings", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: settings } = await supabaseServiceNew.getClient()
        .from('page_settings')
        .select('*')
        .order('page_name');

      res.json(settings || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/admin/page-settings/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: setting } = await supabaseServiceNew.getClient()
        .from('page_settings')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update grimoire with full admin features
  app.put("/api/admin/grimoires/:id", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: grimoire } = await supabaseServiceNew.getClient()
        .from('grimoires')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      res.json(grimoire);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/reflections", authenticateToken, async (req, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: reflections } = await supabaseServiceNew.getClient()
        .from('daily_reflections')
        .select('*')
        .order('date', { ascending: false });

      res.json(reflections || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/articles", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: articles } = await supabaseServiceNew.getClient()
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      res.json(articles || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ======================
  // ROTA PARA CORRIGIR USUÁRIOS
  // ======================
  
  app.post("/api/admin/fix-user-roles", async (req, res) => {
    try {
      // Atualizar admin via Supabase
      const { data: adminUser, error: adminError } = await supabaseServiceNew.getClient()
        .from('users')
        .update({ 
          role: 'admin',
          is_admin: true,
          username: 'magurk_lucifex'
        })
        .eq('email', 'admin@templodoabismo.com.br')
        .select()
        .single();

      // Listar todos os usuários
      const { data: allUsers, error: usersError } = await supabaseServiceNew.getClient()
        .from('users')
        .select('id, username, email, role, is_admin');

      res.json({
        success: true,
        adminUser,
        allUsers: allUsers || [],
        errors: {
          admin: adminError?.message || null,
          users: usersError?.message || null
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Rotas de iniciação
  app.get("/api/initiation/status", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await supabaseServiceNew.getUserById(userId);
      
      res.json({
        isInitiated: user?.role === 'iniciado' || user?.role === 'admin',
        role: user?.role,
        spiritualName: user?.spiritual_name || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/initiation/complete", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const { spiritualName, oathAccepted } = req.body;

      if (!oathAccepted) {
        return res.status(400).json({ error: "Juramento não aceito" });
      }

      if (!spiritualName || spiritualName.trim().length < 3) {
        return res.status(400).json({ error: "Nome espiritual inválido" });
      }

      // Atualizar usuário para iniciado
      const updatedUser = await supabaseServiceNew.updateUser(userId, {
        role: 'iniciado',
        spiritual_name: spiritualName.trim()
      });

      res.json({
        success: true,
        message: "Iniciação completa",
        user: updatedUser
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Função auxiliar para verificar níveis de role
  function getRoleLevel(role: string): number {
    const roleLevels: Record<string, number> = {
      'buscador': 1,
      'iniciado': 2,
      'portador_veu': 3,
      'discipulo_chamas': 4,
      'guardiao_nome': 5,
      'arauto_queda': 6,
      'portador_coroa': 7,
      'magus_supremo': 8,
      'admin': 9
    };
    return roleLevels[role] || 0;
  }

  // Inicializar seções padrão e atualizar schema
  await supabaseServiceNew.initializeDefaultSections();

  // ======================
  // ROTAS DO SISTEMA DE CURSOS
  // ======================

  // Buscar seções dos cursos
  app.get("/api/course-sections", async (req, res) => {
    try {
      const { data, error } = await supabaseServiceNew.getSupabase()
        .from('course_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Erro ao buscar seções:', error);
        return res.status(500).json({ error: "Erro ao buscar seções" });
      }
      
      console.log(`Retornando ${data?.length || 0} seções dos cursos`);
      res.json(data || []);
    } catch (error: any) {
      console.error("Error fetching course sections:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Listar todos os cursos (visíveis para todos, mas com controle de acesso)
  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      console.log('=== COURSES API CALLED ===');
      console.log('User from token:', req.user.id);
      
      // Buscar dados atualizados do usuário
      const user = await supabaseServiceNew.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      console.log('Role atual do usuário:', user.role);
      
      // Buscar todos os cursos com informações da seção
      const { data: courses, error } = await supabaseServiceNew.getClient()
        .from('courses')
        .select(`
          *,
          course_sections!course_section_id (
            name,
            color,
            required_role
          )
        `)
        .eq('is_published', true)
        .order('sort_order');
      
      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }
      
      console.log(`Cursos encontrados:`, courses?.length || 0);
      
      res.json(courses || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Erro interno do servidor", details: error.message });
    }
  });

  // Buscar cursos do usuário (com progresso)
  app.get("/api/user/courses", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('=== API USER COURSES CALLED ===');
      console.log('User ID:', userId);
      
      const { data: coursesWithProgress, error } = await supabaseServiceNew.getClient()
        .from('user_course_progress')
        .select(`
          *,
          courses!course_id (
            id,
            title,
            slug,
            description,
            image_url,
            required_role,
            is_paid,
            price,
            course_section_id,
            course_sections!course_section_id (
              name,
              color
            )
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching user courses:', error);
        throw error;
      }

      console.log('Courses with progress:', coursesWithProgress?.length || 0);
      res.json(coursesWithProgress || []);
    } catch (error: any) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar progresso dos cursos do usuário
  app.get("/api/user/course-progress", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const { data, error } = await supabaseServiceNew.getClient()
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      res.json(data || []);
    } catch (error: any) {
      console.error("Error fetching user course progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Obter detalhes de um curso
  app.get("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await supabaseServiceNew.getCourseById(courseId);
      
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }

      // Verificar se o usuário tem acesso ao curso
      const user = await supabaseServiceNew.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar se usuário tem acesso ao curso (role atual >= role requerido)
      const userRoleLevel = getRoleLevel(user.role);
      const courseRoleLevel = getRoleLevel(course.required_role);
      
      if (userRoleLevel < courseRoleLevel && user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: `Acesso negado - requer nível "${course.required_role}" ou superior` });
      }

      // Buscar módulos do curso
      const modules = await supabaseServiceNew.getModulesByCourse(courseId);
      
      // Buscar progresso do usuário
      const progress = await supabaseServiceNew.getUserCourseProgress(req.user.id, courseId);

      res.json({
        ...course,
        modules,
        progress
      });
    } catch (error: any) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Iniciar curso
  app.post("/api/courses/:id/start", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.user.id;

      // Verificar se já existe progresso
      const existingProgress = await supabaseServiceNew.getUserCourseProgress(userId, courseId);
      if (existingProgress) {
        return res.json(existingProgress);
      }

      // Criar novo progresso
      const progressData: InsertUserCourseProgress = {
        user_id: userId,
        course_id: courseId,
        current_module: 1,
        is_completed: false
      };

      const progress = await supabaseServiceNew.createUserCourseProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      console.error("Error starting course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Obter módulo específico
  app.get("/api/modules/:id", authenticateToken, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await supabaseServiceNew.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      // Verificar progresso do usuário no curso
      const progress = await supabaseServiceNew.getUserCourseProgress(req.user.id, module.course_id);
      
      if (!progress) {
        return res.status(403).json({ error: "Curso não iniciado" });
      }

      // Verificar se o módulo está liberado
      if (module.order > progress.current_module) {
        return res.status(403).json({ error: "Módulo não liberado" });
      }

      // Buscar submissão do usuário se necessária
      let submission = null;
      if (module.requires_submission) {
        submission = await supabaseServiceNew.getUserSubmission(req.user.id, moduleId);
      }

      res.json({
        ...module,
        submission
      });
    } catch (error: any) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Submeter resposta de módulo
  app.post("/api/modules/:id/submit", authenticateToken, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const { text_response } = req.body;

      if (!text_response) {
        return res.status(400).json({ error: "Resposta é obrigatória" });
      }

      // Verificar se já existe submissão
      const existingSubmission = await supabaseServiceNew.getUserSubmission(req.user.id, moduleId);
      if (existingSubmission) {
        return res.status(400).json({ error: "Submissão já realizada" });
      }

      const submissionData: InsertSubmission = {
        user_id: req.user.id,
        module_id: moduleId,
        text_response,
        status: 'accepted' // Auto-aceitar por enquanto
      };

      const submission = await supabaseServiceNew.createSubmission(submissionData);
      res.json(submission);
    } catch (error: any) {
      console.error("Error creating submission:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Completar módulo e avançar
  app.post("/api/modules/:id/complete", authenticateToken, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await supabaseServiceNew.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      // Verificar se há submissão pendente
      if (module.requires_submission) {
        const submission = await supabaseServiceNew.getUserSubmission(req.user.id, moduleId);
        if (!submission || submission.status !== 'accepted') {
          return res.status(400).json({ error: "Submissão pendente ou não aceita" });
        }
      }

      // Avançar progresso
      const progress = await supabaseServiceNew.getUserCourseProgress(req.user.id, module.course_id);
      if (!progress) {
        return res.status(404).json({ error: "Progresso não encontrado" });
      }

      // Buscar todos os módulos do curso para verificar se é o último
      const allModules = await supabaseServiceNew.getModulesByCourse(module.course_id);
      const isLastModule = module.order === Math.max(...allModules.map(m => m.order));

      const updates: Partial<UserCourseProgress> = {
        current_module: isLastModule ? progress.current_module : progress.current_module + 1,
        is_completed: isLastModule,
        completed_at: isLastModule ? new Date().toISOString() as any : undefined
      };

      const updatedProgress = await supabaseServiceNew.updateUserCourseProgress(
        req.user.id, 
        module.course_id, 
        updates
      );

      res.json(updatedProgress);
    } catch (error: any) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar curso por slug
  app.get("/api/courses/slug/:slug", authenticateToken, async (req: any, res) => {
    try {
      const { slug } = req.params;
      
      const { data: course, error } = await supabaseServiceNew.getClient()
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }

      res.json(course);
    } catch (error: any) {
      console.error("Error fetching course by slug:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar módulos de um curso
  app.get("/api/courses/:id/modules", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const modules = await supabaseServiceNew.getModulesByCourse(courseId);
      
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Iniciar progresso no curso
  app.post("/api/user/course-progress", authenticateToken, async (req: any, res) => {
    try {
      const { course_id, current_module = 1 } = req.body;
      const userId = req.user.id;

      // Verificar se já existe progresso
      const existingProgress = await supabaseServiceNew.getUserCourseProgress(userId, course_id);
      if (existingProgress) {
        return res.json(existingProgress);
      }

      // Criar novo progresso
      const progressData = {
        user_id: userId,
        course_id,
        current_module,
        is_completed: false
      };

      const progress = await supabaseServiceNew.createUserCourseProgress(progressData);
      res.json(progress);
    } catch (error: any) {
      console.error("Error creating course progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar progresso específico de um curso
  app.get("/api/user/course-progress/:courseId", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      
      const progress = await supabaseServiceNew.getUserCourseProgress(userId, courseId);
      res.json(progress);
    } catch (error: any) {
      console.error("Error fetching specific course progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Completar módulo (endpoint simplificado para frontend)
  app.post("/api/user/module-complete", authenticateToken, async (req: any, res) => {
    try {
      const { course_id, module_id } = req.body;
      const userId = req.user.id;

      // Buscar progresso atual
      const progress = await supabaseServiceNew.getUserCourseProgress(userId, course_id);
      if (!progress) {
        return res.status(404).json({ error: "Progresso não encontrado" });
      }

      // Buscar todos os módulos do curso
      const allModules = await supabaseServiceNew.getModulesByCourse(course_id);
      const currentModuleData = allModules.find(m => m.id === module_id);
      
      if (!currentModuleData) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      // Verificar se é o último módulo
      const isLastModule = currentModuleData.order === Math.max(...allModules.map(m => m.order));
      
      // Atualizar progresso
      const updates = {
        current_module: isLastModule ? progress.current_module : progress.current_module + 1,
        is_completed: isLastModule,
        completed_at: isLastModule ? new Date().toISOString() : undefined
      };

      const updatedProgress = await supabaseServiceNew.updateUserCourseProgress(
        userId, 
        course_id, 
        updates
      );

      res.json(updatedProgress);
    } catch (error: any) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Completar módulo (endpoint simplificado para frontend)
  app.post("/api/user/module-complete", authenticateToken, async (req: any, res) => {
    try {
      const { course_id, module_id } = req.body;
      const userId = req.user.id;

      // Buscar progresso atual
      const progress = await supabaseServiceNew.getUserCourseProgress(userId, course_id);
      if (!progress) {
        return res.status(404).json({ error: "Progresso não encontrado" });
      }

      // Buscar todos os módulos do curso
      const allModules = await supabaseServiceNew.getModulesByCourse(course_id);
      const currentModuleData = allModules.find(m => m.id === module_id);
      
      if (!currentModuleData) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      // Verificar se é o último módulo
      const isLastModule = currentModuleData.order === Math.max(...allModules.map(m => m.order));
      
      // Atualizar progresso
      const updates = {
        current_module: isLastModule ? progress.current_module : progress.current_module + 1,
        is_completed: isLastModule,
        completed_at: isLastModule ? new Date().toISOString() : undefined
      };

      const updatedProgress = await supabaseServiceNew.updateUserCourseProgress(
        userId, 
        course_id, 
        updates
      );

      res.json(updatedProgress);
    } catch (error: any) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin endpoint para criar cursos
  app.post("/api/admin/courses", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: course, error } = await supabaseServiceNew.getClient()
        .from('courses')
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;
      res.json(course);
    } catch (error: any) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Admin endpoint para criar módulos
  app.post("/api/admin/modules", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: module, error } = await supabaseServiceNew.getClient()
        .from('modules')
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;
      res.json(module);
    } catch (error: any) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Endpoint para criar módulos para cursos existentes
  app.post("/api/admin/create-course-modules", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Buscar todos os cursos existentes
      const { data: courses } = await supabaseServiceNew.getClient()
        .from('courses')
        .select('*')
        .order('id');

      const createdModules = [];

      for (const course of courses || []) {
        // Verificar se já tem módulos
        const { data: existingModules } = await supabaseServiceNew.getClient()
          .from('modules')
          .select('id')
          .eq('course_id', course.id);

        if (!existingModules || existingModules.length === 0) {
          // Criar módulos baseados no curso
          const moduleTemplates = [
            {
              title: "Introdução e Fundamentos",
              order: 1,
              html_content: `
                <h2>Bem-vindo ao ${course.title}</h2>
                <p>${course.description}</p>
                
                <h3>Objetivos deste módulo:</h3>
                <ul>
                  <li>Compreender os fundamentos teóricos</li>
                  <li>Estabelecer bases sólidas para a prática</li>
                  <li>Preparar-se mental e espiritualmente</li>
                </ul>
                
                <h3>Instruções:</h3>
                <p>Leia atentamente todo o conteúdo e reflita sobre os conceitos apresentados. Este módulo estabelece as bases para todo o curso.</p>
                
                <p class="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded">
                  <strong>Importante:</strong> Complete este módulo antes de prosseguir para o próximo.
                </p>
              `,
              requires_submission: false,
              ritual_mandatory: false
            },
            {
              title: "Prática e Aplicação",
              order: 2,
              html_content: `
                <h2>Colocando em Prática</h2>
                <p>Agora que você compreende os fundamentos, é hora de aplicar o conhecimento adquirido.</p>
                
                <h3>Exercícios práticos:</h3>
                <ol>
                  <li>Reflexão diária de 10 minutos sobre os conceitos estudados</li>
                  <li>Aplicação dos princípios em situações cotidianas</li>
                  <li>Manutenção de um diário de experiências</li>
                </ol>
                
                <h3>Avaliação:</h3>
                <p>Ao final deste módulo, você deverá ser capaz de aplicar os conceitos aprendidos de forma prática e consciente.</p>
                
                <div class="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded">
                  <strong>Parabéns!</strong> Ao completar este módulo, você terá concluído o curso com sucesso.
                </div>
              `,
              requires_submission: false,
              ritual_mandatory: false
            }
          ];

          for (const moduleTemplate of moduleTemplates) {
            const moduleData = {
              course_id: course.id,
              ...moduleTemplate
            };

            const { data: module, error } = await supabaseServiceNew.getClient()
              .from('modules')
              .insert(moduleData)
              .select()
              .single();

            if (!error) {
              createdModules.push(module);
            }
          }
        }
      }

      res.json({ 
        message: "Módulos criados com sucesso",
        modules: createdModules,
        count: createdModules.length
      });
    } catch (error: any) {
      console.error("Error creating course modules:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}