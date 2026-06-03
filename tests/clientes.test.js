// ============================================================
// PaintPro CA — Tests: Clientes
// Covers: Repository, Service (CRUD + validaciones + búsqueda)
// ============================================================

function runClientesTests() {
  TestUtils.injectMockDB();

  // ── REPOSITORY ────────────────────────────────────────────

  describe('ClientesRepository — getAll()', () => {

    it('debería retornar todos los clientes', () => {
      const list = ClientesRepository.getAll();
      expect(list).toHaveLength(3);
    });

    it('debería filtrar por nombre (búsqueda)', () => {
      const list = ClientesRepository.getAll('Juan');
      expect(list).toHaveLength(1);
      expect(list[0].nombre).toBe('Juan López');
    });

    it('debería filtrar por empresa', () => {
      const list = ClientesRepository.getAll('Smith LLC');
      expect(list).toHaveLength(1);
    });

    it('debería filtrar por email', () => {
      const list = ClientesRepository.getAll('ana@test.com');
      expect(list).toHaveLength(1);
      expect(list[0].nombre).toBe('Ana Martínez');
    });

    it('debería filtrar por ciudad', () => {
      const list = ClientesRepository.getAll('Pasadena');
      expect(list).toHaveLength(1);
    });

    it('debería retornar lista vacía si no hay coincidencias', () => {
      const list = ClientesRepository.getAll('xyzNoExiste');
      expect(list).toHaveLength(0);
    });

    it('búsqueda vacía debería retornar todos', () => {
      const list = ClientesRepository.getAll('');
      expect(list).toHaveLength(3);
    });
  });

  describe('ClientesRepository — getById()', () => {

    it('debería retornar cliente existente', () => {
      const c = ClientesRepository.getById(1);
      expect(c).toBeTruthy();
      expect(c.nombre).toBe('Juan López');
    });

    it('debería retornar null para ID inexistente', () => {
      const c = ClientesRepository.getById(9999);
      expect(c).toBeNull();
    });
  });

  describe('ClientesRepository — create()', () => {

    it('debería crear un cliente y asignar ID autoincremental', () => {
      const antes = ClientesRepository.getAll().length;
      const nuevo = ClientesRepository.create({
        nombre: 'Nuevo Cliente', empresa: 'NC Corp',
        ciudad: 'Glendale', telefono: '(818) 777-7777',
        email: 'nuevo@test.com', dir: '100 Test Blvd', zip: '91201', notas: '',
      });
      expect(nuevo.id).toBeGreaterThan(0);
      expect(ClientesRepository.getAll()).toHaveLength(antes + 1);
    });

    it('ID nuevo debe ser mayor que el último', () => {
      const list  = ClientesRepository.getAll();
      const maxId = Math.max(...list.map(c => c.id));
      const nuevo = ClientesRepository.create({ nombre: 'Test', empresa: '—', ciudad: 'LA', telefono: '', email: '', dir: '', zip: '', notas: '' });
      expect(nuevo.id).toBeGreaterThan(maxId);
    });
  });

  describe('ClientesRepository — update()', () => {

    it('debería actualizar campos del cliente', () => {
      ClientesRepository.update(1, { nombre: 'Juan Actualizado', ciudad: 'Santa Monica' });
      const updated = ClientesRepository.getById(1);
      expect(updated.nombre).toBe('Juan Actualizado');
      expect(updated.ciudad).toBe('Santa Monica');
    });

    it('debería retornar null para ID inexistente', () => {
      const result = ClientesRepository.update(9999, { nombre: 'X' });
      expect(result).toBeNull();
    });

    it('no debería modificar campos no enviados', () => {
      const original = ClientesRepository.getById(2);
      ClientesRepository.update(2, { ciudad: 'Burbank' });
      const updated  = ClientesRepository.getById(2);
      expect(updated.email).toBe(original.email);
      expect(updated.telefono).toBe(original.telefono);
    });
  });

  describe('ClientesRepository — delete()', () => {

    it('debería eliminar el cliente', () => {
      TestUtils.injectMockDB();
      ClientesRepository.delete(3);
      expect(ClientesRepository.getById(3)).toBeNull();
    });

    it('debería eliminar proyectos asociados', () => {
      TestUtils.injectMockDB();
      ClientesRepository.delete(3);
      const proyectos = AppDB.data.proyectos.filter(p => p.clienteId === 3);
      expect(proyectos).toHaveLength(0);
    });

    it('debería eliminar presupuestos asociados', () => {
      TestUtils.injectMockDB();
      ClientesRepository.delete(3);
      const presupuestos = AppDB.data.presupuestos.filter(p => p.clienteId === 3);
      expect(presupuestos).toHaveLength(0);
    });
  });

  describe('ClientesRepository — countProjects()', () => {

    it('debería contar proyectos por cliente', () => {
      TestUtils.injectMockDB();
      expect(ClientesRepository.countProjects(1)).toBe(1);
      expect(ClientesRepository.countProjects(2)).toBe(1);
    });

    it('debería retornar 0 para cliente sin proyectos', () => {
      expect(ClientesRepository.countProjects(9999)).toBe(0);
    });
  });

  // ── SERVICE ───────────────────────────────────────────────

  describe('ClientesService — create()', () => {

    it('debería crear cliente con datos válidos', () => {
      TestUtils.injectMockDB();
      const result = ClientesService.create({
        nombre: 'Cliente Válido', ciudad: 'LA',
        telefono: '(555) 000-1111', email: 'valido@test.com',
      });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Cliente Válido');
    });

    it('debería rechazar nombre vacío', () => {
      const result = ClientesService.create({ nombre: '' });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('debería rechazar nombre de 1 carácter', () => {
      const result = ClientesService.create({ nombre: 'A' });
      expect(result.success).toBe(false);
    });

    it('debería sanitizar espacios en blanco del nombre', () => {
      TestUtils.injectMockDB();
      const result = ClientesService.create({ nombre: '  Maria Lopez  ' });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Maria Lopez');
    });

    it('empresa vacía debería quedar como "—"', () => {
      TestUtils.injectMockDB();
      const result = ClientesService.create({ nombre: 'Test Cliente', empresa: '' });
      expect(result.data.empresa).toBe('—');
    });
  });

  describe('ClientesService — update()', () => {

    it('debería actualizar cliente existente', () => {
      TestUtils.injectMockDB();
      const result = ClientesService.update(1, { nombre: 'Juan Modificado', ciudad: 'Venice' });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Juan Modificado');
    });

    it('debería rechazar nombre inválido en actualización', () => {
      const result = ClientesService.update(1, { nombre: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('ClientesService — delete()', () => {

    it('debería eliminar cliente y retornar success', () => {
      TestUtils.injectMockDB();
      const result = ClientesService.delete(1);
      expect(result.success).toBe(true);
      expect(ClientesRepository.getById(1)).toBeNull();
    });
  });

  TestUtils.injectMockDB();
}
