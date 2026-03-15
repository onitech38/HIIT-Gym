// ============================================
// SUPABASE.JS — Cliente partilhado
// Carrega ANTES de qualquer outro script JS.
// ============================================

const SUPABASE_URL = 'https://kwvvoisnmqghkzllgegx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EdQ9IY3_zZhqEXU3YAEwtg_605AvlUJ';

// CRÍTICO: sobrescreve window.supabase (biblioteca) com o cliente
// para que TODOS os scripts o encontrem como global.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
