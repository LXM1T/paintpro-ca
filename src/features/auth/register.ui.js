// ============================================================
// PaintPro CA — Register UI
// Multi-step registration: Account → Company → Confirm
// ============================================================

window.RegisterUI = {
  _currentStep: 1,
  _data: {},

  // ── Navigation helpers ────────────────────────────────────
  nextStep(from) {
    const err = this._validate(from);
    if (err) {
      const errEl = Utils.el(`reg-error-${from}`);
      if (errEl) { errEl.textContent = err; errEl.style.display = 'block'; }
      return;
    }

    // Collect data from step
    this._collectStep(from);

    // Clear error
    const errEl = Utils.el(`reg-error-${from}`);
    if (errEl) errEl.style.display = 'none';

    // If going to step 3, build summary
    if (from + 1 === 3) this._buildSummary();

    this._goToStep(from + 1);
  },

  prevStep(from) {
    this._goToStep(from - 1);
  },

  _goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.register-step').forEach(s => s.classList.remove('active'));
    const stepEl = Utils.el(`reg-step-${step}`);
    if (stepEl) stepEl.classList.add('active');

    // Update dots
    for (let i = 1; i <= 3; i++) {
      const dot  = Utils.el(`step-dot-${i}`);
      if (!dot) continue;
      dot.classList.remove('active', 'done');
      if (i < step)  dot.classList.add('done');
      if (i === step) dot.classList.add('active');
      if (i < 3) {
        const line = Utils.el(`step-line-${i}`);
        if (line) line.classList.toggle('done', i < step);
      }
    }

    this._currentStep = step;
  },

  // ── Validation ────────────────────────────────────────────
  _validate(step) {
    if (step === 1) {
      const nombre   = Utils.getVal('reg-nombre');
      const email    = Utils.getVal('reg-email');
      const password = document.getElementById('reg-password')?.value || '';
      const confirm  = document.getElementById('reg-confirmar')?.value || '';

      if (!nombre || nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un correo válido.';
      if (!password || password.length < 8)  return 'La contraseña debe tener al menos 8 caracteres.';
      if (!/[A-Z]/.test(password)) return 'La contraseña necesita al menos una letra mayúscula.';
      if (!/[0-9]/.test(password)) return 'La contraseña necesita al menos un número.';
      if (password !== confirm)    return 'Las contraseñas no coinciden.';

      // Check email taken
      const taken = AppDB.data.users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );
      if (taken) return 'Ya existe una cuenta con ese correo electrónico.';
    }

    if (step === 2) {
      const empresa = Utils.getVal('reg-empresa');
      if (!empresa || empresa.length < 2) return 'Ingresa el nombre de tu empresa.';
    }

    return null;
  },

  // ── Collect form data ─────────────────────────────────────
  _collectStep(step) {
    if (step === 1) {
      this._data.nombre    = Utils.getVal('reg-nombre');
      this._data.email     = Utils.getVal('reg-email');
      this._data.password  = document.getElementById('reg-password')?.value || '';
      this._data.confirmar = document.getElementById('reg-confirmar')?.value || '';
    }
    if (step === 2) {
      this._data.empresa  = Utils.getVal('reg-empresa');
      this._data.telefono = Utils.getVal('reg-telefono');
      this._data.ciudad   = Utils.getVal('reg-ciudad');
      this._data.licencia = Utils.getVal('reg-licencia');
    }
  },

  // ── Build confirmation summary ────────────────────────────
  _buildSummary() {
    const s = this._data;
    const rows = [
      ['👤 Nombre',   s.nombre],
      ['📧 Email',    s.email],
      ['🔒 Contraseña','••••••••'],
      ['🏢 Empresa',  s.empresa],
      ['📍 Ciudad',   s.ciudad || 'No especificada'],
      ['📞 Teléfono', s.telefono || 'No especificado'],
    ];
    const summaryEl = Utils.el('reg-summary');
    if (summaryEl) {
      summaryEl.innerHTML = rows.map(([label, value]) => `
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span style="color:var(--text-muted)">${label}</span>
          <span style="font-weight:500">${Utils.escHtml(value || '')}</span>
        </div>
      `).join('');
    }
  },

  // ── Submit ────────────────────────────────────────────────
  submit() {
    const btn = Utils.el('reg-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }

    const result = Auth.register(this._data);

    if (!result.success) {
      const errEl = Utils.el('reg-error-3');
      if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Crear cuenta gratis'; }
      return;
    }

    // Success — show app
    Utils.toast('¡Bienvenido a PaintPro CA! 🎉', 'success');
    window.hideRegister();
    AppUI._showApp();
    this._reset();
  },

  // ── Password strength indicator ───────────────────────────
  checkPassword(value) {
    const { score, label, color } = Auth.passwordStrength(value);
    const bar   = Utils.el('pw-strength-bar');
    const lbl   = Utils.el('pw-strength-label');
    if (bar) { bar.style.width = `${(score / 5) * 100}%`; bar.style.background = color; }
    if (lbl) { lbl.textContent = label; lbl.style.color = color; }
  },

  // ── Reset form ────────────────────────────────────────────
  _reset() {
    this._data        = {};
    this._currentStep = 1;
    ['reg-nombre','reg-email','reg-password','reg-confirmar',
     'reg-empresa','reg-telefono','reg-ciudad','reg-licencia']
      .forEach(id => Utils.setVal(id, ''));
    this._goToStep(1);
    const bar = Utils.el('pw-strength-bar');
    const lbl = Utils.el('pw-strength-label');
    if (bar) bar.style.width = '0%';
    if (lbl) lbl.textContent = '';
  },
};
