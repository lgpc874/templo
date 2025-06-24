import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente Supabase com service role para acesso total
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

if (!supabase) {
  throw new Error('Supabase client não pôde ser inicializado. Verifique as variáveis de ambiente.');
}

if (supabase) {
  console.log('✅ Supabase conectado com credenciais válidas');
  
  // Teste inicial de conectividade
  supabase.from('users').select('count', { count: 'exact', head: true })
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Erro na conexão inicial com Supabase:', error.message);
      } else {
        console.log('🔄 Conexão com Supabase verificada - banco acessível');
      }
    });
} else {
  console.warn('⚠️  Aguardando configuração das credenciais do Supabase no arquivo .env');
}

// Tipos básicos
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  spiritual_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  required_role: string;
  is_published: boolean;
  price: number;
  is_paid: boolean;
  sort_order: number;
  course_section_id: number;
  sequential_order?: number;
  is_sequential?: boolean;
  reward_role_id?: string;
  reward_badge_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseSection {
  id: number;
  name: string;
  description?: string;
  required_role: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  html_content: string;
  order_number: number;
  requires_submission?: boolean;
  ritual_mandatory?: boolean;
  submission_text?: string;
  ritual_text?: string;
  custom_css?: string;
  submission_position?: 'before' | 'after'; // Posição da submissão
  completion_requirements?: string; // JSON com requisitos de conclusão
  interactive_elements?: string; // JSON com elementos interativos
  created_at?: string;
  updated_at?: string;
}

export interface CourseSubmission {
  id: number;
  user_id: number;
  module_id: number;
  submission_text: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: number;
  reviewer_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CourseChallenge {
  id: number;
  user_id: number;
  module_id: number;
  challenge_description: string;
  challenge_date: string;
  challenge_notes?: string;
  status: 'completed' | 'verified' | 'rejected';
  completed_at: string;
  verified_at?: string;
  verifier_id?: number;
  verifier_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Oracle {
  id: number;
  name: string;
  latin_name: string;
  description?: string;
  icon_url?: string;
  theme_color: string;
  is_active: boolean;
  is_paid: boolean;
  price: number;
  free_roles: string[];
  restricted_roles: string[];
  role_discounts: any;
  sort_order: number;
  ai_personality?: string;
  ai_instructions?: string;
  auto_presentation: boolean;
  custom_presentation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OracleSession {
  id: number;
  oracle_id: number;
  user_id: number;
  user_name: string;
  birth_date: string;
  session_token: string;
  started_at: string;
  last_activity: string;
  is_active: boolean;
}

export interface OracleMessage {
  id: number;
  session_id: number;
  is_user: boolean;
  message: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

export interface OracleConfig {
  id: number;
  openai_api_key?: string;
  default_model: string;
  max_tokens: number;
  temperature: number;
  updated_at: string;
}

// Funções diretas do Supabase
export class SupabaseDirect {
  
  static async testConnection(): Promise<{ status: string; details: any }> {
    if (!supabase) {
      return { 
        status: 'error', 
        details: 'Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env' 
      };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        return { status: 'error', details: error };
      }
      
      return { status: 'success', details: 'Conexão direta com Supabase funcionando' };
    } catch (error) {
      return { status: 'error', details: error };
    }
  }

  // Usuários
  static async getUserById(id: number): Promise<User | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async createUser(userData: Partial<User>): Promise<User | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  // Course Sections
  static async getCourseSections(): Promise<CourseSection[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('course_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error || !data) return [];
    return data;
  }

  // Courses
  static async getAllCourses(): Promise<Course[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_sections(
          name,
          color
        )
      `)
      .eq('is_published', true)
      .order('sort_order');
    
    if (error || !data) return [];
    return data;
  }

  static async getAdminCourses(): Promise<Course[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_sections(
          name,
          color
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data;
  }

  static async getCourseById(id: number): Promise<Course | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_sections(
          name,
          color,
          required_role
        )
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async getCourseBySlug(slug: string): Promise<Course | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_sections(
          name,
          color,
          required_role
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async createCourse(courseData: Partial<Course>): Promise<Course | null> {
    if (!supabase) {
      console.error('Supabase não está inicializado');
      return null;
    }

    try {
      // Dados básicos obrigatórios
      const cleanData = {
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description,
        required_role: courseData.required_role || 'buscador',
        price: courseData.price || 0,
        is_paid: courseData.is_paid || false,
        is_published: true,
        course_section_id: courseData.course_section_id || 1,
        sort_order: courseData.sort_order || 1,
        image_url: courseData.image_url || null
      };

      console.log('Dados para inserção no Supabase:', cleanData);

      const { data, error } = await supabase
        .from('courses')
        .insert(cleanData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        return null;
      }
      
      console.log('Curso criado com sucesso no Supabase:', data);
      return data;
    } catch (error) {
      console.error('Erro durante criação do curso:', error);
      return null;
    }
  }

  static async updateCourse(id: number, updates: Partial<Course>): Promise<Course | null> {
    if (!supabase) return null;

    // Limpar dados e converter 'none' para null
    const cleanUpdates = {
      ...updates,
      reward_role_id: updates.reward_role_id === 'none' ? null : updates.reward_role_id,
      image_url: updates.image_url || null
    };

    console.log('Dados limpos para atualização:', cleanUpdates);

    const { data, error } = await supabase
      .from('courses')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro detalhado ao atualizar curso:', error);
      return null;
    }
    
    return data;
  }

  static async deleteCourse(id: number): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Course Modules
  static async getCourseModules(courseId: number): Promise<CourseModule[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number');
    
    if (error || !data) return [];
    return data;
  }

  static async createModule(moduleData: Partial<CourseModule>): Promise<CourseModule | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('course_modules')
      .insert(moduleData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async updateModule(id: number, updates: Partial<CourseModule>): Promise<CourseModule | null> {
    if (!supabase) return null;

    console.log('Dados para inserção no Supabase:', updates);

    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro do Supabase na atualização:', error);
      return null;
    }
    
    if (!data) {
      console.error('Nenhum dado retornado na atualização');
      return null;
    }

    console.log('Módulo atualizado no Supabase:', data);
    return data;
  }

  static async deleteModule(id: number): Promise<boolean> {
    if (!supabase) return false;

    console.log('Deletando módulo com ID:', id);

    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro do Supabase na exclusão:', error);
      return false;
    }

    console.log('Módulo deletado do Supabase com sucesso');
    return true;
  }

  // Submissões
  static async getUserSubmissions(userId: number, courseId: number): Promise<CourseSubmission[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('course_submission')
      .select(`
        *,
        course_modules!inner(course_id)
      `)
      .eq('user_id', userId)
      .eq('course_modules.course_id', courseId);
    
    if (error || !data) return [];
    return data;
  }

  static async createSubmission(submissionData: Partial<CourseSubmission>): Promise<CourseSubmission | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('course_submission')
      .insert(submissionData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  // Desafios/Rituais
  static async getUserRituals(userId: number, courseId: number): Promise<CourseChallenge[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('course_challenges')
      .select(`
        *,
        course_modules!inner(course_id)
      `)
      .eq('user_id', userId)
      .eq('course_modules.course_id', courseId);
    
    if (error || !data) return [];
    return data;
  }

  static async createRitual(ritualData: Partial<CourseChallenge>): Promise<CourseChallenge | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('course_challenges')
      .insert(ritualData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  // Conclusão de módulos
  static async completeModule(completionData: any): Promise<any> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('module_completions')
      .insert(completionData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async getModuleCompletion(userId: number, moduleId: number): Promise<any> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('module_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();
    
    if (error || !data) return null;
    return data;
  }

  // ORACLE METHODS
  static async getAllOracles(): Promise<Oracle[]> {
    try {
      console.log('Executando query para buscar todos os oráculos...');
      
      if (!supabase) {
        console.error('Supabase client não está disponível');
        return [];
      }

      const { data, error } = await supabase
        .from('oracles')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Erro na query de oráculos:', error);
        return [];
      }

      console.log('Query executada com sucesso. Dados:', data);
      return data || [];
    } catch (error) {
      console.error('Erro geral ao buscar oráculos:', error);
      return [];
    }
  }

  static async getActiveOracles(): Promise<Oracle[]> {
    try {
      console.log('Executando query para buscar oráculos ativos...');
      
      if (!supabase) {
        console.error('Supabase client não está disponível');
        return [];
      }

      const { data, error } = await supabase
        .from('oracles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Erro na query de oráculos ativos:', error);
        return [];
      }

      console.log('Query de oráculos ativos executada com sucesso. Dados:', data);
      return data || [];
    } catch (error) {
      console.error('Erro geral ao buscar oráculos ativos:', error);
      return [];
    }
  }

  static async getOracleById(id: number): Promise<Oracle | null> {
    try {
      const { data, error } = await supabase
        .from('oracles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar oráculo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar oráculo:', error);
      return null;
    }
  }

  static async createOracle(oracleData: Partial<Oracle>): Promise<Oracle | null> {
    try {
      const { data, error } = await supabase
        .from('oracles')
        .insert([{
          ...oracleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar oráculo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar oráculo:', error);
      return null;
    }
  }

  static async updateOracle(id: number, updates: Partial<Oracle>): Promise<Oracle | null> {
    try {
      const { data, error } = await supabase
        .from('oracles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar oráculo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar oráculo:', error);
      return null;
    }
  }

  static async deleteOracle(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('oracles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar oráculo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar oráculo:', error);
      return false;
    }
  }

  static async createOracleSession(sessionData: Partial<OracleSession>): Promise<OracleSession | null> {
    try {
      if (!supabase) {
        console.error('Supabase não inicializado');
        return null;
      }

      console.log('Dados sendo enviados para Supabase:', sessionData);

      const { data, error } = await supabase
        .from('oracle_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar sessão do oráculo:', error);
        return null;
      }

      console.log('Dados retornados do Supabase:', data);
      return data;
    } catch (error) {
      console.error('Erro na criação da sessão:', error);
      return null;
    }
  }

  static async getOracleSession(sessionToken: string): Promise<(OracleSession & { oracle: Oracle }) | null> {
    try {
      if (!supabase) {
        console.error('Supabase não inicializado');
        return null;
      }

      console.log('Buscando sessão com token:', sessionToken);

      const { data, error } = await supabase
        .from('oracle_sessions')
        .select(`
          *,
          oracles (*)
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Erro ao buscar sessão do oráculo:', error);
        return null;
      }

      console.log('Sessão encontrada no banco:', data);
      
      // Reestruturar resposta para incluir oracle como propriedade direta
      if (data && data.oracles) {
        return {
          ...data,
          oracle: data.oracles
        };
      }

      return data;
    } catch (error) {
      console.error('Erro na busca da sessão:', error);
      return null;
    }
  }

  static async updateSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('oracle_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', sessionToken);

      if (error) {
        console.error('Erro ao atualizar atividade da sessão:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar atividade da sessão:', error);
      return false;
    }
  }

  static async addOracleMessage(messageData: Partial<OracleMessage>): Promise<OracleMessage | null> {
    try {
      const { data, error } = await supabase
        .from('oracle_messages')
        .insert([{
          ...messageData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar mensagem do oráculo:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao adicionar mensagem do oráculo:', error);
      return null;
    }
  }

  static async getSessionMessages(sessionId: number): Promise<OracleMessage[]> {
    try {
      const { data, error } = await supabase
        .from('oracle_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens da sessão:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens da sessão:', error);
      return [];
    }
  }

  static async getOracleConfig(): Promise<OracleConfig | null> {
    try {
      const { data, error } = await supabase
        .from('oracle_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Erro ao buscar configuração dos oráculos:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração dos oráculos:', error);
      return null;
    }
  }

  static async updateOracleConfig(updates: Partial<OracleConfig>): Promise<OracleConfig | null> {
    try {
      if (!supabase) {
        console.error('Supabase não inicializado');
        return null;
      }

      console.log('Atualizando configuração no Supabase com:', updates);

      // Primeiro tentar atualizar se existe
      const { data: existingData, error: selectError } = await supabase
        .from('oracle_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        // Não existe, criar novo
        console.log('Configuração não existe, criando nova...');
        const { data, error } = await supabase
          .from('oracle_config')
          .insert([{
            id: 1,
            ...updates,
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar configuração:', error);
          return null;
        }

        console.log('Configuração criada:', data);
        return data;
      } else if (existingData) {
        // Existe, atualizar
        console.log('Configuração existe, atualizando...');
        const { data, error } = await supabase
          .from('oracle_config')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar configuração:', error);
          return null;
        }

        console.log('Configuração atualizada:', data);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Erro ao atualizar configuração dos oráculos:', error);
      return null;
    }
  }
}