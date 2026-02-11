// public/js/roster.js
let rosterState = {
    month: new Date().toISOString().slice(0, 7),
    slots: [],
    contacts: [],
    aliases: [],
    cells: {}, // key: date|slot_id
    holidays: [],
    focusedCell: null
};

async function renderRoster() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <div class="roster-header-actions">
                <div id="monthSelector" class="month-selector">
                    <!-- Month buttons injected here -->
                </div>
                <div style="display:flex; gap: 0.75rem; align-items: center;">
                    <button class="btn btn-ghost" onclick="exportData()">Export JSON</button>
                    <button class="btn btn-ghost" onclick="validateRoster()">Validate</button>
                    <button class="btn btn-primary" onclick="saveRoster()">Save Changes</button>
                    <button class="btn btn-primary" style="background: var(--success)" onclick="publishRoster()">Publish</button>
                </div>
            </div>
            <div id="gridContainer" class="roster-grid-container">
                <p>Loading roster...</p>
            </div>
        </div>
    `;

    renderMonthButtons();
    loadRosterData();
}

function renderMonthButtons() {
    const selector = document.getElementById('monthSelector');
    if (!selector) return;

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 2, 1); // 2 months back

    let html = '';
    for (let i = 0; i < 12; i++) {
        const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const val = `${year}-${month}`;

        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const isActive = val === rosterState.month;

        html += `<button class="month-btn ${isActive ? 'active' : ''}" onclick="setRosterMonth('${val}')">${label}</button>`;
    }
    selector.innerHTML = html;

    // Scroll active into view
    setTimeout(() => {
        const activeBtn = selector.querySelector('.month-btn.active');
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
}

function setRosterMonth(val) {
    rosterState.month = val;
    renderMonthButtons(); // Refresh active state
    loadRosterData();
}

async function loadRosterData() {
    const deptId = state.activeDeptId;
    if (!deptId) {
        document.getElementById('gridContainer').innerHTML = '<p>Please select a department.</p>';
        return;
    }
    const month = rosterState.month;

    // 1. Load Slots for this month
    const { data: slots, error: slotError } = await supabase.from('slot_definitions')
        .select('*')
        .eq('department_id', deptId)
        .eq('active', true)
        .lte('effective_from_month', month)
        .or(`effective_to_month.is.null,effective_to_month.gte.${month}`)
        .order('order_index');

    if (slotError) {
        console.error("Slot load error:", slotError);
        document.getElementById('gridContainer').innerHTML = `<p class="error">Error loading slots: ${slotError.message}</p>`;
        return;
    }

    rosterState.slots = slots || [];

    // 2. Load Contacts and Aliases
    const [resC, resA] = await Promise.all([
        supabase.from('contacts').select('*').eq('department_id', deptId).eq('active', true),
        supabase.from('contact_aliases').select('*').eq('department_id', deptId).eq('active', true)
    ]);
    rosterState.contacts = resC.data || [];
    rosterState.aliases = resA.data || [];

    // 2b. Load Holidays for this month
    const [year, m] = month.split('-').map(Number);
    const lastDay = new Date(year, m, 0).getDate();
    const { data: holidays } = await supabase.from('public_holidays')
        .select('*')
        .gte('date', `${month}-01`)
        .lte('date', `${month}-${String(lastDay).padStart(2, '0')}`);
    rosterState.holidays = holidays || [];

    // 3. Load or Create Roster Month
    let { data: rm } = await supabase.from('roster_months')
        .select('*').eq('department_id', deptId).eq('month', month).single();

    if (!rm) {
        const { data: newRm, error: insError } = await supabase.from('roster_months')
            .insert({ department_id: deptId, month }).select().single();
        if (insError) {
            console.error("Roster month insert error:", insError);
            document.getElementById('gridContainer').innerHTML = `<p class="error">Error creating roster month: ${insError.message}</p>`;
            return;
        }
        rm = newRm;
    }
    rosterState.rosterMonthId = rm.id;

    // 4. Load Cells
    const { data: cells } = await supabase.from('roster_cells')
        .select('*').eq('roster_month_id', rm.id);

    rosterState.cells = {};
    cells.forEach(c => {
        rosterState.cells[`${c.date}|${c.slot_definition_id}|${c.instance_index || 0}`] = c;
    });

    buildGrid();
}

function buildGrid() {
    const grid = document.getElementById('gridContainer');
    const daysInMonth = new Date(rosterState.month.split('-')[0], rosterState.month.split('-')[1], 0).getDate();

    // Flatten slots into columns
    rosterState.columns = [];
    rosterState.slots.forEach(s => {
        for (let i = 0; i < (s.max_people || 1); i++) {
            rosterState.columns.push({ slot: s, instance: i });
        }
    });

    let html = `<table class="roster-table"><thead><tr><th class="date-col">Date</th>`;
    rosterState.columns.forEach(col => {
        const title = col.slot.max_people > 1 ? `${col.slot.label} (${col.instance + 1})` : col.slot.label;
        const isLastInstance = col.instance === (col.slot.max_people || 1) - 1;
        const boundaryClass = isLastInstance ? 'slot-boundary' : '';
        html += `<th class="${boundaryClass}">${title} ${col.slot.required ? '<span style="color:red">*</span>' : ''}</th>`;
    });
    html += `</tr></thead><tbody>`;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${rosterState.month}-${String(d).padStart(2, '0')}`;
        const dObj = new Date(dateStr + 'T00:00:00');
        const dayName = dayNames[dObj.getDay()];
        const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
        const holiday = rosterState.holidays.find(h => h.date === dateStr);

        html += `<tr class="${isWeekend ? 'is-weekend' : ''} ${holiday ? 'is-holiday' : ''}">
                    <td class="date-col">
                        <div style="font-size: 0.75rem; color: var(--text-muted)">${dayName}</div>
                        <div>${dateStr}</div>
                        ${holiday ? `<span class="holiday-label">${holiday.name}</span>` : ''}
                    </td>`;
        rosterState.columns.forEach(col => {
            const cell = rosterState.cells[`${dateStr}|${col.slot.id}|${col.instance}`];
            const display = resolveDisplay(cell);
            const statusClass = resolveStatusClass(cell);
            const isLastInstance = col.instance === (col.slot.max_people || 1) - 1;
            const boundaryClass = isLastInstance ? 'slot-boundary' : '';

            html += `<td class="roster-cell ${statusClass} ${boundaryClass}" 
                        data-date="${dateStr}" 
                        data-slot-id="${col.slot.id}" 
                        data-instance="${col.instance}"
                        tabindex="0"
                        onclick="focusCell(this)"
                        ondblclick="startEditing(this)"
                        onkeydown="handleCellKey(event, this)">
                        ${display}
                    </td>`;
        });
        html += `</tr>`;
    }
    grid.innerHTML = html + `</tbody></table>`;
}

function resolveDisplay(cell) {
    if (!cell) return '';
    if (cell.contact_id) {
        const contact = rosterState.contacts.find(c => c.id === cell.contact_id);
        return contact ? contact.short_name : '???';
    }
    return cell.raw_text || '';
}

function resolveStatusClass(cell) {
    if (!cell) return '';
    if (cell.raw_text) return 'invalid';
    if (cell.contact_id) {
        const contact = rosterState.contacts.find(c => c.id === cell.contact_id);
        if (contact && !contact.phone_number) return 'warning';
    }
    return '';
}

function focusCell(el) {
    if (rosterState.focusedCell) rosterState.focusedCell.classList.remove('focused');
    rosterState.focusedCell = el;
    el.classList.add('focused');
}

function startEditing(el) {
    if (el.querySelector('input')) return; // Already editing

    const currentVal = el.innerText.trim();
    el.innerHTML = '';

    const input = document.createElement('input');
    input.setAttribute('list', 'contactList');
    input.value = currentVal;
    input.style.width = '100%';
    input.style.border = 'none';
    input.style.outline = 'none';

    // Create datalist if it doesn't exist
    if (!document.getElementById('contactList')) {
        const dl = document.createElement('datalist');
        dl.id = 'contactList';
        document.body.appendChild(dl);
    }

    const dl = document.getElementById('contactList');
    dl.innerHTML = rosterState.contacts.map(c =>
        `<option value="${c.short_name}">${c.full_name}</option>`
    ).join('');

    el.appendChild(input);
    input.focus();
    input.select();

    input.onblur = () => {
        const val = input.value.trim();
        updateCell(el, val);
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            input.value = currentVal;
            input.blur();
        }
    };
}

async function handleCellKey(e, el) {
    if (e.key === 'Enter') {
        e.preventDefault();
        startEditing(el);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Just start typing
        startEditing(el);
    }
}

document.addEventListener('paste', async (e) => {
    if (!rosterState.focusedCell) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');

    // Robust TSV parser that handles quoted multiline cells from Excel
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuote) {
            if (char === '"' && nextChar === '"') {
                currentCell += '"'; i++;
            } else if (char === '"') {
                inQuote = false;
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === '\t') {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\r' || char === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentCell += char;
            }
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    let startEl = rosterState.focusedCell;
    let startDate = startEl.dataset.date;
    let startColIdx = rosterState.columns.findIndex(c => c.slot.id === startEl.dataset.slotId && String(c.instance) === String(startEl.dataset.instance));

    for (let r = 0; r < rows.length; r++) {
        const currentRow = rows[r];
        if (currentRow.every(cell => !cell.trim())) continue; // Skip empty rows

        const targetDate = addDays(startDate, r);
        if (new Date(targetDate).getMonth() !== new Date(startDate).getMonth()) break;

        let colOffset = 0;
        for (let c = 0; c < currentRow.length; c++) {
            const rawValue = currentRow[c].trim();
            // Split internal newlines into separate instances
            const subValues = rawValue.split(/\n/).map(v => v.trim()).filter(v => v);

            if (subValues.length > 0) {
                subValues.forEach((val, idx) => {
                    const col = rosterState.columns[startColIdx + colOffset + idx];
                    // Ensure we are still in the same logical slot type (e.g. don't spill AM names into PM)
                    if (col && col.slot.id === rosterState.columns[startColIdx + colOffset]?.slot.id) {
                        const cellEl = document.querySelector(`[data-date="${targetDate}"][data-slot-id="${col.slot.id}"][data-instance="${col.instance}"]`);
                        if (cellEl) updateCell(cellEl, val, false);
                    }
                });
                colOffset += 1;
            }
        }
    }
    buildGrid();
});

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
}

function updateCell(el, val, reRender = true) {
    const date = el.dataset.date;
    const slotId = el.dataset.slotId;
    const instanceIndex = el.dataset.instance || 0;
    const key = `${date}|${slotId}|${instanceIndex}`;

    let contactId = null;
    let rawText = null;

    if (val) {
        // Resolve logic
        const contact = rosterState.contacts.find(c => c.short_name.toLowerCase() === val.toLowerCase());
        if (contact) {
            contactId = contact.id;
        } else {
            const alias = rosterState.aliases.find(a => a.alias_token.toLowerCase() === val.toLowerCase());
            if (alias) {
                contactId = alias.contact_id;
            } else {
                rawText = val;
            }
        }
    }

    const cell = rosterState.cells[key] || {
        roster_month_id: rosterState.rosterMonthId,
        date,
        slot_definition_id: slotId,
        instance_index: parseInt(instanceIndex),
        version: 0
    };

    cell.contact_id = contactId;
    cell.raw_text = rawText;
    cell.dirty = true;
    rosterState.cells[key] = cell;

    if (reRender) buildGrid();
}

async function saveRoster() {
    const toUpsert = Object.values(rosterState.cells).filter(c => c.dirty);
    if (toUpsert.length === 0) {
        showNotification("No changes to save.", "info");
        return;
    }

    if (!confirm(`Are you sure you want to save ${toUpsert.length} changes?`)) {
        return;
    }

    for (const cell of toUpsert) {
        const { dirty, ...payload } = cell;
        payload.updated_by_email = state.user.email;

        let result;
        if (payload.id) {
            // Optimistic lock: update only if version matches
            result = await supabase.from('roster_cells')
                .update({ ...payload, version: payload.version + 1 })
                .eq('id', payload.id)
                .eq('version', payload.version);

            if (result.error || result.count === 0) {
                alert(`Conflict detected for ${payload.date}. Please reload.`);
                return;
            }
        } else {
            result = await supabase.from('roster_cells').insert(payload);
        }
    }

    showNotification("Roster saved successfully.");
    loadRosterData();
}

async function validateRoster() {
    let errors = [];
    rosterState.slots.forEach(s => {
        if (s.required) {
            const daysInMonth = new Date(rosterState.month.split('-')[0], rosterState.month.split('-')[1], 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const date = `${rosterState.month}-${String(d).padStart(2, '0')}`;
                // For required slots, check every instance from 0 to max_people - 1
                for (let i = 0; i < (s.max_people || 1); i++) {
                    const cell = rosterState.cells[`${date}|${s.id}|${i}`];
                    if (!cell || !cell.contact_id) {
                        const label = s.max_people > 1 ? `${s.label} (${i + 1})` : s.label;
                        errors.push(`Missing required slot: ${date} ${label}`);
                    }
                }
            }
        }
    });

    Object.values(rosterState.cells).forEach(c => {
        if (c.raw_text) errors.push(`Unresolved token "${c.raw_text}" at ${c.date}`);
    });

    if (errors.length === 0) {
        alert("Roster is valid!");
        return true;
    } else {
        alert("Validation Errors:\n" + errors.join('\n'));
        return false;
    }
}

async function publishRoster() {
    const isValid = await validateRoster();
    if (!isValid) return;

    if (!confirm("Are you sure you want to PUBLISH this roster? This will make it visible to all users.")) {
        return;
    }

    const { error } = await supabase.from('roster_months')
        .update({ status: 'published' })
        .eq('id', rosterState.rosterMonthId);

    await supabase.from('publish_events').insert({
        roster_month_id: rosterState.rosterMonthId,
        department_id: state.activeDeptId,
        month: rosterState.month,
        published_by_email: state.user.email,
        validation_summary: { status: 'passed' }
    });

    showNotification("Roster published!");
}

function exportData() {
    const data = Object.values(rosterState.cells).map(c => {
        const slot = rosterState.slots.find(s => s.id === c.slot_definition_id);
        const contact = rosterState.contacts.find(con => con.id === c.contact_id);
        return {
            date: c.date,
            slot: slot?.label,
            instance: c.instance_index + 1,
            contact: contact?.full_name,
            phone: contact?.phone_number
        };
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster-${state.activeDeptId}-${rosterState.month}.json`;
    a.click();
}
