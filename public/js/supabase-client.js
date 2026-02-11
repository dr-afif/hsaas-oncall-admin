// public/js/supabase-client.js
// Initialize Supabase client. We use the global 'supabase' object from the CDN to create our instance.
// We overwrite the global 'supabase' with our client instance for ease of use in other scripts.
const config = window.APP_CONFIG || {};
window.supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
