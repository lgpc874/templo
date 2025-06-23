import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nqexwgnscvpfhuonbafr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXh3Z25zY3ZwZmh1b25iYWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODgzNjYsImV4cCI6MjA2NTc2NDM2Nn0.Cc6MdK8Ykyz_Bme0pZzE4bHcIh1p-WUPEt-y8z-Q6lI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  subscription_status: string;
  profile_image_url?: string;
  theme_preference: string;
  email_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LibrarySection {
  id: number;
  name: string;
  description?: string;
  icon_name?: string;
  sort_order: number;
  is_active: boolean;
  color_scheme?: string;
  access_level?: string;
  created_at: string;
  updated_at?: string;
}

export interface Grimoire {
  id: number;
  title: string;
  content: string;
  section_id?: number;
  author_id?: number;
  price: string;
  is_paid: boolean;
  is_published: boolean;
  is_featured: boolean;
  unlock_order: number;
  cover_image_url?: string;
  excerpt?: string;
  difficulty_level: string;
  estimated_read_time: number;
  word_count: number;
  language: string;
  content_type: string;
  access_level: string;
  download_count: number;
  view_count: number;
  rating_average: string;
  rating_count: number;
  created_at: string;
  updated_at?: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  grimoire_id: number;
  chapter_id?: number;
  progress_percentage: string;
  current_page: number;
  total_pages: number;
  reading_time_seconds: number;
  is_completed: boolean;
  completion_date?: string;
  last_read_at: string;
  created_at: string;
  updated_at?: string;
}

// Funções de autenticação
export const auth = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Funções para seções da biblioteca
export const librarySections = {
  async getAll() {
    const { data, error } = await supabase
      .from('library_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    return data as LibrarySection[];
  },

  async create(section: Partial<LibrarySection>) {
    const { data, error } = await supabase
      .from('library_sections')
      .insert(section)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySection;
  },

  async update(id: number, updates: Partial<LibrarySection>) {
    const { data, error } = await supabase
      .from('library_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as LibrarySection;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('library_sections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Funções para grimórios
export const grimoires = {
  async getAll() {
    const { data, error } = await supabase
      .from('grimoires')
      .select('*')
      .eq('is_published', true)
      .order('id');
    
    if (error) throw error;
    return data as Grimoire[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('grimoires')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Grimoire;
  },

  async getBySection(sectionId: number) {
    const { data, error } = await supabase
      .from('grimoires')
      .select('*')
      .eq('section_id', sectionId)
      .eq('is_published', true)
      .order('unlock_order');
    
    if (error) throw error;
    return data as Grimoire[];
  },

  async create(grimoire: Partial<Grimoire>) {
    const { data, error } = await supabase
      .from('grimoires')
      .insert(grimoire)
      .select()
      .single();
    
    if (error) throw error;
    return data as Grimoire;
  },

  async update(id: number, updates: Partial<Grimoire>) {
    const { data, error } = await supabase
      .from('grimoires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Grimoire;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('grimoires')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Funções para progresso do usuário
export const userProgress = {
  async get(userId: number) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as UserProgress[];
  },

  async save(progress: Partial<UserProgress>) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(progress)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProgress;
  }
};

// Funções para estatísticas (admin)
export const adminStats = {
  async getOverview() {
    // Contadores principais
    const [
      { count: totalUsers },
      { count: totalGrimoires },
      { count: totalSections },
      { count: totalProgress }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('grimoires').select('*', { count: 'exact', head: true }),
      supabase.from('library_sections').select('*', { count: 'exact', head: true }),
      supabase.from('user_progress').select('*', { count: 'exact', head: true })
    ]);

    // Usuários recentes
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Grimórios recentes
    const { data: recentGrimoires } = await supabase
      .from('grimoires')
      .select('id, title, section_id, created_at, is_paid, price')
      .order('created_at', { ascending: false })
      .limit(5);

    // Estatísticas por seção
    const { data: sections } = await supabase
      .from('library_sections')
      .select('id, name')
      .order('sort_order');

    const sectionStats = [];
    if (sections) {
      for (const section of sections) {
        const { count } = await supabase
          .from('grimoires')
          .select('*', { count: 'exact', head: true })
          .eq('section_id', section.id)
          .eq('is_published', true);
        
        sectionStats.push({
          id: section.id,
          name: section.name,
          grimoire_count: count || 0
        });
      }
    }

    return {
      totalUsers: totalUsers || 0,
      totalGrimoires: totalGrimoires || 0,
      totalSections: totalSections || 0,
      totalChapters: 0, // Não usado no sistema atual
      totalProgress: totalProgress || 0,
      recentUsers: recentUsers || [],
      recentGrimoires: recentGrimoires || [],
      sectionStats
    };
  }
};