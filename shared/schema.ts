import { pgTable, text, bigserial, bigint, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários do sistema
export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  role: text("role").default("buscador").notNull(), // buscador, iniciado, admin
  subscription_status: text("subscription_status").default("free"),
  profile_image_url: text("profile_image_url"),
  theme_preference: text("theme_preference").default("dark"),
  email_verified: boolean("email_verified").default(false),
  last_login_at: timestamp("last_login_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Seções da biblioteca
export const library_sections = pgTable("library_sections", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color").default("#D97706"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Grimórios
export const grimoires = pgTable("grimoires", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  section_id: bigint("section_id", { mode: "number" }).references(() => library_sections.id),
  author_id: bigint("author_id", { mode: "number" }).references(() => users.id),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  is_paid: boolean("is_paid").default(false),
  is_published: boolean("is_published").default(true),
  is_featured: boolean("is_featured").default(false),
  unlock_order: integer("unlock_order").default(1),
  cover_image_url: text("cover_image_url"),
  excerpt: text("excerpt"),
  difficulty_level: text("difficulty_level").default("beginner"),
  estimated_read_time: integer("estimated_read_time").default(30),
  word_count: integer("word_count").default(0),
  language: text("language").default("pt-BR"),
  content_type: text("content_type").default("grimoire"),
  access_level: text("access_level").default("public"),
  download_count: integer("download_count").default(0),
  view_count: integer("view_count").default(0),
  rating_average: decimal("rating_average", { precision: 3, scale: 2 }).default("0"),
  rating_count: integer("rating_count").default(0),
  // Novos campos para funcionalidades avançadas
  custom_css: text("custom_css"),
  background_color: text("background_color").default("#1a0a0a"),
  is_restricted: boolean("is_restricted").default(false),
  power_words: text("power_words"), // JSON array de palavras de poder
  content_structure: text("content_structure").default("single"), // "single" ou "chapters"
  enable_pdf_download: boolean("enable_pdf_download").default(false),
  pdf_custom_styles: text("pdf_custom_styles"),
  ai_prompt_used: text("ai_prompt_used"),
  generation_settings: text("generation_settings"), // JSON das configurações da IA
  display_order: integer("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Capítulos (compatibilidade)
export const chapters = pgTable("chapters", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  grimoire_id: bigint("grimoire_id", { mode: "number" }).references(() => grimoires.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  chapter_order: integer("chapter_order").default(1),
  is_published: boolean("is_published").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Progresso do usuário
export const user_progress = pgTable("user_progress", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id),
  grimoire_id: bigint("grimoire_id", { mode: "number" }).references(() => grimoires.id),
  chapter_id: bigint("chapter_id", { mode: "number" }).references(() => chapters.id),
  progress_percentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  current_page: integer("current_page").default(1),
  total_pages: integer("total_pages").default(1),

  is_completed: boolean("is_completed").default(false),
  completion_date: timestamp("completion_date"),
  last_read_at: timestamp("last_read_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Compras de grimórios
export const grimoire_purchases = pgTable("grimoire_purchases", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  grimoire_id: bigint("grimoire_id", { mode: "number" }).references(() => grimoires.id).notNull(),
  payment_intent_id: text("payment_intent_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  status: text("status").default("pending").notNull(),
  payment_method: text("payment_method").default("stripe"),
  purchased_at: timestamp("purchased_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow(),
});

// Configurações da IA
export const ai_settings = pgTable("ai_settings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  setting_name: text("setting_name").unique().notNull(),
  personality: text("personality").default("luciferian"),
  complexity: text("complexity").default("beginner"),
  length: text("length").default("medium"),
  style: text("style").default("mixed"),
  guidelines: text("guidelines").default(""),
  default_section_id: bigint("default_section_id", { mode: "number" }).references(() => library_sections.id),
  auto_price: boolean("auto_price").default(false),
  price_range_min: decimal("price_range_min", { precision: 10, scale: 2 }).default("9.99"),
  price_range_max: decimal("price_range_max", { precision: 10, scale: 2 }).default("49.99"),
  model_name: text("model_name").default("gpt-4"),
  max_tokens: integer("max_tokens").default(4000),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Cursos do Templo
export const courses = pgTable("courses", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  section_id: bigint("section_id", { mode: "number" }).references(() => course_sections.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  difficulty_level: text("difficulty_level").default("introductio"),
  estimated_duration: integer("estimated_duration").default(60), // minutos
  cover_image_url: text("cover_image_url"),
  is_published: boolean("is_published").default(true),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Seções dos Cursos
export const course_sections = pgTable("course_sections", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default("#D97706"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Compras de Cursos
export const course_purchases = pgTable("course_purchases", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  course_id: bigint("course_id", { mode: "number" }).references(() => courses.id).notNull(),
  payment_intent_id: text("payment_intent_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  purchased_at: timestamp("purchased_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Progresso nos Cursos
export const course_progress = pgTable("course_progress", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  course_id: bigint("course_id", { mode: "number" }).references(() => courses.id).notNull(),
  progress_percentage: decimal("progress_percentage", { precision: 5, scale: 2 }).default("0"),
  is_completed: boolean("is_completed").default(false),
  completion_date: timestamp("completion_date"),
  last_accessed_at: timestamp("last_accessed_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Oráculos
export const oracles = pgTable("oracles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  personality: text("personality").notNull(), // Personalidade única da IA
  introduction_message: text("introduction_message").notNull(),
  price_per_question: decimal("price_per_question", { precision: 10, scale: 2 }).notNull(),
  avatar_url: text("avatar_url"),
  color: text("color").default("#D97706"),
  is_active: boolean("is_active").default(true),
  sort_order: integer("sort_order").default(0),
  ai_model: text("ai_model").default("gpt-4o"),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.8"),
  max_tokens: integer("max_tokens").default(2000),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Consultas aos Oráculos
export const oracle_consultations = pgTable("oracle_consultations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id).notNull(),
  oracle_id: bigint("oracle_id", { mode: "number" }).references(() => oracles.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  payment_intent_id: text("payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("completed").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Voz da Pluma - Reflexões Diárias
export const daily_reflections = pgTable("daily_reflections", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  is_published: boolean("is_published").default(true),
  views_count: integer("views_count").default(0),
  generated_by_ai: boolean("generated_by_ai").default(true),
  scheduled_at: timestamp("scheduled_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Biblioteca de Artigos
export const articles = pgTable("articles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author_id: bigint("author_id", { mode: "number" }).references(() => users.id),
  category: text("category").default("textos"), // textos, poemas, escrituras
  is_published: boolean("is_published").default(true),
  is_featured: boolean("is_featured").default(false),
  cover_image_url: text("cover_image_url"),
  views_count: integer("views_count").default(0),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Ritual de Iniciação
export const initiation_ritual = pgTable("initiation_ritual", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id).notNull().unique(),
  step_current: integer("step_current").default(1),
  step_total: integer("step_total").default(7),
  is_completed: boolean("is_completed").default(false),
  acceptance_text: text("acceptance_text"),
  ritual_data: text("ritual_data"), // JSON com dados do ritual
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Configurações do sistema
export const system_settings = pgTable("system_settings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  setting_category: text("setting_category").notNull(),
  setting_key: text("setting_key").notNull(),
  setting_value: text("setting_value"),
  setting_type: text("setting_type").default("text"),
  description: text("description"),
  is_public: boolean("is_public").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Analytics de conteúdo
export const content_analytics = pgTable("content_analytics", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  grimoire_id: bigint("grimoire_id", { mode: "number" }).references(() => grimoires.id),
  user_id: bigint("user_id", { mode: "number" }).references(() => users.id),
  event_type: text("event_type").notNull(),
  session_id: text("session_id"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow(),
});

// Schemas de validação
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = insertUserSchema.extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
});

export const insertLibrarySectionSchema = createInsertSchema(library_sections).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGrimoireSchema = createInsertSchema(grimoires).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  created_at: true,
});

export const insertProgressSchema = createInsertSchema(user_progress).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type LibrarySection = typeof library_sections.$inferSelect;
export type InsertLibrarySection = z.infer<typeof insertLibrarySectionSchema>;

export type Grimoire = typeof grimoires.$inferSelect;
export type InsertGrimoire = z.infer<typeof insertGrimoireSchema>;

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type UserProgress = typeof user_progress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type GrimoirePurchase = typeof grimoire_purchases.$inferSelect;
export type AISettings = typeof ai_settings.$inferSelect;
export type SystemSettings = typeof system_settings.$inferSelect;
export type ContentAnalytics = typeof content_analytics.$inferSelect;
