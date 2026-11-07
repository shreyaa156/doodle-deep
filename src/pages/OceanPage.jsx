import { useEffect, useRef, useState } from 'react';
import { Ocean } from '../lib/ocean.js';
import { store, MAX_SHOWN } from '../lib/store.js';
import { TYPES } from '../creatures.js';
import { BrushIcon } from '../icons.jsx';
import { timeAgo } from '../lib/time.js';

export default function OceanPage({ go, highlightId, onHighlightShown }) {
  const canvasRef = useRef(null);
  const oceanRef = useRef(null);
  const [creatures, setCreatures] = useState(null); // null while loading
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ocean = new Ocean(canvasRef.current, { onSelect: setSelected });
    oceanRef.current = ocean;
    const unsubscribe = store.subscribe(
      (list) => { setCreatures(list); setError(false); ocean.setCreatures(list); },
      () => setError(true),
    );
    return () => { unsubscribe(); ocean.destroy(); };
  }, []);

  useEffect(() => {
    if (!highlightId || !oceanRef.current) return;
    oceanRef.current.highlight(highlightId);
    onHighlightShown();
  }, [highlightId, onHighlightShown]);

  // close the card if its creature disappears
  useEffect(() => {
    if (selected && creatures && !creatures.some((c) => c.id === selected.id)) setSelected(null);
  }, [creatures, selected]);

  const n = creatures?.length ?? 0;
  const countText = creatures === null
    ? 'Filling the ocean…'
    : n === 0 ? 'No creatures yet' : `${n >= MAX_SHOWN ? `${MAX_SHOWN}+` : n} ${n === 1 ? 'creature' : 'creatures'} in the ocean`;

  return (
    <div className="ocean-view">
      <canvas ref={canvasRef} className="ocean-canvas" aria-label="The shared ocean, with everyone's drawn creatures swimming" />
      <div className="ocean-top">
        <div className="brand">Doodle Deep<small>An ocean drawn by everyone</small></div>
        <div className="count">{error ? 'Ocean offline' : countText}</div>
      </div>

      {error && (
        <div className="ocean-status"><strong>The ocean couldn't load</strong>Check your connection and reload the page.</div>
      )}
      {!error && creatures?.length === 0 && (
        <div className="ocean-status"><strong>The ocean is empty</strong>Be the first to draw a creature and set it swimming.</div>
      )}

      {selected && (
        <div className="info">
          <img src={selected.img} alt="" />
          <div style={{ minWidth: 0 }}>
            <h3>{selected.name}</h3>
            <p>
              Drew {selected.type === 'anything' ? 'a sea creature' : `a ${TYPES[selected.type].label.toLowerCase()}`}
              {selected.createdAt ? ` · ${timeAgo(selected.createdAt)}` : ''}
            </p>
          </div>
          <div className="info-actions">
            <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}

      <button className="cta" onClick={() => go('pick')}><BrushIcon />Draw your creature</button>
    </div>
  );
}
