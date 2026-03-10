/* ============================================
   SUPABASE.JS — Cliente partilhado
   Carrega ANTES de qualquer outro script JS.

   Inclui no HTML assim (antes de script.js):
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
   <script src="supabase.js"></script>
   ============================================ */

const SUPABASE_URL = 'https://kwvvoisnmqghkzllgegx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EdQ9IY3_zZhqEXU3YAEwtg_605AvlUJ';

// Cliente global — usado por script.js, user.js, blog.js, etc.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);