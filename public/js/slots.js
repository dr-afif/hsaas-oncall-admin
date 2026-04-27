// public/js/slots.js
async function renderSlots() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>Slot Definitions</h2>
                <div style="display:flex; gap: 1rem;">
                    <input type="month" id="slotMonth" value="${new Date().toISOString().slice(0, 7)}" onchange="loadSlots()">
                    <button class="btn btn-primary" onclick="showSlotModal()">Add Slot</button>
                    <button class="btn btn-ghost" onclick="copySlots()">Copy from Prev Month</button>
                </div>
            </div>
            <div id="slotsTable">Loading...</div>
        </div>
    `;
    loadSlots();
}

async function loadSlots() {
    if (!state.activeDeptId) return;
    const month = document.getElementById('slotMonth').value;
    const { data } = await sb.from('slot_definitions')
        .select('*')
        .eq('department_id', state.activeDeptId)
        .eq('active', true)
        .lte('effective_from_month', month)
        .or(`effective_to_month.is.null,effective_to_month.gte.${month}`)
        .order('order_index');

    let html = `<div class="table-responsive"><table class="admin-table" style="width:100%; text-align:left; border-collapse: collapse;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 1rem">Key</th>
            <th style="padding: 1rem">Label</th>
            <th style="padding: 1rem">Required</th>
            <th style="padding: 1rem">Effective From</th>
            <th style="padding: 1rem">Effective To</th>
            <th style="padding: 1rem">Actions</th>
        </tr></thead><tbody>`;

    data.forEach((s, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === data.length - 1;
        html += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 1rem">${escapeHTML(s.slot_key)}</td>
            <td style="padding: 1rem">${escapeHTML(s.label)}</td>
            <td style="padding: 1rem">${s.required ? 'Yes' : 'No'}</td>
            <td style="padding: 1rem">${escapeHTML(s.effective_from_month)}</td>
            <td style="padding: 1rem">${escapeHTML(s.effective_to_month || 'Ongoing')}</td>
            <td style="padding: 1rem">
                <div style="display:flex; gap: 0.5rem;">
                    <button class="btn btn-ghost" onclick="showSlotModal('${s.id}')">Edit</button>
                    <button class="btn btn-ghost" onclick="moveSlot('${s.id}', 'up')" ${isFirst ? 'disabled style="opacity:0.3"' : ''}>↑</button>
                    <button class="btn btn-ghost" onclick="moveSlot('${s.id}', 'down')" ${isLast ? 'disabled style="opacity:0.3"' : ''}>↓</button>
                    <button class="btn btn-ghost" style="color:var(--danger)" onclick="deleteSlot('${s.id}')">Delete</button>
                </div>
            </td>
        </tr>`;
    });
    document.getElementById('slotsTable').innerHTML = html + `</tbody></table></div>`;
}

async function deleteSlot(id) {
    const { data: slot, error: loadError } = await sb.from('slot_definitions').select('label, slot_key').eq('id', id).single();
    if (loadError || !slot) {
        alert("Error loading slot before delete: " + (loadError?.message || "Slot not found"));
        return;
    }

    const { label, slot_key } = slot;
    if (!confirm(`Are you sure you want to delete the slot definition: ${label}?`)) return;

    // Soft delete by setting active = false, and append a suffix to the slot_key to free up the name for a new slot.
    const suffix = Math.floor(Date.now() / 1000);
    const { error } = await sb.from('slot_definitions').update({
        active: false,
        slot_key: `${slot_key}_del_${suffix}`
    }).eq('id', id);
    if (error) {
        alert("Error deleting slot: " + error.message);
    } else {
        showNotification("Slot definition deleted.");
        loadSlots();
    }
}

async function moveSlot(id, direction) {
    const month = document.getElementById('slotMonth').value;
    const { data: slots } = await sb.from('slot_definitions')
        .select('*')
        .eq('department_id', state.activeDeptId)
        .eq('active', true)
        .lte('effective_from_month', month)
        .or(`effective_to_month.is.null,effective_to_month.gte.${month}`)
        .order('order_index', { ascending: true });

    const idx = slots.findIndex(s => s.id === id);
    if (idx === -1) return;

    let targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slots.length) return;

    const current = slots[idx];
    const target = slots[targetIdx];

    // Swap order_index. If they are the same (e.g. both 0), we use the array index as a fallback.
    let currentNewOrder = target.order_index || targetIdx;
    let targetNewOrder = current.order_index || idx;

    // If they are still the same, force offset
    if (currentNewOrder === targetNewOrder) {
        currentNewOrder = direction === 'up' ? idx - 1 : idx + 1;
        targetNewOrder = idx;
    }

    await Promise.all([
        sb.from('slot_definitions').update({ order_index: currentNewOrder }).eq('id', current.id),
        sb.from('slot_definitions').update({ order_index: targetNewOrder }).eq('id', target.id)
    ]);

    loadSlots();
}

async function showSlotModal(id = null) {
    let slot = { slot_key: '', label: '', required: false, max_people: 1, effective_from_month: document.getElementById('slotMonth').value, effective_to_month: '', sub_labels: [] };
    if (id) {
        const { data } = await sb.from('slot_definitions').select('*').eq('id', id).single();
        slot = data;
        if (!slot.sub_labels) slot.sub_labels = [];
    }

    const modal = document.getElementById('modalContent');
    modal.innerHTML = `
        <h3>${id ? 'Edit' : 'Add'} Slot Type</h3>
        <form id="slotForm">
            <div style="margin-bottom: 1rem;">
                <label>Key (e.g. AM, PM)</label>
                <input type="text" name="slot_key" value="${escapeHTML(slot.slot_key)}" required>
            </div>
            <div style="margin-bottom: 1rem;">
                <label>Label</label>
                <input type="text" name="label" value="${escapeHTML(slot.label)}" required>
            </div>
            <div style="display:flex; gap: 1rem; margin-bottom: 1rem;">
                <div style="flex:1">
                    <label>Max People per Slot</label>
                    <input type="number" id="maxPeopleInput" name="max_people" value="${escapeHTML(slot.max_people)}" min="1" required oninput="renderSubLabels()">
                </div>
                <div style="flex:1">
                    <label>Effective From (YYYY-MM)</label>
                    <input type="text" name="effective_from_month" value="${escapeHTML(slot.effective_from_month)}" required>
                </div>
            </div>
            <div id="subLabelsContainer" style="margin-bottom: 1rem;"></div>
            <div style="display:flex; gap: 1rem; margin-bottom: 1rem;">
                <label><input type="checkbox" name="required" ${slot.required ? 'checked' : ''}> Required</label>
            </div>
            <div style="display:flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
    `;

    window.renderSubLabels = () => {
        const maxInput = document.getElementById('maxPeopleInput');
        const count = parseInt(maxInput.value) || 1;
        const container = document.getElementById('subLabelsContainer');

        // Preserve existing values before re-rendering
        const currentInputs = Array.from(container.querySelectorAll('input[name="sub_labels[]"]'));
        const currentValues = currentInputs.map(input => input.value);

        let html = '';
        if (count > 1) {
            html += `<label>Optional Sub-labels (e.g. Blood, Urine)</label><div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">`;
            for (let i = 0; i < count; i++) {
                // Pre-fill with existing typed value, or from DB slot data
                const val = currentValues[i] !== undefined ? currentValues[i] : (slot.sub_labels[i] || '');
                html += `<input type="text" name="sub_labels[]" placeholder="Slot ${i + 1} Title" value="${escapeHTML(val)}">`;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
    };

    // Initial render
    setTimeout(window.renderSubLabels, 10);

    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('slotForm').onsubmit = async (e) => {
        e.preventDefault();

        if (!confirm("Save slot definition?")) return;

        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.required = fd.get('required') === 'on';
        data.department_id = state.activeDeptId;

        // Collect sub labels array
        const subLabelInputs = e.target.querySelectorAll('input[name="sub_labels[]"]');
        if (subLabelInputs.length > 0) {
            data.sub_labels = Array.from(subLabelInputs).map(i => i.value.trim());
        } else {
            data.sub_labels = [];
        }

        // Cleanup sub_labels from regular Object.fromEntries which might be a comma-separated string
        delete data['sub_labels[]'];

        if (!id) {
            // New slot: put at the end
            const { data: existing } = await sb.from('slot_definitions')
                .select('order_index')
                .eq('department_id', state.activeDeptId)
                .order('order_index', { ascending: false })
                .limit(1);
            data.order_index = (existing && existing.length > 0) ? (existing[0].order_index + 1) : 0;
        }

        const { error } = id
            ? await sb.from('slot_definitions').update(data).eq('id', id)
            : await sb.from('slot_definitions').insert(data);

        if (error) alert("Error saving slot: " + error.message);
        else {
            closeModal();
            loadSlots();
            showNotification("Slot definition saved.");
        }
    };
}

async function copySlots() {
    const currentMonth = document.getElementById('slotMonth').value;
    const d = new Date(currentMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    const prevMonth = d.toISOString().slice(0, 7);

    if (!confirm(`Copy slots from ${prevMonth} to ${currentMonth}?`)) return;

    const { data: prevSlots } = await sb.from('slot_definitions')
        .select('*')
        .eq('department_id', state.activeDeptId)
        .eq('active', true)
        .lte('effective_from_month', prevMonth)
        .or(`effective_to_month.is.null,effective_to_month.gte.${prevMonth}`);

    for (const s of prevSlots) {
        const { id, created_at, updated_at, ...payload } = s;
        payload.effective_from_month = currentMonth;
        await sb.from('slot_definitions').insert(payload);
    }
    loadSlots();
    showNotification("Slots copied from previous month.");
}
