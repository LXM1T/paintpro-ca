// ============================================================
// PaintPro CA — Tests: Inventario
// Covers: Repository, Service (CRUD + alertas de stock)
// ============================================================

function runInventarioTests() {
  TestUtils.injectMockDB();

  // ── REPOSITORY ────────────────────────────────────────────

  describe('InventarioRepository — getAll()', () => {

    it('debería retornar todos los productos', () => {
      const list = InventarioRepository.getAll();
      expect(list).toHaveLength(4);
    });
  });

  describe('InventarioRepository — getById()', () => {

    it('debería retornar producto existente', () => {
      const item = InventarioRepository.getById(1);
      expect(item).toBeTruthy();
      expect(item.nombre).toBe('Pintura Premium');
    });

    it('debería retornar null para ID inexistente', () => {
      expect(InventarioRepository.getById(9999)).toBeNull();
    });
  });

  describe('InventarioRepository — create()', () => {

    it('debería crear producto con ID autoincremental', () => {
      TestUtils.injectMockDB();
      const item = InventarioRepository.create({
        nombre: 'Nuevo Material', cat: 'Suministro',
        unidad: 'Pieza', precio: 12, stock: 25, min: 10,
      });
      expect(item.id).toBeGreaterThan(0);
      expect(InventarioRepository.getAll()).toHaveLength(5);
    });
  });

  describe('InventarioRepository — update()', () => {

    it('debería actualizar precio y stock', () => {
      TestUtils.injectMockDB();
      InventarioRepository.update(1, { precio: 75, stock: 30 });
      const updated = InventarioRepository.getById(1);
      expect(updated.precio).toBe(75);
      expect(updated.stock).toBe(30);
    });

    it('debería retornar null para ID inexistente', () => {
      expect(InventarioRepository.update(9999, { precio: 10 })).toBeNull();
    });

    it('no debería modificar campos no enviados', () => {
      TestUtils.injectMockDB();
      const original = InventarioRepository.getById(1);
      InventarioRepository.update(1, { stock: 50 });
      const updated  = InventarioRepository.getById(1);
      expect(updated.nombre).toBe(original.nombre);
      expect(updated.cat).toBe(original.cat);
    });
  });

  describe('InventarioRepository — delete()', () => {

    it('debería eliminar el producto', () => {
      TestUtils.injectMockDB();
      InventarioRepository.delete(4);
      expect(InventarioRepository.getById(4)).toBeNull();
      expect(InventarioRepository.getAll()).toHaveLength(3);
    });
  });

  describe('InventarioRepository — updateStock()', () => {

    it('debería actualizar solo el stock', () => {
      TestUtils.injectMockDB();
      InventarioRepository.updateStock(1, 99);
      expect(InventarioRepository.getById(1).stock).toBe(99);
    });

    it('debería convertir string a número', () => {
      TestUtils.injectMockDB();
      InventarioRepository.updateStock(1, '15');
      expect(InventarioRepository.getById(1).stock).toBe(15);
    });

    it('stock 0 debería ser válido', () => {
      TestUtils.injectMockDB();
      InventarioRepository.updateStock(1, 0);
      expect(InventarioRepository.getById(1).stock).toBe(0);
    });
  });

  // ── SERVICE ───────────────────────────────────────────────

  describe('InventarioService — getLowStock()', () => {

    it('debería detectar productos con stock bajo el mínimo', () => {
      TestUtils.injectMockDB();
      const low = InventarioService.getLowStock();
      // Rodillo 9" tiene stock 5 < min 10, Primer tiene stock 0 < min 8
      expect(low.length).toBeGreaterThanOrEqual(2);
    });

    it('todos los productos en alerta deben tener stock < min', () => {
      const low = InventarioService.getLowStock();
      low.forEach(item => {
        expect(item.stock).toBeLessThan(item.min);
      });
    });

    it('debería retornar vacío si todos tienen stock suficiente', () => {
      TestUtils.injectMockDB();
      // Set all stocks above minimum
      AppDB.data.inventario.forEach(i => { i.stock = i.min + 10; });
      const low = InventarioService.getLowStock();
      expect(low).toHaveLength(0);
    });
  });

  describe('InventarioService — getTotalValue()', () => {

    it('debería calcular valor total del inventario', () => {
      TestUtils.injectMockDB();
      const val = InventarioService.getTotalValue();
      // 62×20 + 8×5 + 5×30 + 28×0 = 1240 + 40 + 150 + 0 = 1430
      expect(val).toBe(1430);
    });

    it('debería retornar 0 si no hay inventario', () => {
      AppDB.data.inventario = [];
      const val = InventarioService.getTotalValue();
      expect(val).toBe(0);
      TestUtils.injectMockDB();
    });

    it('debería retornar número positivo', () => {
      TestUtils.injectMockDB();
      expect(InventarioService.getTotalValue()).toBeGreaterThan(0);
    });
  });

  describe('InventarioService — create()', () => {

    it('debería crear producto con datos válidos', () => {
      TestUtils.injectMockDB();
      const result = InventarioService.create({
        nombre: 'Brocha 2"', cat: 'Herramienta',
        unidad: 'Pieza', precio: 12, stock: 15, min: 8,
      });
      expect(result.success).toBe(true);
      expect(result.data.nombre).toBe('Brocha 2"');
    });

    it('debería rechazar nombre vacío', () => {
      const result = InventarioService.create({ nombre: '', precio: 10 });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('debería parsear precio como número', () => {
      TestUtils.injectMockDB();
      const result = InventarioService.create({ nombre: 'Test', precio: '25.50', stock: 10, min: 5 });
      expect(result.success).toBe(true);
      expect(result.data.precio).toBe(25.5);
    });

    it('stock y min deben ser enteros', () => {
      TestUtils.injectMockDB();
      const result = InventarioService.create({ nombre: 'Test', precio: 10, stock: '20', min: '5' });
      expect(result.success).toBe(true);
      expect(typeof result.data.stock).toBe('number');
      expect(typeof result.data.min).toBe('number');
    });
  });

  describe('InventarioService — update()', () => {

    it('debería actualizar producto existente', () => {
      TestUtils.injectMockDB();
      const result = InventarioService.update(1, {
        nombre: 'Pintura Premium XL', precio: 70, stock: 25, min: 12, cat: 'Pintura', unidad: 'Galón',
      });
      expect(result.success).toBe(true);
      expect(result.data.precio).toBe(70);
    });

    it('debería rechazar nombre vacío', () => {
      const result = InventarioService.update(1, { nombre: '' });
      expect(result.success).toBe(false);
    });

    it('debería retornar error para ID inexistente', () => {
      const result = InventarioService.update(9999, { nombre: 'X', precio: 1, stock: 1, min: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('InventarioService — delete()', () => {

    it('debería eliminar producto correctamente', () => {
      TestUtils.injectMockDB();
      const result = InventarioService.delete(4);
      expect(result.success).toBe(true);
      expect(InventarioRepository.getById(4)).toBeNull();
    });
  });

  describe('InventarioService — updateStock()', () => {

    it('debería actualizar stock sin error', () => {
      TestUtils.injectMockDB();
      InventarioService.updateStock(1, 50);
      expect(InventarioRepository.getById(1).stock).toBe(50);
    });
  });

  TestUtils.injectMockDB();
}
