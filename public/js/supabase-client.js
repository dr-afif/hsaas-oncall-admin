// public/js/supabase-client.js
// Initialize Supabase client. We use the global 'supabase' object from the CDN to create our instance.
// We overwrite the global 'supabase' with our client instance for ease of use in other scripts.
window.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
