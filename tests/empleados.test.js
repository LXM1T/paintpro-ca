// ============================================================
// PaintPro CA — Tests: Empleados
// Covers: Repository, Service (CRUD + validaciones)
// ============================================================

function runEmpleadosTests() {
  TestUtils.injectMockDB();

  // ── REPOSITORY ────────────────────────────────────────────

  describe('EmpleadosRepository — getAll()', () => {

    it('debería retornar todos los empleados', () => {
      const list = EmpleadosRepository.getAll();
      expect(list).toHaveLength(2);
    });

    it('debería retornar array (no null ni undefined)', () => {
      const list = EmpleadosRepository.getAll();
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('EmpleadosRepository — getById()', () => {

    it('debería retornar empleado existente', () => {
      const emp = EmpleadosRepository.getById(1);
      expect(emp).toBeTruthy();
      expect(emp.nombre).toBe('Carlos Pintor');
    });

    it('debería retornar null para ID inexistente', () => {
      const emp = EmpleadosRepository.getById(9999);
      expect(emp).toBeNull();
    });
  });

  describe('EmpleadosRepository — create()', () => {

    it('debería crear empleado y asignar ID', () => {
      TestUtils.injectMockDB();
      const nuevo = EmpleadosRepository.create({
        nombre: 'Nuevo Pintor', puesto: 'Pintor',
        tarifa: 30, telefono: '(213) 000-0000',
        email: 'nuevo@test.com', licencia: '—', notas: '',
      });
      expect(nuevo.id).toBeGreaterThan(0);
      expect(EmpleadosRepository.getAll()).toHaveLength(3);
    });

    it('ID debe ser único y mayor al anterior', () => {
      TestUtils.injectMockDB();
      const e1 = EmpleadosRepository.create({ nombre: 'E1', puesto: 'Pintor', tarifa: 25 });
      const e2 = EmpleadosRepository.create({ nombre: 'E2', puesto: 'Pintor', tarifa: 25 });
      expect(e2.id).toBeGreaterThan(e1.id);
    });
  });

  describe('EmpleadosRepository — update()', () => {

    it('debería actualizar puesto y tarifa', () => {
      TestUtils.injectMockDB();
      EmpleadosRepository.update(2, { puesto: 'Supervisor', tarifa: 48 });
      const updated = EmpleadosRepository.getById(2);
      expect(updated.puesto).toBe('Supervisor');
      expect(updated.tarifa).toBe(48);
    });

    it('debería retornar null para ID inexistente', () => {
      const result = EmpleadosRepository.update(9999, { puesto: 'X' });
      expect(result).toBeNull();
    });

    it('debería preservar campos no actualizados', () => {
      TestUtils.injectMockDB();
      const original = EmpleadosRepository.getById(1);
      EmpleadosRepository.update(1, { tarifa: 50 });
      const updated  = EmpleadosRepository.getById(1);
      expect(updated.nombre).toBe(original.nombre);
      expect(updated.telefono).toBe(original.telefono);
    });
  });

  describe('EmpleadosRepository — delete()', () => {

    it('debería eliminar empleado correctamente', () => {
      TestUtils.injectMockDB();
      EmpleadosRepository.delete(2);
      expect(EmpleadosRepository.getById(2)).toBeNull();
      expect(EmpleadosRepository.getAll()).toHaveLength(1);
    });

    it('eliminar ID inexistente no debería lanzar error', () => {
      let threw = false;
      try { EmpleadosRepository.delete(9999); }
      catch(e) { threw = true; }
      expect(threw).toBe(false);
    });
  });

  // ── SERVICE ───────────────────────────────────────────────

  describe('EmpleadosService — create()', () => {

    it('debería crear con datos válidos', () => {
      TestUtils.injectMockDB();
      const result = EmpleadosService.create({
        nombre: 'Rosa Supervisora', puesto: 'Supervisor',
        tarifa: 48, telefono: '(626) 888-8888',
      });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Rosa Supervisora');
    });

    it('debería rechazar nombre vacío', () => {
      const result = EmpleadosService.create({ nombre: '', tarifa: 30 });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('debería rechazar tarifa no numérica', () => {
      const result = EmpleadosService.create({ nombre: 'Test', tarifa: 'abc' });
      expect(result.success).toBe(false);
    });

    it('debería rechazar tarifa ausente', () => {
      const result = EmpleadosService.create({ nombre: 'Test' });
      expect(result.success).toBe(false);
    });

    it('debería sanitizar espacios del nombre', () => {
      TestUtils.injectMockDB();
      const result = EmpleadosService.create({ nombre: '  Pedro García  ', tarifa: 28 });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Pedro García');
    });

    it('licencia vacía debería quedar como "—"', () => {
      TestUtils.injectMockDB();
      const result = EmpleadosService.create({ nombre: 'Test', tarifa: 25, licencia: '' });
      expect(result.data.licencia).toBe('—');
    });
  });

  describe('EmpleadosService — update()', () => {

    it('debería actualizar empleado existente', () => {
      TestUtils.injectMockDB();
      const result = EmpleadosService.update(1, { nombre: 'Carlos Senior', tarifa: 50 });
      expect(result.success).toBe(true);
      expect(result.data.tarifa).toBe(50);
    });

    it('debería rechazar actualización con nombre vacío', () => {
      const result = EmpleadosService.update(1, { nombre: '', tarifa: 30 });
      expect(result.success).toBe(false);
    });

    it('debería retornar error para ID inexistente', () => {
      const result = EmpleadosService.update(9999, { nombre: 'X', tarifa: 30 });
      expect(result.success).toBe(false);
    });
  });

  describe('EmpleadosService — delete()', () => {

    it('debería eliminar correctamente', () => {
      TestUtils.injectMockDB();
      const result = EmpleadosService.delete(2);
      expect(result.success).toBe(true);
      expect(EmpleadosRepository.getById(2)).toBeNull();
    });
  });

  describe('EmpleadosService — list()', () => {

    it('debería retornar todos los empleados', () => {
      TestUtils.injectMockDB();
      const list = EmpleadosService.list();
      expect(list).toHaveLength(2);
    });
  });

  TestUtils.injectMockDB();
}
