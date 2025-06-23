import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SupabaseDirect, supabase } from "./supabase-direct";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

// Middleware de autenticação
function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Para desenvolvimento, permitir acesso sem token para admin
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    // Usar a chave JWT correta do ambiente
    const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback-key';
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Token decodificado:', decoded);
    req.user = decoded;
    
    // Adicionar flags de admin para emails específicos
    if (decoded.email === 'admin@templodoabismo.com.br') {
      console.log('Admin detectado, flags adicionadas');
      req.user.isAdmin = true;
      req.user.role = 'magus_supremo';
    }
    
    next();
  } catch (err: any) {
    console.error('Erro na verificação do token:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', expired: true });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // =====================
  // ROTAS DE AUTENTICAÇÃO
  // =====================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data: RegisterData = registerSchema.parse(req.body);
      
      const existingUser = await SupabaseDirect.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email já está em uso" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await SupabaseDirect.createUser({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: 'buscador',
      });

      if (!newUser) {
        return res.status(500).json({ error: "Erro ao criar usuário" });
      }

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        },
        token
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data: LoginData = loginSchema.parse(req.body);
      const user = await SupabaseDirect.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );



      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          spiritual_name: user.spiritual_name
        },
        token
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await SupabaseDirect.getUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      console.log('Role atual no banco:', user.role);

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          spiritual_name: user.spiritual_name,
          isAdmin: user.email === 'admin@templodoabismo.com.br'
        }
      });
    } catch (error: any) {
      console.error("Auth me error:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // =====================
  // ROTAS DE TESTE SUPABASE
  // =====================

  app.get("/api/test-supabase", async (req, res) => {
    try {
      console.log('=== TESTE DE CONEXÃO SUPABASE ===');
      const result = await SupabaseDirect.testConnection();
      console.log('Resultado do teste:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error testing Supabase:", error);
      res.status(500).json({ error: error.message });
    }
  });



  // =====================
  // ROTAS DE COURSE SECTIONS
  // =====================

  app.get("/api/course-sections", async (req, res) => {
    try {
      const data = await SupabaseDirect.getCourseSections();
      console.log(`Retornando ${data.length} seções dos cursos`);
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching course sections:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====================
  // ROTAS DE COURSES
  // =====================

  app.get("/api/courses", authenticateToken, async (req: any, res) => {
    try {
      console.log('=== COURSES API CALLED ===');
      console.log('User from token:', req.user.id);
      
      const user = await SupabaseDirect.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      console.log('Role atual do usuário:', user.role);
      
      const courses = await SupabaseDirect.getAllCourses();
      console.log('Courses fetched:', courses.length);
      res.json(courses);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/:idOrSlug", authenticateToken, async (req: any, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      console.log('=== FETCHING COURSE BY ID/SLUG ===');
      console.log('ID/Slug:', idOrSlug);
      
      let course;
      
      // Tentar buscar por ID numérico primeiro
      if (!isNaN(parseInt(idOrSlug))) {
        const courseId = parseInt(idOrSlug);
        course = await SupabaseDirect.getCourseById(courseId);
      } else {
        // Buscar por slug
        course = await SupabaseDirect.getCourseBySlug(idOrSlug);
      }
      
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }

      console.log('Course found:', course.title);
      
      // Verificar permissões de acesso
      const user = await SupabaseDirect.getUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      // Admin tem acesso a tudo
      if (user.email === 'admin@templodoabismo.com.br') {
        return res.json(course);
      }
      
      // Verificar se o usuário tem o role necessário
      const hasAccess = checkRoleAccess(user.role, course.required_role);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: "Acesso negado. Role insuficiente para este curso.",
          userRole: user.role,
          requiredRole: course.required_role
        });
      }

      res.json(course);
    } catch (error: any) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/:idOrSlug/modules", authenticateToken, async (req: any, res) => {
    try {
      const idOrSlug = req.params.idOrSlug;
      console.log('=== BUSCANDO MÓDULOS DO CURSO ===');
      console.log('ID/Slug:', idOrSlug);
      
      let course;
      let courseId;
      
      // Tentar buscar curso por ID ou slug
      if (!isNaN(parseInt(idOrSlug))) {
        courseId = parseInt(idOrSlug);
        course = await SupabaseDirect.getCourseById(courseId);
      } else {
        course = await SupabaseDirect.getCourseBySlug(idOrSlug);
        courseId = course?.id;
      }
      
      if (!course || !courseId) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      // Verificar permissões de acesso
      const user = await SupabaseDirect.getUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }
      
      // Admin tem acesso a tudo
      if (user.email !== 'admin@templodoabismo.com.br') {
        const hasAccess = checkRoleAccess(user.role, course.required_role);
        
        if (!hasAccess) {
          return res.status(403).json({ 
            error: "Acesso negado. Role insuficiente para este curso.",
            userRole: user.role,
            requiredRole: course.required_role
          });
        }
      }
      
      const modules = await SupabaseDirect.getCourseModules(courseId);
      console.log('Módulos encontrados:', modules.length);
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching course modules:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====================
  // ROTAS DE PROGRESSO DO USUÁRIO
  // =====================

  // Buscar todos os progressos do usuário
  app.get("/api/user/course-progress", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('=== FETCHING ALL USER PROGRESS ===');
      console.log('User ID:', userId);
      
      const { data: progress, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user progress:', error);
        return res.status(500).json({ error: "Erro ao buscar progresso" });
      }
      
      res.json(progress || []);
    } catch (error: any) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar progresso específico de um curso
  app.get("/api/user/course-progress/:courseId", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user.id;
      console.log('=== FETCHING SPECIFIC COURSE PROGRESS ===');
      console.log('User ID:', userId, 'Course ID:', courseId);
      
      const { data: progress, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching specific progress:', error);
        return res.status(500).json({ error: "Erro ao buscar progresso" });
      }
      
      res.json(progress || null);
    } catch (error: any) {
      console.error("Error fetching specific course progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Criar/atualizar progresso do curso
  app.post("/api/user/course-progress", authenticateToken, async (req: any, res) => {
    try {
      const { course_id, current_module = 1, is_completed = false } = req.body;
      const userId = req.user.id;
      
      console.log('=== CREATING/UPDATING COURSE PROGRESS ===');
      console.log('User ID:', userId, 'Course ID:', course_id, 'Module:', current_module);
      
      // Verificar se já existe progresso
      const { data: existingProgress } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', course_id)
        .single();
      
      let result;
      
      if (existingProgress) {
        // Atualizar progresso existente
        const updates: any = {
          current_module,
          is_completed
        };
        
        if (is_completed) {
          updates.completed_at = new Date().toISOString();
        }
        
        const { data, error } = await supabase
          .from('user_course_progress')
          .update(updates)
          .eq('user_id', userId)
          .eq('course_id', course_id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating progress:', error);
          return res.status(500).json({ error: "Erro ao atualizar progresso" });
        }
        
        result = data;
      } else {
        // Criar novo progresso
        const progressData: any = {
          user_id: userId,
          course_id,
          current_module,
          is_completed,
          started_at: new Date().toISOString()
        };
        
        if (is_completed) {
          progressData.completed_at = new Date().toISOString();
        }
        
        const { data, error } = await supabase
          .from('user_course_progress')
          .insert(progressData)
          .select()
          .single();
          
        if (error) {
          console.error('Error creating progress:', error);
          return res.status(500).json({ error: "Erro ao criar progresso" });
        }
        
        result = data;
      }
      
      console.log('Progress saved successfully:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error saving course progress:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar cursos do usuário (com progresso)
  app.get("/api/user/courses", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('=== FETCHING USER COURSES ===');
      console.log('User ID:', userId);
      
      const { data: coursesWithProgress, error } = await supabase
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
        return res.status(500).json({ error: "Erro ao buscar cursos do usuário" });
      }
      
      console.log('User courses found:', coursesWithProgress?.length || 0);
      res.json(coursesWithProgress || []);
    } catch (error: any) {
      console.error("Error fetching user courses:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Completar módulo
  app.post("/api/modules/:moduleId/complete", authenticateToken, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const userId = req.user.id;
      
      console.log('=== COMPLETING MODULE ===');
      console.log('User ID:', userId, 'Module ID:', moduleId);
      
      // Buscar progresso existente
      const { data: currentProgress } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', 1)
        .single();
      
      if (!currentProgress) {
        return res.status(404).json({ error: "Progresso não encontrado" });
      }
      
      // Calcular próximo módulo
      const totalModules = 4;
      const nextModule = Math.max(currentProgress.current_module, moduleId) + 1;
      const isLastModule = nextModule > totalModules;
      const finalModule = isLastModule ? totalModules : nextModule;
      
      console.log(`Current: ${currentProgress.current_module}, Next: ${finalModule}, IsLast: ${isLastModule}`);
      
      // Usar raw SQL para evitar problemas de schema cache
      const { data: updatedProgress, error: updateError } = await supabase.rpc('update_course_progress', {
        p_user_id: userId,
        p_course_id: 1,
        p_current_module: finalModule,
        p_is_completed: isLastModule
      });
        
      if (updateError) {
        console.error('RPC Error:', updateError);
        // Fallback para update direto
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_course_progress')
            .update({
              current_module: finalModule,
              is_completed: isLastModule
            })
            .eq('user_id', userId)
            .eq('course_id', 1)
            .select()
            .single();
            
          if (fallbackError) {
            console.error('Fallback update error:', fallbackError);
            return res.status(500).json({ error: "Erro ao atualizar progresso" });
          }
          
          res.json({ success: true, isLastModule, updatedProgress: fallbackData });
        } catch (fallbackErr) {
          return res.status(500).json({ error: "Erro interno do servidor" });
        }
      } else {
        res.json({ success: true, isLastModule, updatedProgress });
      }
      
    } catch (error: any) {
      console.error("Error completing module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar desafios de um módulo
  app.get("/api/modules/:moduleId/challenges", authenticateToken, async (req: any, res) => {
    try {
      // Por enquanto retorna array vazio, implementar quando necessário
      res.json([]);
    } catch (error: any) {
      console.error("Error fetching module challenges:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // =====================
  // ROTAS ADMIN
  // =====================

  app.get("/api/admin/courses", authenticateToken, async (req: any, res) => {
    try {
      console.log('=== ADMIN COURSES REQUEST ===');
      console.log('User:', req.user?.email);
      console.log('User ID:', req.user?.id);
      
      if (req.user?.email !== 'admin@templodoabismo.com.br') {
        console.log('Access denied - not admin user');
        return res.status(403).json({ error: "Acesso negado" });
      }

      console.log('Admin access confirmed, fetching courses...');

      const courses = await SupabaseDirect.getAdminCourses();
      console.log('Admin courses found:', courses.length);
      if (courses.length > 0) {
        console.log('First course:', courses[0].title);
      }
      
      res.json(courses);
    } catch (error: any) {
      console.error('Admin courses error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/courses", authenticateToken, async (req: any, res) => {
    try {
      console.log('=== CRIANDO CURSO ===');
      console.log('User:', req.user.email);
      console.log('Request body:', req.body);
      
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      console.log('Validação de admin passou, inserindo no Supabase...');
      
      // Criar curso usando conexão direta do Supabase
      const courseData = {
        title: req.body.title,
        slug: req.body.slug,
        description: req.body.description,
        required_role: req.body.required_role || 'buscador',
        price: req.body.price || 0,
        is_paid: req.body.is_paid || false,
        is_published: true,
        course_section_id: req.body.course_section_id || 1,
        sort_order: req.body.sort_order || 1,
        image_url: req.body.image_url || null,
        sequential_order: req.body.sequential_order || 1,
        is_sequential: req.body.is_sequential || false,
        reward_role_id: req.body.reward_role_id === 'none' ? null : req.body.reward_role_id
      };

      console.log('Dados para inserção:', courseData);

      // Usar SupabaseDirect que já tem a conexão correta
      const course = await SupabaseDirect.createCourse(courseData);

      if (!course) {
        throw new Error('Falha ao criar curso no Supabase');
      }

      console.log('Curso criado com sucesso:', course);
      res.json(course);
    } catch (error: any) {
      console.error("Error creating course:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor" });
    }
  });

  app.put("/api/admin/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const courseId = parseInt(req.params.id);
      const course = await SupabaseDirect.updateCourse(courseId, req.body);

      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      res.json(course);
    } catch (error: any) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const courseId = parseInt(req.params.id);
      const success = await SupabaseDirect.deleteCourse(courseId);

      if (!success) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/modules", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      console.log('=== CRIANDO MÓDULO ===');
      console.log('Dados recebidos:', req.body);

      const module = await SupabaseDirect.createModule(req.body);

      if (!module) {
        throw new Error('Falha ao criar módulo no Supabase');
      }
      
      console.log('Módulo criado com sucesso:', module);
      res.json(module);
    } catch (error: any) {
      console.error("Error creating module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Atualizar módulo
  app.put("/api/admin/modules/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const moduleId = parseInt(req.params.id);
      console.log('=== ATUALIZANDO MÓDULO ===');
      console.log('ID:', moduleId);
      console.log('Dados para atualização:', req.body);

      const updatedModule = await SupabaseDirect.updateModule(moduleId, req.body);

      if (!updatedModule) {
        console.error('Falha ao atualizar módulo no Supabase');
        return res.status(404).json({ error: "Módulo não encontrado ou falha na atualização" });
      }
      
      console.log('Módulo atualizado com sucesso:', updatedModule);
      res.json(updatedModule);
    } catch (error: any) {
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Deletar módulo
  app.delete("/api/admin/modules/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const moduleId = parseInt(req.params.id);
      console.log('=== DELETANDO MÓDULO ===');
      console.log('ID para deletar:', moduleId);

      const success = await SupabaseDirect.deleteModule(moduleId);

      if (!success) {
        console.error('Falha ao deletar módulo no Supabase');
        return res.status(404).json({ error: "Módulo não encontrado ou falha na exclusão" });
      }
      
      console.log('Módulo deletado com sucesso');
      res.json({ success: true, message: "Módulo deletado com sucesso" });
    } catch (error: any) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Função para verificar hierarquia de roles
  function checkRoleAccess(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = [
      'buscador',
      'iniciado', 
      'portador_veu',
      'discipulo_chamas',
      'guardiao_nome',
      'arauto_queda',
      'portador_coroa',
      'magus_supremo'
    ];
    
    const userLevel = roleHierarchy.indexOf(userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    return userLevel >= requiredLevel;
  }

  // =====================
  // ROTAS DE SUBMISSÕES E RITUAIS
  // =====================

  // Buscar submissões do usuário para um curso
  app.get('/api/user/submissions/:courseId', authenticateToken, async (req: any, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      const submissions = await SupabaseDirect.getUserSubmissions(userId, parseInt(courseId));
      res.json(submissions);
    } catch (error: any) {
      console.error("Erro ao buscar submissões:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar rituais do usuário para um curso
  app.get('/api/user/rituals/:courseId', authenticateToken, async (req: any, res: Response) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      const rituals = await SupabaseDirect.getUserRituals(userId, parseInt(courseId));
      res.json(rituals);
    } catch (error: any) {
      console.error("Erro ao buscar rituais:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Criar submissão
  app.post('/api/user/submit', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { module_id, submission_text } = req.body;

      const submission = await SupabaseDirect.createSubmission({
        user_id: userId,
        module_id,
        submission_text
      });

      if (!submission) {
        throw new Error('Falha ao criar submissão');
      }

      res.json(submission);
    } catch (error: any) {
      console.error("Erro ao criar submissão:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Registrar ritual/desafio
  app.post('/api/user/ritual', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { module_id, ritual_description, ritual_date, ritual_notes } = req.body;

      const ritual = await SupabaseDirect.createRitual({
        user_id: userId,
        module_id,
        challenge_description: ritual_description,
        challenge_date: ritual_date,
        challenge_notes: ritual_notes,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (!ritual) {
        throw new Error('Falha ao registrar ritual');
      }

      res.json(ritual);
    } catch (error: any) {
      console.error("Erro ao registrar ritual:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Finalizar módulo com requisitos de conclusão
  app.post('/api/modules/complete', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { module_id, completed_requirements, requirement_data } = req.body;

      // Registrar conclusão do módulo
      const completion = await SupabaseDirect.completeModule({
        user_id: userId,
        module_id,
        completed_requirements: JSON.stringify(completed_requirements),
        requirement_data: JSON.stringify(requirement_data),
        completed_at: new Date().toISOString()
      });

      if (!completion) {
        throw new Error('Falha ao registrar conclusão do módulo');
      }

      res.json(completion);
    } catch (error: any) {
      console.error("Erro ao finalizar módulo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // ROTAS DE GRIMÓRIOS
  // =====================

  // Rota para buscar grimórios do usuário (aba perfil)
  app.get("/api/user/grimoires", authenticateToken, async (req: any, res) => {
    try {
      console.log('=== USER GRIMOIRES REQUEST ===');
      console.log('User ID:', req.user.id);
      
      const { data: grimoires, error } = await supabase
        .from('grimoires')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar grimórios do usuário:', error);
        console.error('Detalhes do erro:', error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log('Total de grimórios encontrados:', grimoires?.length || 0);
      if (grimoires && grimoires.length > 0) {
        console.log('Primeiro grimório:', grimoires[0].title);
        console.log('Status publicado:', grimoires[0].is_published);
      }
      
      res.json(grimoires || []);
    } catch (error: any) {
      console.error("Error fetching user grimoires:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar todos os grimórios (página libri)
  app.get("/api/grimoires", async (req, res) => {
    try {
      console.log('=== ALL GRIMOIRES REQUEST ===');
      
      // Primeiro tentar buscar com JOIN
      let { data: grimoires, error } = await supabase
        .from('grimoires')
        .select(`
          *,
          library_sections!inner(name, color)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Erro no JOIN, tentando busca simples:', error.message);
        // Se falhar, buscar sem JOIN
        const { data: simpleGrimoires, error: simpleError } = await supabase
          .from('grimoires')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
          
        if (simpleError) {
          console.error('Erro ao buscar grimórios:', simpleError);
          return res.json([]);
        }
        grimoires = simpleGrimoires;
      }

      console.log('Grimórios públicos encontrados:', grimoires?.length || 0);
      if (grimoires && grimoires.length > 0) {
        console.log('Primeiro grimório:', grimoires[0].title);
      }
      res.json(grimoires || []);
    } catch (error: any) {
      console.error("Error fetching grimoires:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar grimório específico por ID
  app.get("/api/grimoires/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('=== GRIMOIRE BY ID REQUEST ===');
      console.log('Grimoire ID:', id);

      const { data: grimoire, error } = await supabase
        .from('grimoires')
        .select(`
          *,
          library_sections(name, color)
        `)
        .eq('id', id)
        .single();

      if (error || !grimoire) {
        console.error('Grimório não encontrado:', error);
        return res.status(404).json({ error: "Grimório não encontrado" });
      }

      console.log('Grimório encontrado:', grimoire.title);
      res.json(grimoire);
    } catch (error: any) {
      console.error("Error fetching grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar seções da biblioteca
  app.get("/api/library/sections", async (req, res) => {
    try {
      console.log('=== LIBRARY SECTIONS REQUEST ===');
      
      const { data: sections, error } = await supabase
        .from('library_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Erro ao buscar seções:', error);
        return res.json([]);
      }

      console.log('Seções encontradas:', sections?.length || 0);
      res.json(sections || []);
    } catch (error: any) {
      console.error("Error fetching library sections:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para buscar progresso do grimório do usuário
  app.get('/api/user/grimoire-progress/:grimoireId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const grimoireId = parseInt(req.params.grimoireId);
      
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const { data: progress, error } = await supabase
        .from('user_grimoire_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('grimoire_id', grimoireId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar progresso:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json(progress || { current_page: 1, total_pages: 1, progress_percentage: 0 });
    } catch (error) {
      console.error('Erro ao buscar progresso do grimório:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Rota para salvar progresso do grimório do usuário
  app.post('/api/user/grimoire-progress/:grimoireId', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const grimoireId = parseInt(req.params.grimoireId);
      const { current_page, total_pages, progress_percentage } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const { data: progress, error } = await supabase
        .from('user_grimoire_progress')
        .upsert({
          user_id: userId,
          grimoire_id: grimoireId,
          current_page,
          total_pages,
          progress_percentage,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,grimoire_id' 
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar progresso:', error);
        return res.status(500).json({ error: error.message });
      }
      
      res.json(progress);
    } catch (error) {
      console.error('Erro ao salvar progresso do grimório:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // =====================
  // ROTAS ADMIN GRIMÓRIOS
  // =====================

  // Rota para criar grimório
  app.post("/api/admin/grimoires", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: grimoire, error } = await supabase
        .from('grimoires')
        .insert([req.body])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar grimório:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json(grimoire);
    } catch (error: any) {
      console.error("Error creating grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para atualizar grimório
  app.put("/api/admin/grimoires/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: grimoire, error } = await supabase
        .from('grimoires')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar grimório:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json(grimoire);
    } catch (error: any) {
      console.error("Error updating grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para excluir grimório
  app.delete("/api/admin/grimoires/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { error } = await supabase
        .from('grimoires')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        console.error('Erro ao excluir grimório:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting grimoire:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // ROTAS ADMIN SEÇÕES
  // =====================

  // Rota para criar seção
  app.post("/api/admin/library-sections", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: section, error } = await supabase
        .from('library_sections')
        .insert([req.body])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar seção:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json(section);
    } catch (error: any) {
      console.error("Error creating section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para atualizar seção
  app.put("/api/admin/library-sections/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { data: section, error } = await supabase
        .from('library_sections')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar seção:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json(section);
    } catch (error: any) {
      console.error("Error updating section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para excluir seção
  app.delete("/api/admin/library-sections/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.email !== 'admin@templodoabismo.com.br') {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { error } = await supabase
        .from('library_sections')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        console.error('Erro ao excluir seção:', error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting section:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ===========================================
  // ORACLE ROUTES
  // ===========================================

  // Buscar oráculos ativos para usuários
  app.get('/api/oracles/active', authenticateToken, async (req: any, res: Response) => {
    try {
      console.log('=== BUSCANDO ORÁCULOS ATIVOS ===');
      const oracles = await SupabaseDirect.getActiveOracles();
      console.log(`Oráculos encontrados: ${oracles.length}`);
      if (oracles.length > 0) {
        console.log('Primeiro oráculo:', oracles[0].name);
      }
      res.json(oracles);
    } catch (error) {
      console.error('Erro ao buscar oráculos ativos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar oráculo específico
  app.get('/api/oracles/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      const oracle = await SupabaseDirect.getOracleById(parseInt(req.params.id));
      if (!oracle) {
        return res.status(404).json({ error: 'Oráculo não encontrado' });
      }
      res.json(oracle);
    } catch (error) {
      console.error('Erro ao buscar oráculo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar sessão de oráculo
  app.post('/api/oracles/:id/session', authenticateToken, async (req: any, res: Response) => {
    try {
      const { userName, birthDate } = req.body;
      
      if (!userName || !birthDate) {
        return res.status(400).json({ error: 'Nome e data de nascimento são obrigatórios' });
      }

      const oracle = await SupabaseDirect.getOracleById(parseInt(req.params.id));
      if (!oracle) {
        return res.status(404).json({ error: 'Oráculo não encontrado' });
      }

      const session = await SupabaseDirect.createOracleSession({
        oracle_id: oracle.id,
        user_id: req.user.id,
        user_name: userName,
        birth_date: birthDate
      });

      if (!session) {
        return res.status(500).json({ error: 'Erro ao criar sessão' });
      }

      res.json(session);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar sessão por token
  app.get('/api/oracles/session/:token', authenticateToken, async (req: any, res: Response) => {
    try {
      const session = await SupabaseDirect.getOracleSession(req.params.token);
      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }
      res.json(session);
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar mensagens da sessão
  app.get('/api/oracles/messages/:sessionId', authenticateToken, async (req: any, res: Response) => {
    try {
      const messages = await SupabaseDirect.getSessionMessages(parseInt(req.params.sessionId));
      res.json(messages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Chat com IA
  app.post('/api/oracles/chat', authenticateToken, async (req: any, res: Response) => {
    try {
      const { sessionToken, message } = req.body;

      if (!sessionToken || !message) {
        return res.status(400).json({ error: 'Token da sessão e mensagem são obrigatórios' });
      }

      const session = await SupabaseDirect.getOracleSession(sessionToken);
      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }

      const oracle = await SupabaseDirect.getOracleById(session.oracle_id);
      if (!oracle) {
        return res.status(404).json({ error: 'Oráculo não encontrado' });
      }

      // Verificar se precisa de pagamento
      const userRole = req.user.role || '';
      const isFree = oracle.free_roles.includes(userRole) || !oracle.is_paid;
      
      if (!isFree && oracle.price > 0) {
        return res.status(402).json({ error: 'Pagamento necessário', price: oracle.price });
      }

      // Salvar mensagem do usuário
      await SupabaseDirect.addOracleMessage({
        session_id: session.id,
        is_user: true,
        message: message,
        tokens_used: 0,
        cost: 0
      });

      // Configurar prompt para IA
      const aiPrompt = `${oracle.ai_instructions}

Informações da consulta:
- Nome: ${session.user_name}
- Data de nascimento: ${session.birth_date}
- Pergunta: ${message}

Responda de forma mística, profunda e ritualística, sempre contextualizando com o nome e data de nascimento da pessoa.`;

      // Integração com OpenAI
      let aiResponse = '';
      try {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey) {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [
                { role: 'system', content: aiPrompt },
                { role: 'user', content: message }
              ],
              max_tokens: 500,
              temperature: 0.8
            })
          });

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.choices[0]?.message?.content || 'Erro na resposta da IA';
          } else {
            throw new Error('Erro na API OpenAI');
          }
        } else {
          throw new Error('Chave OpenAI não configurada');
        }
      } catch (error) {
        console.log('Usando resposta simulada:', error);
        aiResponse = `Salve, ${session.user_name}, nascido(a) sob as influências de ${session.birth_date}...

As energias que emanam de sua essência revelam através do ${oracle.name} que sua pergunta ecoa pelos corredores do tempo...

${message.toLowerCase().includes('amor') || message.toLowerCase().includes('relacionamento') ? 
  'Os ventos do coração sussurram que transformações profundas se aproximam em sua jornada afetiva.' :
  message.toLowerCase().includes('trabalho') || message.toLowerCase().includes('carreira') ?
  'As chamas do progresso indicam que novos caminhos profissionais se manifestarão em breve.' :
  message.toLowerCase().includes('saúde') ?
  'As águas da cura fluem em sua direção, trazendo renovação e vitalidade para seu ser.' :
  'Os mistérios se revelam gradualmente àqueles que buscam com sinceridade.'
}

Configure a chave OpenAI no painel admin para ativar respostas completas da IA.

Que os mistérios se revelem em sua jornada espiritual.`;
      }

      // Salvar resposta da IA
      await SupabaseDirect.addOracleMessage({
        session_id: session.id,
        is_user: false,
        message: aiResponse,
        tokens_used: 150,
        cost: isFree ? 0 : oracle.price
      });

      // Atualizar atividade da sessão
      await SupabaseDirect.updateSessionActivity(sessionToken);

      res.json({ message: aiResponse });
    } catch (error) {
      console.error('Erro no chat:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // ===========================================
  // ADMIN ORACLE ROUTES
  // ===========================================

  // Buscar todos os oráculos (admin)
  app.get('/api/admin/oracles', authenticateToken, async (req: any, res: Response) => {
    try {
      console.log('=== ADMIN ORÁCULOS REQUEST ===');
      console.log('User role:', req.user.role);
      
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        console.log('Acesso negado - role insuficiente');
        return res.status(403).json({ error: 'Acesso negado' });
      }

      console.log('Buscando todos os oráculos...');
      const oracles = await SupabaseDirect.getAllOracles();
      console.log(`Total de oráculos encontrados: ${oracles.length}`);
      
      if (oracles.length > 0) {
        console.log('Primeiro oráculo:', oracles[0]);
      }
      
      res.json(oracles);
    } catch (error) {
      console.error('Erro ao buscar oráculos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Criar oráculo (admin)
  app.post('/api/admin/oracles', authenticateToken, async (req: any, res: Response) => {
    try {
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const oracle = await SupabaseDirect.createOracle(req.body);
      if (!oracle) {
        return res.status(500).json({ error: 'Erro ao criar oráculo' });
      }

      res.json(oracle);
    } catch (error) {
      console.error('Erro ao criar oráculo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Atualizar oráculo (admin)
  app.put('/api/admin/oracles/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const oracle = await SupabaseDirect.updateOracle(parseInt(req.params.id), req.body);
      if (!oracle) {
        return res.status(404).json({ error: 'Oráculo não encontrado' });
      }

      res.json(oracle);
    } catch (error) {
      console.error('Erro ao atualizar oráculo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Deletar oráculo (admin)
  app.delete('/api/admin/oracles/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const success = await SupabaseDirect.deleteOracle(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'Oráculo não encontrado' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar oráculo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Buscar configuração dos oráculos (admin)
  app.get('/api/admin/oracles/config', authenticateToken, async (req: any, res: Response) => {
    try {
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const config = await SupabaseDirect.getOracleConfig();
      res.json(config);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Atualizar configuração dos oráculos (admin)
  app.put('/api/admin/oracles/config', authenticateToken, async (req: any, res: Response) => {
    try {
      if (!checkRoleAccess(req.user.role, 'magus_supremo')) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const config = await SupabaseDirect.updateOracleConfig(req.body);
      if (!config) {
        return res.status(500).json({ error: 'Erro ao atualizar configuração' });
      }

      res.json(config);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  return httpServer;
}