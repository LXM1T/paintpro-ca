// ============================================================
// PaintPro CA — Supabase Client
// Conexión real a la base de datos en la nube
// Lee config desde window.__ENV (inyectado por env-config.js)
// ============================================================

const _ENV = window.__ENV || {};

const SUPABASE_URL     = _ENV.SUPABASE_URL     || 'https://yqctbsyykxxojueciqam.supabase.co';
const SUPABASE_ANON_KEY= _ENV.SUPABASE_ANON_KEY|| 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxY3Ric3l5a3h4b2p1ZWNpcWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzc0OTgsImV4cCI6MjA5NTg1MzQ5OH0.QsznISsDdcZdoLabcMXC4cyWCNBLDrbK_qJ5k1aUQfg';

// ── Internal token storage (in memory only, never localStorage) ──
let _accessToken  = null;
let _refreshToken = null;
let _currentUser  = null;

// ── Core REST helper ─────────────────────────────────────────
async function _request(method, path, body = null, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${path}${params}`;
  const headers = {
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${_accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        method === 'POST' ? 'return=representation' : 'return=representation',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth helpers ─────────────────────────────────────────────
async function _authRequest(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method:  'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.message || 'Auth error');
  return data;
}

// ── Public API ───────────────────────────────────────────────
window.SupabaseClient = {

  // ── Auth ───────────────────────────────────────────────────

  async signIn(email, password) {
    const data = await _authRequest('token?grant_type=password', { email, password });
    _accessToken  = data.access_token;
    _refreshToken = data.refresh_token;
    _currentUser  = data.user;

    // Store refresh token in sessionStorage (not the access token)
    sessionStorage.setItem('sb_refresh', data.refresh_token);
    return data;
  },

  async signOut() {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method:  'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${_accessToken}` },
      });
    } catch { /* ignore */ }
    _accessToken = _refreshToken = _currentUser = null;
    sessionStorage.removeItem('sb_refresh');
  },

  async refreshSession() {
    const rt = _refreshToken || sessionStorage.getItem('sb_refresh');
    if (!rt) return null;
    try {
      const data = await _authRequest('token?grant_type=refresh_token', { refresh_token: rt });
      _accessToken  = data.access_token;
      _refreshToken = data.refresh_token;
      _currentUser  = data.user;
      sessionStorage.setItem('sb_refresh', data.refresh_token);
      return data;
    } catch {
      sessionStorage.removeItem('sb_refresh');
      return null;
    }
  },

  getUser()  { return _currentUser; },
  getToken() { return _accessToken; },
  isAuth()   { return !!_accessToken; },

  // ── CRUD ───────────────────────────────────────────────────

  // SELECT — returns array
  async select(table, { filters = '', order = '', limit = '', select = '*' } = {}) {
    let params = `?select=${select}`;
    if (filters) params += `&${filters}`;
    if (order)   params += `&order=${order}`;
    if (limit)   params += `&limit=${limit}`;
    return _request('GET', table, null, params);
  },

  // SELECT single row
  async selectOne(table, id, select = '*') {
    const rows = await _request('GET', table, null, `?id=eq.${id}&select=${select}&limit=1`);
    return rows?.[0] || null;
  },

  // INSERT — returns inserted row
  async insert(table, data) {
    const res = await _request('POST', table, data);
    return Array.isArray(res) ? res[0] : res;
  },

  // UPDATE — returns updated row
  async update(table, id, data) {
    const res = await _request('PATCH', table, data, `?id=eq.${id}`);
    return Array.isArray(res) ? res[0] : res;
  },

  // DELETE
  async delete(table, id) {
    await _request('DELETE', table, null, `?id=eq.${id}`);
    return true;
  },

  // RPC — call postgres function
  async rpc(fnName, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method:  'POST',
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${_accessToken || SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `RPC ${fnName} failed`);
    }
    return res.json();
  },

  // ── Health check ───────────────────────────────────────────
  async ping() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      return res.ok;
    } catch { return false; }
  },
};
