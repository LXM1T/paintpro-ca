// ============================================================
// PaintPro CA — Test Runner & Shared Utilities
// Lightweight vanilla JS test framework (no dependencies)
// ============================================================

window.TestRunner = {
  results: [],
  _currentSuite: '',

  // ── Suite ─────────────────────────────────────────────────
  describe(suiteName, fn) {
    this._currentSuite = suiteName;
    console.group(`📋 ${suiteName}`);
    fn();
    console.groupEnd();
  },

  // ── Test ──────────────────────────────────────────────────
  it(testName, fn) {
    const result = { suite: this._currentSuite, name: testName, passed: false, error: null };
    try {
      fn();
      result.passed = true;
      console.log(`  ✅ ${testName}`);
    } catch (err) {
      result.error = err.message;
      console.error(`  ❌ ${testName}\n     → ${err.message}`);
    }
    this.results.push(result);
  },

  // ── Assertions ────────────────────────────────────────────
  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected)
          throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      },
      toEqual(expected) {
        const a = JSON.stringify(actual);
        const b = JSON.stringify(expected);
        if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
      },
      toBeTruthy() {
        if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
      },
      toBeFalsy() {
        if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
      },
      toBeGreaterThan(n) {
        if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
      },
      toBeLessThan(n) {
        if (!(actual < n)) throw new Error(`Expected ${actual} < ${n}`);
      },
      toBeGreaterThanOrEqual(n) {
        if (!(actual >= n)) throw new Error(`Expected ${actual} >= ${n}`);
      },
      toContain(item) {
        if (!actual.includes(item))
          throw new Error(`Expected array/string to contain ${JSON.stringify(item)}`);
      },
      toHaveLength(n) {
        if (actual.length !== n)
          throw new Error(`Expected length ${n}, got ${actual.length}`);
      },
      toBeNull() {
        if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      },
      toBeUndefined() {
        if (actual !== undefined) throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
      },
      toThrow() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        try { actual(); throw new Error('Function did not throw'); }
        catch (e) { if (e.message === 'Function did not throw') throw e; }
      },
      toMatchObject(expected) {
        for (const [k, v] of Object.entries(expected)) {
          if (JSON.stringify(actual[k]) !== JSON.stringify(v))
            throw new Error(`Key "${k}": expected ${JSON.stringify(v)}, got ${JSON.stringify(actual[k])}`);
        }
      },
    };
  },

  // ── Summary ───────────────────────────────────────────────
  summary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total  = this.results.length;

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 RESULTADOS: ${passed}/${total} tests pasaron`);
    if (failed > 0) {
      console.warn(`⚠️  ${failed} test(s) fallaron:`);
      this.results.filter(r => !r.passed).forEach(r => {
        console.warn(`   ❌ [${r.suite}] ${r.name}: ${r.error}`);
      });
    } else {
      console.log('🎉 ¡Todos los tests pasaron!');
    }
    console.log('═'.repeat(50));
    return { passed, failed, total };
  },

  reset() {
    this.results = [];
  },
};

// ── Shared mock DB for all tests ──────────────────────────────
window.TestUtils = {
  getMockDB() {
    return {
      users: [
        { id: 1, nombre: 'Admin Test', email: 'admin@test.com', password: 'Test1234', telefono: '(555) 000-0001', puesto: 'Admin', empresa: 'Test Co.' },
      ],
      clientes: [
        { id: 1, nombre: 'Juan López',    empresa: 'López Inc', ciudad: 'Los Angeles', telefono: '(213) 111-1111', email: 'juan@test.com',  zip: '90001', dir: '123 Main St', notas: '' },
        { id: 2, nombre: 'Ana Martínez',  empresa: '—',         ciudad: 'Pasadena',    telefono: '(626) 222-2222', email: 'ana@test.com',   zip: '91101', dir: '456 Oak Ave', notas: 'VIP' },
        { id: 3, nombre: 'Bob Smith',     empresa: 'Smith LLC', ciudad: 'Burbank',     telefono: '(818) 333-3333', email: 'bob@test.com',   zip: '91505', dir: '789 Pine Rd', notas: '' },
      ],
      proyectos: [
        { id: 1, clienteId: 1, nombre: 'Interior Test',  tipo: 'Residencial', subtipo: 'Interior',  dir: '123 Main', estado: 'activo',     finicio: '2026-05-01', ffin: '2026-05-15', valor: 3000 },
        { id: 2, clienteId: 2, nombre: 'Exterior Test',  tipo: 'Comercial',   subtipo: 'Exterior',  dir: '456 Oak',  estado: 'pendiente',  finicio: '2026-06-01', ffin: '2026-06-20', valor: 8000 },
        { id: 3, clienteId: 3, nombre: 'Completed Test', tipo: 'Industrial',  subtipo: 'Interior',  dir: '789 Pine', estado: 'completado', finicio: '2026-04-01', ffin: '2026-04-30', valor: 15000 },
      ],
      presupuestos: [
        { id: 1, num: 'EST-2026-001', clienteId: 1, proyecto: 'Interior Res.',  fecha: '2026-05-01', sqft: 1200, tipo: 'interior_res', capas: 2, pintura: 'standard', margen: 35, total: 2800,  estado: 'Aprobado',  notas: '' },
        { id: 2, num: 'EST-2026-002', clienteId: 2, proyecto: 'Comercial Ext.', fecha: '2026-05-10', sqft: 5000, tipo: 'exterior_com', capas: 2, pintura: 'premium',  margen: 30, total: 9500,  estado: 'Pendiente', notas: 'Incluir andamios' },
        { id: 3, num: 'EST-2026-003', clienteId: 3, proyecto: 'Industrial Int.', fecha: '2026-05-15', sqft: 8000, tipo: 'industrial',  capas: 2, pintura: 'industrial',margen: 25, total: 14000, estado: 'Propuesta', notas: '' },
      ],
      inventario: [
        { id: 1, nombre: 'Pintura Premium',  cat: 'Pintura',     unidad: 'Galón', precio: 62, stock: 20, min: 10 },
        { id: 2, nombre: 'Rodillo 9"',       cat: 'Herramienta', unidad: 'Pieza', precio: 8,  stock: 5,  min: 10 },  // stock bajo
        { id: 3, nombre: 'Masking Tape 3M',  cat: 'Suministro',  unidad: 'Rollo', precio: 5,  stock: 30, min: 15 },
        { id: 4, nombre: 'Primer Zinsser',   cat: 'Primer',      unidad: 'Galón', precio: 28, stock: 0,  min: 8  },  // sin stock
      ],
      empleados: [
        { id: 1, nombre: 'Carlos Pintor',  puesto: 'Pintor Senior', tarifa: 45, telefono: '(213) 444-4444', email: 'carlos@test.com', licencia: 'CAC-001', notas: '' },
        { id: 2, nombre: 'Luis Asistente', puesto: 'Asistente',     tarifa: 22, telefono: '(818) 555-5555', email: 'luis@test.com',   licencia: '—',       notas: '' },
      ],
      config: { labor: 32, tax: 10.25, overhead: 15, margen: 35, fuel: 45 },
    };
  },

  // Inject mock DB into AppDB
  injectMockDB() {
    window.AppDB.data = this.getMockDB();
  },

  // Restore real DB after tests
  restoreDB() {
    window.AppDB.load();
  },
};

// Aliases for convenience
const { describe, it, expect } = {
  describe: (...args) => TestRunner.describe(...args),
  it:       (...args) => TestRunner.it(...args),
  expect:   (v)       => TestRunner.expect(v),
};
window.describe = describe;
window.it       = it;
window.expect   = expect;
