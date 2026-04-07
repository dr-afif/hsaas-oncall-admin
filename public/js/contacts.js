// public/js/contacts.js
async function renderContacts() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>Contacts</h2>
                <div style="display:flex; gap: 1rem;">
                    <button id="bulkDeleteBtn" class="btn btn-ghost hidden" style="color: var(--danger)" onclick="deleteSelectedContacts()">Delete Selected</button>
                    <button class="btn btn-ghost" onclick="showBulkContactModal()">Bulk Add</button>
                    <button class="btn btn-primary" onclick="showContactModal()">Add Contact</button>
                </div>
            </div>
            <div id="contactsTable">Loading...</div>
        </div>
    `;
    loadContacts();
}

async function showBulkContactModal() {
    // 1. Fetch existing contacts for duplicate checking
    const { data: existing } = await sb.from('contacts').select('short_name').eq('department_id', state.activeDeptId);
    const existingShortNames = new Set((existing || []).map(c => c.short_name.toLowerCase()));

    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>Bulk Add Contacts</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
            Paste data from Excel/TSV below. Columns should be:<br>
            <strong>Short Name | Full Name | Phone | Position</strong>
        </p>
        <textarea id="bulkPasteArea" placeholder="ShortName\tFullName\tPhone\tPosition" style="width:100%; height: 250px; font-family: monospace; margin-bottom: 1rem; padding: 1rem;"></textarea>
        <div id="bulkStatus" style="font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: bold;"></div>
        <div id="bulkPreview" style="margin-bottom: 1rem; max-height: 250px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px;"></div>
        <div style="display:flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button id="saveBulkBtn" class="btn btn-primary" disabled>Save Contacts</button>
        </div>
    `;

    const area = document.getElementById('bulkPasteArea');
    const preview = document.getElementById('bulkPreview');
    const status = document.getElementById('bulkStatus');
    const saveBtn = document.getElementById('saveBulkBtn');

    area.oninput = () => {
        const lines = area.value.trim().split('\n').filter(l => l.trim());
        if (lines.length === 0) {
            preview.innerHTML = '';
            status.innerHTML = '';
            saveBtn.disabled = true;
            return;
        }

        let html = '<table style="width:100%; border-collapse: collapse; font-size: 0.85rem;"><thead><tr style="text-align:left; background: var(--bg-secondary); position: sticky; top: 0;">' +
            '<th style="padding: 0.5rem;">Short Name</th><th style="padding: 0.5rem;">Full Name</th><th style="padding: 0.5rem;">Phone</th><th style="padding: 0.5rem;">Status</th></tr></thead><tbody>';

        const seenInBatch = new Set();
        let errorCount = 0;
        let newCount = 0;

        const contacts = lines.map(line => {
            const parts = line.split('\t');
            const sn = (parts[0] || '').trim();
            const fn = (parts[1] || '').trim();
            const ph = (parts[2] || '').trim();
            const pos = (parts[3] || '').trim();

            let rowStatus = 'OK';
            let rowStyle = '';
            let isError = false;

            if (!sn || !fn) {
                rowStatus = 'Missing Name';
                rowStyle = 'background: #fff0f0; color: #c00;';
                isError = true;
            } else if (existingShortNames.has(sn.toLowerCase())) {
                rowStatus = 'Already Exists';
                rowStyle = 'background: #fff0f0; color: #c00;';
                isError = true;
            } else if (seenInBatch.has(sn.toLowerCase())) {
                rowStatus = 'Duplicate in List';
                rowStyle = 'background: #fffbe6; color: #856404;';
                isError = true;
            }

            if (sn) seenInBatch.add(sn.toLowerCase());
            if (isError) errorCount++; else newCount++;

            return { sn, fn, ph, pos, rowStatus, rowStyle };
        });

        contacts.forEach(c => {
            html += `<tr style="border-bottom: 1px solid var(--border); ${c.rowStyle}">
                <td style="padding: 0.5rem;">${c.sn || '?'}</td>
                <td style="padding: 0.5rem;">${c.fn || '?'}</td>
                <td style="padding: 0.5rem;">${c.ph || '-'}</td>
                <td style="padding: 0.5rem;"><strong>${c.rowStatus}</strong></td>
            </tr>`;
        });

        preview.innerHTML = html + '</tbody></table>';
        status.innerHTML = `Found ${newCount} valid new contacts, ${errorCount} issues detected.`;
        status.style.color = errorCount > 0 ? '#c00' : 'var(--success)';
        saveBtn.disabled = newCount === 0;
    };

    saveBtn.onclick = async () => {
        const lines = area.value.trim().split('\n').filter(l => l.trim());
        const seenInBatch = new Set();

        const toSave = lines.map(line => {
            const parts = line.split('\t');
            const sn = (parts[0] || '').trim();
            if (!sn || existingShortNames.has(sn.toLowerCase()) || seenInBatch.has(sn.toLowerCase())) return null;
            seenInBatch.add(sn.toLowerCase());

            return {
                department_id: state.activeDeptId,
                short_name: sn,
                full_name: (parts[1] || '').trim(),
                phone_number: (parts[2] || '').trim(),
                position: (parts[3] || '').trim(),
                active: true
            };
        }).filter(c => c && c.full_name);

        if (toSave.length === 0) return;
        if (!confirm(`Import ${toSave.length} valid contacts?`)) return;

        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

        const { error } = await sb.from('contacts').insert(toSave);

        if (error) {
            alert("Error saving contacts: " + error.message);
            saveBtn.disabled = false;
            saveBtn.innerText = 'Save Contacts';
        } else {
            closeModal();
            loadContacts();
            showNotification(`Successfully added ${toSave.length} contacts.`);
        }
    };

    document.getElementById('modalOverlay').style.display = 'flex';
}

async function loadContacts() {
    if (!state.activeDeptId) return;
    const { data } = await sb.from('contacts')
        .select('*').eq('department_id', state.activeDeptId).order('short_name');

    let html = `<table class="admin-table">
        <thead><tr>
            <th style="width: 40px;"><input type="checkbox" id="selectAllContacts" onclick="toggleAllContacts(this)"></th>
            <th>Short Name</th>
            <th>Full Name</th>
            <th>Phone</th>
            <th>Position</th>
            <th>Active</th>
            <th>Actions</th>
        </tr></thead><tbody>`;

    data.forEach(c => {
        html += `<tr>
            <td><input type="checkbox" class="contact-checkbox" data-id="${c.id}" onclick="updateBulkDeleteVisibility()"></td>
            <td>${c.short_name}</td>
            <td>${c.full_name}</td>
            <td>${c.phone_number || '-'}</td>
            <td>${c.position || '-'}</td>
            <td>${c.active ? '✅' : '❌'}</td>
            <td>
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn btn-ghost" onclick="showContactModal('${c.id}')">Edit</button>
                    <button class="btn btn-ghost" style="color: var(--danger)" onclick="deleteContact('${c.id}', '${c.short_name}')">Delete</button>
                </div>
            </td>
        </tr>`;
    });
    document.getElementById('contactsTable').innerHTML = html + `</tbody></table>`;
    updateBulkDeleteVisibility();
}

function toggleAllContacts(master) {
    const boxes = document.querySelectorAll('.contact-checkbox');
    boxes.forEach(b => b.checked = master.checked);
    updateBulkDeleteVisibility();
}

function updateBulkDeleteVisibility() {
    const selected = document.querySelectorAll('.contact-checkbox:checked').length;
    const btn = document.getElementById('bulkDeleteBtn');
    if (btn) {
        if (selected > 0) {
            btn.classList.remove('hidden');
            btn.innerText = `Delete Selected (${selected})`;
        } else {
            btn.classList.add('hidden');
        }
    }
}

async function deleteContact(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}? This will preserve their name in the roster as plain text, but the link will be broken. Continue?`)) return;

    // 1. Preserve roster history by moving name to raw_text
    await sb.from('roster_cells')
        .update({ contact_id: null, raw_text: name })
        .eq('contact_id', id);

    // 2. Now delete the contact
    const { error } = await sb.from('contacts').delete().eq('id', id);

    if (error) {
        alert("Error deleting contact: " + error.message);
    } else {
        showNotification("Contact deleted.");
        loadContacts();
    }
}

async function deleteSelectedContacts() {
    const selectedBoxes = document.querySelectorAll('.contact-checkbox:checked');
    const ids = Array.from(selectedBoxes).map(b => b.dataset.id);

    if (ids.length === 0) return;

    if (!confirm(`Delete ${ids.length} selected contacts? This will un-link them from the roster but keep their names visible as text. Continue?`)) return;

    // 1. Get names for all contacts to preserve them
    const { data: contacts } = await sb.from('contacts').select('id, short_name').in('id', ids);

    // 2. Update roster cells in bulk (one name at a time since they differ)
    // We do this in parallel for speed
    if (contacts) {
        await Promise.all(contacts.map(c =>
            sb.from('roster_cells')
                .update({ contact_id: null, raw_text: c.short_name })
                .eq('contact_id', c.id)
        ));
    }

    // 3. Delete contacts
    const { error } = await sb.from('contacts').delete().in('id', ids);

    if (error) {
        alert("Error deleting contacts: " + error.message);
    } else {
        showNotification(`${ids.length} contacts deleted.`);
        loadContacts();
    }
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
                <input type="checkbox" name="active" id="contactActive" ${contact.active ? 'checked' : ''} style="width: auto;">
                <label for="contactActive">Active (Uncheck to hide from roster selection)</label>
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
        data.department_id = state.activeDeptId;
        data.active = fd.get('active') === 'on';

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
