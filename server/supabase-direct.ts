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

    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async deleteModule(id: number): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);
    
    return !error;
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
}