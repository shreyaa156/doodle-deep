import { useEffect, useRef, useState } from 'react';
import { ART, TYPES } from '../creatures.js';
import { store } from '../lib/store.js';
import { floodFill, exportDrawing } from '../lib/drawing.js';
import { ArrowRightIcon, BackIcon, EraserIcon, FillIcon, PaintIcon, TrashIcon, UndoIcon, WavesIcon } from '../icons.jsx';

const COLORS = ['#0a2a40', '#ffffff', '#ff5f5f', '#ff8a6b', '#ffb347', '#ffd84d', '#b8e05a', '#5fd3a5', '#2bb3a3', '#4db8ff', '#2f6fe0', '#7b6cff', '#b77bff', '#ff7eb6', '#c98b5a', '#8a96a3'];
const SIZES = [4, 9, 18, 32];
const TOOLS = [
  { id: 'brush', label: 'Brush', Icon: PaintIcon },
  { id: 'fill', label: 'Fill', Icon: FillIcon },
  { id: 'eraser', label: 'Eraser', Icon: EraserIcon },
];
const NAME_KEY = 'doodle-deep:name';

// Keeps an unfinished drawing when the visitor goes back to pick a different creature.
let savedDrawing = null;

export default function DrawPage({ go, type, onReleased }) {
  const t = TYPES[type] || TYPES.fish;
  const canvasRef = useRef(null);
  const undoStack = useRef([]);
  const stroke = useRef(null);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [name, setName] = useState(() => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } });
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [busy, setBusy] = useState(false);

  // The canvas fills whatever space the layout gives it, so its pixel size follows its on-screen size.
  // At least 1000px across (what phones always had), so brush sizes look the same as before.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let pending = savedDrawing;
    const fit = () => {
      const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
      if (!cssW || !cssH) return;
      const k = Math.max(1.4, 1000 / Math.max(cssW, cssH * 10 / 7));
      const w = Math.round(cssW * k), h = Math.round(cssH * k);
      if (w === canvas.width && h === canvas.height && !pending) return;
      // Keep what's drawn: copy it out, resize, then paint it back scaled to the new size.
      const old = document.createElement('canvas');
      if (pending) {
        old.width = pending.width; old.height = pending.height;
        old.getContext('2d').putImageData(pending, 0, 0);
        pending = null;
      } else {
        old.width = canvas.width; old.height = canvas.height;
        old.getContext('2d').drawImage(canvas, 0, 0);
      }
      canvas.width = w; canvas.height = h;
      const s = Math.min(w / old.width, h / old.height);
      ctx.drawImage(old, 0, 0, old.width * s, old.height * s);
      undoStack.current = []; // snapshots were taken at the old size
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    return () => { ro.disconnect(); savedDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height); };
  }, []);

  const ctx = () => canvasRef.current.getContext('2d', { willReadFrequently: true });

  const pushUndo = () => {
    const c = canvasRef.current;
    undoStack.current.push(ctx().getImageData(0, 0, c.width, c.height));
    if (undoStack.current.length > 30) undoStack.current.shift();
  };
  const undo = () => { const s = undoStack.current.pop(); if (s) ctx().putImageData(s, 0, 0); };
  const clear = () => { const c = canvasRef.current; pushUndo(); ctx().clearRect(0, 0, c.width, c.height); };

  const pointOf = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height };
  };
  const applyStyle = (g) => {
    g.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = size;
    g.lineCap = 'round';
    g.lineJoin = 'round';
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const p = pointOf(e);
    pushUndo();
    if (tool === 'fill') { floodFill(ctx(), Math.floor(p.x), Math.floor(p.y), color); return; }
    canvasRef.current.setPointerCapture(e.pointerId);
    stroke.current = { last: p, mid: p };
    const g = ctx();
    applyStyle(g);
    g.beginPath();
    g.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    g.fill();
  };
  const onPointerMove = (e) => {
    const s = stroke.current;
    if (!s) return;
    const g = ctx();
    applyStyle(g);
    const events = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    for (const ev of events) {
      const p = pointOf(ev);
      const m = { x: (s.last.x + p.x) / 2, y: (s.last.y + p.y) / 2 };
      g.beginPath();
      g.moveTo(s.mid.x, s.mid.y);
      g.quadraticCurveTo(s.last.x, s.last.y, m.x, m.y);
      g.stroke();
      s.last = p;
      s.mid = m;
    }
  };
  const endStroke = () => {
    const s = stroke.current;
    if (!s) return;
    const g = ctx();
    g.beginPath();
    g.moveTo(s.mid.x, s.mid.y);
    g.lineTo(s.last.x, s.last.y);
    g.stroke();
    g.globalCompositeOperation = 'source-over';
    stroke.current = null;
  };

  const pickColor = (c) => { setColor(c); if (tool === 'eraser') setTool('brush'); };

  const release = async () => {
    const artist = name.trim().slice(0, 24);
    if (!artist) { setMsg({ text: 'Add your name so people know who drew it.', ok: false }); return; }
    const dataUrl = exportDrawing(canvasRef.current);
    if (!dataUrl) { setMsg({ text: 'The canvas is empty. Draw your creature first.', ok: false }); return; }
    setBusy(true);
    setMsg({ text: 'Releasing…', ok: true });
    try {
      const id = await store.add({ name: artist, type, dataUrl });
      try { localStorage.setItem(NAME_KEY, artist); } catch { /* name is only a convenience */ }
      const c = canvasRef.current;
      ctx().clearRect(0, 0, c.width, c.height);
      undoStack.current = [];
      onReleased(id);
    } catch (err) {
      setMsg({
        text: err.message === 'full'
          ? "This browser's ocean is full. Delete a few creatures from the ocean, then try again."
          : "Couldn't release your creature. Check your connection and try again.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page draw-page">
      <div className="page-inner">
        <header className="draw-head">
          <button className="back" onClick={() => go('pick')}><BackIcon />Pick another</button>
          <div>
            <span className="eyebrow">Step 2 of 2</span>
            <h1>{type === 'anything' ? 'Draw any sea creature' : `Draw your ${t.label.toLowerCase()}`}</h1>
          </div>
        </header>

        <div className="studio">
          <aside className="panel ref">
            <h2>For inspiration</h2>
            <div className="art" dangerouslySetInnerHTML={{ __html: ART[type] || ART.fish }} />
            <p>{t.note}</p>
            {t.motion === 'swim' && (
              <div className="tip"><ArrowRightIcon />Draw it facing right so it swims the right way.</div>
            )}
          </aside>

          <div className="canvas-col">
            <div className="toolbar">
              <div className="tool-group" role="group" aria-label="Tool">
                {TOOLS.map(({ id, label, Icon }) => (
                  <button key={id} className="tbtn" aria-label={label} title={label} aria-pressed={tool === id} onClick={() => setTool(id)}><Icon /><span className="tlabel">{label}</span></button>
                ))}
              </div>
              <div className="tool-group" role="group" aria-label="Brush size">
                {SIZES.map((sz) => {
                  const d = Math.max(5, Math.min(22, sz * 0.7));
                  return (
                    <button key={sz} className="tbtn" aria-label={`Brush size ${sz}`} aria-pressed={size === sz} onClick={() => setSize(sz)}>
                      <span className="size-dot" style={{ width: d, height: d }} />
                    </button>
                  );
                })}
              </div>
              <div className="tool-group" role="group" aria-label="History">
                <button className="tbtn" aria-label="Undo" title="Undo" onClick={undo}><UndoIcon /><span className="tlabel">Undo</span></button>
                <button className="tbtn" aria-label="Clear" title="Clear" onClick={clear}><TrashIcon /><span className="tlabel">Clear</span></button>
              </div>
            </div>

            <div className="palette" role="group" aria-label="Colors">
              {COLORS.map((c) => (
                <button key={c} className="swatch" style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => pickColor(c)} />
              ))}
              <label className="custom-color" title="Pick any color">
                <input type="color" id="custom-color" defaultValue="#ff8a6b" aria-label="Pick any color" onChange={(e) => pickColor(e.target.value)} />
              </label>
            </div>

            <div className="canvas-wrap">
              <canvas
                ref={canvasRef}
                id="pad"
                width="1000"
                height="700"
                aria-label="Drawing canvas"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endStroke}
                onPointerCancel={endStroke}
              />
            </div>

            <div className="release-row">
              <div className="field">
                <label htmlFor="artist">Who drew this?</label>
                <input id="artist" maxLength={24} placeholder="Your name" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <button className="release" onClick={release} disabled={busy}>Release into the ocean<WavesIcon /></button>
            </div>
            <p className={`form-msg${msg.ok ? ' ok' : ''}`} role="status">{msg.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
