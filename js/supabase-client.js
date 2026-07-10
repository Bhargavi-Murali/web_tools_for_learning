(() => {
  const SUPABASE_URL =
    "https://mrnvtbuyenqoqujiinpn.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_j1MRov8jSv0ljTgLLdJJYA_YXpf7_bE";

  const isConfigured =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") &&
    !SUPABASE_PUBLISHABLE_KEY.includes("REPLACE_WITH_YOUR_KEY");

  window.supabaseConfig = Object.freeze({
    isConfigured,
    projectUrl: SUPABASE_URL
  });

  if (!isConfigured) {
    window.supabaseClient = null;
    console.warn(
      "Supabase is not configured. Add the Project URL and publishable key in js/supabase-client.js."
    );
    return;
  }

  if (!window.supabase?.createClient) {
    window.supabaseClient = null;
    console.error("The Supabase JavaScript library did not load.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
