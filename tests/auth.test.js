// ============================================================
// PaintPro CA — Tests: Auth
// Covers: login, logout, session restore, profile update,
//         password change
// ============================================================

function runAuthTests() {
  TestUtils.injectMockDB();

  describe('Auth — login()', () => {

    it('debería autenticar con credenciales correctas', () => {
      const result = Auth.login('admin@test.com', 'Test1234');
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('admin@test.com');
    });

    it('debería fallar con contraseña incorrecta', () => {
      const result = Auth.login('admin@test.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('debería fallar con email inexistente', () => {
      const result = Auth.login('noexiste@test.com', 'Test1234');
      expect(result.success).toBe(false);
    });

    it('debería ser case-insensitive en el email', () => {
      const result = Auth.login('ADMIN@TEST.COM', 'Test1234');
      expect(result.success).toBe(true);
    });

    it('debería guardar currentUser tras login exitoso', () => {
      Auth.login('admin@test.com', 'Test1234');
      expect(Auth.currentUser).toBeTruthy();
      expect(Auth.currentUser.nombre).toBe('Admin Test');
    });

    it('isLoggedIn() debería retornar true tras login', () => {
      Auth.login('admin@test.com', 'Test1234');
      expect(Auth.isLoggedIn()).toBe(true);
    });
  });

  describe('Auth — logout()', () => {

    it('debería limpiar currentUser', () => {
      Auth.login('admin@test.com', 'Test1234');
      Auth.logout();
      expect(Auth.currentUser).toBeNull();
    });

    it('isLoggedIn() debería retornar false tras logout', () => {
      Auth.login('admin@test.com', 'Test1234');
      Auth.logout();
      expect(Auth.isLoggedIn()).toBe(false);
    });
  });

  describe('Auth — getInitials()', () => {

    it('debería retornar iniciales del nombre', () => {
      Auth.login('admin@test.com', 'Test1234');
      expect(Auth.getInitials()).toBe('AT');
    });

    it('debería retornar "?" si no hay usuario', () => {
      Auth.logout();
      expect(Auth.getInitials()).toBe('?');
    });
  });

  describe('Auth — updateProfile()', () => {

    it('debería actualizar nombre y email correctamente', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.updateProfile({
        nombre: 'Admin Actualizado', email: 'nuevo@test.com',
        telefono: '(555) 999-9999', puesto: 'Gerente', empresa: 'Nueva Co.',
      });
      expect(result.success).toBe(true);
      expect(Auth.currentUser.nombre).toBe('Admin Actualizado');
      expect(Auth.currentUser.email).toBe('nuevo@test.com');
    });

    it('debería rechazar nombre vacío', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.updateProfile({ nombre: '', email: 'admin@test.com' });
      expect(result.success).toBe(false);
    });

    it('debería rechazar email ya en uso por otro usuario', () => {
      // Añadir un segundo usuario para probar colisión
      AppDB.data.users.push({ id: 2, nombre: 'Otro', email: 'otro@test.com', password: 'x' });
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.updateProfile({ nombre: 'Admin', email: 'otro@test.com' });
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Auth — changePassword()', () => {

    it('debería cambiar contraseña con datos correctos', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.changePassword('Test1234', 'NuevaClave1', 'NuevaClave1');
      expect(result.success).toBe(true);
    });

    it('debería rechazar contraseña actual incorrecta', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.changePassword('incorrecta', 'NuevaClave1', 'NuevaClave1');
      expect(result.success).toBe(false);
    });

    it('debería rechazar contraseña nueva menor a 6 caracteres', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.changePassword('Test1234', '123', '123');
      expect(result.success).toBe(false);
    });

    it('debería rechazar si confirmación no coincide', () => {
      Auth.login('admin@test.com', 'Test1234');
      const result = Auth.changePassword('Test1234', 'NuevaClave1', 'NuevaClave2');
      expect(result.success).toBe(false);
    });
  });

  TestUtils.injectMockDB(); // reset after tests
}
