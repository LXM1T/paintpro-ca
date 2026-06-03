// ============================================================
// PaintPro CA — Presupuestos: Calculator (California 2026)
// ============================================================

const SQFT_PER_HOUR = {
  interior_res: 70,
  exterior_res: 55,
  interior_com: 80,
  exterior_com: 60,
  industrial:   90,
  gabinetes:    15,
  techo:        65,
  drywall:      40,
};

const SQFT_PER_GALLON = 350;
const PREP_FACTOR     = { minimal: 1.0, medium: 1.2, heavy: 1.5 };

const PAINT_PRICES = {
  standard:       () => window.AppDB.data.config.paintStd   || 38,
  premium:        () => window.AppDB.data.config.paintPrem  || 62,
  luxury:         () => 68,
  exterior_grade: () => 55,
  industrial:     () => 85,
};

window.PresupuestosCalculator = {

  calculate({ jobType, paintType, prepLevel = 'medium', areaSqft, numCoats = 2, numDays = 1, marginPercent }) {
    if (!areaSqft || areaSqft <= 0) return { areaM2:0, gallons:0, laborHours:0, laborCost:0, paintCost:0, otherMat:0, totalMat:0, indirectCost:0, taxAmount:0, profitAmount:0, subtotal:0, total:0 };
    const cfg        = window.AppDB.data.config;
    const laborRate  = cfg.labor || 32;
    const taxRate    = (cfg.tax  || 10.25) / 100;
    const overhead   = (cfg.overhead || 15) / 100;
    const margin     = (marginPercent ?? cfg.margen ?? 35) / 100;

    const areaM2        = areaSqft * 0.0929;
    const sqftPerHr     = SQFT_PER_HOUR[jobType] || 70;
    const prep          = PREP_FACTOR[prepLevel] || 1.2;
    const laborHours    = (areaSqft * numCoats * prep) / sqftPerHr;
    const laborCost     = laborHours * laborRate;
    const gallons       = Math.ceil((areaSqft * numCoats) / SQFT_PER_GALLON);
    const paintPrice    = (PAINT_PRICES[paintType] || PAINT_PRICES.standard)();
    const paintCost     = gallons * paintPrice;
    const otherMat      = areaSqft * 0.08 + numDays * (cfg.fuel || 45);
    const totalMat      = paintCost + otherMat;
    const indirectCost  = (laborCost + totalMat) * overhead;
    const base          = laborCost + totalMat + indirectCost;
    const taxAmount     = totalMat * taxRate;
    const profitAmount  = base * margin;
    const subtotal      = base + taxAmount;
    const total         = subtotal + profitAmount;

    return {
      areaM2:         parseFloat(areaM2.toFixed(2)),
      gallons,
      laborHours:     parseFloat(laborHours.toFixed(1)),
      laborCost:      this._r(laborCost),
      paintCost:      this._r(paintCost),
      otherMat:       this._r(otherMat),
      totalMat:       this._r(totalMat),
      indirectCost:   this._r(indirectCost),
      taxAmount:      this._r(taxAmount),
      profitAmount:   this._r(profitAmount),
      subtotal:       this._r(subtotal),
      total:          this._r(total),
    };
  },

  _r(n) { return Math.round(n * 100) / 100; },
};
