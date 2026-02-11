// public/js/app.js

const state = {
    user: null,
    membership: null,
    activeDeptId: null,
    view: 'roster'
};

async function init() {
    const session = await initAuth();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    state.user = session.user;

    // Fetch account info
    const { data: members, error } = await supabase
        .from('department_members')
        .select('*, departments(*)')
        .eq('email', state.user.email.toLowerCase())
        .single();

    if (error || !members || !members.active) {
        alert("Access denied. Your email is not registered or is inactive.");
        logout();
        return;
    }

    state.membership = members;
    state.activeDeptId = localStorage.getItem('activeDeptId') || members.department_id;

    document.getElementById('userEmail').innerText = `${state.user.email} (${members.role})`;

    if (members.role === 'ADMIN') {
        document.querySelector('[data-view="admin"]').classList.remove('hidden');
        document.getElementById('admin-dept-switcher').classList.remove('hidden');
        await loadDeptsForAdmin();
    } else {
        document.getElementById('activeDeptName').innerText = members.departments?.name || '';
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

async function loadDeptsForAdmin() {
    const { data } = await supabase.from('departments').select('*').eq('active', true);
    if (!data || data.length === 0) return;

    const select = document.getElementById('activeDeptId');
    select.innerHTML = '';

    data.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.innerText = d.name;
        if (d.id === state.activeDeptId) opt.selected = true;
        select.appendChild(opt);
    });

    // If no dept selected yet (e.g. new Admin), default to first available
    if (!state.activeDeptId || !data.some(d => d.id === state.activeDeptId)) {
        state.activeDeptId = data[0].id;
        localStorage.setItem('activeDeptId', state.activeDeptId);
    }

    select.onchange = (e) => {
        state.activeDeptId = e.target.value;
        const selectedOpt = select.options[select.selectedIndex];
        document.getElementById('activeDeptName').innerText = selectedOpt.innerText;
        localStorage.setItem('activeDeptId', state.activeDeptId);
        handleRoute(); // Refresh current view
    };

    // Set initial display name
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt) {
        document.getElementById('activeDeptName').innerText = selectedOpt.innerText;
    }
}

function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'roster';
    state.view = hash;

    // Update nav UI
    document.querySelectorAll('#mainNav a').forEach(a => {
        a.classList.toggle('active', a.dataset.view === hash);
    });

    switch (hash) {
        case 'roster': renderRoster(); break;
        case 'contacts': renderContacts(); break;
        case 'slots': renderSlots(); break;
        case 'audit': renderAudit(); break;
        case 'admin': renderAdmin(); break;
    }
}

function showNotification(msg, type = 'success') {
    const el = document.getElementById('notification');
    el.innerText = msg;

    // Reset classes
    el.className = '';
    el.classList.add(type);
    el.classList.add('show');

    setTimeout(() => {
        el.classList.remove('show');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
