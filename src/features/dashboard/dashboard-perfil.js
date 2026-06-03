// ============================================================
// PaintPro CA — Dashboard UI
// ============================================================
window.DashboardUI = {
  _charts: {},

  refresh() {
    const db = window.AppDB.data;

    const totalIngresos = db.presupuestos
      .filter(p => p.estado === 'Aprobado')
      .reduce((s, p) => s + p.total, 0);

    const activeProyectos = db.proyectos.filter(p => p.estado === 'activo').length;
    const openPresupuestos = db.presupuestos.filter(p => ['Propuesta','Pendiente','Revisión'].includes(p.estado)).length;

    Utils.el('d-ingresos')  && (Utils.el('d-ingresos').textContent  = Utils.formatCurrency(totalIngresos));
    Utils.el('d-proyectos') && (Utils.el('d-proyectos').textContent = activeProyectos);
    Utils.el('d-presup')    && (Utils.el('d-presup').textContent    = openPresupuestos);
    Utils.el('d-empleados') && (Utils.el('d-empleados').textContent = db.empleados.length);

    // Recent estimates
    const tbody = Utils.el('dash-presup-recent');
    if (tbody) {
      const recent = [...db.presupuestos].reverse().slice(0, 5);
      tbody.innerHTML = recent.length ? recent.map(p => {
        const cl = ClientesRepository.getById(p.clienteId);
        return `
          <tr>
            <td class="money" style="font-size:11.5px">${Utils.escHtml(p.num)}</td>
            <td>${cl ? Utils.escHtml(cl.nombre) : '—'}</td>
            <td class="text-muted">${Utils.escHtml(p.proyecto)}</td>
            <td class="font-bold money">${Utils.formatCurrency(p.total)}</td>
            <td>${Utils.statusBadge(p.estado)}</td>
          </tr>`;
      }).join('') : Utils.emptyState('📋', 'Sin presupuestos aún.');
    }

    this._buildCharts();
  },

  _buildCharts() {
    if (typeof Chart === 'undefined') return;

    // Revenue chart
    const ctx1 = Utils.el('chartIngresos');
    if (ctx1) {
      if (this._charts.ingresos) this._charts.ingresos.destroy();
      this._charts.ingresos = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Ene','Feb','Mar','Abr','May','Jun'],
          datasets: [
            { label: 'Ingresos', data: [32000,38000,29000,44000,48320,0], backgroundColor: '#2C5F8A', borderRadius: 5 },
            { label: 'Meta', data: [35000,35000,35000,40000,45000,45000], type: 'line', borderColor: '#E8821A', borderDash:[5,3], pointRadius:3, fill:false, tension:.3 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { font:{size:11}, boxWidth:12, padding:10 } } },
          scales: {
            y: { grid:{color:'#F1F1F1'}, ticks:{ callback: v => '$'+v.toLocaleString(), font:{size:11} } },
            x: { grid:{display:false}, ticks:{font:{size:11}} },
          },
        },
      });
    }

    // Types donut
    const ctx2 = Utils.el('chartTipos');
    if (ctx2) {
      if (this._charts.tipos) this._charts.tipos.destroy();
      this._charts.tipos = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Interior Res.','Exterior Res.','Comercial Int.','Comercial Ext.','Industrial'],
          datasets: [{ data:[28,22,18,20,12], backgroundColor:['#2C5F8A','#4A86B8','#E8821A','#D4840A','#1E7C4A'], borderWidth:0 }],
        },
        options: {
          responsive:true, maintainAspectRatio:false, cutout:'60%',
          plugins:{ legend:{ position:'bottom', labels:{font:{size:11}, padding:8, boxWidth:12} } },
        },
      });
    }
  },
};

window.Router.register('dashboard', () => DashboardUI.refresh());


// ============================================================
// PaintPro CA — Perfil UI
// ============================================================
window.PerfilUI = {

  load() {
    const u = Auth.currentUser;
    if (!u) return;

    const initials = Auth.getInitials();
    Utils.el('profile-avatar')       && (Utils.el('profile-avatar').textContent       = initials);
    Utils.el('profile-name-display') && (Utils.el('profile-name-display').textContent = u.nombre);
    Utils.el('profile-email-display')&& (Utils.el('profile-email-display').textContent= u.email);

    Utils.setVal('pf-nombre',  u.nombre);
    Utils.setVal('pf-email',   u.email);
    Utils.setVal('pf-tel',     u.telefono  || '');
    Utils.setVal('pf-puesto',  u.puesto    || '');
    Utils.setVal('pf-empresa', u.empresa   || '');

    const cfg = window.AppDB.data.config;
    Utils.setVal('cfg-labor',    cfg.labor    || 32);
    Utils.setVal('cfg-tax',      cfg.tax      || 10.25);
    Utils.setVal('cfg-overhead', cfg.overhead || 15);
    Utils.setVal('cfg-margen',   cfg.margen   || 35);
  },

  saveProfile() {
    const result = Auth.updateProfile({
      nombre:  Utils.getVal('pf-nombre'),
      email:   Utils.getVal('pf-email'),
      telefono:Utils.getVal('pf-tel'),
      puesto:  Utils.getVal('pf-puesto'),
      empresa: Utils.getVal('pf-empresa'),
    });
    if (!result.success) { Utils.toast(result.error, 'error'); return; }
    AppUI.updateSidebarUser();
    this.load();
    Utils.toast('Perfil actualizado ✓');
  },

  changePassword() {
    const result = Auth.changePassword(
      Utils.getVal('pw-actual'),
      Utils.getVal('pw-nueva'),
      Utils.getVal('pw-confirmar')
    );
    if (!result.success) { Utils.toast(result.error, 'error'); return; }
    ['pw-actual','pw-nueva','pw-confirmar'].forEach(id => Utils.setVal(id, ''));
    Utils.toast('Contraseña actualizada ✓');
  },

  saveConfig() {
    const cfg = window.AppDB.data.config;
    cfg.labor    = parseFloat(Utils.getVal('cfg-labor'))    || 32;
    cfg.tax      = parseFloat(Utils.getVal('cfg-tax'))      || 10.25;
    cfg.overhead = parseFloat(Utils.getVal('cfg-overhead')) || 15;
    cfg.margen   = parseFloat(Utils.getVal('cfg-margen'))   || 35;
    window.AppDB.save();
    Utils.toast('Configuración guardada ✓');
  },

  confirmDeleteAll() {
    Utils.confirm(
      '¿Borrar TODOS los datos?',
      'Se eliminarán clientes, proyectos, presupuestos, inventario y empleados. Solo se conservará tu cuenta.',
      () => {
        const users  = [...window.AppDB.data.users];
        const config = { ...window.AppDB.data.config };
        window.AppDB.reset();
        window.AppDB.data.users  = users;
        window.AppDB.data.config = config;
        window.AppDB.save();
        AppUI.updateBadges();
        DashboardUI.refresh();
        Utils.toast('Datos eliminados', 'info');
      },
      'Sí, borrar todo',
      '⚠️'
    );
  },
};

window.Router.register('perfil', () => PerfilUI.load());
window.saveProfile      = () => PerfilUI.saveProfile();
window.changePassword   = () => PerfilUI.changePassword();
window.saveConfig       = () => PerfilUI.saveConfig();
window.confirmDeleteAll = () => PerfilUI.confirmDeleteAll();
