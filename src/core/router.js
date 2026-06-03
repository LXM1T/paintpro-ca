// ============================================================
// PaintPro CA — Core: Router
// Screen navigation and lifecycle hooks
// ============================================================

const SCREEN_TITLES = {
  dashboard:     'Dashboard',
  clientes:      'Clientes',
  proyectos:     'Proyectos',
  presupuestos:  'Presupuestos',
  inventario:    'Inventario',
  empleados:     'Empleados',
  perfil:        'Mi perfil',
};

// Map screen name → render function (registered by each feature)
const screenHandlers = {};

window.Router = {
  currentScreen: null,

  // ── Register a screen handler ─────────────────────────────
  register(screenName, handler) {
    screenHandlers[screenName] = handler;
  },

  // ── Navigate to a screen ─────────────────────────────────
  navigate(name) {
    if (!SCREEN_TITLES[name]) {
      console.warn(`[Router] Unknown screen: ${name}`);
      return;
    }

    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target screen
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');

    // Update topbar title
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = SCREEN_TITLES[name];

    // Activate correct nav item
    const navItems = document.querySelectorAll('.nav-item');
    const screenNames = Object.keys(SCREEN_TITLES);
    const idx = screenNames.indexOf(name);
    if (navItems[idx]) navItems[idx].classList.add('active');

    // Call the screen's render handler
    if (screenHandlers[name]) {
      screenHandlers[name]();
    }

    this.currentScreen = name;
  },
};

// Global alias used in HTML onclick attributes
window.showScreen = (name) => window.Router.navigate(name);
