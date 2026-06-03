// ============================================================
// PaintPro CA — Clientes: Service (Business Logic)
// ============================================================

window.ClientesService = {

  list(search = '') {
    return window.ClientesRepository.getAll(search);
  },

  getById(id) {
    return window.ClientesRepository.getById(id);
  },

  create(formData) {
    const validation = this._validate(formData);
    if (!validation.valid) return { success: false, error: validation.error };

    const cliente = window.ClientesRepository.create(this._sanitize(formData));
    return { success: true, data: cliente };
  },

  update(id, formData) {
    const validation = this._validate(formData);
    if (!validation.valid) return { success: false, error: validation.error };

    const updated = window.ClientesRepository.update(id, this._sanitize(formData));
    if (!updated) return { success: false, error: 'Cliente no encontrado.' };
    return { success: true, data: updated };
  },

  delete(id) {
    window.ClientesRepository.delete(id);
    return { success: true };
  },

  _validate(data) {
    if (!data.nombre || data.nombre.trim().length < 2)
      return { valid: false, error: 'El nombre es requerido (mínimo 2 caracteres).' };
    return { valid: true };
  },

  _sanitize(data) {
    return {
      nombre:   data.nombre?.trim(),
      empresa:  data.empresa?.trim() || '—',
      telefono: data.telefono?.trim() || '',
      email:    data.email?.trim()    || '',
      dir:      data.dir?.trim()      || '',
      ciudad:   data.ciudad?.trim()   || 'Los Angeles',
      zip:      data.zip?.trim()      || '',
      notas:    data.notas?.trim()    || '',
    };
  },
};
