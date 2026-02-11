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

    let html = `<table style="width:100%; border-collapse: collapse; font-size: 0.875rem;">
        <thead><tr style="border-bottom: 2px solid var(--border)">
            <th style="padding: 0.5rem">Time</th>
            <th style="padding: 0.5rem">Actor</th>
            <th style="padding: 0.5rem">Table</th>
            <th style="padding: 0.5rem">Action</th>
            <th style="padding: 0.5rem">Details</th>
        </tr></thead><tbody>`;

    data.forEach(log => {
        html += `<tr style="border-bottom: 1px solid var(--border)">
            <td style="padding: 0.5rem">${new Date(log.ts).toLocaleString()}</td>
            <td style="padding: 0.5rem">${log.actor_email}</td>
            <td style="padding: 0.5rem">${log.table_name}</td>
            <td style="padding: 0.5rem">${log.action}</td>
            <td style="padding: 0.5rem"><pre style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${JSON.stringify(log.after_json || log.before_json)}</pre></td>
        </tr>`;
    });
    document.getElementById('auditLog').innerHTML = html + `</tbody></table>`;
}
