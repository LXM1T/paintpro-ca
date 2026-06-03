// ============================================================
// PaintPro CA — Proyectos (Repository + Service + UI)
// ============================================================
window.ProyectosRepository = {
  getAll()    { return window.AppDB.data.proyectos; },
  getById(id) { return window.AppDB.data.proyectos.find(p => p.id === id) || null; },
  getByStatus(estado) { return window.AppDB.data.proyectos.filter(p => p.estado === estado); },

  create(data) {
    const db = window.AppDB.data;
    const p  = { id: window.AppDB.nextId('proyectos'), ...data };
    db.proyectos.push(p);
    window.AppDB.save();
    return p;
  },

  update(id, data) {
    const db  = window.AppDB.data;
    const idx = db.proyectos.findIndex(p => p.id === id);
    if (idx < 0) return null;
    db.proyectos[idx] = { ...db.proyectos[idx], ...data };
    window.AppDB.save();
    return db.proyectos[idx];
  },

  delete(id) {
    window.AppDB.data.proyectos = window.AppDB.data.proyectos.filter(p => p.id !== id);
    window.AppDB.save();
  },

  generateNumber() {
    const list = window.AppDB.data.proyectos;
    const seq  = list.length + 1;
    return `P-2026-${String(seq).padStart(3, '0')}`;
  },
};

window.ProyectosService = {
  list()         { return ProyectosRepository.getAll(); },
  getById(id)    { return ProyectosRepository.getById(id); },
  byStatus(s)    { return ProyectosRepository.getByStatus(s); },

  create(data) {
    if (!data.nombre?.trim()) return { success: false, error: 'El nombre del proyecto es requerido.' };
    if (!data.clienteId)      return { success: false, error: 'Selecciona un cliente.' };
    return { success: true, data: ProyectosRepository.create(this._sanitize(data)) };
  },

  update(id, data) {
    if (!data.nombre?.trim()) return { success: false, error: 'El nombre es requerido.' };
    const upd = ProyectosRepository.update(id, this._sanitize(data));
    return upd ? { success: true, data: upd } : { success: false, error: 'No encontrado.' };
  },

  delete(id) { ProyectosRepository.delete(id); return { success: true }; },

  _sanitize(d) {
    return {
      clienteId: parseInt(d.clienteId),
      nombre:    d.nombre.trim(),
      tipo:      d.tipo    || 'Residencial',
      subtipo:   d.subtipo || 'Interior',
      dir:       d.dir?.trim() || '',
      estado:    d.estado  || 'pendiente',
      finicio:   d.finicio || '',
      ffin:      d.ffin    || '',
      valor:     parseFloat(d.valor) || 0,
    };
  },
};

window.ProyectosUI = {

  render() {
    const cols = { pendiente: 'proj-col-pending', activo: 'proj-col-active', completado: 'proj-col-done' };
    Object.entries(cols).forEach(([estado, colId]) => {
      const el    = Utils.el(colId);
      if (!el) return;
      const items = ProyectosService.byStatus(estado);
      if (!items.length) {
        el.innerHTML = `<div style="padding:20px;text-align:center;font-size:12px;color:var(--text-muted)">Sin proyectos</div>`;
        return;
      }
      el.innerHTML = items.map(p => {
        const cl = ClientesRepository.getById(p.clienteId);
        return `
          <div style="padding:11px 13px;border-bottom:1px solid var(--border)">
            <div class="font-medium" style="font-size:13px">${Utils.escHtml(p.nombre)}</div>
            <div class="text-muted" style="font-size:12px;margin-top:2px">${cl ? Utils.escHtml(cl.nombre) : '?'} · ${Utils.formatCurrency(p.valor)}</div>
            <div class="text-muted" style="font-size:11.5px;margin-top:2px">${p.tipo} · ${p.subtipo}</div>
            <div style="display:flex;gap:4px;margin-top:7px">
              <button class="btn btn-sm" onclick="ProyectosUI.openEdit(${p.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="ProyectosUI.confirmDelete(${p.id})">🗑️</button>
            </div>
          </div>`;
      }).join('');
    });
  },

  openNew() {
    Utils.el('modal-proyecto-title').textContent = 'Nuevo proyecto';
    Utils.setVal('p-id', '');
    ['p-nombre','p-finicio','p-ffin','p-dir','p-valor'].forEach(id => Utils.setVal(id, ''));
    Utils.setVal('p-tipo', 'Residencial');
    Utils.setVal('p-estado', 'pendiente');
    this._populateClientes(0);
    Utils.openModal('nuevoProyecto');
  },

  openEdit(id) {
    const p = ProyectosService.getById(id);
    if (!p) return;
    Utils.el('modal-proyecto-title').textContent = 'Editar proyecto';
    Utils.setVal('p-id',      p.id);
    Utils.setVal('p-nombre',  p.nombre);
    Utils.setVal('p-tipo',    p.tipo);
    Utils.setVal('p-subtipo', p.subtipo);
    Utils.setVal('p-finicio', p.finicio);
    Utils.setVal('p-ffin',    p.ffin);
    Utils.setVal('p-dir',     p.dir);
    Utils.setVal('p-estado',  p.estado);
    Utils.setVal('p-valor',   p.valor);
    this._populateClientes(p.clienteId);
    Utils.openModal('nuevoProyecto');
  },

  save() {
    const id = parseInt(Utils.getVal('p-id')) || 0;
    const formData = {
      clienteId: Utils.getVal('p-cliente'),
      nombre:    Utils.getVal('p-nombre'),
      tipo:      Utils.getVal('p-tipo'),
      subtipo:   Utils.getVal('p-subtipo'),
      finicio:   Utils.getVal('p-finicio'),
      ffin:      Utils.getVal('p-ffin'),
      dir:       Utils.getVal('p-dir'),
      estado:    Utils.getVal('p-estado'),
      valor:     Utils.getVal('p-valor'),
    };
    const result = id ? ProyectosService.update(id, formData) : ProyectosService.create(formData);
    if (!result.success) { Utils.toast(result.error, 'error'); return; }
    Utils.toast(id ? 'Proyecto actualizado ✓' : 'Proyecto creado ✓');
    Utils.closeModal('nuevoProyecto');
    this.render();
    AppUI.updateBadges();
  },

  confirmDelete(id) {
    const p = ProyectosService.getById(id);
    if (!p) return;
    Utils.confirm('¿Eliminar proyecto?', `Se eliminará "${p.nombre}".`, () => {
      ProyectosService.delete(id);
      Utils.toast('Proyecto eliminado', 'info');
      this.render();
      AppUI.updateBadges();
    });
  },

  _populateClientes(selectedId) {
    const sel = Utils.el('p-cliente');
    if (!sel) return;
    sel.innerHTML = ClientesRepository.getAll()
      .map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${Utils.escHtml(c.nombre)}</option>`)
      .join('');
  },
};

window.Router.register('proyectos', () => ProyectosUI.render());
window.saveProyecto = () => ProyectosUI.save();


// ============================================================
// PaintPro CA — Inventario (Repository + Service + UI)
// ============================================================
window.InventarioRepository = {
  getAll()    { return window.AppDB.data.inventario; },
  getById(id) { return window.AppDB.data.inventario.find(i => i.id === id) || null; },

  create(data) {
    const db = window.AppDB.data;
    const item = { id: window.AppDB.nextId('inventario'), ...data };
    db.inventario.push(item);
    window.AppDB.save();
    return item;
  },

  update(id, data) {
    const db  = window.AppDB.data;
    const idx = db.inventario.findIndex(i => i.id === id);
    if (idx < 0) return null;
    db.inventario[idx] = { ...db.inventario[idx], ...data };
    window.AppDB.save();
    return db.inventario[idx];
  },

  delete(id) {
    window.AppDB.data.inventario = window.AppDB.data.inventario.filter(i => i.id !== id);
    window.AppDB.save();
  },

  updateStock(id, quantity) {
    return this.update(id, { stock: parseInt(quantity) || 0 });
  },
};

window.InventarioService = {
  list()      { return InventarioRepository.getAll(); },
  getById(id) { return InventarioRepository.getById(id); },
  getLowStock() { return InventarioRepository.getAll().filter(i => i.stock < i.min); },
  getTotalValue() { return InventarioRepository.getAll().reduce((s, i) => s + (i.precio * i.stock), 0); },

  create(data) {
    if (!data.nombre?.trim()) return { success: false, error: 'El nombre es requerido.' };
    return { success: true, data: InventarioRepository.create(this._sanitize(data)) };
  },

  update(id, data) {
    if (!data.nombre?.trim()) return { success: false, error: 'El nombre es requerido.' };
    const upd = InventarioRepository.update(id, this._sanitize(data));
    return upd ? { success: true, data: upd } : { success: false, error: 'No encontrado.' };
  },

  delete(id) { InventarioRepository.delete(id); return { success: true }; },
  updateStock(id, qty) { InventarioRepository.updateStock(id, qty); },

  _sanitize(d) {
    return {
      nombre: d.nombre.trim(),
      cat:    d.cat    || 'Suministro',
      unidad: d.unidad || 'Pieza',
      precio: parseFloat(d.precio) || 0,
      stock:  parseInt(d.stock)    || 0,
      min:    parseInt(d.min)      || 0,
    };
  },
};

window.InventarioUI = {

  render() {
    const list = InventarioService.list();
    const low  = InventarioService.getLowStock().length;
    const ok   = list.length - low;
    const val  = InventarioService.getTotalValue();

    Utils.el('inv-ok')?.textContent  && (Utils.el('inv-ok').textContent  = ok);
    Utils.el('inv-low')?.textContent && (Utils.el('inv-low').textContent = low);
    Utils.el('inv-val')?.textContent && (Utils.el('inv-val').textContent = Utils.formatCurrency(val));

    const tbody = Utils.el('inv-tbody');
    if (!tbody) return;
    if (!list.length) { tbody.innerHTML = Utils.emptyState('📦', 'Sin materiales.'); return; }

    tbody.innerHTML = list.map(i => {
      const pct   = Math.min(100, Math.round((i.stock / (i.min * 2.5)) * 100));
      const color = i.stock < i.min ? 'var(--danger)' : i.stock < i.min * 1.5 ? 'var(--warning)' : 'var(--success)';
      const badge = i.stock < i.min ? 'badge-danger'  : i.stock < i.min * 1.5 ? 'badge-warning'  : 'badge-success';
      const label = i.stock < i.min ? 'Bajo'          : i.stock < i.min * 1.5 ? 'Limitado'       : 'OK';
      return `
        <tr>
          <td class="font-medium">${Utils.escHtml(i.nombre)}</td>
          <td><span class="badge badge-neutral">${i.cat}</span></td>
          <td class="money">$${i.precio}/${i.unidad}</td>
          <td><input type="number" class="inline-edit" style="width:70px" value="${i.stock}" onchange="InventarioUI.updateStock(${i.id},this.value)" min="0"></td>
          <td class="text-muted">${i.min}</td>
          <td>
            <div style="display:flex;align-items:center;gap:7px">
              <div class="stock-bar" style="width:70px"><div class="stock-fill" style="width:${pct}%;background:${color}"></div></div>
              <span class="badge ${badge}" style="font-size:10px">${label}</span>
            </div>
          </td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm" onclick="InventarioUI.openEdit(${i.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="InventarioUI.confirmDelete(${i.id})">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  updateStock(id, val) {
    InventarioService.updateStock(id, val);
    this.render();
  },

  openNew() {
    Utils.el('modal-mat-title').textContent = 'Agregar material';
    ['m-id','m-nombre','m-precio','m-stock','m-min'].forEach(id => Utils.setVal(id, ''));
    Utils.openModal('nuevoMaterial');
  },

  openEdit(id) {
    const i = InventarioService.getById(id);
    if (!i) return;
    Utils.el('modal-mat-title').textContent = 'Editar material';
    Utils.setVal('m-id',     i.id);
    Utils.setVal('m-nombre', i.nombre);
    Utils.setVal('m-cat',    i.cat);
    Utils.setVal('m-unidad', i.unidad);
    Utils.setVal('m-precio', i.precio);
    Utils.setVal('m-stock',  i.stock);
    Utils.setVal('m-min',    i.min);
    Utils.openModal('nuevoMaterial');
  },

  save() {
    const id = parseInt(Utils.getVal('m-id')) || 0;
    const formData = {
      nombre: Utils.getVal('m-nombre'),
      cat:    Utils.getVal('m-cat'),
      unidad: Utils.getVal('m-unidad'),
      precio: Utils.getVal('m-precio'),
      stock:  Utils.getVal('m-stock'),
      min:    Utils.getVal('m-min'),
    };
    const result = id ? InventarioService.update(id, formData) : InventarioService.create(formData);
    if (!result.success) { Utils.toast(result.error, 'error'); return; }
    Utils.toast(id ? 'Material actualizado ✓' : 'Material agregado ✓');
    Utils.closeModal('nuevoMaterial');
    this.render();
  },

  confirmDelete(id) {
    const i = InventarioService.getById(id);
    if (!i) return;
    Utils.confirm('¿Eliminar material?', `Se eliminará "${i.nombre}".`, () => {
      InventarioService.delete(id);
      Utils.toast('Material eliminado', 'info');
      this.render();
    });
  },
};

window.Router.register('inventario', () => InventarioUI.render());
window.saveMaterial = () => InventarioUI.save();
