// Direct REST fetch helper to bypass supabase-js client hanging issue
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

function authHeaders(token?: string) {
  if (!token) return headers;
  return { ...headers, 'Authorization': `Bearer ${token}` };
}

export async function supabaseFetch<T = any>(
  table: string,
  query: string = '',
  options?: { token?: string }
): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers: authHeaders(options?.token) });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fetch ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function supabaseFetchSingle<T = any>(
  table: string,
  query: string = '',
  options?: { token?: string }
): Promise<T | null> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: { ...authHeaders(options?.token), 'Accept': 'application/vnd.pgrst.object+json' },
  });
  if (res.status === 406 || res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fetch ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function supabaseInsert<T = any>(
  table: string,
  body: Record<string, any>,
  options?: { token?: string }
): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders(options?.token), 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert ${table} failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function supabaseUpdate(
  table: string,
  query: string,
  body: Record<string, any>,
  options?: { token?: string }
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(options?.token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update ${table} failed: ${res.status} ${err}`);
  }
}

export async function supabaseDelete(
  table: string,
  query: string,
  options?: { token?: string }
): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(options?.token),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Delete ${table} failed: ${res.status} ${err}`);
  }
}

export { SUPABASE_URL, SUPABASE_KEY };
