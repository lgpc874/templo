import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Stripe from 'stripe';
import type { 
  Grimoire, 
  InsertGrimoire, 
  Chapter, 
  InsertChapter, 
  LibrarySection, 
  InsertLibrarySection,
  UserProgress,
  InsertProgress,
  User,
  InsertUser,
  GrimoirePurchase,
  AISettings,
  SystemSettings,
  Course,
  InsertCourse,
  Module,
  InsertModule,
  UserCourseProgress,
  InsertUserCourseProgress,
  Submission,
  InsertSubmission,
  Badge,
  InsertBadge,
  UserBadge,
  InsertUserBadge
} from '@shared/schema-new';

// Inicializar OpenAI (opcional)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Inicializar Stripe (opcional)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export class SupabaseServiceNew {
  private supabase;
  private adminClient;

  constructor() {
    const supabaseUrl = 'https://nqexwgnscvpfhuonbafr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXh3Z25zY3ZwZmh1b25iYWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MjYzNDAsImV4cCI6MjA2NTMwMjM0MH0.Kx0FaGAPjCTY31F40zhVTKwiaJXswYpeX9Z75v4ZrBY';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXh3Z25zY3ZwZmh1b25iYWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyNjM0MCwiZXhwIjoyMDY1MzAyMzQwfQ.ERK-PGWpodJX4WC_84IYW4pwbwkfmcICFFS5oXBsGlk';
    
    // Usar service role para queries de cursos para evitar problemas de RLS  
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
    this.adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log('✅ Supabase conectado com service role para máximo acesso');
  }
  
  getClient() {
    return this.supabase;
  }

  getSupabase() {
    return this.supabase;
  }

  get adminClient() {
    return this.adminClient;
  }

  // ======================
  // USUÁRIOS
  // ======================
  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    
    // Garantir que role_color tenha um valor padrão baseado no role
    if (data && !data.role_color) {
      const defaultColors: { [key: string]: string } = {
        'buscador': '#6b7280',
        'iniciado': '#d97706', 
        'portador_veu': '#7c3aed',
        'discipulo_chamas': '#ea580c',
        'guardiao_nome': '#0284c7',
        'arauto_queda': '#7c3aed',
        'portador_coroa': '#ca8a04',
        'magus_supremo': '#991B1B'
      };
      data.role_color = defaultColors[data.role] || '#6b7280';
    }
    
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const { data, error } = await this.adminClient
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);
    return data;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const { data, error } = await this.adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    return data;
  }

  // ======================
  // SEÇÕES DA BIBLIOTECA
  // ======================
  async getLibrarySections(): Promise<LibrarySection[]> {
    const { data, error } = await this.supabase
      .from('library_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw new Error(`Erro ao buscar seções: ${error.message}`);
    return data || [];
  }

  async createLibrarySection(sectionData: InsertLibrarySection): Promise<LibrarySection> {
    // Usar apenas campos que existem na estrutura atual da tabela
    const basicData = {
      name: sectionData.name,
      description: sectionData.description || '',
      sort_order: sectionData.sort_order || 0,
      is_active: sectionData.is_active !== false
    };

    const { data, error } = await this.adminClient
      .from('library_sections')
      .insert(basicData)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar seção: ${error.message}`);
    return data;
  }

  async updateLibrarySection(id: number, updates: Partial<InsertLibrarySection>): Promise<LibrarySection> {
    const { data, error } = await this.adminClient
      .from('library_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar seção: ${error.message}`);
    return data;
  }

  async deleteLibrarySection(id: number): Promise<void> {
    const { error } = await this.adminClient
      .from('library_sections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar seção: ${error.message}`);
  }

  // ======================
  // GRIMÓRIOS
  // ======================
  async getGrimoires(): Promise<Grimoire[]> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('is_published', true)
      .order('section_id', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw new Error(`Erro ao buscar grimórios: ${error.message}`);
    return data || [];
  }

  async getAllGrimoires(): Promise<Grimoire[]> {
    const { data, error } = await this.adminClient
      .from('grimoires')
      .select('*')
      .order('section_id', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw new Error(`Erro ao buscar todos os grimórios: ${error.message}`);
    return data || [];
  }



  async updateGrimoireOrder(id: number, display_order: number): Promise<void> {
    const { error } = await this.adminClient
      .from('grimoires')
      .update({ display_order })
      .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar ordem: ${error.message}`);
  }

  async getGrimoireById(id: number): Promise<Grimoire | null> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getGrimoiresBySection(sectionId: number): Promise<Grimoire[]> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('section_id', sectionId)
      .eq('is_published', true)
      .order('unlock_order');

    if (error) throw new Error(`Erro ao buscar grimórios da seção: ${error.message}`);
    return data || [];
  }

  async createGrimoire(grimoireData: InsertGrimoire): Promise<Grimoire> {
    const { data, error } = await this.adminClient
      .from('grimoires')
      .insert(grimoireData)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar grimório: ${error.message}`);
    return data;
  }

  async updateGrimoire(id: number, updates: Partial<InsertGrimoire>): Promise<Grimoire> {
    const { data, error } = await this.adminClient
      .from('grimoires')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar grimório: ${error.message}`);
    return data;
  }

  async deleteGrimoire(id: number): Promise<void> {
    // Deletar capítulos relacionados primeiro
    await this.adminClient
      .from('chapters')
      .delete()
      .eq('grimoire_id', id);

    // Deletar progresso relacionado
    await this.adminClient
      .from('user_progress')
      .delete()
      .eq('grimoire_id', id);

    // Deletar o grimório
    const { error } = await this.adminClient
      .from('grimoires')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar grimório: ${error.message}`);
  }

  // ======================
  // CAPÍTULOS
  // ======================
  async getChaptersByGrimoire(grimoireId: number): Promise<Chapter[]> {
    const { data, error } = await this.supabase
      .from('chapters')
      .select('*')
      .eq('grimoire_id', grimoireId)
      .eq('is_published', true)
      .order('chapter_order');

    if (error) throw new Error(`Erro ao buscar capítulos: ${error.message}`);
    return data || [];
  }

  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    const { data, error } = await this.adminClient
      .from('chapters')
      .insert(chapterData)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar capítulo: ${error.message}`);
    return data;
  }

  async updateChapter(id: number, updates: Partial<InsertChapter>): Promise<Chapter> {
    const { data, error } = await this.adminClient
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar capítulo: ${error.message}`);
    return data;
  }

  async deleteChapter(id: number): Promise<void> {
    const { error } = await this.adminClient
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar capítulo: ${error.message}`);
  }

  // ======================
  // PROGRESSO DO USUÁRIO
  // ======================
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const { data, error } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar progresso: ${error.message}`);
    return data || [];
  }

  async saveUserProgress(progressData: InsertProgress): Promise<UserProgress> {
    const { data, error } = await this.adminClient
      .from('user_progress')
      .upsert(progressData, {
        onConflict: 'user_id,grimoire_id'
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar progresso: ${error.message}`);
    return data;
  }

  async getUserGrimoireProgress(userId: number, grimoireId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('user_grimoire_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('grimoire_id', grimoireId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar progresso do grimório:', error);
        throw error;
      }

      return data || {
        current_page: 1,
        total_pages: 1,
        progress_percentage: 0,
        status: 'lendo'
      };
    } catch (error) {
      console.error('Erro ao buscar progresso do grimório:', error);
      return {
        current_page: 1,
        total_pages: 1,
        progress_percentage: 0,
        status: 'lendo'
      };
    }
  }

  async saveUserGrimoireProgress(userId: number, grimoireId: number, progress: {
    current_page: number;
    total_pages: number;
    progress_percentage: number;
  }): Promise<any> {
    try {
      const status = progress.progress_percentage >= 100 ? 'lido' : 'lendo';
      
      // Primeiro, verifica se já existe um registro
      const { data: existing, error: selectError } = await this.supabase
        .from('user_grimoire_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('grimoire_id', grimoireId)
        .single();

      let result;
      if (existing) {
        // Atualizar registro existente
        const { data, error } = await this.supabase
          .from('user_grimoire_progress')
          .update({
            current_page: progress.current_page,
            total_pages: progress.total_pages,
            progress_percentage: progress.progress_percentage,
            status: status,
            last_accessed_at: new Date().toISOString(),
            ...(status === 'lido' && { completed_reading_at: new Date().toISOString() })
          })
          .eq('user_id', userId)
          .eq('grimoire_id', grimoireId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Criar novo registro
        const { data, error } = await this.supabase
          .from('user_grimoire_progress')
          .insert({
            user_id: userId,
            grimoire_id: grimoireId,
            current_page: progress.current_page,
            total_pages: progress.total_pages,
            progress_percentage: progress.progress_percentage,
            status: status,
            last_accessed_at: new Date().toISOString(),
            ...(status === 'lido' && { completed_reading_at: new Date().toISOString() })
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Erro ao salvar progresso do grimório:', error);
      throw error;
    }
  }

  // ======================
  // CONFIGURAÇÕES DE IA
  // ======================
  async getAISettings(): Promise<AISettings | null> {
    const { data, error } = await this.supabase
      .from('ai_settings')
      .select('*')
      .eq('setting_name', 'global')
      .single();

    if (error) return null;
    return data;
  }

  async saveAISettings(settings: Partial<AISettings>): Promise<AISettings> {
    const { data, error } = await this.adminClient
      .from('ai_settings')
      .upsert({
        setting_name: 'global',
        ...settings
      }, {
        onConflict: 'setting_name'
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar configurações IA: ${error.message}`);
    return data;
  }

  // ======================
  // CONFIGURAÇÕES DO SISTEMA
  // ======================
  async getSystemSettings(): Promise<SystemSettings[]> {
    const { data, error } = await this.supabase
      .from('system_settings')
      .select('*');

    if (error) throw new Error(`Erro ao buscar configurações: ${error.message}`);
    return data || [];
  }

  async saveSystemSettings(settings: { category: string; key: string; value: string; type?: string }[]): Promise<void> {
    const settingsData = settings.map(s => ({
      setting_category: s.category,
      setting_key: s.key,
      setting_value: s.value,
      setting_type: s.type || 'text'
    }));

    const { error } = await this.adminClient
      .from('system_settings')
      .upsert(settingsData, {
        onConflict: 'setting_category,setting_key'
      });

    if (error) throw new Error(`Erro ao salvar configurações: ${error.message}`);
  }

  // ======================
  // GERAÇÃO COM IA
  // ======================
  async generateGrimoireWithAI(prompt: string, sectionId?: number): Promise<{
    title: string;
    content: string;
    excerpt: string;
    estimated_read_time: number;
    word_count: number;
  }> {
    try {
      const aiSettings = await this.getAISettings();
      
      const systemPrompt = `Você é um especialista em ocultismo luciferiano criando grimórios autênticos.
      
Personalidade: ${aiSettings?.personality || 'luciferian'}
Complexidade: ${aiSettings?.complexity || 'beginner'}
Estilo: ${aiSettings?.style || 'mixed'}
Diretrizes: ${aiSettings?.guidelines || 'Mantenha linguagem acessível mas profunda'}

IMPORTANTE: Retorne APENAS um objeto JSON válido com as seguintes propriedades:
- title: string (título do grimório)
- content: string (conteúdo HTML completo do grimório)
- excerpt: string (resumo de 2-3 frases)
- estimated_read_time: number (tempo estimado em minutos)
- word_count: number (contagem de palavras)

O conteúdo deve ser um grimório completo e substancial em HTML formatado.`;

      if (!openai) {
        throw new Error('OpenAI não configurado. Configure OPENAI_API_KEY para usar geração de IA.');
      }

      const response = await openai.chat.completions.create({
        model: aiSettings?.model_name || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: aiSettings?.max_tokens || 4000,
        temperature: Number(aiSettings?.temperature) || 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Nenhum conteúdo gerado pela IA');

      // Parse do JSON retornado pela IA
      try {
        return JSON.parse(content);
      } catch {
        // Fallback se a IA não retornou JSON válido
        const wordCount = content.split(/\s+/).length;
        return {
          title: prompt.slice(0, 100),
          content: content,
          excerpt: content.slice(0, 200) + '...',
          estimated_read_time: Math.ceil(wordCount / 200),
          word_count: wordCount
        };
      }
    } catch (error: any) {
      throw new Error(`Erro na geração com IA: ${error.message}`);
    }
  }

  // ======================
  // ANALYTICS E ESTATÍSTICAS
  // ======================
  async getOverviewStats(): Promise<{
    totalUsers: number;
    totalGrimoires: number;
    totalSections: number;
    totalChapters: number;
    totalProgress: number;
    recentUsers: any[];
    recentGrimoires: any[];
    sectionStats: any[];
  }> {
    try {
      // Estatísticas gerais
      const [
        { count: totalUsers },
        { count: totalGrimoires },
        { count: totalSections },
        { count: totalChapters },
        { count: totalProgress }
      ] = await Promise.all([
        this.supabase.from('users').select('*', { count: 'exact', head: true }),
        this.supabase.from('grimoires').select('*', { count: 'exact', head: true }),
        this.supabase.from('library_sections').select('*', { count: 'exact', head: true }),
        this.supabase.from('chapters').select('*', { count: 'exact', head: true }),
        this.supabase.from('user_progress').select('*', { count: 'exact', head: true })
      ]);

      // Usuários recentes
      const { data: recentUsers } = await this.supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Grimórios recentes
      const { data: recentGrimoires } = await this.supabase
        .from('grimoires')
        .select('id, title, section_id, created_at, is_paid, price')
        .order('created_at', { ascending: false })
        .limit(5);

      // Estatísticas por seção - abordagem alternativa
      const { data: sections } = await this.supabase
        .from('library_sections')
        .select('id, name')
        .order('sort_order');

      const sectionStats = [];
      if (sections) {
        for (const section of sections) {
          const { count } = await this.supabase
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
        totalChapters: totalChapters || 0,
        totalProgress: totalProgress || 0,
        recentUsers: recentUsers || [],
        recentGrimoires: recentGrimoires || [],
        sectionStats: sectionStats || []
      };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalUsers: 0,
        totalGrimoires: 0,
        totalSections: 0,
        totalChapters: 0,
        totalProgress: 0,
        recentUsers: [],
        recentGrimoires: [],
        sectionStats: []
      };
    }
  }

  // ======================
  // PAGAMENTOS
  // ======================
  async createPaymentIntent(grimoireId: number, amount: number): Promise<{ clientSecret: string }> {
    try {
      if (!stripe) {
        throw new Error('Stripe não configurado. Configure STRIPE_SECRET_KEY para usar pagamentos.');
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converter para centavos
        currency: 'brl',
        metadata: {
          grimoire_id: grimoireId.toString()
        }
      });

      return { clientSecret: paymentIntent.client_secret! };
    } catch (error: any) {
      throw new Error(`Erro ao criar payment intent: ${error.message}`);
    }
  }

  async processPaymentConfirmed(paymentIntentId: string, userId: number): Promise<void> {
    try {
      if (!stripe) {
        throw new Error('Stripe não configurado. Configure STRIPE_SECRET_KEY para usar pagamentos.');
      }
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const grimoireId = parseInt(paymentIntent.metadata.grimoire_id);
        
        await this.adminClient
          .from('grimoire_purchases')
          .insert({
            user_id: userId,
            grimoire_id: grimoireId,
            payment_intent_id: paymentIntentId,
            amount: (paymentIntent.amount / 100).toString(),
            status: 'completed'
          });
      }
    } catch (error: any) {
      throw new Error(`Erro ao processar pagamento: ${error.message}`);
    }
  }

  async hasUserAccess(userId: number, grimoireId: number): Promise<boolean> {
    try {
      // Verificar se é admin/magus supremo (acesso total)
      const user = await this.getUserById(userId);
      if (user?.email === 'admin@templodoabismo.com.br' || user?.is_admin) {
        return true;
      }

      // Verificar se é gratuito
      const grimoire = await this.getGrimoireById(grimoireId);
      if (!grimoire?.is_paid) return true;

      // Verificar se usuário comprou
      const { data: purchase } = await this.supabase
        .from('grimoire_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('grimoire_id', grimoireId)
        .eq('status', 'completed')
        .single();

      return !!purchase;
    } catch {
      return false;
    }
  }

  // ======================
  // INICIALIZAÇÃO
  // ======================
  async initializeDefaultSections(): Promise<void> {
    const defaultSections = [
      { name: 'Atrium Ignis', description: 'Textos preparatórios para iniciantes no caminho luciferiano', sort_order: 1 },
      { name: 'Porta Umbrae', description: 'Conhecimentos intermediários sobre magia e filosofia das sombras', sort_order: 2 },
      { name: 'Arcana Noctis', description: 'Segredos avançados de magia cerimonial e gnose luciferiana', sort_order: 3 },
      { name: 'Via Tenebris', description: 'Caminhos superiores de maestria e transcendência', sort_order: 4 },
      { name: 'Templo do Abismo', description: 'Santuário dos mistérios mais profundos canalizados das divindades primordiais', sort_order: 5 }
    ];

    for (const section of defaultSections) {
      try {
        await this.createLibrarySection(section);
      } catch (error) {
        console.log(`Seção ${section.name} já existe ou erro:`, error);
      }
    }
  }

  // ======================
  // ATUALIZAÇÃO DE SCHEMA
  // ======================
  async updateGrimoireSchema(): Promise<void> {
    const queries = [
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS custom_css TEXT;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a0a0a';",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS power_words TEXT;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS content_structure TEXT DEFAULT 'single';",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS enable_pdf_download BOOLEAN DEFAULT false;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS pdf_custom_styles TEXT;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT;",
      "ALTER TABLE grimoires ADD COLUMN IF NOT EXISTS generation_settings TEXT;"
    ];

    for (const query of queries) {
      try {
        await this.adminClient.rpc('execute_sql', { sql: query });
      } catch (error) {
        // Ignorar erros de coluna já existente
        console.log('Schema update (pode ser normal):', error);
      }
    }
  }

  async getUserCourses(userId: number): Promise<any[]> {
    try {
      // Temporariamente retorna array vazio até implementarmos nova estrutura de cursos
      return [];
    } catch (error) {
      console.error('Erro ao buscar cursos do usuário:', error);
      return [];
    }
  }

  async getUserGrimoires(userId: number): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_grimoire_progress')
        .select(`
          *,
          grimoires (
            id,
            title,
            description,
            price
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao buscar grimórios do usuário:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.grimoires.id,
        title: item.grimoires.title,
        status: item.status,
        progresso: item.progress_percentage
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar grimórios do usuário:', error);
      return [];
    }
  }

  async getUserRituals(userId: number): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_rituals')
        .select('*')
        .eq('user_id', userId)
        .order('data_inicio', { ascending: false });

      if (error) {
        console.error('Erro ao buscar rituais do usuário:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar rituais do usuário:', error);
      return [];
    }
  }

  // ======================
  // DIAGNÓSTICO
  // ======================
  async checkAndCreateCourseTables(): Promise<{ status: string; details: any }> {
    try {
      console.log('=== VERIFICANDO E CRIANDO TABELAS DE CURSOS NO SUPABASE ===');
      
      const tablesToCheck = [
        'courses',
        'course_modules', 
        'course_progress',
        'course_challenges',
        'course_certificates'
      ];
      
      const results = {};
      
      for (const tableName of tablesToCheck) {
        try {
          const { data, error } = await this.supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (error) {
            if (error.message.includes('does not exist')) {
              results[tableName] = 'NOT_EXISTS - CRIANDO...';
              console.log(`❌ Tabela ${tableName} NÃO EXISTE - Tentando criar...`);
              
              // Tentar criar a tabela usando SQL raw
              if (tableName === 'course_modules') {
                const createResult = await this.createCourseModulesTable();
                results[tableName] += ` | ${createResult}`;
              } else if (tableName === 'course_progress') {
                const createResult = await this.createCourseProgressTable();
                results[tableName] += ` | ${createResult}`;
              } else if (tableName === 'course_challenges') {
                const createResult = await this.createCourseChallengesTable();
                results[tableName] += ` | ${createResult}`;
              } else if (tableName === 'course_certificates') {
                const createResult = await this.createCourseCertificatesTable();
                results[tableName] += ` | ${createResult}`;
              }
            } else {
              results[tableName] = `ERROR: ${error.message}`;
              console.log(`⚠️  Tabela ${tableName} erro: ${error.message}`);
            }
          } else {
            results[tableName] = 'EXISTS';
            console.log(`✅ Tabela ${tableName} existe`);
          }
        } catch (err) {
          results[tableName] = `EXCEPTION: ${err.message}`;
          console.log(`❌ Erro verificando ${tableName}:`, err.message);
        }
      }
      
      return { status: 'completed', details: results };
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
      return { status: 'error', details: error.message };
    }
  }

  async createMissingCourseTables(): Promise<{ status: string; details: any }> {
    try {
      console.log('=== CRIANDO TABELAS FALTANTES NO SUPABASE ===');
      
      const results = {};
      
      // Criar course_modules
      try {
        const { error: error1 } = await this.adminClient.from('course_modules').select('id').limit(1);
        if (error1 && error1.message.includes('does not exist')) {
          // Usar o client admin para executar SQL direto
          const createModulesSQL = `
            CREATE TABLE course_modules (
              id SERIAL PRIMARY KEY,
              course_id INTEGER NOT NULL,
              title VARCHAR(255) NOT NULL,
              html_content TEXT,
              order_number INTEGER NOT NULL,
              requires_submission BOOLEAN DEFAULT FALSE,
              ritual_mandatory BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX idx_course_modules_course_id ON course_modules(course_id);
          `;
          
          // Como não podemos executar SQL direto, vamos inserir dados de exemplo que forcem a criação
          results['course_modules'] = 'NEEDS_MANUAL_CREATION';
          console.log('❌ course_modules precisa ser criada manualmente no Supabase');
        } else {
          results['course_modules'] = 'EXISTS';
        }
      } catch (err) {
        results['course_modules'] = `ERROR: ${err.message}`;
      }
      
      // Similar para outras tabelas...
      const tables = ['course_progress', 'course_challenges', 'course_certificates'];
      for (const table of tables) {
        try {
          const { error } = await this.adminClient.from(table).select('id').limit(1);
          if (error && error.message.includes('does not exist')) {
            results[table] = 'NEEDS_MANUAL_CREATION';
            console.log(`❌ ${table} precisa ser criada manualmente no Supabase`);
          } else {
            results[table] = 'EXISTS';
          }
        } catch (err) {
          results[table] = `ERROR: ${err.message}`;
        }
      }
      
      return { status: 'completed', details: results };
    } catch (error) {
      return { status: 'error', details: error.message };
    }
  }

  async testConnection(): Promise<{ status: string; details: any }> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        return {
          status: 'ERROR',
          details: {
            message: 'Erro na conexão',
            error: error.message
          }
        };
      }

      return {
        status: 'SUCCESS',
        details: {
          message: 'Conexão funcionando perfeitamente',
          admin_privileges: true
        }
      };
    } catch (error: any) {
      return {
        status: 'CRITICAL',
        details: {
          message: 'Falha crítica',
          error: error.message
        }
      };
    }
  }

  // ======================
  // SISTEMA DE CURSOS
  // ======================

  async getCourses(): Promise<Course[]> {
    try {
      console.log('=== getCourses() called ===');
      
      // Test direct connection first
      const { data: testData, error: testError } = await this.supabase
        .from('courses')
        .select('count');
      
      console.log('Test query result:', { testData, testError });
      
      const { data, error } = await this.supabase
        .from('courses')
        .select('*');
      
      console.log('Raw query result:', { data, error });
      
      if (error) {
        console.error('Error fetching all courses:', error);
        throw new Error(`Error fetching courses: ${error.message}`);
      }
      
      console.log('All courses fetched:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('Exception in getCourses:', error);
      throw error;
    }
  }

  async getCourseById(id: number): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async getCoursesByRole(role: string): Promise<Course[]> {
    // Buscar todos os cursos para mostrar com bloqueio visual
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error(`Error fetching courses:`, error);
      throw new Error(`Error fetching courses: ${error.message}`);
    }
    console.log(`Returning ${data?.length || 0} courses for role: ${role}`);
    return data || [];
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    const { data, error } = await this.supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true });
    
    if (error) throw new Error(`Error fetching modules: ${error.message}`);
    return data || [];
  }

  async getModuleById(id: number): Promise<Module | null> {
    const { data, error } = await this.supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async getUserCourseProgress(userId: number, courseId: number): Promise<UserCourseProgress | null> {
    const { data, error } = await this.supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (error) return null;
    return data;
  }

  async createUserCourseProgress(progressData: InsertUserCourseProgress): Promise<UserCourseProgress> {
    const { data, error } = await this.supabase
      .from('user_course_progress')
      .insert(progressData)
      .select()
      .single();
    
    if (error) throw new Error(`Error creating course progress: ${error.message}`);
    return data;
  }

  async updateUserCourseProgress(userId: number, courseId: number, updates: Partial<UserCourseProgress>): Promise<UserCourseProgress> {
    const { data, error } = await this.supabase
      .from('user_course_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .select()
      .single();
    
    if (error) throw new Error(`Error updating course progress: ${error.message}`);
    return data;
  }

  async createSubmission(submissionData: InsertSubmission): Promise<Submission> {
    const { data, error } = await this.supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();
    
    if (error) throw new Error(`Error creating submission: ${error.message}`);
    return data;
  }

  async getUserSubmission(userId: number, moduleId: number): Promise<Submission | null> {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .single();
    
    if (error) return null;
    return data;
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    const { data, error } = await this.supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    
    if (error) throw new Error(`Error fetching user badges: ${error.message}`);
    return data || [];
  }

  async createUserBadge(badgeData: InsertUserBadge): Promise<UserBadge> {
    const { data, error } = await this.supabase
      .from('user_badges')
      .insert(badgeData)
      .select()
      .single();
    
    if (error) throw new Error(`Error creating user badge: ${error.message}`);
    return data;
  }
}

export const supabaseServiceNew = new SupabaseServiceNew();