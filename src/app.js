// ============================================================
// PaintPro CA — App Entry Point
// Bootstraps the entire application
// ============================================================

window.AppUI = {

  // ── Boot ─────────────────────────────────────────────────
  init() {
    AppDB.load();

    // Garantizar estado inicial correcto via JS
    // (no depender únicamente de CSS)
    this._enforceInitialState();
    this._bindConfirmDialog();
    this._bindModalOverlays();
    this._bindLoginForm();

    // Intentar restaurar sesión existente
    if (Auth.restoreSession()) {
      this._showApp();
    } else {
      this._showLogin();
    }
  },

  // ── Enforce initial visibility state ─────────────────────
  // Corre antes de cualquier render para evitar flash
  _enforceInitialState() {
    const app   = Utils.el('app');
    const login = Utils.el('login-screen');
    if (app)   { app.classList.remove('visible'); app.style.display = 'none'; }
    if (login) { login.classList.remove('hidden'); login.style.display = ''; }

    // Ocultar todos los screens excepto dashboard
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const dash = Utils.el('screen-dashboard');
    if (dash) dash.classList.add('active');
  },

  // ── Show app after successful login ──────────────────────
  _showApp() {
    const login = Utils.el('login-screen');
    const app   = Utils.el('app');

    // Ocultar login
    if (login) {
      login.classList.add('hidden');
      login.style.display = 'none';
    }

    // Mostrar app
    if (app) {
      app.style.display = '';  // quitar inline override
      app.classList.add('visible');
    }

    this.updateSidebarUser();
    this.updateBadges();
    Router.navigate('dashboard');

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const topbarDate = Utils.el('topbar-date');
    if (topbarDate) topbarDate.textContent = `California · ${dateStr}`;
  },

  // ── Show login ────────────────────────────────────────────
  _showLogin() {
    const login = Utils.el('login-screen');
    const app   = Utils.el('app');

    if (app) {
      app.classList.remove('visible');
      app.style.display = 'none';
    }
    if (login) {
      login.classList.remove('hidden');
      login.style.display = '';
    }

    // Focus email input
    setTimeout(() => Utils.el('login-email')?.focus(), 50);
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

  // ── Update nav badges ─────────────────────────────────────
  updateBadges() {
    const db = AppDB.data;
    const nbC = Utils.el('nb-clientes');
    const nbP = Utils.el('nb-proyectos');
    if (nbC) nbC.textContent = db.clientes.length;
    if (nbP) nbP.textContent = db.proyectos.filter(p => p.estado === 'activo').length;
  },

  // ── Login form bindings ───────────────────────────────────
  _bindLoginForm() {
    const loginBtn = Utils.el('login-btn-submit');
    const emailInp = Utils.el('login-email');
    const passInp  = Utils.el('login-pass');

    const attemptLogin = () => {
      const email    = emailInp?.value || '';
      const password = passInp?.value  || '';
      const result   = Auth.login(email, password);
      const errEl    = Utils.el('login-error');

      if (!result.success) {
        if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
        if (passInp) passInp.value = '';
        // Shake animation
        const card = document.querySelector('.login-card');
        if (card) {
          card.style.animation = 'none';
          card.style.transform = 'translateX(-6px)';
          setTimeout(() => {
            card.style.transform = 'translateX(6px)';
            setTimeout(() => { card.style.transform = ''; }, 80);
          }, 80);
        }
        return;
      }

      if (errEl) errEl.style.display = 'none';
      this._showApp();
    };

    loginBtn?.addEventListener('click', attemptLogin);
    passInp?.addEventListener('keydown',  e => { if (e.key === 'Enter') attemptLogin(); });
    emailInp?.addEventListener('keydown', e => { if (e.key === 'Enter') passInp?.focus(); });

    // Global aliases
    window.doLogin = attemptLogin;

    window.doLogout = () => {
      Auth.logout();
      this._showLogin();
    };

    window.showForgot = () => {
      Utils.toast('Contacta al administrador para restablecer tu contraseña.', 'info');
    };
  },

  // ── Confirm dialog ────────────────────────────────────────
  _bindConfirmDialog() {
    Utils.el('confirm-overlay')?.addEventListener('click', e => {
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

// ── Override openModal to init forms before opening ──────────
window.openModal = function(id) {
  const openers = {
    nuevoCliente:     () => ClientesUI.openNew(),
    nuevoProyecto:    () => ProyectosUI.openNew(),
    nuevoPresupuesto: () => PresupuestosUI.openNew(),
    nuevoMaterial:    () => InventarioUI.openNew(),
    nuevoEmpleado:    () => EmpleadosUI.openNew(),
  };
  openers[id] ? openers[id]() : Utils.openModal(id);
};

// ── Boot on DOM ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => AppUI.init());
