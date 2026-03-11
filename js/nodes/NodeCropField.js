// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeCropField.js
// 🌾 Food resource node — irradiated, overgrown cropland
// Exclusive monster: BLOATED CRAWLER (mutant slug-thing)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['food'],

  exclusiveMonster: {
    id: 'bloated_crawler',
    name: 'Bloated Crawler',
    emoji: '🐛',
    baseStrength: 18,
    strength: 18,
    loot: ['food', 'wild_seeds', 'food'],
    desc: 'A grotesquely swollen mutant grub — slow but acidic to the touch.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#020501' : '#0e1a05';
    return `
      <div class="node-scene node-cropfield" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#0f1a07 55%,#0a1205 100%);">

        <!-- Sky glow — sickly yellow-green irradiation -->
        <div style="position:absolute;top:0;left:0;right:0;height:40%;
          background:linear-gradient(180deg,
            rgba(${isNight?'5,15,2':'30,50,5'},0.6) 0%,transparent 100%);"></div>

        <!-- Distant silo silhouette -->
        <div style="position:absolute;top:8%;left:70%;width:18px;height:70px;
          background:#0a1004;opacity:0.8;"></div>
        <div style="position:absolute;top:6%;left:68%;width:22px;height:10px;
          border-radius:50% 50% 0 0;background:#0a1004;opacity:0.8;"></div>

        <!-- Crop rows (irradiated stalks) -->
        ${_cfCropRows(isNight)}

        <!-- Glowing seed pods -->
        ${_cfSeedPods(isNight)}

        <!-- Ground -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:22%;
          background:#0a1205;border-top:1px solid #1a2a08;"></div>

        <!-- Radiation shimmer -->
        <div style="position:absolute;bottom:20%;left:0;right:0;height:5%;
          background:linear-gradient(90deg,
            transparent,rgba(60,100,10,0.08),transparent);
          animation:node-cf-shimmer 4s ease-in-out infinite;"></div>

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(1,3,0,0.55);"></div>' : ''}
      </div>
      <style>
        @keyframes node-cf-shimmer {
          0%,100%{opacity:0.4;transform:scaleX(1);}
          50%{opacity:1;transform:scaleX(1.05);}
        }
        @keyframes node-cf-sway {
          0%,100%{transform:rotate(-2deg);} 50%{transform:rotate(2deg);}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;
        background:${isNight?'#010400':'#0a1205'};">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Crop stalk silhouettes framing arena -->
          ${[5,15,78,88].map(x=>`
            <line x1="${x}%" y1="100%" x2="${x+2}%" y2="20%"
              stroke="${isNight?'#0a1804':'#0f2206'}" stroke-width="6" opacity="0.9"/>
            <ellipse cx="${x+2}%" cy="18%" rx="5%" ry="8%"
              fill="${isNight?'#0a1a04':'#102806'}" opacity="0.8"/>
          `).join('')}
          <!-- Irradiated glow on ground -->
          <ellipse cx="50%" cy="90%" rx="40%" ry="8%"
            fill="rgba(40,80,5,0.12)"/>
        </svg>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _cfRng(seed);
    // Vertical stalk marks
    for (let i = 0; i < 3; i++) {
      const px = x + rng() * w;
      ctx.strokeStyle = `rgba(30,${60+rng()*30|0},8,0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, y + h);
      ctx.lineTo(px + (rng()-0.5)*2, y);
      ctx.stroke();
      // Seed head
      ctx.fillStyle = 'rgba(80,120,20,0.6)';
      ctx.beginPath();
      ctx.ellipse(px, y + rng()*h*0.3, 1.5, 3, 0, 0, Math.PI*2);
      ctx.fill();
    }
  },
});

function _cfCropRows(isNight) {
  const stalkColor = isNight ? '#0c1806' : '#16280a';
  let html = '';
  for (let i = 0; i < 7; i++) {
    const left = i * 14 + 2;
    html += `<div style="position:absolute;bottom:20%;left:${left}%;
      width:4px;height:${45+Math.sin(i)*10}%;
      background:${stalkColor};
      animation:node-cf-sway ${3+i*0.4}s ease-in-out infinite;
      animation-delay:${i*0.3}s;transform-origin:bottom center;">
      <div style="position:absolute;top:-8px;left:-4px;width:12px;height:10px;
        border-radius:50%;background:${isNight?'rgba(60,100,10,0.5)':'rgba(80,130,20,0.4)'};"></div>
    </div>`;
  }
  return html;
}

function _cfSeedPods(isNight) {
  return [[18,55],[42,48],[65,52],[82,50]].map(([l,b]) => `
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:8px;height:8px;border-radius:50%;
      background:${isNight?'rgba(40,80,5,0.7)':'rgba(80,140,15,0.5)'};
      box-shadow:0 0 ${isNight?6:2}px ${isNight?'rgba(60,120,10,0.6)':'transparent'};"></div>
  `).join('');
}
function _cfRng(s){ let r=(s|0)||7; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
