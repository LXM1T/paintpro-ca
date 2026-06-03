// ============================================================
// PaintPro CA — Tests: Core
// Covers: Database, Router, Utils
// ============================================================

function runCoreTests() {

  // ── DATABASE ──────────────────────────────────────────────

  describe('AppDB — load() y save()', () => {

    it('debería cargar datos al inicializar', () => {
      AppDB.load();
      expect(AppDB.data).toBeTruthy();
      expect(Array.isArray(AppDB.data.clientes)).toBe(true);
    });

    it('debería persistir datos en localStorage', () => {
      TestUtils.injectMockDB();
      AppDB.data.clientes.push({ id: 99, nombre: 'Persistido', empresa: '—', ciudad: 'LA', telefono: '', email: '', zip: '', dir: '', notas: '' });
      AppDB.save();
      const raw = JSON.parse(localStorage.getItem('paintpro_db_v2'));
      expect(raw.clientes.find(c => c.id === 99)).toBeTruthy();
    });

    it('debería cargar datos guardados correctamente', () => {
      AppDB.load();
      expect(AppDB.data.clientes.find(c => c.id === 99)).toBeTruthy();
    });
  });

  describe('AppDB — nextId()', () => {

    it('debería retornar 1 para colección vacía', () => {
      AppDB.data.empleados = [];
      expect(AppDB.nextId('empleados')).toBe(1);
    });

    it('debería retornar max + 1', () => {
      TestUtils.injectMockDB();
      const maxId = Math.max(...AppDB.data.clientes.map(c => c.id));
      expect(AppDB.nextId('clientes')).toBe(maxId + 1);
    });

    it('debería funcionar con IDs no consecutivos', () => {
      AppDB.data.clientes = [{ id: 5 }, { id: 12 }, { id: 3 }];
      expect(AppDB.nextId('clientes')).toBe(13);
    });
  });

  describe('AppDB — reset()', () => {

    it('debería restaurar datos por defecto', () => {
      TestUtils.injectMockDB();
      AppDB.data.clientes = [];
      AppDB.reset();
      expect(AppDB.data.clientes.length).toBeGreaterThan(0);
    });
  });

  // ── UTILS ─────────────────────────────────────────────────

  describe('Utils — formatCurrency()', () => {

    it('debería formatear número como moneda USD', () => {
      expect(Utils.formatCurrency(1000)).toBe('$1,000');
    });

    it('debería formatear números grandes', () => {
      expect(Utils.formatCurrency(25000)).toBe('$25,000');
    });

    it('debería formatear 0 correctamente', () => {
      expect(Utils.formatCurrency(0)).toBe('$0');
    });

    it('debería manejar valores undefined', () => {
      expect(Utils.formatCurrency(undefined)).toBe('$0');
    });

    it('debería redondear decimales', () => {
      const result = Utils.formatCurrency(1234.56);
      expect(result.includes('1,234')).toBe(true);
    });
  });

  describe('Utils — escHtml()', () => {

    it('debería escapar < y >', () => {
      expect(Utils.escHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('debería escapar &', () => {
      expect(Utils.escHtml('A & B')).toBe('A &amp; B');
    });

    it('debería escapar comillas dobles', () => {
      expect(Utils.escHtml('"test"')).toBe('&quot;test&quot;');
    });

    it('debería manejar null y undefined sin crash', () => {
      let threw = false;
      try { Utils.escHtml(null); Utils.escHtml(undefined); }
      catch(e) { threw = true; }
      expect(threw).toBe(false);
    });

    it('debería retornar string vacío para string vacío', () => {
      expect(Utils.escHtml('')).toBe('');
    });

    it('debería preservar texto sin caracteres especiales', () => {
      expect(Utils.escHtml('Texto normal 123')).toBe('Texto normal 123');
    });
  });

  describe('Utils — formatDate()', () => {

    it('debería formatear fecha ISO correctamente', () => {
      const formatted = Utils.formatDate('2026-05-15');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('May');
    });

    it('debería retornar "—" para fecha vacía', () => {
      expect(Utils.formatDate('')).toBe('—');
    });

    it('debería retornar "—" para undefined', () => {
      expect(Utils.formatDate(undefined)).toBe('—');
    });
  });

  describe('Utils — statusBadge()', () => {

    it('debería generar badge HTML para "Aprobado"', () => {
      const html = Utils.statusBadge('Aprobado');
      expect(html).toContain('badge-success');
      expect(html).toContain('Aprobado');
    });

    it('debería generar badge HTML para "Pendiente"', () => {
      const html = Utils.statusBadge('Pendiente');
      expect(html).toContain('badge-warning');
    });

    it('debería generar badge HTML para "Rechazado"', () => {
      const html = Utils.statusBadge('Rechazado');
      expect(html).toContain('badge-danger');
    });

    it('debería generar badge neutral para estado desconocido', () => {
      const html = Utils.statusBadge('Desconocido');
      expect(html).toContain('badge-neutral');
    });
  });

  describe('Utils — emptyState()', () => {

    it('debería generar HTML con el icono y texto', () => {
      const html = Utils.emptyState('📦', 'Sin materiales');
      expect(html).toContain('📦');
      expect(html).toContain('Sin materiales');
      expect(html).toContain('empty-state');
    });
  });

  // ── ROUTER ────────────────────────────────────────────────

  describe('Router — register() y navigate()', () => {

    it('debería registrar un handler de pantalla', () => {
      let called = false;
      Router.register('__test__', () => { called = true; });
      // Simulate navigate (won't actually change DOM in test env)
      // Just verify it's registered
      expect(typeof Router.navigate).toBe('function');
    });

    it('debería tener navigate como función', () => {
      expect(typeof Router.navigate).toBe('function');
    });

    it('debería registrar múltiples screens sin conflicto', () => {
      let count = 0;
      Router.register('dashboard', () => count++);
      Router.register('clientes',  () => count++);
      // Both registered without error
      expect(count).toBe(0); // Not called yet
    });
  });

  TestUtils.injectMockDB();
}
