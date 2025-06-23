-- Adicionar coluna icon_url na tabela library_sections
ALTER TABLE library_sections ADD COLUMN IF NOT EXISTS icon_url TEXT;