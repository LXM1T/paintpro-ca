// ============================================================
// PaintPro CA — Clientes: Repository (Data Access Layer)
// ============================================================

window.ClientesRepository = {

  getAll(search = '') {
    let list = window.AppDB.data.clientes;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.empresa || '').toLowerCase().includes(q) ||
        (c.email  || '').toLowerCase().includes(q) ||
        (c.ciudad || '').toLowerCase().includes(q)
      );
    }
    return list;
  },

  getById(id) {
    return window.AppDB.data.clientes.find(c => c.id === id) || null;
  },

  create(data) {
    const db = window.AppDB.data;
    const cliente = { id: window.AppDB.nextId('clientes'), ...data };
    db.clientes.push(cliente);
    window.AppDB.save();
    return cliente;
  },

  update(id, data) {
    const db = window.AppDB.data;
    const idx = db.clientes.findIndex(c => c.id === id);
    if (idx < 0) return null;
    db.clientes[idx] = { ...db.clientes[idx], ...data };
    window.AppDB.save();
    return db.clientes[idx];
  },

  delete(id) {
    const db = window.AppDB.data;
    db.clientes = db.clientes.filter(c => c.id !== id);
    // Also remove related projects and estimates
    db.proyectos    = db.proyectos.filter(p => p.clienteId !== id);
    db.presupuestos = db.presupuestos.filter(p => p.clienteId !== id);
    window.AppDB.save();
  },

  countProjects(clienteId) {
    return window.AppDB.data.proyectos.filter(p => p.clienteId === clienteId).length;
  },
};
