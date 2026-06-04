// ============================================================
// PaintPro CA — Sidebar UI Controller
// Collapsible desktop sidebar + mobile drawer
// ============================================================

window.SidebarUI = {
  _collapsed: false,
  _mobileOpen: false,

  // ── Init ─────────────────────────────────────────────────
  init() {
    // Restore saved state
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') this._applyCollapsed(true, false);

    // Auto-collapse on tablet
    if (window.innerWidth <= 900 && window.innerWidth > 640) {
      this._applyCollapsed(true, false);
    }

    // Listen for resize
    window.addEventListener('resize', () => this._onResize());
  },

  // ── Toggle collapse/expand (desktop) ─────────────────────
  toggle() {
    if (window.innerWidth <= 640) return; // mobile uses drawer
    this._applyCollapsed(!this._collapsed);
  },

  _applyCollapsed(collapsed, save = true) {
    this._collapsed = collapsed;
    const sidebar = document.getElementById('sidebar');
    const btn     = document.getElementById('sidebar-toggle-btn');
    if (!sidebar) return;

    if (collapsed) {
      sidebar.classList.add('collapsed');
      if (btn) btn.setAttribute('title', 'Expandir menú');
    } else {
      sidebar.classList.remove('collapsed');
      if (btn) btn.setAttribute('title', 'Colapsar menú');
    }

    if (save) localStorage.setItem('sidebar_collapsed', collapsed);
  },

  // ── Mobile drawer ─────────────────────────────────────────
  openMobile() {
    this._mobileOpen = true;
    document.getElementById('sidebar')?.classList.add('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    this._mobileOpen = false;
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
    document.body.style.overflow = '';
  },

  // ── Resize handler ────────────────────────────────────────
  _onResize() {
    const w = window.innerWidth;
    if (w <= 640) {
      // Mobile: close drawer if open
      if (this._mobileOpen) this.closeMobile();
    } else if (w <= 900) {
      // Tablet: collapse sidebar
      this.closeMobile();
      this._applyCollapsed(true, false);
    } else {
      // Desktop: restore saved state
      document.body.style.overflow = '';
      const saved = localStorage.getItem('sidebar_collapsed') === 'true';
      this._applyCollapsed(saved, false);
    }
  },
};

// Close mobile sidebar when navigating
const _origShowScreen = window.showScreen;
window.showScreen = function(name) {
  if (window.SidebarUI && window.SidebarUI._mobileOpen) {
    window.SidebarUI.closeMobile();
  }
  _origShowScreen(name);
};
