// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeFishPond.js
// 🎣 Fishing pond — murky irradiated water
// Exclusive monster: MUTANT PIKE (giant irradiated predator fish)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['pond'],

  exclusiveMonster: {
    id: 'mutant_pike',
    name: 'Mutant Pike',
    emoji: '🐟',
    baseStrength: 24,
    strength: 24,
    loot: ['food', 'food', 'chemicals'],
    desc: 'A grotesquely enlarged freshwater predator — it will bite through your wheel.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#01030a' : '#080d14';
    return `
      <div class="node-scene node-fishpond" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#050a10 55%,#030608 100%);">

        <!-- Sky reflection glow -->
        <div style="position:absolute;top:0;left:0;right:0;height:35%;
          background:linear-gradient(180deg,
            rgba(${isNight?'5,15,30':'15,30,60'},0.5) 0%,transparent 100%);"></div>

        <!-- Reeds at edges -->
        ${_fpReeds('left', isNight)}
        ${_fpReeds('right', isNight)}

        <!-- Water surface (main) -->
        <div style="position:absolute;bottom:18%;left:0;right:0;height:40%;
          background:${isNight?'rgba(5,15,30,0.85)':'rgba(8,20,40,0.75)'};
          border-top:1px solid rgba(${isNight?'20,50,80':'30,70,120'},0.4);">
          <!-- Ripple rings -->
          ${_fpRipples(isNight)}
        </div>

        <!-- Lily pads -->
        ${_fpLilyPads(isNight)}

        <!-- Bioluminescent algae glow (irradiation) -->
        ${_fpAlgae(isNight)}

        <!-- Ground bank -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#030506;border-top:1px solid #0a1010;"></div>

        <!-- Water line fog at night -->
        ${isNight ? `<div style="position:absolute;bottom:56%;left:0;right:0;height:8%;
          background:linear-gradient(180deg,transparent,rgba(10,20,30,0.3),transparent);
          animation:node-fp-mistdrift 6s ease-in-out infinite;"></div>` : ''}

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(1,2,5,0.45);"></div>' : ''}
      </div>
      <style>
        @keyframes node-fp-ripple {
          0%{transform:scale(0.2);opacity:0.8;}
          100%{transform:scale(2.5);opacity:0;}
        }
        @keyframes node-fp-sway-reed {
          0%,100%{transform:rotate(-3deg);} 50%{transform:rotate(3deg);}
        }
        @keyframes node-fp-mistdrift {
          0%,100%{opacity:0.4;transform:translateX(0);} 50%{opacity:0.7;transform:translateX(8px);}
        }
        @keyframes node-fp-algae-pulse {
          0%,100%{opacity:0.3;} 50%{opacity:0.7;}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;
        background:${isNight?'#010305':'#050a10'};">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Water fills bottom half -->
          <rect x="0" y="45%" width="100%" height="55%"
            fill="rgba(5,15,30,0.9)"/>
          <!-- Water surface line -->
          <line x1="0" y1="45%" x2="100%" y2="45%"
            stroke="rgba(30,80,140,0.4)" stroke-width="1"/>
          <!-- Depth glow beneath -->
          <ellipse cx="50%" cy="70%" rx="45%" ry="20%"
            fill="rgba(0,80,120,0.06)"/>
          <!-- Biolum algae spot -->
          <ellipse cx="30%" cy="65%" rx="12%" ry="5%"
            fill="rgba(0,180,80,0.06)"/>
          <!-- Reed silhouettes -->
          ${[8,14,82,88].map(x=>
            `<line x1="${x}%" y1="100%" x2="${x+1}%" y2="25%"
               stroke="${isNight?'#04080a':'#060d0e'}" stroke-width="4"/>`
          ).join('')}
        </svg>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _fpRng(seed);
    // Dark water fill
    ctx.fillStyle = `rgba(${5+rng()*5|0},${15+rng()*10|0},${30+rng()*15|0},0.8)`;
    ctx.fillRect(x, y, w, h);
    // Ripple arcs
    ctx.strokeStyle = 'rgba(30,80,140,0.3)';
    ctx.lineWidth = 0.5;
    const rx = x + w*0.5, ry = y + h*0.5;
    ctx.beginPath(); ctx.arc(rx, ry, w*0.3, 0, Math.PI*2); ctx.stroke();
    // Lily pad dot
    if (rng() > 0.5) {
      ctx.fillStyle = 'rgba(20,60,20,0.5)';
      ctx.beginPath(); ctx.arc(x+rng()*w, y+rng()*h, 2+rng()*2, 0, Math.PI*2); ctx.fill();
    }
  },
});

function _fpReeds(side, isNight) {
  const isLeft = side === 'left';
  const c = isNight ? '#040a0a' : '#060d0d';
  return Array.from({length:6},(_,i)=>`
    <div style="position:absolute;bottom:15%;${isLeft?'left':'right'}:${i*4+1}%;
      width:3px;height:${30+i%3*10}%;
      background:${c};
      animation:node-fp-sway-reed ${2.5+i*0.3}s ease-in-out infinite;
      animation-delay:${i*0.2}s;transform-origin:bottom center;">
      <div style="position:absolute;top:-6px;left:-2px;
        width:7px;height:7px;border-radius:50%;
        background:${isNight?'#0a1408':'#0d1a0a'};"></div>
    </div>`).join('');
}

function _fpRipples(isNight) {
  return [[20,50],[50,70],[75,55]].map(([l,t])=>`
    <div style="position:absolute;left:${l}%;top:${t}%;
      width:20px;height:8px;border-radius:50%;
      border:1px solid rgba(${isNight?'20,60,100':'30,80,140'},0.4);
      animation:node-fp-ripple ${2+l*0.03}s ease-out infinite;
      animation-delay:${l*0.06}s;"></div>`).join('');
}

function _fpLilyPads(isNight) {
  return [[18,42],[45,40],[68,43],[82,41]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:14px;height:8px;border-radius:50%;
      background:${isNight?'rgba(10,25,12,0.6)':'rgba(15,35,15,0.55)'};
      border:1px solid rgba(20,50,20,0.3);"></div>`).join('');
}

function _fpAlgae(isNight) {
  return [[22,45],[55,44],[78,46]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:18px;height:6px;border-radius:50%;
      background:rgba(0,${isNight?130:80},40,0.15);
      box-shadow:0 0 ${isNight?8:3}px rgba(0,160,50,0.15);
      animation:node-fp-algae-pulse ${3+l*0.03}s ease-in-out infinite;
      animation-delay:${l*0.05}s;"></div>`).join('');
}

function _fpRng(s){ let r=(s|0)||43; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
