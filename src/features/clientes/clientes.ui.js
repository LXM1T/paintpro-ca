// ============================================================
// PaintPro CA — Clientes: UI Layer
// ============================================================

window.ClientesUI = {

  // ── Render table ─────────────────────────────────────────
  render() {
    const search  = Utils.el('clientes-search')?.value || '';
    const list    = ClientesService.list(search);
    const tbody   = Utils.el('clientes-tbody');
    const counter = Utils.el('clientes-count');

    if (counter) counter.textContent = `${list.length} cliente${list.length !== 1 ? 's' : ''}`;

    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = Utils.emptyState('👥', 'No hay clientes. Agrega el primero.');
      return;
    }

    tbody.innerHTML = list.map(c => {
      const np = ClientesRepository.countProjects(c.id);
      return `
        <tr>
          <td><span class="font-medium">${Utils.escHtml(c.nombre)}</span></td>
          <td class="text-muted">${Utils.escHtml(c.empresa)}</td>
          <td>${Utils.escHtml(c.ciudad)}, CA</td>
          <td class="money" style="font-size:12px">${Utils.escHtml(c.telefono)}</td>
          <td class="text-brand">${Utils.escHtml(c.email)}</td>
          <td><span class="badge badge-info">${np} proy.</span></td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm" onclick="ClientesUI.openEdit(${c.id})">✏️ Editar</button>
              <button class="btn btn-sm btn-danger" onclick="ClientesUI.confirmDelete(${c.id})">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  // ── Open modal for new client ─────────────────────────────
  openNew() {
    Utils.el('modal-cliente-title').textContent = 'Nuevo cliente';
    ['c-id','c-nombre','c-empresa','c-tel','c-email','c-dir','c-ciudad','c-zip','c-notas']
      .forEach(id => Utils.setVal(id, ''));
    Utils.openModal('nuevoCliente');
  },

  // ── Open modal to edit ────────────────────────────────────
  openEdit(id) {
    const c = ClientesService.getById(id);
    if (!c) return;

    Utils.el('modal-cliente-title').textContent = 'Editar cliente';
    Utils.setVal('c-id',      c.id);
    Utils.setVal('c-nombre',  c.nombre);
    Utils.setVal('c-empresa', c.empresa !== '—' ? c.empresa : '');
    Utils.setVal('c-tel',     c.telefono);
    Utils.setVal('c-email',   c.email);
    Utils.setVal('c-dir',     c.dir);
    Utils.setVal('c-ciudad',  c.ciudad);
    Utils.setVal('c-zip',     c.zip);
    Utils.setVal('c-notas',   c.notas);
    Utils.openModal('nuevoCliente');
  },

  // ── Save (create or update) ───────────────────────────────
  save() {
    const id = parseInt(Utils.getVal('c-id')) || 0;
    const formData = {
      nombre:   Utils.getVal('c-nombre'),
      empresa:  Utils.getVal('c-empresa'),
      telefono: Utils.getVal('c-tel'),
      email:    Utils.getVal('c-email'),
      dir:      Utils.getVal('c-dir'),
      ciudad:   Utils.getVal('c-ciudad'),
      zip:      Utils.getVal('c-zip'),
      notas:    Utils.getVal('c-notas'),
    };

    const result = id
      ? ClientesService.update(id, formData)
      : ClientesService.create(formData);

    if (!result.success) { Utils.toast(result.error, 'error'); return; }

    Utils.toast(id ? 'Cliente actualizado ✓' : 'Cliente registrado ✓');
    Utils.closeModal('nuevoCliente');
    this.render();
    AppUI.updateBadges();
  },

  // ── Confirm delete ────────────────────────────────────────
  confirmDelete(id) {
    const c = ClientesService.getById(id);
    if (!c) return;
    Utils.confirm(
      '¿Eliminar cliente?',
      `Se eliminará "${c.nombre}" y todos sus proyectos y presupuestos.`,
      () => {
        ClientesService.delete(id);
        Utils.toast('Cliente eliminado', 'info');
        this.render();
        AppUI.updateBadges();
      }
    );
  },
};

// Register with router
window.Router.register('clientes', () => ClientesUI.render());

// Global aliases for HTML onclick
window.saveCliente = () => ClientesUI.save();
