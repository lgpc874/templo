import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SupabaseDirect } from "./supabase-direct";

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

  if (token == null) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err: any, decoded: any) => {
    if (err) {
      console.error('Erro na verificação do token:', err);
      return res.status(403).json({ error: 'Token inválido' });
    }

    try {
      console.log('Token decodificado:', decoded);
      req.user = decoded;
      
      // Adicionar flags de admin para emails específicos
      if (decoded.email === 'admin@templodoabismo.com.br') {
        console.log('Admin detectado, flags adicionadas');
        req.user.isAdmin = true;
        req.user.role = 'magus_supremo';
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de autenticação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
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

  app.get("/api/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      console.log('=== FETCHING COURSE BY ID ===');
      console.log('Course ID:', courseId);
      
      const course = await SupabaseDirect.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Curso não encontrado" });
      }

      console.log('Course found:', course.title);
      res.json(course);
    } catch (error: any) {
      console.error("Error fetching course:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  app.get("/api/courses/:id/modules", authenticateToken, async (req: any, res) => {
    try {
      const courseId = parseInt(req.params.id);
      console.log('=== BUSCANDO MÓDULOS DO CURSO ===');
      console.log('Course ID:', courseId);
      
      const modules = await SupabaseDirect.getCourseModules(courseId);
      console.log('Módulos encontrados:', modules.length);
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching course modules:", error);
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

  return httpServer;
}