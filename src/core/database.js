// ============================================================
// PaintPro CA — Core: Database (localStorage persistence)
// ============================================================

const STORAGE_KEY = 'paintpro_db_v2';

function getDefaultDB() {
  return {
    users: [
      {
        id: 1, nombre: 'Juan Martínez', email: 'admin@paintpro.com',
        password: 'demo2026', telefono: '(323) 555-0100',
        puesto: 'Administrador', empresa: 'LA Premium Painting Co.',
      },
    ],
    clientes: [
      { id:1, nombre:'María Rodríguez', empresa:'—', ciudad:'Los Angeles', telefono:'(213) 555-0121', email:'m.rodriguez@email.com', zip:'90028', dir:'456 Oak Ave', notas:'' },
      { id:2, nombre:'Carlos Vega',     empresa:'—', ciudad:'Pasadena',    telefono:'(626) 555-0187', email:'c.vega@email.com',       zip:'91101', dir:'789 Pine St', notas:'' },
      { id:3, nombre:'Sunset Plaza LLC',empresa:'Sunset Plaza LLC', ciudad:'Beverly Hills', telefono:'(310) 555-0234', email:'ops@sunsetplaza.com', zip:'90210', dir:'1 Sunset Blvd', notas:'Cliente VIP' },
      { id:4, nombre:'Linda Chen',      empresa:'—', ciudad:'Burbank',     telefono:'(818) 555-0456', email:'lchen@email.com',         zip:'91505', dir:'321 Maple Dr', notas:'' },
    ],
    proyectos: [
      { id:1, clienteId:1, nombre:'Interior Rodríguez', tipo:'Residencial', subtipo:'Interior', dir:'456 Oak Ave, LA',              estado:'activo',    finicio:'2026-05-10', ffin:'2026-05-20', valor:4200 },
      { id:2, clienteId:2, nombre:'Interior + Exterior Vega', tipo:'Residencial', subtipo:'Interior + Exterior', dir:'789 Pine St', estado:'activo',    finicio:'2026-05-15', ffin:'2026-06-01', valor:6800 },
      { id:3, clienteId:3, nombre:'Comercial Sunset Plaza',   tipo:'Comercial',   subtipo:'Exterior',           dir:'1 Sunset Blvd', estado:'pendiente', finicio:'2026-06-05', ffin:'2026-06-20', valor:18500 },
      { id:4, clienteId:4, nombre:'Exterior Chen',            tipo:'Residencial', subtipo:'Exterior',           dir:'321 Maple Dr',  estado:'activo',    finicio:'2026-05-18', ffin:'2026-05-25', valor:2900 },
    ],
    presupuestos: [
      { id:1, num:'EST-2026-001', clienteId:1, proyecto:'Interior Residencial', fecha:'2026-05-15', sqft:1800, tipo:'interior_res', capas:2, pintura:'premium',        margen:35, total:4200,  estado:'Aprobado',  notas:'' },
      { id:2, num:'EST-2026-002', clienteId:2, proyecto:'Interior + Exterior',  fecha:'2026-05-20', sqft:2400, tipo:'interior_res', capas:2, pintura:'premium',        margen:35, total:6800,  estado:'Aprobado',  notas:'' },
      { id:3, num:'EST-2026-003', clienteId:3, proyecto:'Comercial Exterior',   fecha:'2026-05-18', sqft:12000,tipo:'exterior_com', capas:2, pintura:'exterior_grade', margen:30, total:18500, estado:'Pendiente', notas:'Incluir andamios' },
      { id:4, num:'EST-2026-004', clienteId:4, proyecto:'Exterior Residencial', fecha:'2026-05-24', sqft:900,  tipo:'exterior_res', capas:2, pintura:'standard',       margen:35, total:2900,  estado:'Aprobado',  notas:'' },
    ],
    inventario: [
      { id:1, nombre:'Sherwin-Williams Duration Ext.', cat:'Pintura',     unidad:'Galón',   precio:72, stock:18, min:10 },
      { id:2, nombre:'Benjamin Moore Regal Select',   cat:'Pintura',     unidad:'Galón',   precio:68, stock:24, min:10 },
      { id:3, nombre:'Behr Premium Plus Interior',    cat:'Pintura',     unidad:'Galón',   precio:38, stock:36, min:15 },
      { id:4, nombre:'Zinsser Bulls Eye Primer',      cat:'Primer',      unidad:'Galón',   precio:28, stock:8,  min:12 },
      { id:5, nombre:'Rodillo 9" nap 3/8"',           cat:'Herramienta', unidad:'Pieza',   precio:8,  stock:22, min:15 },
      { id:6, nombre:'Masking tape 3M 2090',          cat:'Suministro',  unidad:'Rollo',   precio:5,  stock:45, min:20 },
      { id:7, nombre:'Lija 220 grit (paquete)',       cat:'Suministro',  unidad:'Paquete', precio:9,  stock:4,  min:8  },
      { id:8, nombre:'Lona protectora 9x12',          cat:'Suministro',  unidad:'Pieza',   precio:14, stock:12, min:8  },
    ],
    empleados: [
      { id:1, nombre:'Miguel Hernández', puesto:'Pintor Senior', tarifa:45, telefono:'(213) 555-1100', email:'m.hernandez@co.com', licencia:'CAC-4521', notas:'' },
      { id:2, nombre:'Andrés Morales',   puesto:'Pintor',        tarifa:32, telefono:'(818) 555-2200', email:'a.morales@co.com',   licencia:'—',       notas:'' },
      { id:3, nombre:'Luis Pérez',       puesto:'Pintor',        tarifa:32, telefono:'(626) 555-3300', email:'l.perez@co.com',     licencia:'—',       notas:'' },
      { id:4, nombre:'David Kim',        puesto:'Supervisor',    tarifa:52, telefono:'(310) 555-5500', email:'d.kim@co.com',       licencia:'CAC-7832',notas:'Supervisor de obra' },
    ],
    config: { labor: 32, tax: 10.25, overhead: 15, margen: 35 },
  };
}

// ── Public API ──────────────────────────────────────────────

window.AppDB = {
  data: null,

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    this.data = raw ? JSON.parse(raw) : getDefaultDB();
    return this.data;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  reset() {
    this.data = getDefaultDB();
    this.save();
  },

  nextId(collection) {
    const arr = this.data[collection];
    return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
  },
};
