const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../public/js/config.js');
const dirPath = path.dirname(configPath);

// Ensure directory exists
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

const rawUrl = process.env.SUPABASE_URL;
const rawAnonKey = process.env.SUPABASE_ANON_KEY;

function cleanEnvVar(val) {
    if (!val) return '';
    let cleaned = val.trim();
    // Strip enclosing single or double quotes
    cleaned = cleaned.replace(/^['"]|['"]$/g, '');
    return cleaned.trim();
}

const supabaseUrl = cleanEnvVar(rawUrl);
const supabaseAnonKey = cleanEnvVar(rawAnonKey);

if (!supabaseUrl) {
    console.error('FATAL ERROR: SUPABASE_URL environment variable is missing!');
    process.exit(1);
}

if (!supabaseAnonKey) {
    console.error('FATAL ERROR: SUPABASE_ANON_KEY environment variable is missing!');
    process.exit(1);
}

const content = `// Auto-generated config
window.APP_CONFIG = {
    SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
    SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
};
`;

try {
    fs.writeFileSync(configPath, content);
    console.log('✅ Config file successfully generated at:', configPath);
} catch (err) {
    console.error('❌ Failed to write config file:', err);
    process.exit(1);
}
