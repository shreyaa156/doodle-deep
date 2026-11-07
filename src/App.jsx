import { useCallback, useEffect, useRef, useState } from 'react';
import OceanPage from './pages/OceanPage.jsx';
import PickPage from './pages/PickPage.jsx';
import DrawPage from './pages/DrawPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const PAGES = ['ocean', 'pick', 'draw', 'admin'];
const pageFromHash = () => {
  const h = location.hash.slice(1);
  return PAGES.includes(h) ? h : 'ocean';
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [creatureType, setCreatureType] = useState('fish');
  const [highlightId, setHighlightId] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    const onHash = () => { setPage(pageFromHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Page change with a wave of bubbles sweeping up the screen.
  const go = useCallback((next) => {
    if (reduceMotion) { location.hash = next; return; }
    setBubbles(Array.from({ length: 34 }, (_, i) => ({
      key: `${Date.now()}-${i}`, size: 30 + Math.random() * 100, left: -5 + Math.random() * 105, delay: Math.random() * 0.25,
    })));
    timers.current.push(setTimeout(() => { location.hash = next; }, 420));
    timers.current.push(setTimeout(() => setBubbles([]), 1400));
  }, []);

  const pickCreature = (type) => { setCreatureType(type); go('draw'); };
  const released = (id) => { setHighlightId(id); go('ocean'); };

  return (
    <>
      {page === 'ocean' && <OceanPage go={go} highlightId={highlightId} onHighlightShown={() => setHighlightId(null)} />}
      {page === 'pick' && <PickPage go={go} onPick={pickCreature} />}
      {page === 'draw' && <DrawPage go={go} type={creatureType} onReleased={released} />}
      {page === 'admin' && <AdminPage go={go} />}
      <div className="bubble-wave" aria-hidden="true">
        {bubbles.map((b) => (
          <span key={b.key} style={{ width: b.size, height: b.size, left: `${b.left}%`, animationDelay: `${b.delay}s` }} />
        ))}
      </div>
    </>
  );
}
