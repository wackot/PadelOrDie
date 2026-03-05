// ═══════════════════════════════════════════
// PEDAL OR DIE — raids.js  (Phase 2)
// Full raid system with dedicated combat screen,
// health bars, defence mechanic, and results
// ═══════════════════════════════════════════

const Raids = {

  _checkTimer:      null,
  _raidTimer:       null,
  _raidDuration:    45,
  _raidSeconds:     0,
  _currentAnimal:   null,
  _playerHealth:    100,
  _enemyHealth:     100,
  _enemyHealthMax:  100,
  _wasOnScreen:     'base',

  // ── Start random raid checks ───────────────
  startChecks() {
    this._checkTimer = setInterval(() => {
      if (this._checkPaused) return;
      if (!State.data.world.activeRaid) this._maybeRaid();
    }, 180000);
  },

  stopChecks() {
    clearInterval(this._checkTimer);
    clearInterval(this._raidTimer);
  },

  // ── Probabilistic raid trigger ─────────────
  _maybeRaid() {
    // Never raid while player is away from base — they can't defend
    if (Foraging.isActive()) return;
    if (typeof WorldMap !== 'undefined' && WorldMap._travelling) return;
    if (typeof DevMode !== 'undefined' && DevMode.raidsBlocked()) return;
    const daysSince  = State.data.world.daysSinceLastRaid;
    const isNight    = State.data.world.isNight;
    const baseChance = Utils.clamp(0.06 + daysSince * 0.04, 0.06, 0.55);
    // Night is always 2× — but if player is out foraging at night (with light) even MORE raids
    const nightEncReduction = State.data.base.bikeNightEncounterReduction || 0;
    const nightMult = (isNight ? 2.0 : 1.0) * (1 - nightEncReduction);
    const chance = baseChance * nightMult;
    if (Math.random() < chance) this.triggerRaid(isNight ? 'night' : 'random');
  },

  // ── Trigger a raid ─────────────────────────
  triggerRaid(source = 'random') {
    if (State.data.world.activeRaid) return;

    const animal              = Animals.randomRaidAnimal();
    this._currentAnimal       = animal;
    this._raidSeconds         = this._raidDuration;
    this._playerHealth        = 100;
    // Night raids: enemies are angrier (+40% health, more aggressive)
    const isNight    = State.data.world.isNight;
    const nightBoost = isNight ? 1.4 : 1.0;
    this._enemyHealth         = Utils.clamp(Math.round(animal.strength * 2 * nightBoost), 20, 280);
    this._enemyHealthMax      = this._enemyHealth;

    State.data.world.activeRaid        = true;
    State.data.world.raidStrength      = animal.strength;
    State.data.world.daysSinceLastRaid = 0;
    this._wasOnScreen  = State.data.world.currentScreen;
    this._raidStartTime = null; // reset timestamp — set when first tick fires

    Utils.toast(`⚠ ${animal.emoji} ${animal.name} attacks your base!`, 'bad', 3000);
    Audio.sfxRaidAlert();
    setTimeout(() => this._openRaidScreen(), 1500);
    console.log('[Raids] Triggered:', animal.name, 'source:', source);
  },

  // ── Open raid screen ──────────────────────
  _openRaidScreen() {
    this._buildRaidScreen();
    Game.goTo('raid');
    Audio.play('raid');
    this._raidTimer = setInterval(() => this._raidTick(), 1000);
  },

  // ── Build raid screen — animated SVG arena ──
  _buildRaidScreen() {
    const screen = document.getElementById('screen-raid');
    if (!screen) return;

    const animal  = this._currentAnimal;
    const defence = State.data.base.defenceRating;
    const isNight = State.data.world.isNight;

    // Title bar + alert
    screen.innerHTML =
      '<div class="raid-bg' + (isNight ? ' raid-bg-night' : '') + '"></div>' +
      (isNight ? '<div class="night-stars" id="raid-stars"></div>' : '') +
      '<div class="raid-screen-wrap">' +
        '<div class="raid-title-bar">' +
          '<div class="raid-title raid-title-flash">⚠ BASE UNDER ATTACK ⚠</div>' +
          '<div class="raid-animal-display">' + animal.emoji + ' ' + animal.name + ' — STR ' + animal.strength + '</div>' +
        '</div>' +
        // ── Animated SVG combat arena (reused from foraging) ──
        '<div class="raid-arena-wrap">' +
          this._buildRaidArenaHTML(animal) +
        '</div>' +
        // Timer + defence row
        '<div class="raid-info-row">' +
          '<span class="raid-info-cell">⏱ <span id="raid-timer">' + this._raidDuration + '</span>s</span>' +
          '<span class="raid-info-cell">🛡 ' + defence + ' DEF</span>' +
          '<span class="raid-info-cell">CPM <span id="raid-cpm">0</span></span>' +
        '</div>' +
        // Cadence bar
        '<div class="raid-cadence-zone">' +
          '<div class="raid-cadence-label">PEDAL FASTER TO DEFEND — HIT TARGET LINE TO ATTACK!</div>' +
          '<div class="raid-cadence-bar-wrap">' +
            '<div class="raid-cadence-fill" id="raid-cadence-bar" style="width:0%"></div>' +
            '<div class="raid-target-line"></div>' +
          '</div>' +
        '</div>' +
        '<button class="btn-raid-pedal" id="btn-raid-pedal">⚔️ PEDAL TO FIGHT!</button>' +
      '</div>';

    Cadence.stop();

    const btn = document.getElementById('btn-raid-pedal');
    if (btn) {
      let lastTouch = 0;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); lastTouch = Date.now(); this._onRaidClick();
      }, { passive: false });
      btn.addEventListener('click', () => {
        if (Date.now() - lastTouch > 300) this._onRaidClick();
      });
    }

    // Monster enter animation
    setTimeout(() => {
      const mon = document.getElementById('ca-monster');
      if (mon) mon.style.animation = 'ca-monster-enter 0.4s ease-out forwards';
    }, 50);

    if (isNight) this._generateStars('raid-stars');
    Cadence.start();
  },

  // ── Build the animated SVG arena HTML ────────
  _buildRaidArenaHTML(animal) {
    const isNight = State.data.world.isNight;
    const bgCol   = isNight ? '#050510' : '#0d1208';

    return '<div class="ca-overlay" id="raid-ca-overlay">' +
      // HP bars row (reuse foraging ca styles)
      '<div class="ca-hpbars">' +
        '<div class="ca-hp-side player-side">' +
          '<span class="ca-hp-label">🛡 BASE</span>' +
          '<div class="ca-hp-wrap"><div class="ca-hp-fill player-hp" id="raid-player-hp" style="width:' + this._playerHealth + '%"></div></div>' +
        '</div>' +
        '<div class="ca-vs">VS</div>' +
        '<div class="ca-hp-side monster-side">' +
          '<div class="ca-hp-wrap"><div class="ca-hp-fill monster-hp" id="raid-enemy-hp" style="width:100%"></div></div>' +
          '<span class="ca-hp-label">' + animal.name + '</span>' +
        '</div>' +
      '</div>' +
      // SVG arena
      '<svg class="ca-svg" id="raid-ca-svg" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet">' +
        '<defs>' +
          '<filter id="ca-glow-red"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '<filter id="ca-glow-hit"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '<filter id="ca-shadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/></filter>' +
        '</defs>' +
        '<rect width="320" height="100" fill="' + (isNight ? '#050510' : '#0d1208') + '"/>' +
        (isNight ?
          '<circle cx="280" cy="20" r="10" fill="#d4d0c0" opacity="0.6"/>' +
          '<circle cx="40" cy="15" r="2" fill="white" opacity="0.7"/>' +
          '<circle cx="180" cy="10" r="2" fill="white" opacity="0.5"/>' : '') +
        '<rect y="100" width="320" height="60" fill="' + bgCol + '"/>' +
        '<rect y="100" width="320" height="4" fill="rgba(0,0,0,0.4)"/>' +
        '<line x1="0" y1="108" x2="320" y2="108" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>' +
        // Player (base defender — left side)
        '<g id="ca-player" filter="url(#ca-shadow)">' +
          this._raidPlayerSVG(80, 88) +
        '</g>' +
        // Monster (right side — same SVG as foraging)
        '<g id="ca-monster" filter="url(#ca-shadow)">' +
          (typeof Foraging !== 'undefined' ? Foraging._monsterSVG(animal.id, 240, 88) : '<text x="240" y="88" text-anchor="middle" font-size="40">' + animal.emoji + '</text>') +
        '</g>' +
        '<g id="ca-effects"></g>' +
      '</svg>' +
      '<div class="ca-status" id="ca-status">⚔️ PEDAL TO DEFEND YOUR BASE!</div>' +
      '<div class="ca-lose-row">' +
        '<span class="ca-lose-label">⏱ <span id="ca-lose-secs">' + this._raidDuration + '</span>s</span>' +
        '<div class="ca-lose-wrap"><div class="ca-lose-bar" id="ca-lose-bar" style="width:0%"></div></div>' +
      '</div>' +
    '</div>';
  },

  // ── Base defender SVG — armoured figure with shield ──
  _raidPlayerSVG(cx, cy) {
    return (
      // Shadow
      '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>' +
      // Shield (big, left)
      '<rect x="' + (cx-30) + '" y="' + (cy-28) + '" width="18" height="28" fill="#3a5a8a" rx="3" stroke="#5a8abb" stroke-width="1.5"/>' +
      '<line x1="' + (cx-21) + '" y1="' + (cy-28) + '" x2="' + (cx-21) + '" y2="' + cy + '" stroke="#5a8abb" stroke-width="1" opacity="0.5"/>' +
      '<circle cx="' + (cx-21) + '" cy="' + (cy-14) + '" r="4" fill="#6a9adb" opacity="0.7"/>' +
      // Body
      '<rect x="' + (cx-10) + '" y="' + (cy-22) + '" width="18" height="24" fill="#4a4a5a" rx="2"/>' +
      // Armour plates
      '<rect x="' + (cx-10) + '" y="' + (cy-22) + '" width="18" height="8" fill="#5a5a6a" rx="2"/>' +
      '<line x1="' + (cx-10) + '" y1="' + (cy-10) + '" x2="' + (cx+8) + '" y2="' + (cy-10) + '" stroke="#6a6a7a" stroke-width="1"/>' +
      '<line x1="' + (cx-10) + '" y1="' + (cy-4) + '" x2="' + (cx+8) + '" y2="' + (cy-4) + '" stroke="#6a6a7a" stroke-width="1"/>' +
      // Head (helmet)
      '<circle cx="' + (cx-1) + '" cy="' + (cy-28) + '" r="10" fill="#5a5a6a"/>' +
      '<rect x="' + (cx-9) + '" y="' + (cy-32) + '" width="17" height="5" fill="#6a6a7a" rx="1"/>' +
      // Visor slit
      '<rect x="' + (cx-6) + '" y="' + (cy-27) + '" width="12" height="3" fill="#1a1a2a" rx="1"/>' +
      '<line x1="' + (cx-4) + '" y1="' + (cy-26) + '" x2="' + (cx-4) + '" y2="' + (cy-25) + '" stroke="#ef5350" stroke-width="1.5" opacity="0.8"/>' +
      '<line x1="' + (cx) + '" y1="' + (cy-26) + '" x2="' + (cx) + '" y2="' + (cy-25) + '" stroke="#ef5350" stroke-width="1.5" opacity="0.8"/>' +
      // Sword arm (right, raised)
      '<line x1="' + (cx+8) + '" y1="' + (cy-18) + '" x2="' + (cx+22) + '" y2="' + (cy-38) + '" stroke="#888" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="' + (cx+17) + '" y="' + (cy-44) + '" width="4" height="16" fill="#aaa" rx="1" transform="rotate(30 ' + (cx+19) + ' ' + (cy-36) + ')"/>' +
      '<rect x="' + (cx+13) + '" y="' + (cy-36) + '" width="12" height="3" fill="#888" rx="1" transform="rotate(30 ' + (cx+19) + ' ' + (cy-34) + ')"/>' +
      // Legs
      '<rect x="' + (cx-8) + '" y="' + (cy+2) + '" width="7" height="10" fill="#4a4a5a" rx="1"/>' +
      '<rect x="' + (cx+1) + '" y="' + (cy+2) + '" width="7" height="10" fill="#4a4a5a" rx="1"/>'
    );
  },

  // ── Player clicks to fight ─────────────────
  _onRaidClick() {
    Cadence.registerClick();
    Audio.sfxPedal();
    const ratio   = Cadence.getRatio();
    const defence = State.data.base.defenceRating;
    const dmg     = Utils.randFloat(0.5, 1.5) * ratio * (1 + defence / 100);
    this._enemyHealth = Math.max(0, this._enemyHealth - dmg);
    // Animate: player lunges toward monster on click if ratio is good
    if (ratio >= 1.0) {
      const player = document.getElementById('ca-player');
      if (player) {
        player.style.transition = 'transform 0.07s ease-out';
        player.style.transform  = 'translateX(16px) rotate(4deg)';
        setTimeout(() => { player.style.transform = ''; }, 140);
      }
      this._raidSpawnHit(true, dmg);
      this._raidArenaShake(4);
    } else if (ratio >= 0.6) {
      const player = document.getElementById('ca-player');
      if (player) {
        player.style.transition = 'transform 0.1s ease-out';
        player.style.transform  = 'translateX(8px)';
        setTimeout(() => { player.style.transform = ''; }, 160);
      }
      this._raidSpawnHit(false, dmg);
    }
    this._updateRaidHP();
    this._updatePedalBtn();
    if (this._enemyHealth <= 0) this._endRaid(true);
  },

  // ── Raid tick ─────────────────────────────
  _raidTick() {
    if (this._checkPaused) return;

    if (!this._raidStartTime) this._raidStartTime = Date.now();
    const elapsed  = Math.floor((Date.now() - this._raidStartTime) / 1000);
    this._raidSeconds = Math.max(0, this._raidDuration - elapsed);

    const timerEl = document.getElementById('raid-timer');
    if (timerEl) timerEl.textContent = this._raidSeconds + 's';

    const loseSecs = document.getElementById('ca-lose-secs');
    if (loseSecs) loseSecs.textContent = this._raidSeconds;

    // Lose bar shows time pressure (fills as time runs out)
    const loseBar = document.getElementById('ca-lose-bar');
    if (loseBar) loseBar.style.width = (100 - (this._raidSeconds / this._raidDuration) * 100) + '%';

    const ratio    = Cadence.getRatio();
    const strength = this._currentAnimal ? this._currentAnimal.strength : 10;
    const enemyDmg = strength * 0.15 * (1 - ratio * 0.7);
    this._playerHealth = Math.max(0, this._playerHealth - enemyDmg);

    this._updateCadenceBar();
    this._updateRaidHP();

    // End raid early if base is overrun
    if (this._playerHealth <= 0) {
      this._endRaid(false);
      return;
    }

    // Arena phase animations (mirrors foraging _arenaUpdate)
    const mon    = document.getElementById('ca-monster');
    const player = document.getElementById('ca-player');
    const status = document.getElementById('ca-status');

    if (ratio >= 1.4) {
      if (status) { status.textContent = '💥 FULL COUNTER-ATTACK!'; status.className = 'ca-status ca-status-heavy'; }
      if (mon) { mon.style.transition = 'transform 0.15s ease-out'; mon.style.transform = 'translateX(14px) rotate(5deg) scaleX(0.94)'; setTimeout(() => { mon.style.transform = ''; }, 220); }
    } else if (ratio >= 1.0) {
      if (status) { status.textContent = '⚔️ Holding the line! Keep pedalling!'; status.className = 'ca-status ca-status-light'; }
      if (mon) { mon.style.transition = 'transform 0.15s ease-out'; mon.style.transform = 'translateX(6px) rotate(2deg)'; setTimeout(() => { mon.style.transform = ''; }, 200); }
    } else {
      // Monster attacks base — player recoils
      if (status) { status.textContent = '😰 BASE TAKING DAMAGE — PEDAL HARDER!'; status.className = 'ca-status ca-status-danger'; }
      if (mon)    { mon.style.transition = 'transform 0.1s ease-out'; mon.style.transform = 'translateX(-18px) scaleX(1.06)'; setTimeout(() => { mon.style.transform = ''; }, 220); }
      if (player) { player.style.transition = 'transform 0.12s ease-out'; player.style.transform = 'translateX(-10px) rotate(-4deg)'; setTimeout(() => { player.style.transform = ''; }, 220); }
      this._raidSpawnPlayerHurt();
      this._raidArenaShake(3);
    }

    if (this._raidSeconds <= 0) {
      this._endRaid(this._playerHealth > this._enemyHealth * 0.5);
    }
  },

  // ── Update raid HP bars ─────────────────────
  _updateRaidHP() {
    const defPct = Utils.clamp(this._playerHealth, 0, 100);
    const enePct = Utils.clamp((this._enemyHealth / this._enemyHealthMax) * 100, 0, 100);
    const defBar = document.getElementById('raid-player-hp');
    const eneBar = document.getElementById('raid-enemy-hp');
    if (defBar) {
      defBar.style.width = defPct + '%';
      defBar.style.background = defPct > 60 ? '#4caf50' : defPct > 25 ? '#ff6d00' : '#ef5350';
    }
    if (eneBar) {
      eneBar.style.width = enePct + '%';
      eneBar.style.background = enePct > 60 ? '#e53935' : enePct > 25 ? '#ff6d00' : '#ffd600';
    }
  },

  _updateCadenceBar() {
    const ratio = Cadence.getRatio();
    const bar   = document.getElementById('raid-cadence-bar');
    const cpm   = document.getElementById('raid-cpm');
    if (bar) {
      bar.style.width = Utils.clamp(ratio * 100, 0, 100) + '%';
      bar.classList.toggle('winning', ratio >= 0.75);
    }
    if (cpm) cpm.textContent = Cadence.getCPM();
  },

  _updatePedalBtn() {
    const btn = document.getElementById('btn-raid-pedal');
    if (!btn) return;
    const winning = Cadence.getRatio() >= 0.75;
    btn.classList.toggle('winning', winning);
    btn.textContent = winning ? '⚔️ DEFENDING!' : '⚔️ PEDAL TO FIGHT!';
  },

  // ── Raid arena VFX (mirrors foraging hit effects) ──
  _raidSpawnHit(heavy, dmg) {
    const svg = document.getElementById('raid-ca-svg');
    if (!svg) return;
    let fx = document.getElementById('ca-effects');
    if (!fx) { fx = document.createElementNS('http://www.w3.org/2000/svg','g'); fx.id='ca-effects'; svg.appendChild(fx); }

    const ix = 185 + (Math.random() * 20 - 10);
    const iy = 60  + (Math.random() * 20 - 10);
    const sparkCount = heavy ? 8 : 5;
    const baseCol    = heavy ? '#ffd600' : '#ff8800';
    let html = '';
    for (let i = 0; i < sparkCount; i++) {
      const ang = (i / sparkCount) * Math.PI * 2;
      const len = heavy ? (10 + Math.random() * 14) : (6 + Math.random() * 8);
      const x2  = ix + Math.cos(ang) * len;
      const y2  = iy + Math.sin(ang) * len;
      html += '<line x1="' + ix + '" y1="' + iy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (i%2===0?baseCol:'#fff') + '" stroke-width="' + (heavy?2.5:1.8) + '" stroke-linecap="round" class="ca-spark"/>';
    }
    html += '<circle cx="' + ix + '" cy="' + iy + '" r="' + (heavy?16:10) + '" fill="' + baseCol + '" opacity="0.5" class="ca-flash"/>';
    if (dmg > 0) html += '<text x="' + (ix+6) + '" y="' + (iy-8) + '" font-family="monospace" font-size="' + (heavy?12:9) + '" font-weight="bold" fill="' + baseCol + '" class="ca-dmg-float" filter="url(#ca-glow-red)">' + dmg.toFixed(1) + '</text>';
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.innerHTML = html;
    fx.appendChild(g);
    setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 450);
  },

  _raidSpawnPlayerHurt() {
    const svg = document.getElementById('raid-ca-svg');
    if (!svg) return;
    let fx = document.getElementById('ca-effects');
    if (!fx) { fx = document.createElementNS('http://www.w3.org/2000/svg','g'); fx.id='ca-effects'; svg.appendChild(fx); }
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.innerHTML = '<rect x="20" y="30" width="110" height="80" fill="rgba(229,57,53,0.22)" rx="4" class="ca-hurt-flash"/>' +
                  '<text x="75" y="88" font-family="monospace" font-size="10" font-weight="bold" fill="#ef5350" text-anchor="middle" class="ca-dmg-float">BASE HIT!</text>';
    fx.appendChild(g);
    setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 400);
  },

  _raidArenaShake(intensity) {
    const wrap = document.getElementById('raid-ca-overlay');
    if (!wrap) return;
    const kf = [
      { transform: 'translate(0,0)' },
      { transform: 'translate(' + intensity + 'px,' + (-intensity/2) + 'px)' },
      { transform: 'translate(' + (-intensity) + 'px,' + (intensity/2) + 'px)' },
      { transform: 'translate(0,0)' },
    ];
    if (wrap.animate) wrap.animate(kf, { duration: 200, easing: 'ease-out' });
  },

  // ── End raid ──────────────────────────────
  _endRaid(playerWon) {
    clearInterval(this._raidTimer);
    Cadence.stop();
    State.data.world.activeRaid   = false;
    State.data.world.raidStrength = 0;

    if (playerWon) {
      State.data.stats.raidsRepelled++;
      Audio.sfxVictory();
    } else {
      State.data.stats.raidsFailed++;
      Audio.sfxDefeat();
      this._applyRaidLoss();
    }

    Audio.play('base');
    this._showResult(playerWon);
    this._currentAnimal = null;
    console.log('[Raids] Ended. Victory:', playerWon);
  },

  // ── Result overlay ─────────────────────────
  _showResult(victory) {
    const screen = document.getElementById('screen-raid');
    if (!screen) return;

    const overlay = document.createElement('div');
    overlay.className = `raid-result ${victory ? 'victory' : 'defeat'}`;
    overlay.innerHTML = `
      <div class="raid-result-icon">${victory ? '🏆' : '💀'}</div>
      <div class="raid-result-title">${victory ? 'RAID REPELLED!' : 'BASE BREACHED!'}</div>
      <div class="raid-result-detail">${victory
        ? 'Your defences held. Resources safe.'
        : 'They broke through. 20% of resources lost.'}</div>
      <button class="btn-pixel btn-primary" id="btn-raid-continue" style="max-width:260px">
        ${victory ? '✅ BACK TO BASE' : '😔 ASSESS DAMAGE'}
      </button>
    `;
    screen.appendChild(overlay);

    document.getElementById('btn-raid-continue')?.addEventListener('click', () => {
      overlay.remove();
      Game.goTo('base');
      Events.emit('hud:update');
    });
  },

  // ── Apply 20% resource loss ───────────────
  _applyRaidLoss() {
    const inv = State.data.inventory;
    ['wood','metal','gasoline','food','water','medicine','cloth','electronics','rope','chemicals']
      .forEach(r => { inv[r] = Math.max(0, Math.floor((inv[r]||0) * 0.8)); });
    console.log('[Raids] 20% resource loss applied');
  },

  // ── Generate twinkling stars ───────────────
  _generateStars(id) {
    const c = document.getElementById(id);
    if (!c) return;
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*60}%;
        --twinkle-dur:${Utils.randFloat(1.5,4)}s;opacity:${Utils.randFloat(0.3,1)};
        width:${Utils.randInt(1,3)}px;height:${Utils.randInt(1,3)}px;
        animation-delay:${Utils.randFloat(0,3)}s;`;
      c.appendChild(s);
    }
  }

};
