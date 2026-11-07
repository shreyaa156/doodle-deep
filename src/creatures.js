// Creature catalogue: how each type is labelled, how it moves in the ocean,
// and the reference sketch shown on the pick and draw pages.

const INK = 'stroke="#0a2a40" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

export const ART = {
  fish: `<svg viewBox="0 0 130 84"><path ${INK} fill="#ffb347" d="M30 42 L6 22 Q10 42 6 62 Z"/><ellipse ${INK} fill="#ff8a6b" cx="66" cy="42" rx="40" ry="26"/><path ${INK} fill="#ffd27a" d="M60 17 Q72 4 86 20"/><path ${INK} fill="none" d="M52 26 Q60 42 52 58"/><path ${INK} fill="#ffd27a" d="M64 50 Q72 62 80 52"/><circle cx="90" cy="36" r="6" fill="#fff" ${INK}/><circle cx="92" cy="36" r="2.6" fill="#0a2a40"/><path ${INK} fill="none" d="M100 50 Q104 52 106 48"/></svg>`,
  jellyfish: `<svg viewBox="0 0 110 130"><path ${INK} fill="none" d="M30 60 Q24 80 32 96 Q40 112 30 124"/><path ${INK} fill="none" d="M46 62 Q52 82 44 100 Q38 116 46 126"/><path ${INK} fill="none" d="M64 62 Q58 82 66 100 Q72 116 64 126"/><path ${INK} fill="none" d="M80 60 Q86 80 78 96 Q70 112 80 124"/><path ${INK} fill="#c9a7ff" d="M14 58 Q14 10 55 10 Q96 10 96 58 Q86 66 76 58 Q66 66 55 58 Q44 66 34 58 Q24 66 14 58Z"/><circle cx="42" cy="38" r="4" fill="#0a2a40"/><circle cx="68" cy="38" r="4" fill="#0a2a40"/><path ${INK} fill="none" d="M48 48 Q55 53 62 48"/><ellipse cx="36" cy="26" rx="8" ry="4" fill="#fff" opacity=".6"/></svg>`,
  crab: `<svg viewBox="0 0 140 100"><path ${INK} fill="none" d="M40 66 L18 80 M44 72 L26 92 M100 66 L122 80 M96 72 L114 92"/><path ${INK} fill="none" d="M44 52 L30 38 M96 52 L110 38"/><path ${INK} fill="#ff6b5b" d="M18 20 Q30 10 40 22 L30 30 Q34 40 22 42 Q8 36 18 20Z"/><path ${INK} fill="#ff6b5b" d="M122 20 Q110 10 100 22 L110 30 Q106 40 118 42 Q132 36 122 20Z"/><path ${INK} fill="none" d="M58 44 L54 28 M82 44 L86 28"/><circle cx="54" cy="24" r="6" fill="#fff" ${INK}/><circle cx="86" cy="24" r="6" fill="#fff" ${INK}/><circle cx="54" cy="24" r="2.5" fill="#0a2a40"/><circle cx="86" cy="24" r="2.5" fill="#0a2a40"/><ellipse ${INK} fill="#ff8a6b" cx="70" cy="62" rx="36" ry="22"/><path ${INK} fill="none" d="M62 66 Q70 72 78 66"/></svg>`,
  octopus: `<svg viewBox="0 0 120 130"><path ${INK} fill="#ff7eb6" d="M28 70 Q14 96 26 110 Q36 120 30 126 Q44 120 40 104 Q38 90 44 78"/><path ${INK} fill="#ff7eb6" d="M44 76 Q38 104 50 120 Q56 112 54 100 Q54 88 58 80"/><path ${INK} fill="#ff7eb6" d="M62 80 Q66 92 66 104 Q66 116 74 120 Q82 104 76 76"/><path ${INK} fill="#ff7eb6" d="M76 78 Q82 92 82 104 Q80 120 94 126 Q88 116 96 106 Q106 92 92 70"/><ellipse ${INK} fill="#ff9cc6" cx="60" cy="48" rx="34" ry="36"/><circle cx="48" cy="48" r="6" fill="#fff" ${INK}/><circle cx="72" cy="48" r="6" fill="#fff" ${INK}/><circle cx="49" cy="49" r="2.6" fill="#0a2a40"/><circle cx="73" cy="49" r="2.6" fill="#0a2a40"/><path ${INK} fill="none" d="M54 62 Q60 66 66 62"/><circle cx="44" cy="26" r="4" fill="#fff" opacity=".55"/></svg>`,
  turtle: `<svg viewBox="0 0 150 92"><ellipse ${INK} fill="#7fd6a0" cx="46" cy="72" rx="14" ry="8" transform="rotate(20 46 72)"/><ellipse ${INK} fill="#7fd6a0" cx="98" cy="74" rx="16" ry="8" transform="rotate(-25 98 74)"/><ellipse ${INK} fill="#7fd6a0" cx="96" cy="22" rx="16" ry="8" transform="rotate(25 96 22)"/><path ${INK} fill="#7fd6a0" d="M22 46 L8 42 L20 54Z"/><circle ${INK} fill="#7fd6a0" cx="124" cy="44" r="14"/><circle cx="130" cy="40" r="3" fill="#0a2a40"/><path ${INK} fill="none" d="M126 50 Q131 52 134 49"/><ellipse ${INK} fill="#3f9e6b" cx="70" cy="46" rx="44" ry="28"/><path ${INK} fill="#5cbf88" d="M70 26 L84 36 L80 54 L60 54 L56 36Z"/><path ${INK} fill="none" d="M56 36 L34 34 M84 36 L106 34 M60 54 L46 66 M80 54 L94 66"/></svg>`,
  whale: `<svg viewBox="0 0 170 100"><path ${INK} fill="none" d="M120 20 Q118 8 112 4 M120 20 Q122 8 130 4 M120 20 L120 4"/><path ${INK} fill="#5aa9e6" d="M34 52 L8 30 Q16 50 4 62 Q22 64 34 60Z"/><path ${INK} fill="#5aa9e6" d="M30 56 Q44 24 100 24 Q158 24 160 60 Q158 86 104 86 Q52 86 30 56Z"/><path ${INK} fill="#d8efff" d="M70 74 Q104 92 150 70 Q146 84 104 86 Q76 86 70 74Z"/><circle cx="132" cy="50" r="4" fill="#0a2a40"/><path ${INK} fill="none" d="M138 64 Q146 66 152 60"/><path ${INK} fill="#4a94cf" d="M96 66 Q104 80 118 78 Q110 68 108 62Z"/></svg>`,
  anything: `<svg viewBox="0 0 130 110"><path fill="#ffd84d" ${INK} d="M65 10 L74 40 L104 46 L78 62 L86 94 L65 76 L44 94 L52 62 L26 46 L56 40Z"/><path fill="#5fd3a5" ${INK} d="M110 10 L114 22 L126 24 L116 31 L119 44 L110 36 L101 44 L104 31 L94 24 L106 22Z"/><circle cx="20" cy="86" r="7" fill="#a9d6e5" ${INK}/><circle cx="114" cy="90" r="5" fill="#a9d6e5" ${INK}/><circle cx="20" cy="20" r="4" fill="#a9d6e5" ${INK}/><text x="65" y="66" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="26" fill="#0a2a40">?</text></svg>`,
};

export const TYPES = {
  fish: {
    label: 'Fish', blurb: 'Swims side to side', motion: 'swim', size: 1, speed: [34, 60], anim: 'swim',
    note: "Here's a fish to get you started. It's just for inspiration: draw any fish you like, as wild and colorful as you want.",
  },
  jellyfish: {
    label: 'Jellyfish', blurb: 'Bobs and drifts', motion: 'bob', size: 1.05, speed: [6, 14], anim: 'bob',
    note: 'A jellyfish floats with its tentacles hanging down. Give it any shape, glow or pattern you like.',
  },
  crab: {
    label: 'Crab', blurb: 'Scuttles along the sand', motion: 'crawl', size: 0.8, speed: [22, 40], anim: 'crawl',
    note: "Crabs live on the sea floor. Big claws, tiny claws, ten legs or two: it's your crab.",
  },
  octopus: {
    label: 'Octopus', blurb: 'Drifts and wiggles', motion: 'wiggle', size: 1.05, speed: [10, 22], anim: 'wiggle',
    note: 'Eight arms is traditional, but nobody is counting. Add spots, stripes or a little hat.',
  },
  turtle: {
    label: 'Turtle', blurb: 'Glides slowly', motion: 'swim', size: 1.1, speed: [16, 28], anim: 'glide',
    note: 'A sea turtle with a patterned shell. Make the shell as fancy as you like.',
  },
  whale: {
    label: 'Whale', blurb: 'Cruises through the deep', motion: 'swim', size: 1.7, speed: [12, 22], anim: 'glide',
    note: 'Whales are the biggest creatures in the ocean, so yours will be too. Add a spout if you want.',
  },
  anything: {
    label: 'Anything else', blurb: 'Draw whatever you imagine', motion: 'swim', size: 1, speed: [24, 44], anim: 'spark',
    note: 'A seahorse, a shark, a mermaid, a submarine, a sea monster. Anything goes, and it will swim around the ocean.',
  },
};
