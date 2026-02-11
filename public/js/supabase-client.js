// public/js/supabase-client.js
(function () {
    const config = window.APP_CONFIG;

    if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
        console.error("Supabase configuration missing or invalid:", config);
        return;
    }

    if (!window.supabase) {
        console.error("Supabase SDK not found. Ensure the CDN script is loaded correctly.");
        return;
    }

    try {
        window.sb = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
        console.log("Supabase client initialized successfully.");
    } catch (err) {
        console.error("Error initializing Supabase client:", err);
    }
})();
