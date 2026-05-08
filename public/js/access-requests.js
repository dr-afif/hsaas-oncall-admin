// public/js/access-requests.js

async function renderAccessRequests() {
    const main = document.getElementById('appContent');
    main.innerHTML = `
        <div class="view-header">
            <h2>Viewer Access Requests</h2>
            <div class="header-actions">
                <button class="btn btn-secondary" onclick="loadAccessRequests()">Refresh</button>
            </div>
        </div>
        
        <div class="filter-bar">
            <select id="requestStatusFilter" onchange="loadAccessRequests()">
                <option value="pending">Pending</option>
                <option value="approved">Approved / Active</option>
                <option value="all">All Requests</option>
            </select>
        </div>

        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Requested Duration</th>
                        <th>Status</th>
                        <th>Expires At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="requestsList">
                    <tr><td colspan="8" class="text-center">Loading...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    await loadAccessRequests();
}

async function loadAccessRequests() {
    const statusFilter = document.getElementById('requestStatusFilter').value;
    let query = sb.from('viewer_access_requests').select('*, departments(name)').order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
        if (statusFilter === 'approved') {
            // Also only show ones that haven't expired
            query = query.eq('status', 'approved').gte('expires_at', new Date().toISOString());
        } else {
            query = query.eq('status', statusFilter);
        }
    }

    const { data, error } = await query;

    const tbody = document.getElementById('requestsList');
    if (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="error text-center">Failed to load requests: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No requests found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(req => {
        const createdDate = new Date(req.created_at).toLocaleDateString();
        const expiresDate = req.expires_at ? new Date(req.expires_at).toLocaleDateString() : '-';
        const deptName = req.departments?.name || req.department_id;
        
        let actions = '';
        if (req.status === 'pending') {
            actions = `
                <button class="btn btn-sm btn-primary" onclick="approveRequest('${req.id}', ${req.duration_months})">Approve (${req.duration_months}m)</button>
                <button class="btn btn-sm btn-danger" onclick="rejectRequest('${req.id}')">Reject</button>
            `;
        } else if (req.status === 'approved' && new Date(req.expires_at) > new Date()) {
            actions = `
                <button class="btn btn-sm btn-secondary" onclick="approveRequest('${req.id}', ${req.duration_months})">Extend</button>
                <button class="btn btn-sm btn-danger" onclick="revokeRequest('${req.id}')">Revoke</button>
            `;
        } else {
            actions = `<span style="color:var(--text-muted)">-</span>`;
        }

        let statusBadge = '';
        if (req.status === 'pending') statusBadge = '<span class="badge" style="background:#f59e0b;color:#fff">Pending</span>';
        else if (req.status === 'approved') {
            if (new Date(req.expires_at) > new Date()) statusBadge = '<span class="badge" style="background:#10b981;color:#fff">Active</span>';
            else statusBadge = '<span class="badge" style="background:#ef4444;color:#fff">Expired</span>';
        }
        else statusBadge = `<span class="badge" style="background:#ef4444;color:#fff">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>`;

        return `
            <tr>
                <td>${createdDate}</td>
                <td><strong>${escapeHTML(req.full_name)}</strong></td>
                <td>${escapeHTML(req.email)}</td>
                <td>${escapeHTML(deptName)}</td>
                <td>${req.duration_months} month(s)</td>
                <td>${statusBadge}</td>
                <td>${expiresDate}</td>
                <td class="action-cell" style="display:flex;gap:4px;">${actions}</td>
            </tr>
        `;
    }).join('');
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
