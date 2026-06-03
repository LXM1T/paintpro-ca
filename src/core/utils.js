// ============================================================
// PaintPro CA — Core: Utils
// Toast · Confirm · Modal · HTML helpers
// ============================================================

window.Utils = {

  // ── Toast notifications ──────────────────────────────────
  toast(msg, type = 'success') {
    const container = document.getElementById('toast');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast-item ${type === 'error' ? 'danger' : type === 'success' ? 'success' : ''}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    el.textContent = `${icons[type] || 'ℹ️'} ${msg}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },

  // ── Confirm dialog ───────────────────────────────────────
  _confirmCb: null,

  confirm(title, msg, callback, btnLabel = 'Eliminar', icon = '🗑️') {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = msg;
    document.getElementById('confirm-icon').textContent  = icon;
    document.getElementById('confirm-ok-btn').textContent = btnLabel;
    this._confirmCb = callback;
    document.getElementById('confirm-overlay').classList.add('open');
  },

  closeConfirm() {
    document.getElementById('confirm-overlay').classList.remove('open');
    this._confirmCb = null;
  },

  confirmOk() {
    if (this._confirmCb) this._confirmCb();
    this.closeConfirm();
  },

  // ── Modal ─────────────────────────────────────────────────
  openModal(id) {
    document.getElementById(`modal-${id}`)?.classList.add('open');
  },

  closeModal(id) {
    document.getElementById(`modal-${id}`)?.classList.remove('open');
  },

  // ── XSS protection ───────────────────────────────────────
  escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // ── Format helpers ────────────────────────────────────────
  formatCurrency(value) {
    return '$' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  },

  // ── DOM helpers ───────────────────────────────────────────
  el(id) { return document.getElementById(id); },

  setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  },

  getVal(id) {
    return document.getElementById(id)?.value?.trim() ?? '';
  },

  // ── Color badge ──────────────────────────────────────────
  statusBadge(status) {
    const map = {
      'Aprobado':  'badge-success',
      'Pendiente': 'badge-warning',
      'Propuesta': 'badge-info',
      'Revisión':  'badge-neutral',
      'Rechazado': 'badge-danger',
      'activo':    'badge-success',
      'pendiente': 'badge-warning',
      'completado':'badge-info',
    };
    return `<span class="badge ${map[status] || 'badge-neutral'}">${status}</span>`;
  },

  // ── Empty state HTML ─────────────────────────────────────
  emptyState(icon, text) {
    return `<tr><td colspan="99"><div class="empty-state"><div class="ei">${icon}</div><p>${text}</p></div></td></tr>`;
  },
};

// Global aliases for HTML onclick compatibility
window.closeModal   = (id) => window.Utils.closeModal(id);
window.closeConfirm = ()   => window.Utils.closeConfirm();
window.confirmOk    = ()   => window.Utils.confirmOk();
