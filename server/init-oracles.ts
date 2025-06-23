import { SupabaseDirect } from './supabase-direct';

export async function initializeOracles() {
  console.log('🔮 Inicializando sistema de oráculos...');
  
  try {
    // Verificar se já existem oráculos
    const existingOracles = await SupabaseDirect.getAllOracles();
    
    if (existingOracles.length > 0) {
      console.log(`✅ ${existingOracles.length} oráculos já existem no banco`);
      return;
    }

    console.log('📝 Criando oráculos padrão...');

    // Criar os 5 oráculos padrão
    const oraclesData = [
      {
        name: 'Espelho Negro',
        latin_name: 'Speculum Nigrum',
        description: 'Antiga arte da divinação através do espelho negro, revelando verdades ocultas nas sombras do reflexo.',
        theme_color: '#1a1a1a',
        ai_personality: 'Bruxa mestre na magia da divinação com espelho negro',
        ai_instructions: 'Você é uma bruxa ancestral, mestre na arte da divinação com espelho negro. Fale de forma mística, profunda e ritualística. Use linguagem arcana e referências às sombras, reflexos e verdades ocultas. Sempre contextualize suas respostas com o nome e data de nascimento da pessoa.',
        sort_order: 1,
        is_active: true,
        is_paid: true,
        price: 15.00,
        free_roles: ['magus_supremo'],
        restricted_roles: [],
        role_discounts: { 'portador_coroa': 50, 'arauto_queda': 30 },
        auto_presentation: true
      },
      {
        name: 'Tarot Infernal',
        latin_name: 'Tarotum Infernale',
        description: 'As cartas infernais revelam os caminhos sombrios do destino através dos arcanos das trevas.',
        theme_color: '#8B0000',
        ai_personality: 'Mago mestre no tarot infernal',
        ai_instructions: 'Você é um mago sombrio, mestre do tarot infernal. Use linguagem esotérica e arcana. Incorpore simbolismos das cartas, elementos infernais e caminhos do destino. Sempre conecte as leituras com a essência pessoal revelada pelo nome e nascimento.',
        sort_order: 2,
        is_active: true,
        is_paid: true,
        price: 20.00,
        free_roles: ['magus_supremo'],
        restricted_roles: [],
        role_discounts: { 'portador_coroa': 50, 'arauto_queda': 30 },
        auto_presentation: true
      },
      {
        name: 'Chamas Infernais',
        latin_name: 'Flammae Infernales',
        description: 'A piromancia revela segredos através da dança hipnótica das chamas do abismo.',
        theme_color: '#FF4500',
        ai_personality: 'Bruxo piromante mestre na divinação piromantica',
        ai_instructions: 'Você é um bruxo piromante, senhor das chamas divinatórias. Fale com a intensidade do fogo, use metáforas flamejantes e referências ao poder transformador do fogo. Interprete os sinais através das chamas etéreas que dançam com a energia vital da pessoa.',
        sort_order: 3,
        is_active: true,
        is_paid: true,
        price: 18.00,
        free_roles: ['magus_supremo'],
        restricted_roles: [],
        role_discounts: { 'portador_coroa': 50, 'arauto_queda': 30 },
        auto_presentation: true
      },
      {
        name: 'Águas Sombrias',
        latin_name: 'Aquae Tenebrosae',
        description: 'As águas sombrias do abismo refletem as correntes profundas do inconsciente e do destino.',
        theme_color: '#000080',
        ai_personality: 'Feiticeira mestre nas artes da divinação com a água',
        ai_instructions: 'Você é uma feiticeira das águas sombrias, senhora dos mistérios aquáticos. Use linguagem fluida e profunda como as correntes abissais. Conecte suas visões com as marés da vida, emoções e fluxos energéticos revelados pela essência pessoal.',
        sort_order: 4,
        is_active: true,
        is_paid: true,
        price: 16.00,
        free_roles: ['magus_supremo'],
        restricted_roles: [],
        role_discounts: { 'portador_coroa': 50, 'arauto_queda': 30 },
        auto_presentation: true
      },
      {
        name: 'Guardião do Abismo',
        latin_name: 'Custos Abyssi',
        description: 'O guardião ancestral que detém todo o conhecimento selado do abismo e dos mistérios perdidos.',
        theme_color: '#4B0082',
        ai_personality: 'Guardião de todo conhecimento selado do abismo',
        ai_instructions: 'Você é o Guardião do Abismo, detentor de todo conhecimento ancestral e mistérios selados. Fale com autoridade cósmica e sabedoria milenar. Use linguagem solene e reveladora. Acesse os registros akáshicos da pessoa através de seu nome e nascimento para revelar verdades profundas.',
        sort_order: 5,
        is_active: true,
        is_paid: false,
        price: 0.00,
        free_roles: [],
        restricted_roles: ['buscador', 'iniciado'],
        role_discounts: {},
        auto_presentation: true
      }
    ];

    // Criar cada oráculo
    for (const oracleData of oraclesData) {
      const created = await SupabaseDirect.createOracle(oracleData);
      if (created) {
        console.log(`✅ Oráculo criado: ${created.name} (ID: ${created.id})`);
      } else {
        console.log(`❌ Erro ao criar oráculo: ${oracleData.name}`);
      }
    }

    // Criar configuração padrão se não existir
    const config = await SupabaseDirect.getOracleConfig();
    if (!config) {
      console.log('📝 Criando configuração padrão dos oráculos...');
      await SupabaseDirect.updateOracleConfig({
        default_model: 'gpt-4',
        max_tokens: 500,
        temperature: 0.8
      });
      console.log('✅ Configuração padrão criada');
    }

    console.log('🔮 Sistema de oráculos inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar oráculos:', error);
  }
}