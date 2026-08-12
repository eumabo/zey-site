// ZEY — configuração do Supabase
// A anon key é pública por design e pode ficar no frontend.
// NUNCA coloque a service_role key aqui.
export const SUPABASE_URL = 'https://ykpzfasxfavitssulpbk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_NAyRA1vfhW-v5Hgm-Zxuwg_hy1EU7-R';

export const isSupabaseConfigured = () =>
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('COLE_AQUI') &&
  SUPABASE_ANON_KEY.length > 30 &&
  !SUPABASE_ANON_KEY.includes('COLE_AQUI');
