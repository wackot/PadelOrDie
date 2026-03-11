// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeTechRuins.js
// 💡 Electronics resource node — collapsed server farm / data centre
// Exclusive monster: STATIC REVENANT (EMP-charged wraith)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['electronics', 'circuit_board'],

  exclusiveMonster: {
    id: 'static_revenant',
    name: 'Static Revenant',
    emoji: '⚡',
    baseStrength: 45,
    strength: 45,
    loot: ['electronics', 'circuit_board', 'scrap_wire'],
    desc: 'A corpse animated by residual EMP energy — it shorts out everything it touches.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#020408' : '#060810';
    return `
      <div class="node-scene node-techruins" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#040610 55%,#020308 100%);">

        <!-- Server rack silhouettes -->
        ${_trRacks(isNight)}

        <!-- Blinking LED indicators -->
        ${_trLEDs(isNight)}

        <!-- Exposed cable bundles -->
        ${_trCables(isNight)}

        <!-- Static discharge arcs -->
        ${_trArcs(isNight)}

        <!-- Data screen glows (dead monitors) -->
        ${_trScreens(isNight)}

        <div style="position:absolute;bottom:0;left:0;right:0;height:18%;
          background:#020308;border-top:1px solid #080c18;"></div>

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(1,2,4,0.5);"></div>' : ''}
      </div>
      <style>
        @keyframes node-tr-blink {
          0%,100%{opacity:0.2;} 45%{opacity:0.2;} 50%{opacity:1;} 55%{opacity:0.2;}
        }
        @keyframes node-tr-arc {
          0%,100%{opacity:0;} 10%{opacity:0.8;} 15%{opacity:0;} 60%{opacity:0;} 65%{opacity:0.6;} 70%{opacity:0;}
        }
        @keyframes node-tr-scanline {
          0%{transform:translateY(-100%);} 100%{transform:translateY(200%);}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#020308;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Server rack frames flanking arena -->
          <rect x="0" y="5%" width="10%" height="90%" fill="#040610" opacity="0.9" rx="2"/>
          <rect x="90%" y="5%" width="10%" height="90%" fill="#040610" opacity="0.9" rx="2"/>
          <!-- Rack unit lines -->
          ${Array.from({length:8},(_,i)=>
            `<line x1="0" y1="${8+i*10}%" x2="10%" y2="${8+i*10}%"
               stroke="rgba(0,80,120,0.2)" stroke-width="1"/>
             <line x1="90%" y1="${8+i*10}%" x2="100%" y2="${8+i*10}%"
               stroke="rgba(0,80,120,0.2)" stroke-width="1"/>`
          ).join('')}
          <!-- Floor cable tray glow -->
          <rect x="0" y="85%" width="100%" height="5%"
            fill="rgba(0,60,120,0.08)"/>
          <!-- EMP static ceiling -->
          <ellipse cx="50%" cy="5%" rx="40%" ry="8%"
            fill="rgba(100,80,200,0.06)"/>
        </svg>
        <!-- Scanline effect -->
        <div style="position:absolute;left:0;right:0;top:0;height:4px;
          background:linear-gradient(180deg,transparent,rgba(0,120,200,0.1),transparent);
          animation:node-tr-scanline 3s linear infinite;"></div>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _trRng(seed);
    // Circuit board grid pattern
    ctx.strokeStyle = `rgba(0,${40+rng()*40|0},${60+rng()*40|0},0.5)`;
    ctx.lineWidth = 0.5;
    // Horizontal trace
    ctx.beginPath(); ctx.moveTo(x,y+h*0.4); ctx.lineTo(x+w,y+h*0.4); ctx.stroke();
    // Vertical trace
    ctx.beginPath(); ctx.moveTo(x+w*0.6,y); ctx.lineTo(x+w*0.6,y+h); ctx.stroke();
    // Solder point
    ctx.fillStyle = `rgba(${60+rng()*40|0},${50+rng()*30|0},${100+rng()*60|0},0.6)`;
    ctx.beginPath(); ctx.arc(x+w*0.6, y+h*0.4, 2, 0, Math.PI*2); ctx.fill();
    // LED dot
    if (rng() > 0.5) {
      ctx.fillStyle = `rgba(0,${150+rng()*100|0},${80+rng()*60|0},0.6)`;
      ctx.beginPath(); ctx.arc(x+rng()*w, y+rng()*h, 1.5, 0, Math.PI*2); ctx.fill();
    }
  },
});

function _trRacks(isNight) {
  const c = isNight ? '#030510' : '#050812';
  return [[2,70],[18,75],[55,68],[72,72],[84,70]].map(([l,h])=>`
    <div style="position:absolute;bottom:18%;left:${l}%;
      width:14px;height:${h}%;background:${c};opacity:0.9;
      border:1px solid rgba(0,40,80,0.3);">
      ${Array.from({length:5},(_,i)=>`
        <div style="position:absolute;top:${i*18+4}%;left:2px;right:2px;height:3px;
          background:rgba(0,30,60,0.4);"></div>`).join('')}
    </div>`).join('');
}

function _trLEDs(isNight) {
  return Array.from({length:10},(_,i)=>`
    <div style="position:absolute;
      left:${3+i*9}%;top:${22+i%4*12}%;
      width:3px;height:3px;border-radius:50%;
      background:${['#00ff88','#0088ff','#ff4400','#00ccff','#88ff00'][i%5]};
      opacity:0.6;
      animation:node-tr-blink ${0.8+i*0.3}s step-end infinite;
      animation-delay:${i*0.22}s;"></div>`).join('');
}

function _trCables(isNight) {
  return [[5,65,25,80],[30,70,60,65],[50,60,80,72],[70,65,90,60]].map(([x1,y1,x2,y2])=>`
    <div style="position:absolute;
      top:${y1}%;left:${x1}%;
      width:${Math.abs(x2-x1)}%;height:3px;
      background:${isNight?'rgba(0,40,80,0.5)':'rgba(0,30,60,0.4)'};
      transform:rotate(${Math.atan2(y2-y1,x2-x1)*180/Math.PI}deg);
      transform-origin:left center;"></div>`).join('');
}

function _trArcs(isNight) {
  return [[20,40],[55,35],[78,45]].map(([l,t])=>`
    <div style="position:absolute;left:${l}%;top:${t}%;
      width:15px;height:8px;
      border-top:2px solid rgba(100,150,255,0.7);
      border-radius:50%;
      animation:node-tr-arc ${1.5+l*0.03}s ease-in-out infinite;
      animation-delay:${l*0.06}s;"></div>`).join('');
}

function _trScreens(isNight) {
  return [[35,25],[62,22]].map(([l,t])=>`
    <div style="position:absolute;left:${l}%;top:${t}%;
      width:22px;height:16px;
      background:rgba(0,20,40,0.6);
      border:1px solid rgba(0,60,120,0.3);
      overflow:hidden;">
      <div style="position:absolute;inset:0;
        background:${isNight?'rgba(0,80,160,0.08)':'rgba(0,50,100,0.06)'};"></div>
      <div style="position:absolute;top:30%;left:0;right:0;height:1px;
        background:rgba(0,120,200,0.15);
        animation:node-tr-scanline 4s linear infinite;
        animation-delay:${l*0.05}s;"></div>
    </div>`).join('');
}

function _trRng(s){ let r=(s|0)||37; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
