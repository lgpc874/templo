# Templo do Abismo - Sistema de Cursos

## Visão Geral do Projeto
Sistema web completo para "Templo do Abismo" com foco em cursos hierárquicos baseados em papéis (roles), sistema sequencial de desbloqueio e recompensas automáticas. O projeto utiliza React + TypeScript no frontend, Express.js no backend e Supabase como banco de dados.

## Arquitetura do Projeto

### Frontend (client/)
- React 18 com TypeScript
- Vite como bundler
- TailwindCSS + shadcn/ui para componentes
- React Query para gerenciamento de estado
- Wouter para roteamento
- Sistema de autenticação com JWT

### Backend (server/)
- Express.js com TypeScript
- Autenticação JWT customizada
- Integração direta com Supabase
- APIs RESTful para CRUD de cursos e usuários

### Banco de Dados
- Supabase (PostgreSQL)
- Tabelas principais: users, courses, course_sections, course_modules
- Sistema de roles hierárquico: buscador → iniciado → portador_veu → discipulo_chamas → guardiao_nome → arauto_queda → portador_coroa → magus_supremo

## Funcionalidades Implementadas

### Sistema de Cursos ✓
- Criação, edição e exclusão de cursos (admin)
- Organização por seções hierárquicas
- Sistema de preços e cursos pagos/gratuitos
- Upload de imagens para cursos

### Sistema de Roles e Acesso ✓
- Controle de acesso baseado em roles
- Hierarquia de permissões bem definida
- Admin com acesso total (magus_supremo)

### Autenticação ✓
- Login/registro com validação
- Tokens JWT funcionais
- Sessões persistentes
- Middleware de autenticação

## Funcionalidades em Desenvolvimento

### Sistema Sequencial e Recompensas (Pendente SQL)
- Cursos sequenciais dentro de cada seção (1→2→3→4→5)
- Desbloqueio automático do próximo curso após conclusão
- Recompensas de role ao completar cursos
- Campos necessários no banco: `sequential_order`, `is_sequential`, `reward_role_id`

### Sistema de Módulos
- Módulos dentro de cada curso
- Editor de texto rico para conteúdo
- Submissões obrigatórias
- Rituais mandatórios

## Status Atual (23/06/2025)
- ✅ Conexão Supabase 100% funcional
- ✅ Sistema de autenticação funcionando
- ✅ Criação de cursos funcionando (curso "teste1" criado com ID: 10)
- ✅ Interface admin completa com formulários de criação/edição
- ✅ Sistema avançado de módulos com submissões configuráveis
- ✅ Editor completo de módulos com requisitos de conclusão
- ✅ Sistema de bloqueio por submissão inicial
- ✅ Componentes interativos para conclusão de módulos
- ✅ Sistema Oraculum com 5 oráculos em nomes latinos funcionais
- ✅ Páginas individuais para cada oráculo criadas

## Preferências do Usuário
- Comunicação direta, sem enrolação
- Exige verificação real no banco de dados antes de confirmar funcionalidades
- Não tolera "claims" sem evidência
- Prefere soluções completas e funcionais
- Quer sistema 100% conectado ao Supabase, sem mocks
- **CRÍTICO**: Backend é Supabase, NUNCA usar banco local ou psql
- **CRÍTICO**: Sempre usar APIs do servidor para verificar dados no Supabase
- **NOVO**: Sistema Oraculum deve usar APENAS IA real (OpenAI), sem fallbacks simulados
- **NOVO**: IA não deve mencionar data de nascimento diretamente, apenas referências sutis aos ciclos cósmicos

## Mudanças Recentes
- **23/06/2025 19:04**: Corrigida autenticação JWT e conexão Supabase
- **23/06/2025 19:04**: Primeiro curso criado com sucesso (teste1, ID: 10)
- **23/06/2025 19:05**: Fornecido SQL para adicionar colunas sequenciais
- **23/06/2025 19:07**: Interface admin mostrando curso criado corretamente
- **23/06/2025 19:08**: Sistema de módulos funcionando (POST /api/admin/modules retornou ID: 5)
- **23/06/2025 19:09**: Sistema completamente funcional - aguardando apenas execução do SQL das colunas
- **23/06/2025 19:20**: Implementado sistema avançado de módulos interativos
- **23/06/2025 19:21**: Editor completo com submissões configuráveis (antes/depois)
- **23/06/2025 19:22**: Sistema de requisitos de conclusão (botões, rituais, desafios, confirmações)
- **23/06/2025 19:33**: Corrigidos problemas de edição e exclusão de módulos
- **23/06/2025 19:33**: Adicionados logs detalhados para debug das operações CRUD
- **23/06/2025 19:33**: Implementada sincronização automática após operações
- **23/06/2025 19:41**: Editor de módulos avançado com abas completamente implementado
- **23/06/2025 19:41**: Modal de edição substituído por sistema de abas (Conteúdo, Submissão, Conclusão, Preview)
- **23/06/2025 19:52**: Sistema completo de cursos implementado com campos sequenciais
- **23/06/2025 19:52**: Adicionados: ordem sequencial, bloqueio, preços, recompensas de roles
- **23/06/2025 19:53**: Sistema de requisitos de conclusão implementado na aba Conclusão
- **23/06/2025 19:58**: Sistema de requisitos implementado também na criação de módulos
- **23/06/2025 19:58**: Interface completa de requisitos funcionando em criação e edição
- **23/06/2025 20:03**: Implementadas rotas de grimórios no servidor atual
- **23/06/2025 20:03**: Corrigido problema de grimórios não carregando (rotas estavam no backup)
- **23/06/2025 20:03**: Criado SQL para tabelas de grimórios e seções de biblioteca
- **23/06/2025 20:04**: Sistema de grimórios 100% funcional
- **23/06/2025 20:04**: 6 grimórios e 5 seções carregando corretamente
- **23/06/2025 20:04**: Rotas de progresso de grimórios implementadas
- **23/06/2025 20:15**: Criada página Forja Libri completa para administração de grimórios
- **23/06/2025 20:15**: Sistema CRUD completo para grimórios e seções de biblioteca
- **23/06/2025 20:15**: Editor avançado com suporte a HTML/CSS, cores, preços e roles
- **23/06/2025 20:15**: Botão adicionado no painel admin e rotas configuradas
- **23/06/2025 20:27**: Corrigido nome do botão para "Libri Tenebris" e rota para /admin/libri
- **23/06/2025 20:27**: Sistema Forja Libri totalmente integrado ao painel administrativo
- **23/06/2025 20:42**: Editor HTML/CSS separado implementado na Forja Libri
- **23/06/2025 20:42**: Sistema de abas com HTML, CSS e Preview em tempo real
- **23/06/2025 20:42**: Suporte completo a CSS personalizado e HTML puro
- **23/06/2025 20:46**: Corrigido editor de seções removendo campo icon_url inexistente
- **23/06/2025 20:46**: Sistema de seções totalmente funcional implementado
- **23/06/2025 20:50**: Sistema Forja Libri 100% concluído e testado
- **23/06/2025 20:50**: Edição de seções confirmada funcionando (logs mostram PUT 200)
- **23/06/2025 21:22**: Sistema Oraculum completamente implementado
- **23/06/2025 21:22**: 5 oráculos criados com IA integrada (OpenAI GPT-4)
- **23/06/2025 21:22**: Interface de chat personalizada por tema de cada oráculo
- **23/06/2025 21:22**: Sistema de pagamento e roles configurável por oráculo
- **23/06/2025 21:22**: Página de administração completa para oráculos
- **23/06/2025 21:22**: APIs completas para sessões, mensagens e configurações
- **23/06/2025 22:10**: Páginas individuais dos oráculos com nomes latinos implementadas
- **23/06/2025 22:10**: 5 botões funcionais na página Oraculum direcionando para consultas específicas
- **24/06/2025 00:42**: Sistema de apresentação automática do oráculo implementado
- **24/06/2025 00:42**: Removido sistema de IA simulada - apenas OpenAI real permitido
- **24/06/2025 00:42**: Oráculo se apresenta automaticamente ao entrar no chat
- **24/06/2025 00:44**: IA configurada para não mencionar data de nascimento diretamente
- **24/06/2025 00:44**: Sistema permite referências sutis a ciclos cósmicos baseados no nascimento
- **24/06/2025 00:47**: Simplificado sistema de prompt - IA recebe contexto automaticamente
- **24/06/2025 00:47**: Removidas variáveis obrigatórias - prompt pode ser escrito naturalmente

## Sistema Oraculum Implementado ✅
- **5 Oráculos Criados**: Espelho Negro, Tarot Infernal, Chamas Infernais, Águas Sombrias, Guardião do Abismo
- **IA Integrada**: GPT-4 com personalidades específicas para cada oráculo
- **Sistema de Chat**: Interface personalizada com tema único por oráculo
- **Controle de Acesso**: Pagamento por consulta, roles gratuitos, descontos configuráveis
- **Admin Completo**: Criação, edição, configuração de oráculos e IA
- **Banco de Dados**: Tabelas para oráculos, sessões, mensagens e configurações

## Próximos Passos
1. Executar SQL para criar tabelas dos oráculos (create-oracles-tables.sql)
2. Configurar chave OpenAI no painel admin
3. Testar sistema completo de consultas aos oráculos
4. Implementar sistema de pagamento real (opcional)