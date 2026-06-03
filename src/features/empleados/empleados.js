// ============================================================
// PaintPro CA — Empleados: Repository
// ============================================================
window.EmpleadosRepository = {
  getAll()    { return window.AppDB.data.empleados; },
  getById(id) { return window.AppDB.data.empleados.find(e => e.id === id) || null; },

  create(data) {
    const db = window.AppDB.data;
    const emp = { id: window.AppDB.nextId('empleados'), ...data };
    db.empleados.push(emp);
    window.AppDB.save();
    return emp;
  },

  update(id, data) {
    const db  = window.AppDB.data;
    const idx = db.empleados.findIndex(e => e.id === id);
    if (idx < 0) return null;
    db.empleados[idx] = { ...db.empleados[idx], ...data };
    window.AppDB.save();
    return db.empleados[idx];
  },

  delete(id) {
    window.AppDB.data.empleados = window.AppDB.data.empleados.filter(e => e.id !== id);
    window.AppDB.save();
  },
};

// ============================================================
// PaintPro CA — Empleados: Service
// ============================================================
window.EmpleadosService = {
  list()        { return EmpleadosRepository.getAll(); },
  getById(id)   { return EmpleadosRepository.getById(id); },

  create(data) {
    const v = this._validate(data);
    if (!v.valid) return { success: false, error: v.error };
    return { success: true, data: EmpleadosRepository.create(this._sanitize(data)) };
  },

  update(id, data) {
    const v = this._validate(data);
    if (!v.valid) return { success: false, error: v.error };
    const updated = EmpleadosRepository.update(id, this._sanitize(data));
    return updated ? { success: true, data: updated } : { success: false, error: 'No encontrado.' };
  },

  delete(id) { EmpleadosRepository.delete(id); return { success: true }; },

  _validate(d) {
    if (!d.nombre?.trim()) return { valid: false, error: 'El nombre es requerido.' };
    if (!d.tarifa || isNaN(d.tarifa)) return { valid: false, error: 'La tarifa debe ser un número.' };
    return { valid: true };
  },

  _sanitize(d) {
    return {
      nombre:   d.nombre.trim(),
      puesto:   d.puesto || 'Pintor',
      tarifa:   parseFloat(d.tarifa) || 0,
      telefono: d.telefono?.trim() || '',
      email:    d.email?.trim()    || '',
      licencia: d.licencia?.trim() || '—',
      notas:    d.notas?.trim()    || '',
    };
  },
};

// ============================================================
// PaintPro CA — Empleados: UI
// ============================================================
const EMP_COLORS = ['#2C5F8A','#E8821A','#1E7C4A','#D4840A','#4A86B8','#7C3AED','#0891B2'];

window.EmpleadosUI = {

  render() {
    const grid = Utils.el('empleados-grid');
    if (!grid) return;
    const list = EmpleadosService.list();

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="ei">👷</div><p>No hay empleados registrados.</p></div>`;
      return;
    }

    grid.innerHTML = list.map((e, i) => {
      const initials = e.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
      const color    = EMP_COLORS[i % EMP_COLORS.length];
      return `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:22px 18px">
            <div style="width:52px;height:52px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;margin:0 auto 11px">${initials}</div>
            <div style="font-size:14px;font-weight:600">${Utils.escHtml(e.nombre)}</div>
            <div class="text-muted" style="font-size:11.5px;margin-top:2px">${Utils.escHtml(e.puesto)}</div>
            <div style="margin-top:13px;display:flex;flex-direction:column;gap:5px;text-align:left;font-size:12.5px">
              <div style="display:flex;justify-content:space-between"><span class="text-muted">Tarifa</span><span class="font-medium money">$${e.tarifa}/hr</span></div>
              <div style="display:flex;justify-content:space-between"><span class="text-muted">Tel</span><span>${Utils.escHtml(e.telefono || '—')}</span></div>
              <div style="display:flex;justify-content:space-between"><span class="text-muted">Licencia</span><span>${Utils.escHtml(e.licencia || '—')}</span></div>
            </div>
            <div style="display:flex;gap:6px;margin-top:13px;justify-content:center">
              <button class="btn btn-sm" style="flex:1" onclick="EmpleadosUI.openEdit(${e.id})">✏️ Editar</button>
              <button class="btn btn-sm btn-danger" onclick="EmpleadosUI.confirmDelete(${e.id})">🗑️</button>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  openNew() {
    Utils.el('modal-emp-title').textContent = 'Agregar empleado';
    ['e-id','e-nombre','e-tarifa','e-tel','e-email','e-lic','e-notas'].forEach(id => Utils.setVal(id, ''));
    Utils.setVal('e-puesto', 'Pintor');
    Utils.openModal('nuevoEmpleado');
  },

  openEdit(id) {
    const e = EmpleadosService.getById(id);
    if (!e) return;
    Utils.el('modal-emp-title').textContent = 'Editar empleado';
    Utils.setVal('e-id',     e.id);
    Utils.setVal('e-nombre', e.nombre);
    Utils.setVal('e-puesto', e.puesto);
    Utils.setVal('e-tarifa', e.tarifa);
    Utils.setVal('e-tel',    e.telefono);
    Utils.setVal('e-email',  e.email);
    Utils.setVal('e-lic',    e.licencia !== '—' ? e.licencia : '');
    Utils.setVal('e-notas',  e.notas);
    Utils.openModal('nuevoEmpleado');
  },

  save() {
    const id = parseInt(Utils.getVal('e-id')) || 0;
    const formData = {
      nombre:   Utils.getVal('e-nombre'),
      puesto:   Utils.getVal('e-puesto'),
      tarifa:   Utils.getVal('e-tarifa'),
      telefono: Utils.getVal('e-tel'),
      email:    Utils.getVal('e-email'),
      licencia: Utils.getVal('e-lic'),
      notas:    Utils.getVal('e-notas'),
    };

    const result = id ? EmpleadosService.update(id, formData) : EmpleadosService.create(formData);
    if (!result.success) { Utils.toast(result.error, 'error'); return; }

    Utils.toast(id ? 'Empleado actualizado ✓' : 'Empleado agregado ✓');
    Utils.closeModal('nuevoEmpleado');
    this.render();
    AppUI.updateBadges();
  },

  confirmDelete(id) {
    const e = EmpleadosService.getById(id);
    if (!e) return;
    Utils.confirm('¿Eliminar empleado?', `Se eliminará a "${e.nombre}" del equipo.`, () => {
      EmpleadosService.delete(id);
      Utils.toast('Empleado eliminado', 'info');
      this.render();
      AppUI.updateBadges();
    });
  },
};

window.Router.register('empleados', () => EmpleadosUI.render());
window.saveEmpleado = () => EmpleadosUI.save();
