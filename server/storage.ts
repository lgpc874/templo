// DEPRECATED - Use supabaseServiceNew.ts instead
// This file is kept only for backward compatibility and will be removed
import { createClient } from '@supabase/supabase-js';

// Re-export from the new service for compatibility
export { supabaseServiceNew as storage } from './supabase-service-new';