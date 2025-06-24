-- Tabela para páginas customizadas
CREATE TABLE IF NOT EXISTS custom_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  css_content TEXT,
  js_content TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  required_role VARCHAR(50) DEFAULT 'buscador',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  custom_layout BOOLEAN DEFAULT false,
  route_path VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_pages_updated_at BEFORE UPDATE ON custom_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir algumas páginas de exemplo
INSERT INTO custom_pages (name, slug, title, description, html_content, css_content, required_role, route_path) VALUES
('Sobre o Templo', 'sobre-templo', 'Sobre o Templo do Abismo', 'Conheça a história e missão do Templo', 
'<div class="page-content">
  <h1>Sobre o Templo do Abismo</h1>
  <p>O Templo do Abismo é uma ordem iniciática dedicada ao estudo dos mistérios ocultos.</p>
  <p>Nossa missão é guiar buscadores através dos véus da realidade.</p>
</div>',
'.page-content { max-width: 800px; margin: 0 auto; padding: 2rem; color: #f3f4f6; }
.page-content h1 { color: #fbbf24; text-align: center; margin-bottom: 2rem; }',
'public', '/sobre-templo'),

('Rituais Avançados', 'rituais-avancados', 'Rituais Avançados', 'Página restrita para iniciados avançados',
'<div class="page-content">
  <h1>Rituais Avançados</h1>
  <p>Conteúdo restrito para discípulos das chamas e acima.</p>
  <div class="ritual-section">
    <h2>Ritual do Fogo Interior</h2>
    <p>Este ritual é reservado para aqueles que dominaram os fundamentos.</p>
  </div>
</div>',
'.page-content { max-width: 900px; margin: 0 auto; padding: 2rem; color: #f3f4f6; }
.ritual-section { background: rgba(239, 68, 68, 0.1); padding: 1.5rem; border-left: 4px solid #ef4444; margin: 2rem 0; }',
'discipulo_chamas', '/rituais-avancados');
