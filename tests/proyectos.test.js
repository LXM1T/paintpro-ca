// ============================================================
// PaintPro CA — Tests: Proyectos
// Covers: Repository, Service (CRUD + estados + validaciones)
// ============================================================

function runProyectosTests() {
  TestUtils.injectMockDB();

  // ── REPOSITORY ────────────────────────────────────────────

  describe('ProyectosRepository — getAll()', () => {

    it('debería retornar todos los proyectos', () => {
      const list = ProyectosRepository.getAll();
      expect(list).toHaveLength(3);
    });
  });

  describe('ProyectosRepository — getById()', () => {

    it('debería retornar proyecto existente', () => {
      const p = ProyectosRepository.getById(1);
      expect(p).toBeTruthy();
      expect(p.nombre).toBe('Interior Test');
    });

    it('debería retornar null para ID inexistente', () => {
      expect(ProyectosRepository.getById(9999)).toBeNull();
    });
  });

  describe('ProyectosRepository — getByStatus()', () => {

    it('debería filtrar proyectos activos', () => {
      const list = ProyectosRepository.getByStatus('activo');
      expect(list).toHaveLength(1);
      expect(list[0].nombre).toBe('Interior Test');
    });

    it('debería filtrar proyectos pendientes', () => {
      const list = ProyectosRepository.getByStatus('pendiente');
      expect(list).toHaveLength(1);
      expect(list[0].nombre).toBe('Exterior Test');
    });

    it('debería filtrar proyectos completados', () => {
      const list = ProyectosRepository.getByStatus('completado');
      expect(list).toHaveLength(1);
    });

    it('debería retornar vacío para estado inexistente', () => {
      const list = ProyectosRepository.getByStatus('cancelado');
      expect(list).toHaveLength(0);
    });
  });

  describe('ProyectosRepository — create()', () => {

    it('debería crear proyecto con ID autoincremental', () => {
      TestUtils.injectMockDB();
      const p = ProyectosRepository.create({
        clienteId: 1, nombre: 'Nuevo Proyecto', tipo: 'Residencial',
        subtipo: 'Interior', dir: '100 Test', estado: 'pendiente',
        finicio: '2026-07-01', ffin: '2026-07-15', valor: 5000,
      });
      expect(p.id).toBeGreaterThan(0);
      expect(ProyectosRepository.getAll()).toHaveLength(4);
    });
  });

  describe('ProyectosRepository — update()', () => {

    it('debería actualizar estado del proyecto', () => {
      TestUtils.injectMockDB();
      ProyectosRepository.update(1, { estado: 'completado' });
      const p = ProyectosRepository.getById(1);
      expect(p.estado).toBe('completado');
    });

    it('debería actualizar valor estimado', () => {
      TestUtils.injectMockDB();
      ProyectosRepository.update(1, { valor: 9999 });
      expect(ProyectosRepository.getById(1).valor).toBe(9999);
    });

    it('debería retornar null para ID inexistente', () => {
      expect(ProyectosRepository.update(9999, { estado: 'activo' })).toBeNull();
    });
  });

  describe('ProyectosRepository — delete()', () => {

    it('debería eliminar el proyecto', () => {
      TestUtils.injectMockDB();
      ProyectosRepository.delete(3);
      expect(ProyectosRepository.getById(3)).toBeNull();
      expect(ProyectosRepository.getAll()).toHaveLength(2);
    });
  });

  describe('ProyectosRepository — generateNumber()', () => {

    it('debería generar número de proyecto con formato P-YYYY-NNN', () => {
      const num = ProyectosRepository.generateNumber();
      expect(/^P-\d{4}-\d{3}$/.test(num)).toBe(true);
    });

    it('debería incrementar el número con cada llamada', () => {
      TestUtils.injectMockDB();
      const n1 = ProyectosRepository.generateNumber();
      ProyectosRepository.create({ clienteId:1, nombre:'A', tipo:'Residencial', subtipo:'Interior', dir:'', estado:'pendiente', finicio:'', ffin:'', valor:0 });
      const n2 = ProyectosRepository.generateNumber();
      const seq1 = parseInt(n1.split('-')[2]);
      const seq2 = parseInt(n2.split('-')[2]);
      expect(seq2).toBeGreaterThan(seq1);
    });
  });

  // ── SERVICE ───────────────────────────────────────────────

  describe('ProyectosService — create()', () => {

    it('debería crear proyecto con datos válidos', () => {
      TestUtils.injectMockDB();
      const result = ProyectosService.create({
        clienteId: 1, nombre: 'Proyecto Válido',
        tipo: 'Comercial', subtipo: 'Exterior',
        dir: '200 Test Ave', estado: 'pendiente', valor: 12000,
      });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Proyecto Válido');
    });

    it('debería rechazar nombre vacío', () => {
      const result = ProyectosService.create({ nombre: '', clienteId: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('debería rechazar sin clienteId', () => {
      const result = ProyectosService.create({ nombre: 'Sin Cliente' });
      expect(result.success).toBe(false);
    });

    it('debería sanitizar el nombre', () => {
      TestUtils.injectMockDB();
      const result = ProyectosService.create({ clienteId: 1, nombre: '  Proyecto Limpio  ' });
      expect(result.data.nombre).toBe('Proyecto Limpio');
    });

    it('valor 0 debería ser aceptado', () => {
      TestUtils.injectMockDB();
      const result = ProyectosService.create({ clienteId: 1, nombre: 'Sin Valor', valor: 0 });
      expect(result.success).toBe(true);
      expect(result.data.valor).toBe(0);
    });
  });

  describe('ProyectosService — update()', () => {

    it('debería cambiar estado del proyecto', () => {
      TestUtils.injectMockDB();
      const result = ProyectosService.update(1, {
        clienteId: 1, nombre: 'Interior Test', estado: 'completado',
      });
      expect(result.success).toBe(true);
      expect(result.data.estado).toBe('completado');
    });

    it('debería rechazar nombre vacío en actualización', () => {
      const result = ProyectosService.update(1, { nombre: '', clienteId: 1 });
      expect(result.success).toBe(false);
    });

    it('debería retornar error para ID inexistente', () => {
      const result = ProyectosService.update(9999, { nombre: 'X', clienteId: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('ProyectosService — delete()', () => {

    it('debería eliminar y retornar success', () => {
      TestUtils.injectMockDB();
      const result = ProyectosService.delete(2);
      expect(result.success).toBe(true);
    });
  });

  describe('ProyectosService — byStatus()', () => {

    it('debería agrupar proyectos por estado correctamente', () => {
      TestUtils.injectMockDB();
      expect(ProyectosService.byStatus('activo')).toHaveLength(1);
      expect(ProyectosService.byStatus('pendiente')).toHaveLength(1);
      expect(ProyectosService.byStatus('completado')).toHaveLength(1);
    });
  });

  TestUtils.injectMockDB();
}
