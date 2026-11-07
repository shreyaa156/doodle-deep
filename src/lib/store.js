// Where creatures are kept.
//
// Local mode (no Supabase keys): creatures live in this browser's localStorage.
// Other tabs of the same browser see new creatures live, which is handy for testing.
// The admin page needs no login, since only this computer can reach it.
//
// Supabase mode (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set): drawings go to the
// "creatures" storage bucket, rows to the "creatures" table, and Realtime pushes new
// creatures to everyone. Only accounts listed in the "admins" table can delete.
// See supabase/schema.sql for the setup.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const mode = SUPABASE_URL && SUPABASE_KEY ? 'supabase' : 'local';
export const MAX_SHOWN = 150; // creatures swimming in the ocean at once
export const MAX_ADMIN = 1000; // creatures listed on the admin page

// ---------- local ----------

const LOCAL_KEY = 'doodle-deep:creatures';
const localListeners = new Set();

function readLocal() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  localListeners.forEach((fn) => fn());
}

const local = {
  subscribe(onChange, onError, limit = MAX_SHOWN) {
    const emit = () => onChange(readLocal().sort((a, b) => b.createdAt - a.createdAt).slice(0, limit));
    const onStorage = (e) => { if (e.key === LOCAL_KEY) emit(); };
    localListeners.add(emit);
    window.addEventListener('storage', onStorage);
    emit();
    return () => { localListeners.delete(emit); window.removeEventListener('storage', onStorage); };
  },
  async add({ name, type, dataUrl }) {
    const creature = { id: crypto.randomUUID(), name, type, img: dataUrl, createdAt: Date.now() };
    try {
      writeLocal([...readLocal(), creature]);
    } catch {
      throw new Error('full');
    }
    return creature.id;
  },
  async remove(ids) {
    const gone = new Set(ids);
    writeLocal(readLocal().filter((c) => !gone.has(c.id)));
  },
};

const localAuth = {
  required: false,
  onChange(cb) { cb({ email: 'this computer', isAdmin: true }); return () => {}; },
  async signIn() {},
  async signOut() {},
};

// ---------- supabase ----------

let clientPromise = null;
function getClient() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY));
  return clientPromise;
}

const fromRow = (r) => ({ id: r.id, name: r.name, type: r.type, img: r.image_url, createdAt: Date.parse(r.created_at) });
const storagePath = (url) => decodeURIComponent(url.split('/storage/v1/object/public/creatures/')[1] || '');

let feedCount = 0;

const supabase = {
  subscribe(onChange, onError, limit = MAX_SHOWN) {
    let cancelled = false;
    let channel = null;
    const refresh = async () => {
      const sb = await getClient();
      const { data, error } = await sb
        .from('creatures')
        .select('id, name, type, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;
      if (error) onError?.(error);
      else onChange(data.map(fromRow));
    };
    getClient().then((sb) => {
      if (cancelled) return;
      channel = sb
        .channel(`creatures-feed-${++feedCount}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'creatures' }, refresh)
        .subscribe();
      refresh();
    });
    return () => {
      cancelled = true;
      if (channel) getClient().then((sb) => sb.removeChannel(channel));
    };
  },
  async add({ name, type, dataUrl }) {
    const sb = await getClient();
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type === 'image/webp' ? 'webp' : 'png';
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from('creatures').upload(path, blob, { contentType: blob.type });
    if (up.error) throw up.error;
    const { data: pub } = sb.storage.from('creatures').getPublicUrl(path);
    const { data, error } = await sb
      .from('creatures')
      .insert({ name, type, image_url: pub.publicUrl })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },
  // Admins only: the database refuses deletes from anyone else.
  async remove(ids) {
    const sb = await getClient();
    const { data, error } = await sb.from('creatures').delete().in('id', ids).select('image_url');
    if (error) throw error;
    if (!data.length) throw new Error('not allowed');
    const paths = data.map((r) => storagePath(r.image_url)).filter(Boolean);
    if (paths.length) await sb.storage.from('creatures').remove(paths);
  },
};

const supabaseAuth = {
  required: true,
  // Calls back with null (signed out) or { email, isAdmin }.
  onChange(cb) {
    let cancelled = false;
    let sub = null;
    const report = async (user) => {
      if (!user) { if (!cancelled) cb(null); return; }
      const sb = await getClient();
      const { data } = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!cancelled) cb({ email: user.email, isAdmin: !!data });
    };
    getClient().then((sb) => {
      if (cancelled) return;
      sb.auth.getSession().then(({ data }) => report(data.session?.user ?? null));
      sub = sb.auth.onAuthStateChange((event, session) => {
        if (event !== 'INITIAL_SESSION') report(session?.user ?? null);
      }).data.subscription;
    });
    return () => { cancelled = true; sub?.unsubscribe(); };
  },
  async signIn(email, password) {
    const sb = await getClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signOut() {
    const sb = await getClient();
    await sb.auth.signOut();
  },
};

export const store = mode === 'supabase' ? supabase : local;
export const auth = mode === 'supabase' ? supabaseAuth : localAuth;
