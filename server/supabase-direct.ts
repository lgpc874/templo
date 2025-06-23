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
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();
    
    if (error || !data) return null;
    return data;
  }

  static async updateCourse(id: number, updates: Partial<Course>): Promise<Course | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return null;
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
}