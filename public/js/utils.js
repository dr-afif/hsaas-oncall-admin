// public/js/utils.js
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function renderError(targetId, message) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = `<p class="error" style="color: var(--danger);">${escapeHTML(message)}</p>`;
}
