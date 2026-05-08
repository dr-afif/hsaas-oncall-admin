// public/js/access-requests.js

async function renderAccessRequests() {
    const main = document.getElementById('appContent');
    main.innerHTML = `
        <div style="padding: 1.5rem;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin:0">Viewer Access Management</h2>
                <div class="header-actions">
                    <button class="btn btn-ghost" onclick="loadAccessRequests()">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:8px; vertical-align:middle"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        Refresh
                    </button>
                </div>
            </div>
            
            <div id="pendingContainer"></div>
            <div id="activeContainer"></div>
            <div id="historyContainer"></div>
        </div>
    `;

    await loadAccessRequests();
}

async function loadAccessRequests() {
    // Show loading state
    const containers = ['pendingContainer', 'activeContainer', 'historyContainer'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="card"><p>Loading...</p></div>';
    });

    const { data, error } = await sb
        .from('viewer_access_requests')
        .select('*, departments(name)')
        .order('created_at', { ascending: false });

    if (error) {
        showNotification("Failed to load requests: " + error.message, 'error');
        return;
    }

    const now = new Date();
    const pending = data.filter(r => r.status === 'pending');
    const active = data.filter(r => r.status === 'approved' && new Date(r.expires_at) > now);
    const history = data.filter(r => 
        r.status === 'rejected' || 
        r.status === 'revoked' || 
        (r.status === 'approved' && new Date(r.expires_at) <= now)
    );

    renderSection('pendingContainer', 'Pending Requests', pending, true);
    renderSection('activeContainer', 'Active Access', active, false);
    renderSection('historyContainer', 'History (Expired / Rejected / Revoked)', history, false);
}

function renderSection(containerId, title, items, isPending) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const now = new Date();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="card" style="margin-bottom: 1.5rem; opacity: 0.7;">
                <h3 style="margin-top:0; color: var(--text-muted)">${title}</h3>
                <p>No records found.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin:0">${title}</h3>
                <span class="badge" style="background: var(--bg); color: var(--text-muted)">${items.length}</span>
            </div>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Dept / Email</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>${isPending ? 'Requested' : 'Expires'}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    html += items.map(req => {
        const createdDate = new Date(req.created_at).toLocaleDateString();
        const expiresDate = req.expires_at ? new Date(req.expires_at).toLocaleDateString() : '-';
        const deptName = req.departments?.name || req.department_id;
        
        let actions = '';
        if (req.status === 'pending') {
            actions = `
                <button class="btn btn-sm btn-primary" onclick="approveRequest('${req.id}', ${req.duration_months})">Approve</button>
                <button class="btn btn-sm btn-ghost" style="color: var(--danger)" onclick="rejectRequest('${req.id}')">Reject</button>
            `;
        } else if (req.status === 'approved' && new Date(req.expires_at) > now) {
            actions = `
                <button class="btn btn-sm btn-ghost" onclick="approveRequest('${req.id}', ${req.duration_months})">Extend</button>
                <button class="btn btn-sm btn-ghost" style="color: var(--danger)" onclick="revokeRequest('${req.id}')">Revoke</button>
            `;
        } else {
            actions = `<button class="btn btn-sm btn-ghost" onclick="approveRequest('${req.id}', ${req.duration_months})">Restore</button>`;
        }

        let statusBadge = '';
        if (req.status === 'pending') statusBadge = '<span class="badge" style="background:#fef3c7;color:#92400e">Pending</span>';
        else if (req.status === 'approved') {
            if (new Date(req.expires_at) > now) statusBadge = '<span class="badge" style="background:#d1fae5;color:#065f46">Active</span>';
            else statusBadge = '<span class="badge" style="background:#f3f4f6;color:#374151">Expired</span>';
        }
        else if (req.status === 'rejected') statusBadge = '<span class="badge" style="background:#fee2e2;color:#991b1b">Rejected</span>';
        else if (req.status === 'revoked') statusBadge = '<span class="badge" style="background:#f1f5f9;color:#475569">Revoked</span>';

        return `
            <tr>
                <td>
                    <div style="font-weight:600">${escapeHTML(req.full_name)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${createdDate}</div>
                </td>
                <td>
                    <div>${escapeHTML(deptName)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${escapeHTML(req.email)}</div>
                </td>
                <td>${req.duration_months}m</td>
                <td>${statusBadge}</td>
                <td style="font-size:0.85rem">${isPending ? createdDate : expiresDate}</td>
                <td>
                    <div style="display:flex; gap:4px;">${actions}</div>
                </td>
            </tr>
        `;
    }).join('');

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

async function approveRequest(id, months) {
    console.log("Approve requested for ID:", id, "Months:", months);
    if (!confirm(`Approve this request for ${months} month(s)?`)) return;
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (months || 1));

    try {
        const { error } = await sb
            .from('viewer_access_requests')
            .update({ 
                status: 'approved', 
                expires_at: expiresAt.toISOString(),
                approved_at: new Date().toISOString(),
                approved_by: window.state?.user?.email || 'admin'
            })
            .eq('id', id);

        if (error) {
            console.error("Approve error:", error);
            showNotification(error.message, 'error');
        } else {
            showNotification('Request approved successfully');
            loadAccessRequests();
        }
    } catch (err) {
        console.error("Unexpected approve error:", err);
        showNotification("An unexpected error occurred: " + err.message, "error");
    }
}

async function rejectRequest(id) {
    if (!confirm("Are you sure you want to reject this request?")) return;

    try {
        const { error } = await sb
            .from('viewer_access_requests')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) {
            console.error("Reject error:", error);
            showNotification(error.message, 'error');
        } else {
            showNotification('Request rejected');
            loadAccessRequests();
        }
    } catch (err) {
        console.error("Unexpected reject error:", err);
    }
}

async function revokeRequest(id) {
    if (!confirm("Are you sure you want to revoke access? The user will immediately lose access to the viewer app.")) return;

    try {
        const { error } = await sb
            .from('viewer_access_requests')
            .update({ status: 'revoked' })
            .eq('id', id);

        if (error) {
            console.error("Revoke error:", error);
            showNotification(error.message, 'error');
        } else {
            showNotification('Access revoked');
            loadAccessRequests();
        }
    } catch (err) {
        console.error("Unexpected revoke error:", err);
    }
}
