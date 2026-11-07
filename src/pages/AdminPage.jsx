import { useEffect, useMemo, useState } from 'react';
import { store, auth, mode, MAX_ADMIN } from '../lib/store.js';
import { TYPES } from '../creatures.js';
import { timeAgo } from '../lib/time.js';
import { BackIcon, TrashIcon } from '../icons.jsx';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await auth.signIn(email.trim(), password);
    } catch {
      setError('That email and password didn\'t match. Check them and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel admin-signin" onSubmit={submit}>
      <h2>Admin sign in</h2>
      <div className="field">
        <label htmlFor="admin-email">Email</label>
        <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="release" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p className="form-msg" role="status">{error}</p>
    </form>
  );
}

export default function AdminPage({ go }) {
  const [user, setUser] = useState(undefined); // undefined while checking, null when signed out
  const [creatures, setCreatures] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [picked, setPicked] = useState(() => new Set());
  const [armed, setArmed] = useState(null); // id of the creature awaiting a second tap, or 'bulk'
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => auth.onChange(setUser), []);

  useEffect(() => {
    if (!user?.isAdmin) return undefined;
    return store.subscribe(
      (list) => { setCreatures(list); setLoadError(false); },
      () => setLoadError(true),
      MAX_ADMIN,
    );
  }, [user?.isAdmin]);

  // forget picks for creatures that no longer exist
  useEffect(() => {
    if (!creatures) return;
    const ids = new Set(creatures.map((c) => c.id));
    setPicked((p) => new Set([...p].filter((id) => ids.has(id))));
  }, [creatures]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (creatures || []).filter((c) =>
      (typeFilter === 'all' || c.type === typeFilter) && (!q || c.name.toLowerCase().includes(q)));
  }, [creatures, query, typeFilter]);

  const togglePick = (id) => {
    setArmed(null);
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allVisiblePicked = visible.length > 0 && visible.every((c) => picked.has(c.id));
  const toggleAllVisible = () => {
    setArmed(null);
    setPicked((p) => {
      const next = new Set(p);
      visible.forEach((c) => (allVisiblePicked ? next.delete(c.id) : next.add(c.id)));
      return next;
    });
  };

  const remove = async (ids, armKey) => {
    if (armed !== armKey) { setArmed(armKey); return; }
    setBusy(true);
    setMsg('');
    try {
      await store.remove(ids);
      setMsg(ids.length === 1 ? 'Creature deleted.' : `${ids.length} creatures deleted.`);
      setPicked(new Set());
    } catch (err) {
      setMsg(err.message === 'not allowed'
        ? "This account isn't allowed to delete creatures."
        : "Couldn't delete. Check your connection and try again.");
    } finally {
      setBusy(false);
      setArmed(null);
    }
  };

  const signedIn = user?.isAdmin;

  return (
    <div className="page">
      <div className="page-inner">
        <header className="draw-head admin-head">
          <button className="back" onClick={() => go('ocean')}><BackIcon />Back to the ocean</button>
          <div>
            <span className="eyebrow">Admin</span>
            <h1>Manage creatures</h1>
          </div>
          {signedIn && (
            <div className="admin-who">
              <span>Signed in as {user.email}</span>
              {auth.required && <button className="btn-ghost" onClick={() => auth.signOut()}>Sign out</button>}
            </div>
          )}
        </header>

        {mode === 'local' && (
          <p className="admin-note">
            Local mode: creatures are saved in this browser only, so no password is needed. Once the site is live on Supabase, this page asks for your admin login.
          </p>
        )}

        {user === undefined && <p className="admin-empty">Checking your login…</p>}
        {user === null && <SignIn />}
        {user && !user.isAdmin && (
          <div className="panel admin-signin">
            <h2>Not an admin account</h2>
            <p className="admin-empty">{user.email} is signed in but isn't on the admin list.</p>
            <button className="btn-ghost" onClick={() => auth.signOut()}>Sign out</button>
          </div>
        )}

        {signedIn && (
          <>
            <div className="admin-bar">
              <div className="field admin-search">
                <label htmlFor="admin-search">Search by name</label>
                <input id="admin-search" type="search" placeholder="Artist name" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="admin-filters" role="group" aria-label="Filter by creature">
                {['all', ...Object.keys(TYPES)].map((key) => (
                  <button key={key} className="chip" aria-pressed={typeFilter === key} onClick={() => setTypeFilter(key)}>
                    {key === 'all' ? 'All' : TYPES[key].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-actions">
              <span className="admin-count">
                {creatures === null ? 'Loading…' : `${visible.length} of ${creatures.length} creatures`}
              </span>
              <button className="btn-ghost" onClick={toggleAllVisible} disabled={!visible.length}>
                {allVisiblePicked ? 'Unselect all' : 'Select all shown'}
              </button>
              <button
                className={`btn-danger${armed === 'bulk' ? ' armed' : ''}`}
                disabled={!picked.size || busy}
                onClick={() => remove([...picked], 'bulk')}
              >
                {armed === 'bulk' ? `Tap again to delete ${picked.size}` : `Delete selected (${picked.size})`}
              </button>
              <p className="form-msg ok" role="status">{msg}</p>
            </div>

            {loadError && <p className="admin-empty">Couldn't load the creatures. Check your connection and reload.</p>}
            {creatures?.length === 0 && <p className="admin-empty">The ocean is empty. Nothing to manage yet.</p>}
            {creatures?.length > 0 && visible.length === 0 && <p className="admin-empty">No creatures match that search.</p>}

            <ul className="admin-grid">
              {visible.map((c) => (
                <li key={c.id} className={`admin-card${picked.has(c.id) ? ' picked' : ''}`}>
                  <label className="admin-pick">
                    <input type="checkbox" checked={picked.has(c.id)} onChange={() => togglePick(c.id)} aria-label={`Select ${c.name}'s creature`} />
                  </label>
                  <div className="admin-img"><img src={c.img} alt={`${c.name}'s ${TYPES[c.type]?.label.toLowerCase() || 'creature'}`} loading="lazy" /></div>
                  <div className="admin-info">
                    <strong>{c.name}</strong>
                    <span>{TYPES[c.type]?.label || 'Creature'} · {timeAgo(c.createdAt)}</span>
                  </div>
                  <button
                    className={`btn-danger admin-del${armed === c.id ? ' armed' : ''}`}
                    disabled={busy}
                    onClick={() => remove([c.id], c.id)}
                    aria-label={`Delete ${c.name}'s creature`}
                  >
                    <TrashIcon />{armed === c.id ? 'Tap again' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
