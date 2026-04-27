// public/js/audit.js
async function renderAudit() {
    const container = document.getElementById('appContent');
    container.innerHTML = `
        <div class="card">
            <h2>Audit Log</h2>
            <div id="auditLog">Loading...</div>
        </div>
    `;

    const { data } = await sb.from('audit_log')
        .select('*')
        .order('ts', { ascending: false })
        .limit(100);

    let html = `<div class="table-responsive"><table class="admin-table">
        <thead><tr>
            <th class="date-col">Time</th>
            <th>Actor</th>
            <th>Table</th>
            <th>Action</th>
            <th>Details</th>
        </tr></thead><tbody>`;

    data.forEach(log => {
        html += `<tr>
            <td class="date-col">${escapeHTML(new Date(log.ts).toLocaleString())}</td>
            <td>${escapeHTML(log.actor_email)}</td>
            <td>${escapeHTML(log.table_name)}</td>
            <td>${escapeHTML(log.action)}</td>
            <td><pre style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(JSON.stringify(log.after_json || log.before_json))}</pre></td>
        </tr>`;
    });
    document.getElementById('auditLog').innerHTML = html + `</tbody></table></div>`;
}
