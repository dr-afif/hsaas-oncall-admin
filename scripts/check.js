const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const failures = [];

function fail(message) {
    failures.push(message);
}

function read(relPath) {
    return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function listFiles(dir, predicate) {
    return fs.readdirSync(path.join(root, dir))
        .filter(predicate)
        .map((name) => path.join(dir, name).replace(/\\/g, '/'));
}

for (const relPath of listFiles('public/js', (name) => name.endsWith('.js')).concat(['scripts/build-config.js'])) {
    try {
        new vm.Script(read(relPath), { filename: relPath });
    } catch (err) {
        fail(`${relPath}: JavaScript syntax error: ${err.message}`);
    }
}

for (const relPath of ['public/app.html', 'public/login.html']) {
    const html = read(relPath);
    const scriptRefs = [...html.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/g)].map((match) => match[1]);

    for (const ref of scriptRefs) {
        if (/^https?:\/\//.test(ref)) continue;
        const localPath = ref.split('?')[0];
        if (localPath === 'js/config.js') continue;
        const target = path.join(path.dirname(relPath), localPath);
        if (!fs.existsSync(path.join(root, target))) {
            fail(`${relPath}: missing script ${ref}`);
        }
    }
}

const appHtml = read('public/app.html');
const utilsIndex = appHtml.indexOf('js/utils.js');
const appIndex = appHtml.indexOf('js/app.js');
if (utilsIndex === -1) {
    fail('public/app.html: missing js/utils.js');
} else if (appIndex !== -1 && utilsIndex > appIndex) {
    fail('public/app.html: js/utils.js must load before app modules that use shared helpers');
}

const sw = read('public/sw.js');
for (const asset of ['./js/utils.js', './js/app.js', './js/roster.js']) {
    if (!sw.includes(asset)) {
        fail(`public/sw.js: missing cached asset ${asset}`);
    }
}

const readme = read('README.md');
for (const required of ['05_multi_person_slots.sql', '06_public_holidays.sql', '09_performance_indexes.sql', 'Supabase Auth with Google OAuth']) {
    if (!readme.includes(required)) {
        fail(`README.md: missing ${required}`);
    }
}

if (!fs.existsSync(path.join(root, 'sql/09_performance_indexes.sql'))) {
    fail('sql/09_performance_indexes.sql: missing optional performance index script');
}

if (!fs.existsSync(path.join(root, 'sql/README.md'))) {
    fail('sql/README.md: missing SQL setup guide');
}

if (!fs.existsSync(path.join(root, 'sql/10_rls_verification.sql'))) {
    fail('sql/10_rls_verification.sql: missing RLS verification guide');
}

if (!fs.existsSync(path.join(root, 'docs/WORKTREE_NOTES.md'))) {
    fail('docs/WORKTREE_NOTES.md: missing worktree triage notes');
}

if (read('scripts/build-config.js').includes('app_config.js')) {
    fail('scripts/build-config.js: must generate public/js/config.js, not app_config.js');
}

if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
}

console.log('Repository checks passed.');
