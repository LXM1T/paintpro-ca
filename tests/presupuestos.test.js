// ============================================================
// PaintPro CA — Tests: Presupuestos
// Covers: Calculator (CA 2026), Repository, Service
// ============================================================

function runPresupuestosTests() {
  TestUtils.injectMockDB();

  // ── CALCULATOR ────────────────────────────────────────────

  describe('PresupuestosCalculator — calculate() — valores base', () => {

    const baseInput = {
      jobType: 'interior_res', paintType: 'standard',
      prepLevel: 'medium', areaSqft: 1000,
      numCoats: 2, numDays: 1, marginPercent: 35,
    };

    it('debería retornar resultado con total > 0', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      expect(r.total).toBeGreaterThan(0);
    });

    it('debería convertir sqft a m² correctamente', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      // 1000 sqft = 92.9 m²
      expect(r.areaM2).toBeGreaterThan(90);
      expect(r.areaM2).toBeLessThan(96);
    });

    it('debería calcular galones necesarios', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      // 1000 sqft × 2 capas / 350 sqft/gal = ~6 galones
      expect(r.gallons).toBeGreaterThan(4);
      expect(r.gallons).toBeLessThan(10);
    });

    it('debería calcular horas de labor > 0', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      expect(r.laborHours).toBeGreaterThan(0);
    });

    it('costo de labor debe ser horas × tarifa', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      const cfg = AppDB.data.config;
      expect(r.laborCost).toBeGreaterThanOrEqual(r.laborHours * cfg.labor * 0.95);
    });

    it('total debe ser mayor que subtotal', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      expect(r.total).toBeGreaterThanOrEqual(r.subtotal);
    });

    it('indirect cost debe ser > 0', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      expect(r.indirectCost).toBeGreaterThan(0);
    });

    it('impuesto CA debe ser > 0', () => {
      const r = PresupuestosCalculator.calculate(baseInput);
      expect(r.taxAmount).toBeGreaterThan(0);
    });
  });

  describe('PresupuestosCalculator — tipos de trabajo', () => {

    it('industrial debería tener menos horas por sqft que gabinetes', () => {
      const industrial = PresupuestosCalculator.calculate({ jobType:'industrial',  paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      const gabinetes  = PresupuestosCalculator.calculate({ jobType:'gabinetes',   paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      // Gabinetes toma más horas por sqft (más detalle)
      expect(gabinetes.laborHours).toBeGreaterThan(industrial.laborHours);
    });

    it('pintura premium debería costar más que estándar', () => {
      const std  = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      const prem = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'premium',  prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      expect(prem.paintCost).toBeGreaterThan(std.paintCost);
      expect(prem.total).toBeGreaterThan(std.total);
    });

    it('3 capas debería costar más que 2 capas', () => {
      const dos  = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      const tres = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:3, numDays:1, marginPercent:35 });
      expect(tres.total).toBeGreaterThan(dos.total);
      expect(tres.gallons).toBeGreaterThan(dos.gallons);
    });

    it('preparación extensa debería costar más que mínima', () => {
      const minimal = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'minimal', areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      const heavy   = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'heavy',   areaSqft:1000, numCoats:2, numDays:1, marginPercent:35 });
      expect(heavy.laborCost).toBeGreaterThan(minimal.laborCost);
    });

    it('mayor margen debería incrementar el total', () => {
      const m25 = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:25 });
      const m40 = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:1000, numCoats:2, numDays:1, marginPercent:40 });
      expect(m40.total).toBeGreaterThan(m25.total);
    });

    it('área 0 debería retornar total 0', () => {
      const r = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'medium', areaSqft:0, numCoats:2, numDays:1, marginPercent:35 });
      expect(r.total).toBe(0);
    });

    it('el total nunca debe ser negativo', () => {
      const r = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'minimal', areaSqft:100, numCoats:1, numDays:1, marginPercent:0 });
      expect(r.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PresupuestosCalculator — escala lineal', () => {

    it('doble de área debería producir aprox. doble de costo de materiales', () => {
      const r1 = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'minimal', areaSqft:500,  numCoats:2, numDays:1, marginPercent:0 });
      const r2 = PresupuestosCalculator.calculate({ jobType:'interior_res', paintType:'standard', prepLevel:'minimal', areaSqft:1000, numCoats:2, numDays:1, marginPercent:0 });
      const ratio = r2.paintCost / r1.paintCost;
      expect(ratio).toBeGreaterThan(1.8);
      expect(ratio).toBeLessThan(2.2);
    });
  });

  // ── REPOSITORY ────────────────────────────────────────────

  describe('PresupuestosRepository — getAll()', () => {

    it('debería retornar todos los presupuestos', () => {
      TestUtils.injectMockDB();
      expect(PresupuestosRepository.getAll()).toHaveLength(3);
    });
  });

  describe('PresupuestosRepository — getById()', () => {

    it('debería retornar presupuesto existente', () => {
      const p = PresupuestosRepository.getById(1);
      expect(p.num).toBe('EST-2026-001');
    });

    it('debería retornar null para ID inexistente', () => {
      expect(PresupuestosRepository.getById(9999)).toBeNull();
    });
  });

  describe('PresupuestosRepository — generateNumber()', () => {

    it('debería generar número con formato EST-YYYY-NNN', () => {
      const num = PresupuestosRepository.generateNumber();
      expect(/^EST-\d{4}-\d{3}$/.test(num)).toBe(true);
    });

    it('debería incrementar secuencialmente', () => {
      TestUtils.injectMockDB();
      const n1 = PresupuestosRepository.generateNumber();
      PresupuestosRepository.create({ num: n1, clienteId:1, proyecto:'X', fecha:'2026-01-01', sqft:100, tipo:'interior_res', capas:2, pintura:'standard', margen:35, total:500, estado:'Propuesta', notas:'' });
      const n2 = PresupuestosRepository.generateNumber();
      const seq1 = parseInt(n1.split('-')[2]);
      const seq2 = parseInt(n2.split('-')[2]);
      expect(seq2).toBeGreaterThan(seq1);
    });
  });

  describe('PresupuestosRepository — delete()', () => {

    it('debería eliminar presupuesto', () => {
      TestUtils.injectMockDB();
      PresupuestosRepository.delete(1);
      expect(PresupuestosRepository.getById(1)).toBeNull();
      expect(PresupuestosRepository.getAll()).toHaveLength(2);
    });
  });

  // ── SERVICE ───────────────────────────────────────────────

  describe('PresupuestosService — create()', () => {

    it('debería crear presupuesto con datos válidos', () => {
      TestUtils.injectMockDB();
      const result = PresupuestosService.create({
        num: 'EST-2026-099', clienteId: 1,
        proyecto: 'Interior Test', fecha: '2026-06-01',
        sqft: 800, tipo: 'interior_res', capas: 2,
        pintura: 'standard', margen: 35, estado: 'Propuesta', notas: '',
      });
      expect(result.success).toBe(true);
      expect(result.data.num).toBe('EST-2026-099');
    });

    it('debería rechazar sin número', () => {
      const result = PresupuestosService.create({ num: '', clienteId: 1, proyecto: 'X' });
      expect(result.success).toBe(false);
    });

    it('debería rechazar sin descripción de proyecto', () => {
      const result = PresupuestosService.create({ num: 'EST-001', clienteId: 1, proyecto: '' });
      expect(result.success).toBe(false);
    });

    it('debería rechazar sin clienteId', () => {
      const result = PresupuestosService.create({ num: 'EST-001', proyecto: 'X' });
      expect(result.success).toBe(false);
    });
  });

  describe('PresupuestosService — delete()', () => {

    it('debería eliminar y retornar success', () => {
      TestUtils.injectMockDB();
      const result = PresupuestosService.delete(1);
      expect(result.success).toBe(true);
    });
  });

  TestUtils.injectMockDB();
}
