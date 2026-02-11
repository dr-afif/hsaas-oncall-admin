// public/js/admin.js
async function renderAdmin() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>Manage Departments</h2>
                <button class="btn btn-primary" onclick="showDeptModal()">Add Department</button>
            </div>
            <div id="deptsAdmin">Loading...</div>
        </div>
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>User Membership</h2>
                <button class="btn btn-primary" onclick="showMemberModal()">Add Member</button>
            </div>
            <div id="membersAdmin">Loading...</div>
        </div>
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>Public Holidays</h2>
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn btn-ghost" onclick="syncHolidays2026()">Sync 2026 (Selangor)</button>
                    <button class="btn btn-primary" onclick="showHolidayModal()">Add Holiday</button>
                </div>
            </div>
            <div id="holidaysAdmin">Loading...</div>
        </div>
    `;
    loadAdminData();
}

async function loadAdminData() {
    const [depts, members] = await Promise.all([
        sb.from('departments').select('*').order('id'),
        sb.from('department_members').select('*').order('email')
    ]);

    // Render Departments
    let dHtml = `<table style="width:100%; border-collapse: collapse;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 0.5rem; text-align: left;">ID (Code)</th>
            <th style="padding: 0.5rem; text-align: left;">Name</th>
            <th style="padding: 0.5rem; text-align: left;">Active</th>
            <th style="padding: 0.5rem; text-align: left;">Actions</th>
        </tr></thead><tbody>`;
    depts.data.forEach(d => {
        dHtml += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 0.5rem">${d.id}</td>
            <td style="padding: 0.5rem">${d.name}</td>
            <td style="padding: 0.5rem">${d.active ? '✅' : '❌'}</td>
            <td style="padding: 0.5rem">
                <button class="btn btn-ghost" onclick="showDeptModal('${d.id}')">Edit</button>
            </td>
        </tr>`;
    });
    document.getElementById('deptsAdmin').innerHTML = dHtml + `</tbody></table>`;

    // Render Members
    let mHtml = `<table style="width:100%; border-collapse: collapse;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 0.5rem; text-align: left;">Email</th>
            <th style="padding: 0.5rem; text-align: left;">Role</th>
            <th style="padding: 0.5rem; text-align: left;">Dept</th>
            <th style="padding: 0.5rem; text-align: left;">Active</th>
            <th style="padding: 0.5rem; text-align: left;">Actions</th>
        </tr></thead><tbody>`;
    members.data.forEach(m => {
        mHtml += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 0.5rem">${m.email}</td>
            <td style="padding: 0.5rem">${m.role}</td>
            <td style="padding: 0.5rem">${m.department_id || 'N/A'}</td>
            <td style="padding: 0.5rem">${m.active ? '✅' : '❌'}</td>
            <td style="padding: 0.5rem">
                <button class="btn btn-ghost" onclick="showMemberModal('${m.email}')">Edit</button>
            </td>
        </tr>`;
    });
    document.getElementById('membersAdmin').innerHTML = mHtml + `</tbody></table>`;

    // Render Holidays
    const { data: holidays } = await sb.from('public_holidays').select('*').order('date', { ascending: false }).limit(20);
    let hHtml = `<table style="width:100%; border-collapse: collapse;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 0.5rem; text-align: left;">Date</th>
            <th style="padding: 0.5rem; text-align: left;">Name</th>
            <th style="padding: 0.5rem; text-align: left;">Type</th>
            <th style="padding: 0.5rem; text-align: left;">Actions</th>
        </tr></thead><tbody>`;
    holidays.forEach(h => {
        hHtml += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 0.5rem">${h.date}</td>
            <td style="padding: 0.5rem">${h.name}</td>
            <td style="padding: 0.5rem">${h.is_state_holiday ? 'Selangor' : 'National'}</td>
            <td style="padding: 0.5rem">
                <button class="btn btn-ghost" onclick="deleteHoliday('${h.id}')">Delete</button>
            </td>
        </tr>`;
    });
    document.getElementById('holidaysAdmin').innerHTML = hHtml + `</tbody></table>`;
}

async function showHolidayModal() {
    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>Add Public Holiday</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
            Use this for standard holidays or sudden ones announced on national TV.
        </p>
        <form id="holidayForm">
            <div style="margin-bottom: 1rem;">
                <label>Date</label>
                <input type="date" name="date" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Holiday Name</label>
                <input type="text" name="name" placeholder="e.g. Hari Raya, Sudden Public Holiday" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label><input type="checkbox" name="is_state_holiday"> State Holiday (Selangor Only)</label>
            </div>
            <div style="display:flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Holiday</button>
            </div>
        </form>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('holidayForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.is_state_holiday = fd.get('is_state_holiday') === 'on';

        const { error } = await sb.from('public_holidays').insert(data);
        if (error) alert(error.message);
        else { closeModal(); loadAdminData(); showNotification("Holiday added."); }
    };
}

async function deleteHoliday(id) {
    if (!confirm("Are you sure you want to remove this public holiday?")) return;
    const { error } = await sb.from('public_holidays').delete().eq('id', id);
    if (error) alert(error.message);
    else { loadAdminData(); showNotification("Holiday removed."); }
}

async function syncHolidays2026() {
    if (!confirm("This will populate 2026 Selangor public holidays from the official schedule. Continue?")) return;

    const holidays = [
        { date: '2026-01-01', name: "New Year's Day", is_state_holiday: false },
        { date: '2026-02-01', name: "Thaipusam", is_state_holiday: true },
        { date: '2026-02-02', name: "Thaipusam Holiday", is_state_holiday: true },
        { date: '2026-02-17', name: "Chinese New Year", is_state_holiday: false },
        { date: '2026-02-18', name: "Chinese New Year Day 2", is_state_holiday: false },
        { date: '2026-03-07', name: "Nuzul Al-Quran", is_state_holiday: true },
        { date: '2026-03-21', name: "Hari Raya Aidilfitri", is_state_holiday: false },
        { date: '2026-03-22', name: "Hari Raya Aidilfitri Day 2", is_state_holiday: false },
        { date: '2026-03-23', name: "Hari Raya Aidilfitri Holiday", is_state_holiday: false },
        { date: '2026-05-01', name: "Labour Day", is_state_holiday: false },
        { date: '2026-05-27', name: "Hari Raya Haji", is_state_holiday: false },
        { date: '2026-05-31', name: "Wesak Day", is_state_holiday: false },
        { date: '2026-06-01', name: "Agong's Birthday", is_state_holiday: false },
        { date: '2026-06-17', name: "Awal Muharram", is_state_holiday: false },
        { date: '2026-08-25', name: "Prophet Muhammad's Birthday", is_state_holiday: false },
        { date: '2026-08-31', name: "National Day", is_state_holiday: false },
        { date: '2026-09-16', name: "Malaysia Day", is_state_holiday: false },
        { date: '2026-11-08', name: "Deepavali", is_state_holiday: false },
        { date: '2026-11-09', name: "Deepavali Holiday", is_state_holiday: false },
        { date: '2026-12-11', name: "Sultan of Selangor's Birthday", is_state_holiday: true },
        { date: '2026-12-25', name: "Christmas Day", is_state_holiday: false }
    ];

    const { error } = await sb.from('public_holidays').upsert(holidays, { onConflict: 'date' });

    if (error) {
        alert("Error syncing holidays: " + error.message);
    } else {
        showNotification("2026 Holidays synced successfully!");
        loadAdminData();
    }
}

async function showDeptModal(id = null) {
    let dept = { id: '', name: '', active: true };
    if (id) {
        const { data } = await sb.from('departments').select('*').eq('id', id).single();
        dept = data;
    }

    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>${id ? 'Edit' : 'Add'} Department</h3>
        <form id="deptForm">
            <div style="margin-bottom: 1rem;">
                <label>Department Code (ID)</label>
                <input type="text" name="id" value="${dept.id}" ${id ? 'readonly' : ''} placeholder="e.g. ED, MED" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Department Name</label>
                <input type="text" name="name" value="${dept.name}" placeholder="e.g. Emergency Department" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label><input type="checkbox" name="active" ${dept.active ? 'checked' : ''}> Active</label>
            </div>
            <div style="display:flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('deptForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.active = fd.get('active') === 'on';

        const { error } = id
            ? await sb.from('departments').update({ name: data.name, active: data.active }).eq('id', id)
            : await sb.from('departments').insert(data);

        if (error) alert(error.message);
        else { closeModal(); loadAdminData(); showNotification("Department saved."); }
    };
}

async function showMemberModal(email = null) {
    let member = { email: '', role: 'DEPT_USER', department_id: '', active: true };
    if (email) {
        const { data } = await sb.from('department_members').select('*').eq('email', email).single();
        member = data;
    }

    const { data: depts } = await sb.from('departments').select('*').eq('active', true);

    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>${email ? 'Edit' : 'Add'} Member</h3>
        <form id="memberForm">
            <div style="margin-bottom: 1rem;">
                <label>Email Address</label>
                <input type="email" name="email" value="${member.email}" ${email ? 'readonly' : ''} required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Role</label>
                <select name="role">
                    <option value="DEPT_USER" ${member.role === 'DEPT_USER' ? 'selected' : ''}>Department User</option>
                    <option value="ADMIN" ${member.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Department</label>
                <select name="department_id">
                    <option value="">-- None (Admin Only) --</option>
                    ${depts.map(d => `<option value="${d.id}" ${member.department_id === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label><input type="checkbox" name="active" ${member.active ? 'checked' : ''}> Active</label>
            </div>
            <div style="display:flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('memberForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.active = fd.get('active') === 'on';
        data.email = data.email.toLowerCase();

        const { error } = email
            ? await sb.from('department_members').update({ role: data.role, department_id: data.department_id || null, active: data.active }).eq('email', email)
            : await sb.from('department_members').insert({ ...data, department_id: data.department_id || null });

        if (error) alert(error.message);
        else { closeModal(); loadAdminData(); showNotification("Member saved."); }
    };
}
