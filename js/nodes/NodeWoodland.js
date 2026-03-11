// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeWoodland.js
// 🪵 Wood resource node — dense post-apocalyptic overgrown forest
// Exclusive monster: FERAL HOUND (mutated dog pack)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['wood'],

  exclusiveMonster: {
    id: 'feral_hound',
    name: 'Feral Hound Pack',
    emoji: '🐕',
    baseStrength: 22,
    strength: 22,
    loot: ['rope', 'food'],
    desc: 'A starving pack of mutated dogs — fast, vicious, and relentless.',
  },

  // ── Foraging scene ─────────────────────────────────────────────
  sceneHTML(loc, isNight) {
    const nightFilter = isNight ? 'brightness(0.35) saturate(0.5)' : 'brightness(1)';
    const fogAlpha    = isNight ? 0.55 : 0.0;
    return `
      <div class="node-scene node-woodland" style="
        position:absolute;inset:0;overflow:hidden;
        background: linear-gradient(180deg,
          ${isNight ? '#020d04' : '#0a1a08'} 0%,
          ${isNight ? '#040f06' : '#0d1f0a'} 60%,
          ${isNight ? '#010b03' : '#081508'} 100%);
        filter:${nightFilter};">

        <!-- Sky layer -->
        <div style="position:absolute;top:0;left:0;right:0;height:38%;
          background:linear-gradient(180deg,
            ${isNight ? '#00050a' : '#1a3a1a'} 0%,
            transparent 100%);"></div>

        <!-- Far canopy (parallax slow) -->
        <div class="node-wl-treeline far" style="
          position:absolute;bottom:35%;left:-10%;width:120%;height:55%;
          background:none;">
          ${_wlTreeRow(12, 0.55, '#1a2e14', '#0f1f0b', isNight)}
        </div>

        <!-- Mid canopy -->
        <div class="node-wl-treeline mid" style="
          position:absolute;bottom:22%;left:-5%;width:110%;height:50%;
          animation:node-wl-sway 8s ease-in-out infinite;">
          ${_wlTreeRow(9, 0.75, '#1e3518', '#152512', isNight)}
        </div>

        <!-- Foreground brush + roots -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:30%;
          background:linear-gradient(180deg,transparent 0%,
            ${isNight ? '#01080a' : '#0a1f08'} 80%);"></div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:22%;
          background:${isNight ? '#010703' : '#0d2008'};
          border-top:2px solid ${isNight ? '#0a1a0a' : '#1a3a14'};"></div>

        <!-- Glowing mushrooms (unique to woodland) -->
        ${_wlMushrooms(isNight)}

        <!-- Fireflies at night -->
        ${isNight ? _wlFireflies() : ''}

        <!-- Night fog layer -->
        <div style="position:absolute;inset:0;
          background:rgba(0,5,2,${fogAlpha});pointer-events:none;"></div>
      </div>

      <style>
        @keyframes node-wl-sway {
          0%,100%{transform:translateX(0) scaleX(1);}
          50%{transform:translateX(-6px) scaleX(1.01);}
        }
        @keyframes node-wl-firefly {
          0%  {opacity:0;  transform:translate(0,0);}
          20% {opacity:0.9;transform:translate(4px,-6px);}
          60% {opacity:0.4;transform:translate(-3px,-12px);}
          100%{opacity:0;  transform:translate(2px,-18px);}
        }
        @keyframes node-wl-mush-glow {
          0%,100%{opacity:0.6;} 50%{opacity:1;}
        }
      </style>
    `;
  },

  // ── Combat arena ───────────────────────────────────────────────
  arenaHTML(loc, animal, isNight) {
    const bg = isNight ? '#010703' : '#0a1a08';
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:${bg};">
        <!-- Dense tree silhouettes framing the fight -->
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          ${_arenaTreeSilhouettes(isNight)}
          <!-- Ground roots -->
          <ellipse cx="50%" cy="85%" rx="45%" ry="6%" fill="${isNight ? '#010a03' : '#0d1f08'}" opacity="0.9"/>
          <!-- Moonlight / dappled light shaft -->
          <ellipse cx="50%" cy="40%" rx="22%" ry="50%"
            fill="${isNight ? 'rgba(100,200,120,0.04)' : 'rgba(120,200,80,0.08)'}"/>
        </svg>
        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(0,4,2,0.5);"></div>' : ''}
      </div>
    `;
  },

  // ── Worldmap overlay ───────────────────────────────────────────
  drawOverlay(ctx, x, y, w, h, seed) {
    // Canopy circles — clustered tree crowns
    const rng = _seededRng(seed);
    const count = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const cx = x + rng() * w;
      const cy = y + rng() * h;
      const r  = 3 + rng() * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${20 + rng()*20|0},${60 + rng()*30|0},${10 + rng()*15|0},0.85)`;
      ctx.fill();
      // Highlight
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80,160,40,0.3)';
      ctx.fill();
    }
  },
});

// ── Private helpers ──────────────────────────────────────────────

function _wlTreeRow(count, scale, fill, shadow, isNight) {
  let html = '';
  const spread = 100 / count;
  for (let i = 0; i < count; i++) {
    const left = i * spread + (Math.sin(i * 1.7) * spread * 0.3);
    const h    = 60 + Math.sin(i * 2.3) * 25;
    const w    = 28 + Math.cos(i * 1.4) * 10;
    html += `<div style="position:absolute;bottom:0;left:${left}%;
      width:${w * scale}px;height:${h * scale}px;
      background:${isNight ? shadow : fill};
      clip-path:polygon(50% 0%,90% 50%,75% 100%,25% 100%,10% 50%);
      opacity:0.9;"></div>`;
    // Trunk
    html += `<div style="position:absolute;bottom:-2%;left:${left + w*scale*0.43/8}%;
      width:${5 * scale}px;height:${20 * scale}px;
      background:${isNight ? '#0a0803' : '#1a1008'};opacity:0.8;"></div>`;
  }
  return html;
}

function _wlMushrooms(isNight) {
  const spots = [[8,88],[22,91],[55,90],[70,87],[85,89],[40,92]];
  return spots.map(([left, bottom]) => `
    <div style="position:absolute;left:${left}%;bottom:${100 - bottom}%;
      width:10px;height:10px;">
      <div style="width:14px;height:8px;border-radius:50% 50% 0 0;
        background:${isNight ? '#8a2a8a' : '#c03a18'};
        box-shadow:0 0 ${isNight ? 8 : 2}px ${isNight ? '#a040a0' : 'transparent'};
        animation:node-wl-mush-glow 3s ease-in-out infinite;
        animation-delay:${left * 0.05}s;"></div>
      <div style="width:4px;height:6px;margin:0 auto;
        background:${isNight ? '#5a2040' : '#8a3a20'};"></div>
    </div>`).join('');
}

function _wlFireflies() {
  return Array.from({length: 8}, (_, i) => `
    <div style="position:absolute;
      left:${10 + i * 11}%;top:${20 + (i%3)*18}%;
      width:3px;height:3px;border-radius:50%;
      background:#80ff80;
      box-shadow:0 0 6px #40ff40;
      animation:node-wl-firefly ${2.5 + i*0.4}s ease-in-out infinite;
      animation-delay:${i * 0.35}s;"></div>`).join('');
}

function _arenaTreeSilhouettes(isNight) {
  const trees = [
    {x:2,  h:85, w:18},
    {x:12, h:95, w:22},
    {x:75, h:90, w:20},
    {x:85, h:78, w:16},
  ];
  const fill = isNight ? '#010803' : '#0d2008';
  return trees.map(t =>
    `<polygon points="${t.x}%,${100-t.h}% ${t.x+t.w/2}%,${100-t.h}% ${t.x+t.w}%,100% ${t.x}%,100%"
      fill="${fill}" opacity="0.95"/>`
  ).join('');
}

function _seededRng(seed) {
  let s = (seed | 0) || 42;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}
