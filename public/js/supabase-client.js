// public/js/supabase-client.js
(function () {
    const config = window.APP_CONFIG;

    if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
        console.error("Supabase configuration missing or invalid:", config);
        return;
    }

    function cleanConfigVal(val) {
        if (!val) return '';
        let cleaned = String(val).trim();
        // Remove enclosing single or double quotes
        cleaned = cleaned.replace(/^['"]|['"]$/g, '');
        return cleaned.trim();
    }

    const url = cleanConfigVal(config.SUPABASE_URL);
    const key = cleanConfigVal(config.SUPABASE_ANON_KEY);

    if (!url || !key) {
        console.error("Supabase URL or Key is empty after sanitization.");
        return;
    }

    if (!window.supabase) {
        console.error("Supabase SDK not found. Ensure the CDN script is loaded correctly.");
        return;
    }

    try {
        window.sb = window.supabase.createClient(url, key);
        console.log("Supabase client initialized successfully.");
    } catch (err) {
        console.error("Error initializing Supabase client:", err);
    }
})();
