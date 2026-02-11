// public/js/sb-client.js
// Initialize sb client. We use the global 'sb' object from the CDN to create our instance.
// We overwrite the global 'sb' with our client instance for ease of use in other scripts.
const config = window.APP_CONFIG || {};
if (config.sb_URL && config.sb_ANON_KEY) {
    window.sb = window.supabase.createClient(config.sb_URL, config.sb_ANON_KEY);
} else {
    console.error("sb config missing!");
}
