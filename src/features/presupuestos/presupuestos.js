// ============================================================
// PaintPro CA — Presupuestos: Repository
// ============================================================
window.PresupuestosRepository = {
  getAll()    { return window.AppDB.data.presupuestos; },
  getById(id) { return window.AppDB.data.presupuestos.find(p => p.id === id) || null; },

  create(data) {
    const db  = window.AppDB.data;
    const est = { id: window.AppDB.nextId('presupuestos'), ...data };
    db.presupuestos.push(est);
    window.AppDB.save();
    return est;
  },

  update(id, data) {
    const db  = window.AppDB.data;
    const idx = db.presupuestos.findIndex(p => p.id === id);
    if (idx < 0) return null;
    db.presupuestos[idx] = { ...db.presupuestos[idx], ...data };
    window.AppDB.save();
    return db.presupuestos[idx];
  },

  delete(id) {
    window.AppDB.data.presupuestos = window.AppDB.data.presupuestos.filter(p => p.id !== id);
    window.AppDB.save();
  },

  generateNumber() {
    const list = window.AppDB.data.presupuestos;
    const last  = list.length ? list[list.length - 1].num : 'EST-2026-000';
    const seq   = parseInt(last.split('-')[2] || '0') + 1;
    return `EST-2026-${String(seq).padStart(3, '0')}`;
  },
};

// ============================================================
// PaintPro CA — Presupuestos: Service
// ============================================================
window.PresupuestosService = {
  list()      { return PresupuestosRepository.getAll(); },
  getById(id) { return PresupuestosRepository.getById(id); },

  create(formData) {
    const v = this._validate(formData);
    if (!v.valid) return { success: false, error: v.error };
    const calc  = this._runCalc(formData);
    const total = formData.totalOverride ? parseFloat(formData.totalOverride) : calc.total;
    return { success: true, data: PresupuestosRepository.create({ ...this._sanitize(formData), total, ...calc }) };
  },

  update(id, formData) {
    const v = this._validate(formData);
    if (!v.valid) return { success: false, error: v.error };
    const calc  = this._runCalc(formData);
    const total = formData.totalOverride ? parseFloat(formData.totalOverride) : calc.total;
    const upd   = PresupuestosRepository.update(id, { ...this._sanitize(formData), total, ...calc });
    return upd ? { success: true, data: upd } : { success: false, error: 'No encontrado.' };
  },

  delete(id) { PresupuestosRepository.delete(id); return { success: true }; },

  _validate(d) {
    if (!d.num?.trim())     return { valid: false, error: 'El número es requerido.' };
    if (!d.proyecto?.trim()) return { valid: false, error: 'La descripción es requerida.' };
    if (!d.clienteId)       return { valid: false, error: 'Selecciona un cliente.' };
    return { valid: true };
  },

  _runCalc(d) {
    if (!d.sqft || isNaN(d.sqft)) return {};
    return PresupuestosCalculator.calculate({
      jobType:       d.tipo       || 'interior_res',
      paintType:     d.pintura    || 'standard',
      prepLevel:     d.prep       || 'medium',
      areaSqft:      parseFloat(d.sqft),
      numCoats:      parseInt(d.capas) || 2,
      numDays:       parseInt(d.dias)  || 1,
      marginPercent: parseFloat(d.margen) || 35,
    });
  },

  _sanitize(d) {
    return {
      num:       d.num.trim(),
      clienteId: parseInt(d.clienteId),
      proyecto:  d.proyecto.trim(),
      fecha:     d.fecha || new Date().toISOString().split('T')[0],
      sqft:      parseFloat(d.sqft) || 0,
      tipo:      d.tipo    || 'interior_res',
      capas:     parseInt(d.capas)  || 2,
      pintura:   d.pintura || 'standard',
      margen:    parseFloat(d.margen) || 35,
      estado:    d.estado  || 'Propuesta',
      notas:     d.notas?.trim() || '',
    };
  },
};

// ============================================================
// PaintPro CA — Presupuestos: UI
// ============================================================
window.PresupuestosUI = {

  render() {
    const tbody = Utils.el('presup-tbody');
    if (!tbody) return;
    const list = [...PresupuestosService.list()].reverse();

    if (!list.length) {
      tbody.innerHTML = Utils.emptyState('📋', 'No hay presupuestos. Crea el primero.');
      return;
    }

    tbody.innerHTML = list.map(p => {
      const cl = ClientesRepository.getById(p.clienteId);
      return `
        <tr>
          <td class="money" style="font-size:11.5px">${Utils.escHtml(p.num)}</td>
          <td>${cl ? Utils.escHtml(cl.nombre) : '—'}</td>
          <td class="text-muted">${Utils.escHtml(p.proyecto)}</td>
          <td class="text-muted">${Utils.formatDate(p.fecha)}</td>
          <td>${Number(p.sqft).toLocaleString()} sqft</td>
          <td class="font-bold money">${Utils.formatCurrency(p.total)}</td>
          <td>${Utils.statusBadge(p.estado)}</td>
          <td>
            <div class="actions-cell">
              <button class="btn btn-sm" onclick="PresupuestosUI.openEdit(${p.id})">✏️ Editar</button>
              <button class="btn btn-sm btn-danger" onclick="PresupuestosUI.confirmDelete(${p.id})">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  _populateClienteSelect(selectId, selectedId) {
    const sel = Utils.el(selectId);
    if (!sel) return;
    sel.innerHTML = ClientesRepository.getAll()
      .map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${Utils.escHtml(c.nombre)}</option>`)
      .join('');
  },

  openNew() {
    Utils.el('modal-presup-title').textContent = 'Nuevo presupuesto';
    Utils.setVal('est-id', '');
    Utils.setVal('est-num', PresupuestosRepository.generateNumber());
    Utils.setVal('est-fecha', new Date().toISOString().split('T')[0]);
    Utils.setVal('est-margen', window.AppDB.data.config.margen || 35);
    ['est-proyecto','est-sqft','est-notas'].forEach(id => Utils.setVal(id, ''));
    Utils.setVal('est-tipo',    'interior_res');
    Utils.setVal('est-capas',   '2');
    Utils.setVal('est-pintura', 'standard');
    Utils.setVal('est-estado',  'Propuesta');
    this._populateClienteSelect('est-cliente', 0);
    Utils.el('est-calc-result').style.display = 'none';
    Utils.openModal('nuevoPresupuesto');
  },

  openEdit(id) {
    const p = PresupuestosService.getById(id);
    if (!p) return;
    Utils.el('modal-presup-title').textContent = 'Editar presupuesto';
    Utils.setVal('est-id',      p.id);
    Utils.setVal('est-num',     p.num);
    Utils.setVal('est-proyecto',p.proyecto);
    Utils.setVal('est-fecha',   p.fecha);
    Utils.setVal('est-sqft',    p.sqft);
    Utils.setVal('est-tipo',    p.tipo);
    Utils.setVal('est-capas',   p.capas);
    Utils.setVal('est-pintura', p.pintura);
    Utils.setVal('est-margen',  p.margen);
    Utils.setVal('est-estado',  p.estado);
    Utils.setVal('est-notas',   p.notas);
    this._populateClienteSelect('est-cliente', p.clienteId);
    this.runCalc();
    Utils.openModal('nuevoPresupuesto');
  },

  runCalc() {
    const sqft = parseFloat(Utils.getVal('est-sqft')) || 0;
    if (!sqft) { Utils.el('est-calc-result').style.display = 'none'; return 0; }

    const result = PresupuestosCalculator.calculate({
      jobType:       Utils.getVal('est-tipo')    || 'interior_res',
      paintType:     Utils.getVal('est-pintura') || 'standard',
      areaSqft:      sqft,
      numCoats:      parseInt(Utils.getVal('est-capas')) || 2,
      marginPercent: parseFloat(Utils.getVal('est-margen')) || 35,
    });

    const fmt = Utils.formatCurrency.bind(Utils);
    const rows = [
      ['Mano de obra (' + result.laborHours + ' hrs)', fmt(result.laborCost)],
      ['Materiales (' + result.gallons + ' gal)',      fmt(result.totalMat)],
      ['Costos indirectos',                            fmt(result.indirectCost)],
      ['Impuesto CA',                                  fmt(result.taxAmount)],
      ['Margen utilidad',                              fmt(result.profitAmount)],
    ];

    Utils.el('est-calc-detail').innerHTML = rows
      .map(([l, v]) => `<span class="text-muted">${l}</span><span class="font-medium">${v}</span>`)
      .join('');
    Utils.el('est-calc-total').textContent = fmt(result.total);
    Utils.el('est-calc-result').style.display = 'block';
    return result.total;
  },

  save() {
    const id    = parseInt(Utils.getVal('est-id')) || 0;
    const total = this.runCalc();
    const formData = {
      num:       Utils.getVal('est-num'),
      clienteId: Utils.getVal('est-cliente'),
      proyecto:  Utils.getVal('est-proyecto'),
      fecha:     Utils.getVal('est-fecha'),
      sqft:      Utils.getVal('est-sqft'),
      tipo:      Utils.getVal('est-tipo'),
      capas:     Utils.getVal('est-capas'),
      pintura:   Utils.getVal('est-pintura'),
      margen:    Utils.getVal('est-margen'),
      estado:    Utils.getVal('est-estado'),
      notas:     Utils.getVal('est-notas'),
      totalOverride: total || undefined,
    };

    const result = id
      ? PresupuestosService.update(id, formData)
      : PresupuestosService.create(formData);

    if (!result.success) { Utils.toast(result.error, 'error'); return; }

    Utils.toast(id ? 'Presupuesto actualizado ✓' : 'Presupuesto creado ✓');
    Utils.closeModal('nuevoPresupuesto');
    this.render();
    DashboardUI.refresh();
  },

  confirmDelete(id) {
    const p = PresupuestosService.getById(id);
    if (!p) return;
    Utils.confirm(
      '¿Eliminar presupuesto?',
      `Se eliminará el presupuesto ${p.num} (${Utils.formatCurrency(p.total)}).`,
      () => {
        PresupuestosService.delete(id);
        Utils.toast('Presupuesto eliminado', 'info');
        this.render();
        DashboardUI.refresh();
      }
    );
  },
};

window.Router.register('presupuestos', () => PresupuestosUI.render());
window.savePresupuesto   = () => PresupuestosUI.save();
window.calcPresupuesto   = () => PresupuestosUI.runCalc();
