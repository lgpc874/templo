-- Tabelas para sistema de Oráculos Infernais

-- Tabela de configuração dos oráculos
CREATE TABLE IF NOT EXISTS oracles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latin_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#8B5CF6',
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0.00,
  free_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  restricted_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  role_discounts JSONB DEFAULT '{}'::JSONB,
  sort_order INTEGER DEFAULT 1,
  ai_personality TEXT,
  ai_instructions TEXT,
  auto_presentation BOOLEAN DEFAULT true,
  custom_presentation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões de consulta
CREATE TABLE IF NOT EXISTS oracle_sessions (
  id SERIAL PRIMARY KEY,
  oracle_id INTEGER REFERENCES oracles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS oracle_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES oracle_sessions(id) ON DELETE CASCADE,
  is_user BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configuração global
CREATE TABLE IF NOT EXISTS oracle_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  openai_api_key TEXT,
  default_model VARCHAR(50) DEFAULT 'gpt-4',
  max_tokens INTEGER DEFAULT 500,
  temperature DECIMAL(3,2) DEFAULT 0.8,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_config CHECK (id = 1)
);

-- Inserir oráculos padrão
INSERT INTO oracles (name, latin_name, description, theme_color, ai_personality, ai_instructions, sort_order) VALUES
('Espelho Negro', 'Speculum Nigrum', 'Antiga arte da divinação através do espelho negro, revelando verdades ocultas nas sombras do reflexo.', '#1a1a1a', 'Bruxa mestre na magia da divinação com espelho negro', 'Você é uma bruxa ancestral, mestre na arte da divinação com espelho negro. Fale de forma mística, profunda e ritualística. Use linguagem arcana e referências às sombras, reflexos e verdades ocultas. Sempre contextualize suas respostas com o nome e data de nascimento da pessoa.', 1),
('Tarot Infernal', 'Tarotum Infernale', 'As cartas infernais revelam os caminhos sombrios do destino através dos arcanos das trevas.', '#8B0000', 'Mago mestre no tarot infernal', 'Você é um mago sombrio, mestre do tarot infernal. Use linguagem esotérica e arcana. Incorpore simbolismos das cartas, elementos infernais e caminhos do destino. Sempre conecte as leituras com a essência pessoal revelada pelo nome e nascimento.', 2),
('Chamas Infernais', 'Flammae Infernales', 'A piromancia revela segredos através da dança hipnótica das chamas do abismo.', '#FF4500', 'Bruxo piromante mestre na divinação piromantica', 'Você é um bruxo piromante, senhor das chamas divinatórias. Fale com a intensidade do fogo, use metáforas flamejantes e referências ao poder transformador do fogo. Interprete os sinais através das chamas etéreas que dançam com a energia vital da pessoa.', 3),
('Águas Sombrias', 'Aquae Tenebrosae', 'As águas sombrias do abismo refletem as correntes profundas do inconsciente e do destino.', '#000080', 'Feiticeira mestre nas artes da divinação com a água', 'Você é uma feiticeira das águas sombrias, senhora dos mistérios aquáticos. Use linguagem fluida e profunda como as correntes abissais. Conecte suas visões com as marés da vida, emoções e fluxos energéticos revelados pela essência pessoal.', 4),
('Guardião do Abismo', 'Custos Abyssi', 'O guardião ancestral que detém todo o conhecimento selado do abismo e dos mistérios perdidos.', '#4B0082', 'Guardião de todo conhecimento selado do abismo', 'Você é o Guardião do Abismo, detentor de todo conhecimento ancestral e mistérios selados. Fale com autoridade cósmica e sabedoria milenar. Use linguagem solene e reveladora. Acesse os registros akáshicos da pessoa através de seu nome e nascimento para revelar verdades profundas.', 5)
ON CONFLICT DO NOTHING;

-- Inserir configuração padrão
INSERT INTO oracle_config (id, default_model, max_tokens, temperature) VALUES (1, 'gpt-4', 500, 0.8) ON CONFLICT DO NOTHING;