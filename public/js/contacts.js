// public/js/contacts.js
async function renderContacts() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>Contacts</h2>
                <button class="btn btn-primary" onclick="showContactModal()">Add Contact</button>
            </div>
            <div id="contactsTable">Loading...</div>
        </div>
    `;
    loadContacts();
}

async function loadContacts() {
    if (!state.activeDeptId) return;
    const { data } = await sb.from('contacts')
        .select('*').eq('department_id', state.activeDeptId).order('short_name');

    let html = `<table style="width:100%; text-align:left; border-collapse: collapse;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 1rem">Short Name</th>
            <th style="padding: 1rem">Full Name</th>
            <th style="padding: 1rem">Phone</th>
            <th style="padding: 1rem">Position</th>
            <th style="padding: 1rem">Active</th>
            <th style="padding: 1rem">Actions</th>
        </tr></thead><tbody>`;

    data.forEach(c => {
        html += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 1rem">${c.short_name}</td>
            <td style="padding: 1rem">${c.full_name}</td>
            <td style="padding: 1rem">${c.phone_number || '-'}</td>
            <td style="padding: 1rem">${c.position || '-'}</td>
            <td style="padding: 1rem">${c.active ? '✅' : '❌'}</td>
            <td style="padding: 1rem">
                <button class="btn btn-ghost" onclick="showContactModal('${c.id}')">Edit</button>
            </td>
        </tr>`;
    });
    document.getElementById('contactsTable').innerHTML = html + `</tbody></table>`;
}

async function showContactModal(id = null) {
    let contact = { short_name: '', full_name: '', phone_number: '', position: '', active: true };
    if (id) {
        const { data } = await sb.from('contacts').select('*').eq('id', id).single();
        contact = data;
    }

    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>${id ? 'Edit' : 'Add'} Contact</h3>
        <form id="contactForm">
            <div style="margin-bottom: 1rem;">
                <label>Short Name (Unique)</label>
                <input type="text" name="short_name" value="${contact.short_name}" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Full Name</label>
                <input type="text" name="full_name" value="${contact.full_name}" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Phone Number</label>
                <input type="text" id="phoneInput" name="phone_number" value="${contact.phone_number || ''}" placeholder="e.g. 012-345 6789">
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Position</label>
                <select name="position">
                    <option value="" ${!contact.position ? 'selected' : ''}>- Select Position -</option>
                    <option value="Service MO" ${contact.position === 'Service MO' ? 'selected' : ''}>Service MO</option>
                    <option value="Masters Student" ${contact.position === 'Masters Student' ? 'selected' : ''}>Masters Student</option>
                    <option value="Specialist" ${contact.position === 'Specialist' ? 'selected' : ''}>Specialist</option>
                    <option value="Consultant" ${contact.position === 'Consultant' ? 'selected' : ''}>Consultant</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" name="active" ${contact.active ? 'checked' : ''} style="width: auto; margin: 0;">
                <span>Active</span>
            </div>
            <div style="display:flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    const pInput = document.getElementById('phoneInput');
    pInput.oninput = (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Numbers only
        if (val.length > 11) val = val.substring(0, 11);

        let formatted = '';
        if (val.length > 0) {
            formatted = val.substring(0, 3);
            if (val.length > 3) {
                if (val.length === 10) {
                    // 3-3-4 format
                    formatted += '-' + val.substring(3, 6) + ' ' + val.substring(6);
                } else if (val.length === 11) {
                    // 3-4-4 format
                    formatted += '-' + val.substring(3, 7) + ' ' + val.substring(7);
                } else {
                    formatted += '-' + val.substring(3);
                }
            }
        }
        e.target.value = formatted;
    };

    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('contactForm').onsubmit = async (e) => {
        e.preventDefault();

        if (!confirm("Save contact changes?")) return;

        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.active = fd.get('active') === 'on';
        data.department_id = state.activeDeptId;

        const { error } = id
            ? await sb.from('contacts').update(data).eq('id', id)
            : await sb.from('contacts').insert(data);

        if (error) alert("Error saving contact: " + error.message);
        else {
            closeModal();
            loadContacts();
            showNotification("Contact saved.");
        }
    };
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}
