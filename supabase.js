/* ============================================
   SUPABASE.JS — Cliente partilhado
   Carrega ANTES de qualquer outro script JS.

   Inclui no HTML assim (antes de script.js):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
   <script src="supabase.js"></script>
   ============================================ */

const SUPABASE_URL = 'https://kwvvoisnmqghkzllgegx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EdQ9IY3_zZhqEXU3YAEwtg_605AvlUJ';

// ⚠️  CRÍTICO: window.supabase é a biblioteca CDN.
// Sobrescrevemos com o cliente para ser acessível em todos os scripts.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);