const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../public/js/config.js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://hklgsjozideopydbdcmp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const content = `// Auto-generated config
window.APP_CONFIG = {
    SUPABASE_URL: '${supabaseUrl}',
    SUPABASE_ANON_KEY: '${supabaseAnonKey}',
};
`;

fs.writeFileSync(configPath, content);
console.log('Config file generated at:', configPath);
