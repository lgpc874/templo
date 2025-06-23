-- Criar tabela library_sections se não existir
CREATE TABLE IF NOT EXISTS library_sections (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  sort_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela grimoires se não existir
CREATE TABLE IF NOT EXISTS grimoires (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  section_id BIGINT REFERENCES library_sections(id),
  is_published BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  unlock_order INTEGER DEFAULT 1,
  difficulty_level TEXT DEFAULT 'beginner',
  author_id BIGINT REFERENCES users(id),
  cover_image_url TEXT,
  estimated_read_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir seções de biblioteca padrão
INSERT INTO library_sections (name, description, color, sort_order, is_active) VALUES
  ('Porta Umbrae', 'Portal de entrada aos mistérios primordiais', '#8B5CF6', 1, true),
  ('Atrium Ignis', 'Câmara das chamas do conhecimento', '#EF4444', 2, true),
  ('Sanctum Tenebris', 'Santuário das trevas sagradas', '#1F2937', 3, true),
  ('Arcanum Noctis', 'Arquivo dos segredos noturnos', '#059669', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir grimórios de exemplo
INSERT INTO grimoires (title, content, description, section_id, is_published, is_paid, price, unlock_order, difficulty_level) VALUES
  (
    'Manual do Buscador', 
    '<h2>Bem-vindo à Senda</h2><p>Este grimório marca o início de sua jornada nos mistérios luciferianos.</p><p>Aqui você encontrará os fundamentos essenciais para compreender nossa filosofia e práticas iniciais.</p><h3>Primeiros Passos</h3><p>A jornada do buscador começa com a compreensão de que o conhecimento é poder, e o poder é responsabilidade.</p>',
    'Grimório introdutório para novos buscadores na senda luciferiana',
    1, true, false, 0, 1, 'beginner'
  ),
  (
    'Grimório das Sombras Primordiais',
    '<h2>Os Mistérios Profundos</h2><p>Este texto sagrado contém conhecimentos avançados sobre as forças primordiais que governam nossa realidade.</p><p>Prepare-se para mergulhar nas profundezas do conhecimento proibido.</p><h3>Invocações Primordiais</h3><p>As invocações aqui contidas foram transmitidas através dos séculos pelos mestres da arte.</p>',
    'Conhecimentos avançados sobre as forças primordiais e rituais de invocação',
    2, true, true, 29.99, 2, 'advanced'
  ),
  (
    'Códice dos Véus Rasgados',
    '<h2>Além dos Véus da Realidade</h2><p>Este grimório revela os segredos ocultos por trás dos véus que separam os mundos.</p><p>Somente aqueles que provaram sua dedicação podem acessar estes ensinamentos.</p><h3>Técnicas de Transição</h3><p>Aprenda a navegar entre os planos de existência com segurança e propósito.</p>',
    'Técnicas avançadas para trabalhar além dos véus da realidade comum',
    3, true, true, 49.99, 3, 'expert'
  )
ON CONFLICT (id) DO NOTHING;