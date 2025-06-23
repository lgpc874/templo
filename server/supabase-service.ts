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
  Curso,
  InsertCurso,
  Modulo,
  InsertModulo,
  RespostaCurso,
  InsertRespostaCurso,
  ProgressoCurso,
  InsertProgressoCurso
} from '@shared/schema';

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Inicializar Stripe apenas se a chave estiver disponível
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }
} catch (error) {
  console.log('Stripe não configurado - funcionalidades de pagamento desabilitadas');
}

export class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://nqexwgnscvpfhuonbafr.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXh3Z25zY3ZwZmh1b25iYWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MjYzNDAsImV4cCI6MjA2NTMwMjM0MH0.Kx0FaGAPjCTY31F40zhVTKwiaJXswYpeX9Z75v4ZrBY';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // SEÇÕES DA BIBLIOTECA
  async getLibrarySections(): Promise<LibrarySection[]> {
    const { data, error } = await this.supabase
      .from('library_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw new Error(`Error fetching sections: ${error.message}`);
    return data || [];
  }

  async createLibrarySection(section: InsertLibrarySection): Promise<LibrarySection> {
    const { data, error } = await this.supabase
      .from('library_sections')
      .insert(section)
      .select()
      .single();

    if (error) throw new Error(`Error creating section: ${error.message}`);
    return data;
  }

  async initializeDefaultSections(): Promise<void> {
    const defaultSections = [
      { name: 'Porta das Sombras', description: 'Para os que chegaram ao limiar. Os olhos ainda fechados... mas já sentem o fogo.', slug: 'porta-das-sombras', display_order: 1 },
      { name: 'Vestíbulo da Chama', description: 'O primeiro despertar. A chama interior começa a arder com conhecimento primordial.', slug: 'vestibulo-da-chama', display_order: 2 },
      { name: 'Torre dos Selos', description: 'Ascensão aos mistérios selados. Conhecimentos que poucos ousam desvelar.', slug: 'torre-dos-selos', display_order: 3 },
      { name: 'Sanctum Profundum', description: 'O santuário dos arcanos supremos. Apenas para os que transcenderam o véu.', slug: 'sanctum-profundum', display_order: 4 },
      { name: 'Textos Filosóficos', description: 'Fundamentos filosóficos e teóricos dos ensinamentos luciferianos.', slug: 'textos-filosoficos', display_order: 5 },
      { name: 'Meditações Práticas', description: 'Práticas meditativas e exercícios para desenvolvimento espiritual.', slug: 'meditacoes-praticas', display_order: 6 }
    ];

    for (const section of defaultSections) {
      try {
        await this.createLibrarySection({
          ...section,
          is_active: true
        });
      } catch (error) {
        // Section may already exist, continue
        console.log(`Section ${section.name} may already exist`);
      }
    }
  }

  // GRIMÓRIOS
  async getGrimoires(): Promise<Grimoire[]> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('is_published', true)
      .order('id', { ascending: true });

    if (error) throw new Error(`Error fetching grimoires: ${error.message}`);
    return data || [];
  }

  async getGrimoireById(id: number): Promise<Grimoire | null> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching grimoire: ${error.message}`);
    }
    return data;
  }

  async getGrimoiresBySection(sectionId: number): Promise<Grimoire[]> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .select('*')
      .eq('section_id', sectionId)
      .eq('is_published', true)
      .order('id', { ascending: true });

    if (error) throw new Error(`Error fetching grimoires by section: ${error.message}`);
    return data || [];
  }

  async createGrimoire(grimoire: InsertGrimoire): Promise<Grimoire> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .insert({
        ...grimoire,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating grimoire: ${error.message}`);
    return data;
  }

  async updateGrimoire(id: number, updates: Partial<InsertGrimoire>): Promise<Grimoire> {
    const { data, error } = await this.supabase
      .from('grimoires')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating grimoire: ${error.message}`);
    return data;
  }

  async deleteGrimoire(id: number): Promise<void> {
    // Primeiro deletar todos os capítulos do grimório
    const { error: chaptersError } = await this.supabase
      .from('chapters')
      .delete()
      .eq('grimoire_id', id);

    if (chaptersError) throw new Error(`Error deleting chapters: ${chaptersError.message}`);

    // Depois deletar o grimório
    const { error: grimoireError } = await this.supabase
      .from('grimoires')
      .delete()
      .eq('id', id);

    if (grimoireError) throw new Error(`Error deleting grimoire: ${grimoireError.message}`);
  }

  async moveGrimoireToSection(grimoireId: number, newSectionId: number): Promise<Grimoire> {
    return this.updateGrimoire(grimoireId, { section_id: newSectionId });
  }

  // CAPÍTULOS
  async getChaptersByGrimoire(grimoireId: number): Promise<Chapter[]> {
    const { data, error } = await this.supabase
      .from('chapters')
      .select('*')
      .eq('grimoire_id', grimoireId)
      .order('chapter_number');

    if (error) throw new Error(`Error fetching chapters: ${error.message}`);
    return data || [];
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const { data, error } = await this.supabase
      .from('chapters')
      .insert({
        ...chapter,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Error creating chapter: ${error.message}`);
    return data;
  }

  async updateChapter(id: number, updates: Partial<InsertChapter>): Promise<Chapter> {
    const { data, error } = await this.supabase
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating chapter: ${error.message}`);
    return data;
  }

  async deleteChapter(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error deleting chapter: ${error.message}`);
  }

  // PROGRESSO DO USUÁRIO
  async getUserProgress(userId: number): Promise<UserProgress[]> {
    const { data, error } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_read_at', { ascending: false });

    if (error) throw new Error(`Error fetching user progress: ${error.message}`);
    return data || [];
  }

  async saveUserProgress(progress: InsertProgress): Promise<UserProgress> {
    console.log("💾 Salvando progresso no Supabase:", progress);
    
    const { data, error } = await this.supabase
      .from('user_progress')
      .upsert({
        user_id: progress.user_id,
        grimoire_id: progress.grimoire_id,
        current_page: progress.current_page || 1,
        total_pages: progress.total_pages || 1,
        last_read_at: progress.last_read_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,grimoire_id'
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao salvar progresso:", error);
      throw new Error(`Error saving user progress: ${error.message}`);
    }
    
    console.log("✅ Progresso salvo com sucesso:", data);
    return data;
  }

  // ESTATÍSTICAS ADMINISTRATIVAS
  async getAdminStats() {
    const [grimoires, sections, totalUsers] = await Promise.all([
      this.supabase.from('grimoires').select('id', { count: 'exact' }),
      this.supabase.from('library_sections').select('id', { count: 'exact' }),
      this.supabase.from('users').select('id', { count: 'exact' })
    ]);

    return {
      totalGrimoires: grimoires.count || 0,
      totalSections: sections.count || 0,
      totalUsers: totalUsers.count || 0
    };
  }

  // ESTATÍSTICAS COMPLETAS PARA VISÃO GERAL
  async getOverviewStats() {
    try {
      // Contadores principais
      const [grimoireCount, chapterCount, progressCount, userCount, sectionCount] = await Promise.all([
        this.supabase.from('grimoires').select('id', { count: 'exact' }),
        this.supabase.from('chapters').select('id', { count: 'exact' }),
        this.supabase.from('user_progress').select('id', { count: 'exact' }),
        this.supabase.from('users').select('id', { count: 'exact' }),
        this.supabase.from('library_sections').select('id', { count: 'exact' })
      ]);

      // Usuários recentes (últimos 10)
      const { data: recentUsers } = await this.supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Grimórios recentes (últimos 10)
      const { data: recentGrimoires } = await this.supabase
        .from('grimoires')
        .select('id, title, section_id, created_at, is_paid, price')
        .order('created_at', { ascending: false })
        .limit(10);

      // Estatísticas por seção (contagem de grimórios)
      const { data: sectionsData } = await this.supabase
        .from('library_sections')
        .select(`
          id,
          name,
          grimoires(count)
        `)
        .eq('is_active', true);

      // Processar dados das seções
      const sectionStats = sectionsData?.map(section => ({
        id: section.id,
        name: section.name,
        grimoire_count: section.grimoires?.[0]?.count || 0
      })) || [];

      return {
        totalUsers: userCount.count || 0,
        totalGrimoires: grimoireCount.count || 0,
        totalSections: sectionCount.count || 0,
        totalChapters: chapterCount.count || 0,
        totalProgress: progressCount.count || 0,
        recentUsers: recentUsers || [],
        recentGrimoires: recentGrimoires || [],
        sectionStats
      };
    } catch (error: any) {
      console.error('Error fetching overview stats:', error);
      throw new Error(`Error fetching overview stats: ${error?.message || 'Unknown error'}`);
    }
  }

  // GERAÇÃO DE GRIMÓRIOS COM IA
  async generateGrimoireWithAI(prompt: string) {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um mestre luciferiano e especialista em ocultismo. Sua tarefa é criar um grimório COMPLETO com conteúdo unificado e detalhado.

            REGRA ABSOLUTA: O conteúdo deve ter entre 20.000-40.000 palavras, totalmente desenvolvido e completo.

            Formato JSON obrigatório:
            {
              "title": "Título do grimório",
              "description": "Descrição detalhada em 2-3 parágrafos explicando o propósito e conteúdo do grimório",
              "content": "CONTEÚDO COMPLETO DO GRIMÓRIO em HTML formatado com 20.000-40.000 palavras incluindo: introdução conceitual extensiva, desenvolvimento teórico profundo e completo, instruções práticas detalhadas, múltiplos rituais específicos, filosofia luciferiana abrangente, simbolismo esotérico, meditações guiadas, invocações completas, correspondências mágicas, exercícios práticos, estudos de caso, análises históricas, técnicas avançadas e conclusões elaboradas. Use formatação HTML rica (<h1>, <h2>, <h3>, <h4>, <strong>, <em>, <blockquote>, <ul>, <li>, <p>, <div>), citações em latim frequentes, linguagem mística erudita e estrutura extremamente bem organizada em múltiplas seções e subseções.",
              "suggested_price": "29.99"
            }

            DIRETRIZES OBRIGATÓRIAS:
            ✓ Conteúdo unificado de 20.000-40.000 palavras
            ✓ Linguagem mística luciferiana autêntica e erudita
            ✓ Múltiplos rituais práticos detalhados e completos
            ✓ Filosofia e teoria fundamentada e abrangente
            ✓ Símbolos, correspondências e sistemas completos
            ✓ Citações em latim frequentes e apropriadas
            ✓ Formatação HTML rica e hierárquica
            ✓ Múltiplas seções e subseções bem organizadas
            ✓ Desenvolvimento extensivo e exaustivo do tema
            ✓ Exercícios práticos e técnicas avançadas
            ✓ Estudos históricos e análises profundas
            ✓ Meditações guiadas e invocações completas`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 4000
      });

      const rawContent = response.choices[0].message.content || '{}';
      console.log('🤖 Raw AI Response:', rawContent.substring(0, 500) + '...');
      
      const generatedContent = JSON.parse(rawContent);
      console.log('📖 Parsed Content Structure:', {
        title: !!generatedContent.title,
        description: !!generatedContent.description,
        content: !!generatedContent.content,
        contentLength: generatedContent.content?.length || 0
      });
      
      return {
        title: generatedContent.title || "Grimório Gerado",
        description: generatedContent.description || "Descrição gerada pela IA",
        content: generatedContent.content || "Conteúdo gerado pela IA",
        suggested_price: generatedContent.suggested_price || "29.99"
      };
    } catch (error: any) {
      console.error('Error generating grimoire with AI:', error);
      throw new Error(`Error generating grimoire with AI: ${error?.message || 'Unknown error'}`);
    }
  }

  // PAGAMENTOS COM STRIPE
  async createPaymentIntent(grimoireId: number, amount: number) {
    try {
      // Buscar informações do grimório
      const { data: grimoire, error } = await this.supabase
        .from('grimoires')
        .select('*')
        .eq('id', grimoireId)
        .single();

      if (error || !grimoire) {
        throw new Error('Grimório não encontrado');
      }

      // Converter valor para centavos
      const amountInCents = Math.round(amount * 100);

      // Criar Payment Intent no Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'brl',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          grimoireId: grimoireId.toString(),
          grimoireTitle: grimoire.title,
          type: 'grimoire_purchase'
        },
        description: `Compra do grimório: ${grimoire.title}`
      });

      return paymentIntent;
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Error creating payment intent: ${error?.message || 'Unknown error'}`);
    }
  }

  // PROCESSAR PAGAMENTO CONFIRMADO (webhook)
  async processPaymentConfirmed(paymentIntentId: string, userId: number) {
    try {
      // Buscar detalhes do Payment Intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Pagamento não foi confirmado');
      }

      const grimoireId = parseInt(paymentIntent.metadata.grimoireId);
      
      // Registrar compra na tabela de compras (precisa ser criada)
      const { data: purchase, error } = await this.supabase
        .from('grimoire_purchases')
        .insert({
          user_id: userId,
          grimoire_id: grimoireId,
          payment_intent_id: paymentIntentId,
          amount: paymentIntent.amount / 100, // Converter de centavos
          status: 'completed',
          purchased_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording purchase:', error);
        throw new Error('Erro ao registrar compra');
      }

      return {
        success: true,
        grimoireId,
        purchase
      };
    } catch (error: any) {
      console.error('Error processing payment confirmation:', error);
      throw new Error(`Error processing payment: ${error?.message || 'Unknown error'}`);
    }
  }

  // VERIFICAR SE USUÁRIO POSSUI ACESSO AO GRIMÓRIO
  async hasUserAccess(userId: number, grimoireId: number): Promise<boolean> {
    try {
      // Verificar se é gratuito
      const { data: grimoire } = await this.supabase
        .from('grimoires')
        .select('is_paid')
        .eq('id', grimoireId)
        .single();

      if (!grimoire?.is_paid) {
        return true; // Grimório gratuito
      }

      // Verificar se usuário comprou
      const { data: purchase } = await this.supabase
        .from('grimoire_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('grimoire_id', grimoireId)
        .eq('status', 'completed')
        .single();

      return !!purchase;
    } catch (error: any) {
      console.error('Error checking user access:', error);
      return false;
    }
  }

  // CLIENTE ADMINISTRATIVO COM SERVICE ROLE
  private getAdminClient() {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://nqexwgnscvpfhuonbafr.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZXh3Z25zY3ZwZmh1b25iYWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyNjM0MCwiZXhwIjoyMDY1MzAyMzQwfQ.ERK-PGWpodJX4WC_84IYW4pwbwkfmcICFFS5oXBsGlk';
    
    return createClient(supabaseUrl, serviceRoleKey);
  }

  // OPERAÇÕES ADMINISTRATIVAS COM PRIVILÉGIOS TOTAIS
  async adminCreateTable(tableName: string, columns: string): Promise<boolean> {
    try {
      const adminClient = this.getAdminClient();
      const { error } = await adminClient.rpc('exec_sql', { 
        sql: `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});` 
      });
      
      if (error) {
        console.error(`Erro ao criar tabela ${tableName}:`, error);
        return false;
      }
      
      console.log(`✓ Tabela ${tableName} criada com sucesso`);
      return true;
    } catch (error: any) {
      console.error(`Erro durante criação da tabela ${tableName}:`, error);
      return false;
    }
  }

  async adminInsertData(tableName: string, data: any): Promise<any> {
    try {
      const adminClient = this.getAdminClient();
      const { data: result, error } = await adminClient
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao inserir dados em ${tableName}:`, error);
        throw new Error(`Erro ao inserir dados: ${error.message}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Erro durante inserção em ${tableName}:`, error);
      throw error;
    }
  }

  async adminUpdateData(tableName: string, id: number, data: any): Promise<any> {
    try {
      const adminClient = this.getAdminClient();
      const { data: result, error } = await adminClient
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar dados em ${tableName}:`, error);
        throw new Error(`Erro ao atualizar dados: ${error.message}`);
      }

      return result;
    } catch (error: any) {
      console.error(`Erro durante atualização em ${tableName}:`, error);
      throw error;
    }
  }

  async adminDeleteData(tableName: string, condition: string, value: any): Promise<boolean> {
    try {
      const adminClient = this.getAdminClient();
      const { error } = await adminClient
        .from(tableName)
        .delete()
        .eq(condition, value);

      if (error) {
        console.error(`Erro ao deletar dados de ${tableName}:`, error);
        throw new Error(`Erro ao deletar dados: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error(`Erro durante deleção em ${tableName}:`, error);
      throw error;
    }
  }

  // GERENCIAR CONFIGURAÇÕES DE IA
  async getAISettings() {
    try {
      const { data, error } = await this.supabase
        .from('ai_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Se não existe configuração, retornar valores padrão
      if (!data) {
        return {
          personality: 'luciferian',
          complexity: 'beginner',
          length: 'medium',
          style: 'mixed',
          guidelines: '',
          defaultSection: '',
          autoPrice: false,
          priceRange: { min: '9.99', max: '49.99' }
        };
      }

      return {
        personality: data.personality,
        complexity: data.complexity,
        length: data.length,
        style: data.style,
        guidelines: data.guidelines || '',
        defaultSection: data.default_section || '',
        autoPrice: data.auto_price,
        priceRange: { 
          min: data.price_range_min?.toString() || '9.99', 
          max: data.price_range_max?.toString() || '49.99' 
        }
      };
    } catch (error: any) {
      console.error('Error getting AI settings:', error);
      throw new Error(`Error getting AI settings: ${error.message}`);
    }
  }

  async saveAISettings(settings: any) {
    try {
      // Verificar se já existe uma configuração
      const { data: existing } = await this.supabase
        .from('ai_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const settingsData = {
        personality: settings.personality,
        complexity: settings.complexity,
        length: settings.length,
        style: settings.style,
        guidelines: settings.guidelines || '',
        default_section: settings.defaultSection || '',
        auto_price: settings.autoPrice || false,
        price_range_min: parseFloat(settings.priceRange?.min || '9.99'),
        price_range_max: parseFloat(settings.priceRange?.max || '49.99'),
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Atualizar configuração existente
        const { data, error } = await this.supabase
          .from('ai_settings')
          .update(settingsData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova configuração
        const { data, error } = await this.supabase
          .from('ai_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      throw new Error(`Error saving AI settings: ${error.message}`);
    }
  }

  // GERENCIAR CONFIGURAÇÕES DO SISTEMA
  async getSystemSettings() {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Se não existe configuração, retornar valores padrão
      if (!data) {
        return {
          siteName: 'Templo do Abismo',
          siteDescription: 'Portal de ensinamentos luciferianos',
          siteKeywords: 'lucifer, ocultismo, magia, grimórios',
          adminEmail: 'admin@templodoabismo.com.br',
          contentLanguage: 'português',
          contentTone: 'formal',
          contentTargetAudience: 'iniciantes',
          enableUserRegistration: true,
          enablePaidContent: true,
          enableAIGeneration: true,
          securityLevel: 'medium',
          enableContentProtection: true,
          enableDownloadProtection: true
        };
      }

      return {
        siteName: data.site_name,
        siteDescription: data.site_description,
        siteKeywords: data.site_keywords,
        adminEmail: data.admin_email,
        contentLanguage: data.content_language,
        contentTone: data.content_tone,
        contentTargetAudience: data.content_target_audience,
        enableUserRegistration: data.enable_user_registration,
        enablePaidContent: data.enable_paid_content,
        enableAIGeneration: data.enable_ai_generation,
        securityLevel: data.security_level,
        enableContentProtection: data.enable_content_protection,
        enableDownloadProtection: data.enable_download_protection
      };
    } catch (error: any) {
      console.error('Error getting system settings:', error);
      throw new Error(`Error getting system settings: ${error.message}`);
    }
  }

  async saveSystemSettings(settings: any) {
    try {
      // Verificar se já existe uma configuração
      const { data: existing } = await this.supabase
        .from('system_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const settingsData = {
        site_name: settings.siteName || 'Templo do Abismo',
        site_description: settings.siteDescription || 'Portal de ensinamentos luciferianos',
        site_keywords: settings.siteKeywords || 'lucifer, ocultismo, magia, grimórios',
        admin_email: settings.adminEmail || 'admin@templodoabismo.com',
        content_language: settings.contentLanguage || 'português',
        content_tone: settings.contentTone || 'formal',
        content_target_audience: settings.contentTargetAudience || 'iniciantes',
        enable_user_registration: settings.enableUserRegistration !== undefined ? settings.enableUserRegistration : true,
        enable_paid_content: settings.enablePaidContent !== undefined ? settings.enablePaidContent : true,
        enable_ai_generation: settings.enableAIGeneration !== undefined ? settings.enableAIGeneration : true,
        security_level: settings.securityLevel || 'medium',
        enable_content_protection: settings.enableContentProtection !== undefined ? settings.enableContentProtection : true,
        enable_download_protection: settings.enableDownloadProtection !== undefined ? settings.enableDownloadProtection : true,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Atualizar configuração existente
        const { data, error } = await this.supabase
          .from('system_settings')
          .update(settingsData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova configuração
        const { data, error } = await this.supabase
          .from('system_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error: any) {
      console.error('Error saving system settings:', error);
      throw new Error(`Error saving system settings: ${error.message}`);
    }
  }

  // GERAR IMAGEM COM IA (DALL-E)
  async generateImageWithAI(prompt: string): Promise<{ imageUrl: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });

      if (!response.data || !response.data[0] || !response.data[0].url) {
        throw new Error('No image URL received from OpenAI');
      }

      return {
        imageUrl: response.data[0].url
      };
    } catch (error: any) {
      console.error('Error generating image with AI:', error);
      throw new Error(`Error generating image with AI: ${error.message}`);
    }
  }

  async getUnlockedGrimoires(userId: number, sectionId: number): Promise<number[]> {
    try {
      // Busca todos os grimórios da seção ordenados por unlock_order
      const { data: grimoires, error: grimoiresError } = await this.supabase
        .from('grimoires')
        .select('id, unlock_order, title')
        .eq('section_id', sectionId)
        .eq('is_published', true)
        .order('unlock_order', { ascending: true });

      if (grimoiresError || !grimoires) {
        console.error('Erro ao buscar grimórios:', grimoiresError);
        return [];
      }

      // Busca o progresso de leitura do usuário
      const { data: progress, error: progressError } = await this.supabase
        .from('user_progress')
        .select('grimoire_id, progress_percentage')
        .eq('user_id', userId);

      if (progressError) {
        console.error('Erro ao buscar progresso:', progressError);
        return [];
      }

      const unlockedIds = [];
      
      for (const grimoire of grimoires) {
        // O primeiro grimório sempre está desbloqueado
        if (grimoire.unlock_order === 1) {
          unlockedIds.push(grimoire.id);
          continue;
        }

        // Verifica se o grimório anterior foi completado (>=80% de progresso)
        const previousGrimoire = grimoires.find(g => g.unlock_order === grimoire.unlock_order - 1);
        if (previousGrimoire) {
          const previousProgress = progress?.find(p => p.grimoire_id === previousGrimoire.id);
          if (previousProgress && parseFloat(previousProgress.progress_percentage) >= 80) {
            unlockedIds.push(grimoire.id);
          }
        }
      }

      return unlockedIds;
    } catch (error) {
      console.error('Erro ao verificar grimórios desbloqueados:', error);
      return [];
    }
  }

  // ===== MÉTODOS PARA SISTEMA DE CURSOS OCULTISTAS =====

  // Buscar todos os cursos ativos
  async getCursos(): Promise<Curso[]> {
    try {
      const { data, error } = await this.supabase
        .from('cursos')
        .select('*')
        .eq('is_active', true)
        .order('ordem_exibicao');

      if (error) throw new Error(`Error fetching courses: ${error.message}`);
      return data || [];
    } catch (error: any) {
      console.error('Error in getCursos:', error);
      throw error;
    }
  }

  // Buscar curso por slug
  async getCursoBySlug(slug: string): Promise<Curso | null> {
    try {
      const { data, error } = await this.supabase
        .from('cursos')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error fetching course by slug: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error in getCursoBySlug:', error);
      throw error;
    }
  }

  // Buscar módulos de um curso
  async getModulosByCurso(cursoId: number): Promise<Modulo[]> {
    try {
      const { data, error } = await this.supabase
        .from('modulos')
        .select('*')
        .eq('curso_id', cursoId)
        .eq('is_active', true)
        .order('ordem');

      if (error) throw new Error(`Error fetching modules: ${error.message}`);
      return data || [];
    } catch (error: any) {
      console.error('Error in getModulosByCurso:', error);
      throw error;
    }
  }

  // Salvar resposta de usuário para módulo
  async salvarRespostaCurso(resposta: InsertRespostaCurso): Promise<RespostaCurso> {
    try {
      // Verificar se já existe resposta para este usuário e módulo
      const { data: existingResponse, error: fetchError } = await this.supabase
        .from('respostas_cursos')
        .select('*')
        .eq('usuario_id', resposta.usuario_id)
        .eq('modulo_id', resposta.modulo_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error checking existing response: ${fetchError.message}`);
      }

      if (existingResponse) {
        // Atualizar resposta existente
        const { data, error } = await this.supabase
          .from('respostas_cursos')
          .update({
            resposta: resposta.resposta,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)
          .select()
          .single();

        if (error) throw new Error(`Error updating response: ${error.message}`);
        return data;
      } else {
        // Criar nova resposta
        const { data, error } = await this.supabase
          .from('respostas_cursos')
          .insert(resposta)
          .select()
          .single();

        if (error) throw new Error(`Error creating response: ${error.message}`);
        return data;
      }
    } catch (error: any) {
      console.error('Error in salvarRespostaCurso:', error);
      throw error;
    }
  }

  // Buscar respostas do usuário para um curso específico
  async getRespostasByCurso(usuarioId: number, cursoId: number): Promise<RespostaCurso[]> {
    try {
      const { data, error } = await this.supabase
        .from('respostas_cursos')
        .select(`
          *,
          modulos!inner(
            id,
            curso_id,
            titulo,
            ordem
          )
        `)
        .eq('usuario_id', usuarioId)
        .eq('modulos.curso_id', cursoId);

      if (error) throw new Error(`Error fetching responses: ${error.message}`);
      return data || [];
    } catch (error: any) {
      console.error('Error in getRespostasByCurso:', error);
      throw error;
    }
  }

  // Buscar progresso do usuário em um curso
  async getProgressoCurso(usuarioId: number, cursoId: number): Promise<ProgressoCurso | null> {
    try {
      const { data, error } = await this.supabase
        .from('progresso_cursos')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('curso_id', cursoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Error fetching course progress: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error in getProgressoCurso:', error);
      throw error;
    }
  }

  // Atualizar progresso do usuário em um curso
  async atualizarProgressoCurso(progresso: InsertProgressoCurso): Promise<ProgressoCurso> {
    try {
      // Verificar se já existe progresso para este usuário e curso
      const { data: existingProgress, error: fetchError } = await this.supabase
        .from('progresso_cursos')
        .select('*')
        .eq('usuario_id', progresso.usuario_id)
        .eq('curso_id', progresso.curso_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Error checking existing progress: ${fetchError.message}`);
      }

      if (existingProgress) {
        // Atualizar progresso existente
        const { data, error } = await this.supabase
          .from('progresso_cursos')
          .update({
            modulo_atual: progresso.modulo_atual,
            modulos_concluidos: progresso.modulos_concluidos,
            concluido: progresso.concluido,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (error) throw new Error(`Error updating progress: ${error.message}`);
        return data;
      } else {
        // Criar novo progresso
        const { data, error } = await this.supabase
          .from('progresso_cursos')
          .insert(progresso)
          .select()
          .single();

        if (error) throw new Error(`Error creating progress: ${error.message}`);
        return data;
      }
    } catch (error: any) {
      console.error('Error in atualizarProgressoCurso:', error);
      throw error;
    }
  }

  // Verificar se usuário tem acesso ao curso
  async userHasAccessToCourse(userId: number, cursoId: number): Promise<boolean> {
    try {
      // Verificar se curso é gratuito
      const { data: curso } = await this.supabase
        .from('cursos')
        .select('is_paid')
        .eq('id', cursoId)
        .single();

      if (!curso?.is_paid) {
        return true; // Cursos gratuitos sempre têm acesso
      }

      // Verificar se há compra confirmada
      const { data: purchase } = await this.supabase
        .from('course_purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', cursoId)
        .eq('status', 'completed')
        .single();

      return !!purchase;
    } catch (error: any) {
      console.error('Error checking course access:', error);
      return false;
    }
  }

  // ===== MÉTODOS ADMINISTRATIVOS PARA CURSOS =====

  // Criar novo curso
  async createCurso(cursoData: InsertCurso): Promise<Curso> {
    try {
      const { data, error } = await this.supabase
        .from('cursos')
        .insert(cursoData)
        .select()
        .single();

      if (error) throw new Error(`Error creating course: ${error.message}`);
      return data;
    } catch (error: any) {
      console.error('Error in createCurso:', error);
      throw error;
    }
  }

  // Atualizar curso
  async updateCurso(cursoId: number, updateData: Partial<InsertCurso>): Promise<Curso> {
    try {
      const { data, error } = await this.supabase
        .from('cursos')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', cursoId)
        .select()
        .single();

      if (error) throw new Error(`Error updating course: ${error.message}`);
      return data;
    } catch (error: any) {
      console.error('Error in updateCurso:', error);
      throw error;
    }
  }

  // Deletar curso
  async deleteCurso(cursoId: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cursos')
        .delete()
        .eq('id', cursoId);

      if (error) throw new Error(`Error deleting course: ${error.message}`);
    } catch (error: any) {
      console.error('Error in deleteCurso:', error);
      throw error;
    }
  }

  // Criar novo módulo
  async createModulo(moduloData: InsertModulo): Promise<Modulo> {
    try {
      const { data, error } = await this.supabase
        .from('modulos')
        .insert(moduloData)
        .select()
        .single();

      if (error) throw new Error(`Error creating module: ${error.message}`);
      return data;
    } catch (error: any) {
      console.error('Error in createModulo:', error);
      throw error;
    }
  }

  // Atualizar módulo
  async updateModulo(moduloId: number, updateData: Partial<InsertModulo>): Promise<Modulo> {
    try {
      const { data, error } = await this.supabase
        .from('modulos')
        .update(updateData)
        .eq('id', moduloId)
        .select()
        .single();

      if (error) throw new Error(`Error updating module: ${error.message}`);
      return data;
    } catch (error: any) {
      console.error('Error in updateModulo:', error);
      throw error;
    }
  }

  // Deletar módulo
  async deleteModulo(moduloId: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('modulos')
        .delete()
        .eq('id', moduloId);

      if (error) throw new Error(`Error deleting module: ${error.message}`);
    } catch (error: any) {
      console.error('Error in deleteModulo:', error);
      throw error;
    }
  }

  // Criar Payment Intent para curso
  async createCoursePaymentIntent(cursoId: number, userId: number) {
    try {
      // Buscar informações do curso
      const { data: curso, error } = await this.supabase
        .from('cursos')
        .select('*')
        .eq('id', cursoId)
        .single();

      if (error || !curso) {
        throw new Error('Curso não encontrado');
      }

      if (!curso.is_paid) {
        // Para cursos gratuitos, apenas registrar "compra"
        await this.supabase
          .from('course_purchases')
          .insert({
            user_id: userId,
            course_id: cursoId,
            amount: 0,
            status: 'completed',
            payment_method: 'free'
          });

        return { success: true, message: 'Inscrição realizada com sucesso' };
      }

      // Para cursos pagos, criar Payment Intent no Stripe
      const amount = Math.round(parseFloat(curso.preco || '0') * 100); // Converter para centavos

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          courseId: cursoId.toString(),
          userId: userId.toString(),
          courseTitle: curso.nome,
          type: 'course_purchase'
        },
        description: `Compra do curso: ${curso.nome}`
      });

      // Registrar tentativa de compra
      await this.supabase
        .from('course_purchases')
        .insert({
          user_id: userId,
          course_id: cursoId,
          payment_intent_id: paymentIntent.id,
          amount: parseFloat(curso.preco || '0'),
          status: 'pending'
        });

      return {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      };
    } catch (error: any) {
      console.error('Error creating course payment intent:', error);
      throw new Error(`Error creating course payment intent: ${error?.message || 'Unknown error'}`);
    }
  }
  // SISTEMA DE INICIALIZAÇÃO AUTOMÁTICA DO BANCO
  async ensureDatabaseStructure(): Promise<boolean> {
    try {
      console.log('🔧 Verificando estrutura do banco de dados...');
      
      // Verificar se as tabelas principais existem
      const tables = ['users', 'library_sections', 'grimoires', 'user_progress'];
      const adminClient = this.getAdminClient();
      
      for (const table of tables) {
        const { error } = await adminClient.from(table).select('count', { count: 'exact', head: true });
        
        if (error && error.code === 'PGRST116') {
          console.log(`⚠️ Tabela ${table} não encontrada - executando setup automático...`);
          return false; // Indica que precisa executar o setup completo
        }
      }
      
      console.log('✅ Estrutura do banco verificada com sucesso');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao verificar estrutura do banco:', error);
      return false;
    }
  }

  // TESTE DE CONECTIVIDADE COMPLETO
  async testConnection(): Promise<{ status: string; details: any }> {
    try {
      const adminClient = this.getAdminClient();
      
      // Teste 1: Conexão básica
      const { data: ping, error: pingError } = await adminClient
        .from('users')
        .select('count', { count: 'exact', head: true });
      
      if (pingError) {
        return {
          status: 'ERROR',
          details: {
            message: 'Falha na conexão básica',
            error: pingError.message,
            suggestion: 'Verifique as credenciais do Supabase'
          }
        };
      }
      
      // Teste 2: Permissões de escrita
      const testData = { 
        username: `test_${Date.now()}`, 
        password: 'test', 
        email: `test${Date.now()}@test.com` 
      };
      
      const { data: insertTest, error: insertError } = await adminClient
        .from('users')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        return {
          status: 'PARTIAL',
          details: {
            message: 'Conexão OK, mas sem permissões de escrita',
            error: insertError.message,
            suggestion: 'Verificar políticas RLS e service role key'
          }
        };
      }
      
      // Limpar teste
      await adminClient.from('users').delete().eq('id', insertTest.id);
      
      return {
        status: 'SUCCESS',
        details: {
          message: 'Conexão e permissões funcionando perfeitamente',
          tables_accessible: ['users', 'grimoires', 'library_sections', 'user_progress'],
          admin_privileges: true
        }
      };
      
    } catch (error: any) {
      return {
        status: 'CRITICAL',
        details: {
          message: 'Falha crítica na conexão',
          error: error.message,
          suggestion: 'Verificar URL e chaves do Supabase'
        }
      };
    }
  }
}

export const supabaseService = new SupabaseService();