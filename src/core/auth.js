// ============================================================
// PaintPro CA — Core: Auth
// Login · Logout · Session · Permissions
// ============================================================

window.Auth = {
  currentUser: null,

  // ── Login ────────────────────────────────────────────────
  login(email, password) {
    const db = window.AppDB.data;
    const user = db.users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (!user) return { success: false, error: 'Correo o contraseña incorrectos.' };

    this.currentUser = user;
    sessionStorage.setItem('pp_session', user.email);
    return { success: true, user };
  },

  // ── Logout ───────────────────────────────────────────────
  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('pp_session');
  },

  // ── Restore session ──────────────────────────────────────
  restoreSession() {
    const savedEmail = sessionStorage.getItem('pp_session');
    if (!savedEmail) return false;

    const db = window.AppDB.data;
    const user = db.users.find(u => u.email.toLowerCase() === savedEmail.toLowerCase());
    if (user) {
      this.currentUser = user;
      return true;
    }
    return false;
  },

  // ── Update profile ───────────────────────────────────────
  updateProfile({ nombre, email, telefono, puesto, empresa }) {
    if (!nombre || !nombre.trim()) return { success: false, error: 'El nombre es requerido.' };
    if (!email  || !email.trim())  return { success: false, error: 'El email es requerido.' };
    const db = window.AppDB.data;
    const idx = db.users.findIndex(u => u.id === this.currentUser.id);
    if (idx < 0) return { success: false, error: 'Usuario no encontrado.' };

    // Check email collision
    const collision = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== this.currentUser.id);
    if (collision) return { success: false, error: 'Ese email ya está en uso.' };

    db.users[idx] = { ...db.users[idx], nombre, email, telefono, puesto, empresa };
    this.currentUser = db.users[idx];
    sessionStorage.setItem('pp_session', email);
    window.AppDB.save();
    return { success: true };
  },

  // ── Change password ──────────────────────────────────────
  changePassword(actual, nueva, confirmar) {
    if (actual !== this.currentUser.password) return { success: false, error: 'Contraseña actual incorrecta.' };
    if (nueva.length < 6) return { success: false, error: 'Mínimo 6 caracteres.' };
    if (nueva !== confirmar) return { success: false, error: 'Las contraseñas no coinciden.' };

    const db = window.AppDB.data;
    const idx = db.users.findIndex(u => u.id === this.currentUser.id);
    db.users[idx].password = nueva;
    this.currentUser = db.users[idx];
    window.AppDB.save();
    return { success: true };
  },

  // ── Helpers ──────────────────────────────────────────────
  getInitials() {
    if (!this.currentUser) return '?';
    return this.currentUser.nombre
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  },

  isLoggedIn() {
    return !!this.currentUser;
  },
};

  // ── Register (create new account) ────────────────────────
  register(formData) {
    const { nombre, email, password, confirmar, empresa, telefono } = formData;

    // Validations
    if (!nombre?.trim() || nombre.trim().length < 2)
      return { success: false, error: 'El nombre debe tener al menos 2 caracteres.' };

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { success: false, error: 'Ingresa un correo electrónico válido.' };

    if (!password || password.length < 8)
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };

    if (!/[A-Z]/.test(password))
      return { success: false, error: 'La contraseña debe contener al menos una mayúscula.' };

    if (!/[0-9]/.test(password))
      return { success: false, error: 'La contraseña debe contener al menos un número.' };

    if (password !== confirmar)
      return { success: false, error: 'Las contraseñas no coinciden.' };

    const db = window.AppDB.data;

    // Check email already taken
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()))
      return { success: false, error: 'Ya existe una cuenta con ese correo electrónico.' };

    // Create user
    const newUser = {
      id:       window.AppDB.nextId('users'),
      nombre:   nombre.trim(),
      email:    email.toLowerCase().trim(),
      password,
      telefono: telefono?.trim() || '',
      puesto:   'Administrador',
      empresa:  empresa?.trim() || 'Mi Empresa de Pintura',
    };

    db.users.push(newUser);
    window.AppDB.save();

    // Auto login after register
    this.currentUser = newUser;
    sessionStorage.setItem('pp_session', newUser.email);
    return { success: true, user: newUser };
  },

  // ── Password strength ────────────────────────────────────
  passwordStrength(password) {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8)   score++;
    if (password.length >= 12)  score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: '',          color: '' },
      { label: 'Muy débil', color: '#C0392B' },
      { label: 'Débil',     color: '#E8821A' },
      { label: 'Regular',   color: '#D4840A' },
      { label: 'Buena',     color: '#2C5F8A' },
      { label: 'Excelente', color: '#1E7C4A' },
    ];
    return { score, ...levels[Math.min(score, 5)] };
  },
