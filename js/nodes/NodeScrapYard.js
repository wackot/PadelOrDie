// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeScrapYard.js
// ⚙️ Metal / Scrap resource node — rusted industrial wasteland
// Exclusive monster: SCRAP GOLEM (animated heap of metal junk)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['metal'],

  exclusiveMonster: {
    id: 'scrap_golem',
    name: 'Scrap Golem',
    emoji: '🤖',
    baseStrength: 35,
    strength: 35,
    loot: ['metal', 'electronics', 'scrap_wire'],
    desc: 'A shambling mass of rusted metal — slow but nearly impossible to stop.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#04040a' : '#1a1208';
    return `
      <div class="node-scene node-scrapyard" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#100a06 60%,#0a0604 100%);">

        <!-- Toxic haze horizon -->
        <div style="position:absolute;top:30%;left:0;right:0;height:20%;
          background:linear-gradient(180deg,transparent,rgba(80,40,0,0.18),transparent);"></div>

        <!-- Distant crane silhouette -->
        <div style="position:absolute;top:5%;right:8%;width:40px;height:120px;">
          <div style="position:absolute;top:0;left:18px;width:4px;height:80px;background:#1a1008;"></div>
          <div style="position:absolute;top:0;left:0;width:40px;height:4px;background:#1a1008;"></div>
          <div style="position:absolute;top:4px;right:0;width:3px;height:30px;background:#1a1008;opacity:0.7;"></div>
        </div>

        <!-- Rusted car hulks (silhouette row) -->
        ${_syCarRow(isNight)}

        <!-- Foreground scrap piles -->
        ${_syScrapPiles(isNight)}

        <!-- Rust dust particles -->
        ${_syDust(isNight)}

        <!-- Ground -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#0a0604;border-top:1px solid #2a1a0a;"></div>

        <!-- Oil slick puddles -->
        <div style="position:absolute;bottom:18%;left:15%;width:60px;height:10px;
          border-radius:50%;background:rgba(30,15,5,0.7);
          box-shadow:0 0 8px rgba(60,30,10,0.4);"></div>
        <div style="position:absolute;bottom:16%;left:55%;width:40px;height:8px;
          border-radius:50%;background:rgba(20,10,5,0.6);"></div>

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(2,1,0,0.55);"></div>' : ''}
      </div>

      <style>
        @keyframes node-sy-dust {
          0%  {opacity:0;  transform:translate(0,0)   scale(1);}
          40% {opacity:0.6;transform:translate(8px,-12px) scale(1.3);}
          100%{opacity:0;  transform:translate(14px,-24px) scale(0.8);}
        }
        @keyframes node-sy-flicker {
          0%,100%{opacity:0.5;} 47%{opacity:0.8;} 48%{opacity:0.1;} 52%{opacity:0.7;}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    const bg = isNight ? '#030204' : '#0a0704';
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:${bg};">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Rusted beam framework -->
          <line x1="5%" y1="0" x2="12%" y2="100%" stroke="#1a0e06" stroke-width="8" opacity="0.9"/>
          <line x1="88%" y1="0" x2="82%" y2="100%" stroke="#1a0e06" stroke-width="8" opacity="0.9"/>
          <line x1="0" y1="30%" x2="100%" y2="28%" stroke="#140a04" stroke-width="5" opacity="0.7"/>
          <!-- Hanging chains -->
          ${[18,38,62,80].map(x =>
            `<path d="M${x}%,0 Q${x+3}%,15% ${x}%,30% Q${x-3}%,45% ${x}%,55%"
              fill="none" stroke="#2a1a0a" stroke-width="2" opacity="0.8"/>`
          ).join('')}
          <!-- Scrap pile ground -->
          <ellipse cx="50%" cy="90%" rx="55%" ry="8%" fill="#0a0604" opacity="0.95"/>
          <!-- Toxic glow from ground cracks -->
          <ellipse cx="35%" cy="88%" rx="12%" ry="3%"
            fill="${isNight ? 'rgba(180,60,0,0.12)' : 'rgba(140,50,0,0.08)'}"/>
        </svg>
        <!-- Smouldering embers -->
        ${Array.from({length:6},(_,i)=>`
          <div style="position:absolute;
            left:${8+i*15}%;bottom:${5+i%3*3}%;
            width:3px;height:3px;border-radius:50%;
            background:#ff4400;box-shadow:0 0 5px #ff6600;
            animation:node-sy-flicker ${1.2+i*0.3}s ease-in-out infinite;
            animation-delay:${i*0.2}s;"></div>`).join('')}
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _syRng(seed);
    // Rust-coloured angular scrap fragments
    for (let i = 0; i < 4; i++) {
      const px = x + rng() * w;
      const py = y + rng() * h;
      const sz = 2 + rng() * 4;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rng() * Math.PI);
      ctx.fillStyle = `rgba(${80+rng()*40|0},${30+rng()*20|0},${5+rng()*10|0},0.8)`;
      ctx.fillRect(-sz/2, -sz/4, sz, sz/2);
      ctx.restore();
    }
    // Small rust dot cluster
    ctx.fillStyle = 'rgba(100,45,10,0.5)';
    ctx.beginPath();
    ctx.arc(x + w*0.5, y + h*0.5, 3 + rng()*3, 0, Math.PI*2);
    ctx.fill();
  },
});

function _syCarRow(isNight) {
  const cars = [{l:5,w:55,h:22},{l:28,w:50,h:20},{l:55,w:58,h:24},{l:75,w:45,h:18}];
  return cars.map(c => `
    <div style="position:absolute;bottom:22%;left:${c.l}%;
      width:${c.w}px;height:${c.h}px;
      background:${isNight ? '#0c0804' : '#1a1008'};
      border-radius:4px 8px 0 0;opacity:0.85;">
      <div style="position:absolute;top:3px;left:8px;right:8px;height:9px;
        background:${isNight ? '#060402' : '#100804'};border-radius:3px 6px 0 0;"></div>
    </div>`).join('');
}

function _syScrapPiles(isNight) {
  const col = isNight ? '#120d06' : '#1e1408';
  return `
    <div style="position:absolute;bottom:18%;left:2%;
      width:70px;height:28px;border-radius:50% 50% 0 0;
      background:${col};opacity:0.9;"></div>
    <div style="position:absolute;bottom:18%;left:40%;
      width:55px;height:22px;border-radius:50% 50% 0 0;
      background:${col};opacity:0.85;"></div>
    <div style="position:absolute;bottom:18%;right:5%;
      width:65px;height:25px;border-radius:50% 50% 0 0;
      background:${col};opacity:0.9;"></div>`;
}

function _syDust(isNight) {
  return Array.from({length:5},(_,i)=>`
    <div style="position:absolute;
      left:${20+i*14}%;top:${40+i%2*10}%;
      width:5px;height:5px;border-radius:50%;
      background:rgba(${isNight?'60,30,5':'100,50,10'},0.4);
      animation:node-sy-dust ${2+i*0.4}s ease-out infinite;
      animation-delay:${i*0.5}s;"></div>`).join('');
}

function _syRng(seed) {
  let s = (seed | 0) || 17;
  return () => { s = (s * 16807) % 2147483647; return (s-1)/2147483646; };
}
