// ============================================================
// PaintPro CA — App Entry Point
// Bootstraps the entire application
// ============================================================

window.AppUI = {

  // ── Boot ─────────────────────────────────────────────────
  init() {
    AppDB.load();
    this._bindConfirmDialog();
    this._bindModalOverlays();
    this._bindLoginForm();

    if (Auth.restoreSession()) {
      this._showApp();
    }
  },

  // ── Show app after login ──────────────────────────────────
  _showApp() {
    Utils.el('login-screen').style.display = 'none';
    Utils.el('app').classList.add('visible');
    this.updateSidebarUser();
    this.updateBadges();
    Router.navigate('dashboard');

    // Set date in topbar
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const topbarDate = Utils.el('topbar-date');
    if (topbarDate) topbarDate.textContent = `California · ${dateStr}`;
  },

  // ── Update sidebar user info ──────────────────────────────
  updateSidebarUser() {
    const u = Auth.currentUser;
    if (!u) return;
    const initials = Auth.getInitials();
    Utils.el('sidebar-av')    && (Utils.el('sidebar-av').textContent    = initials);
    Utils.el('sidebar-name')  && (Utils.el('sidebar-name').textContent  = u.nombre);
    Utils.el('sidebar-email') && (Utils.el('sidebar-email').textContent = u.email);
  },

  // ── Update nav badges ────────────────────────────────────
  updateBadges() {
    const db = AppDB.data;
    Utils.el('nb-clientes')  && (Utils.el('nb-clientes').textContent  = db.clientes.length);
    Utils.el('nb-proyectos') && (Utils.el('nb-proyectos').textContent = db.proyectos.filter(p => p.estado === 'activo').length);
  },

  // ── Login form ────────────────────────────────────────────
  _bindLoginForm() {
    const loginBtn  = Utils.el('login-btn-submit');
    const emailInp  = Utils.el('login-email');
    const passInp   = Utils.el('login-pass');

    const attemptLogin = () => {
      const email    = emailInp?.value || '';
      const password = passInp?.value  || '';
      const result   = Auth.login(email, password);
      const errEl    = Utils.el('login-error');

      if (!result.success) {
        if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
        if (passInp) passInp.value = '';
        return;
      }
      if (errEl) errEl.style.display = 'none';
      this._showApp();
    };

    loginBtn?.addEventListener('click', attemptLogin);
    passInp?.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
    emailInp?.addEventListener('keydown', e => { if (e.key === 'Enter') passInp?.focus(); });

    // Global login + logout functions for HTML onclick
    window.doLogin = attemptLogin;
    window.doLogout = () => {
      Auth.logout();
      Utils.el('app').classList.remove('visible');
      Utils.el('login-screen').style.display = 'flex';
      if (emailInp) emailInp.value = '';
      if (passInp)  passInp.value  = '';
      Utils.el('login-email')?.focus();
    };

    window.showForgot = () => {
      Utils.toast('Contacta al administrador para restablecer tu contraseña.', 'info');
    };
  },

  // ── Confirm dialog wiring ─────────────────────────────────
  _bindConfirmDialog() {
    document.getElementById('confirm-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'confirm-overlay') Utils.closeConfirm();
    });
  },

  // ── Modal backdrop close ──────────────────────────────────
  _bindModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m) m.classList.remove('open');
      });
    });
  },
};

// ── Override openModal to init forms ─────────────────────────
window.openModal = function (id) {
  const openers = {
    nuevoCliente:      () => ClientesUI.openNew(),
    nuevoProyecto:     () => ProyectosUI.openNew(),
    nuevoPresupuesto:  () => PresupuestosUI.openNew(),
    nuevoMaterial:     () => InventarioUI.openNew(),
    nuevoEmpleado:     () => EmpleadosUI.openNew(),
  };
  openers[id] ? openers[id]() : Utils.openModal(id);
};

// ── Boot on DOM ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => AppUI.init());
