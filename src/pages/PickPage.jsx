import { ART, TYPES } from '../creatures.js';
import { BackIcon } from '../icons.jsx';

export default function PickPage({ go, onPick }) {
  return (
    <div className="page">
      <div className="page-inner">
        <button className="back" onClick={() => go('ocean')}><BackIcon />Back to the ocean</button>
        <header className="page-head">
          <span className="eyebrow">Step 1 of 2</span>
          <h1>Who's joining the ocean today?</h1>
          <p>Pick a creature. Each one moves its own way once it's in the water: fish swim, jellyfish bob, crabs scuttle along the sand.</p>
        </header>
        <div className="creature-grid">
          {Object.entries(TYPES).map(([key, t]) => (
            <button key={key} className={`creature-card anim-${t.anim}${key === 'anything' ? ' special' : ''}`} onClick={() => onPick(key)}>
              <div className="art" dangerouslySetInnerHTML={{ __html: ART[key] }} />
              <h3>{t.label}</h3>
              <p>{t.blurb}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
