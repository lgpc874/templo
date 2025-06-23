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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
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
      
      const course = await SupabaseDirect.createCourse(req.body);

      if (!course) {
        console.error('Falha retornada pela função createCourse');
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

      const module = await SupabaseDirect.createModule(req.body);

      if (!module) {
        throw new Error('Falha ao criar módulo no Supabase');
      }
      
      res.json(module);
    } catch (error: any) {
      console.error("Error creating module:", error);
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

  return httpServer;
}