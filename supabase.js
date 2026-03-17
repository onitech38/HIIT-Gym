// ============================================
// SUPABASE.JS — Cliente partilhado
// Carrega ANTES de qualquer outro script JS.
// ============================================

const SUPABASE_URL = 'https://kwvvoisnmqghkzllgegx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EdQ9IY3_zZhqEXU3YAEwtg_605AvlUJ';

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);