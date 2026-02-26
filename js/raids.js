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
    if (Foraging._active) return;
    if (typeof WorldMap !== 'undefined' && WorldMap._travelling) return;
    const daysSince  = State.data.world.daysSinceLastRaid;
    const isNight    = State.data.world.isNight;
    const baseChance = Utils.clamp(0.06 + daysSince * 0.04, 0.06, 0.55);
    // Night is always 2× — but if player is out foraging at night (with light) even MORE raids
    const isNightForaging = isNight && Foraging._active && (State.data.base.bikeHasLight || false);
    const nightEncReduction = State.data.base.bikeNightEncounterReduction || 0;
    let nightMult = isNight ? 2.0 : 1.0;
    if (isNightForaging) nightMult = 3.0; // extra danger when out at night
    nightMult *= (1 - nightEncReduction);  // bike upgrade reduces encounter chance
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

  // ── Build raid screen ─────────────────────
  _buildRaidScreen() {
    const screen = document.getElementById('screen-raid');
    if (!screen) return;

    const animal  = this._currentAnimal;
    const defence = State.data.base.defenceRating;
    const target  = 90;

    screen.innerHTML = `
      <div class="raid-bg"></div>
      ${State.data.world.isNight ? '<div class="night-stars" id="raid-stars"></div>' : ''}
      <div class="raid-screen-wrap">
        <div class="raid-title-bar">
          <div class="raid-title">⚠ BASE UNDER ATTACK ⚠</div>
          <div class="raid-animal-display">${animal.emoji} ${animal.name} — STRENGTH ${animal.strength}</div>
        </div>
        <div class="raid-arena">
          <div class="raid-player">
            <div class="raid-player-emoji" id="raid-player-emoji">🧍</div>
            <div class="raid-player-label">YOU</div>
          </div>
          <div class="raid-vs">VS</div>
          <div class="raid-enemy">
            <div class="raid-enemy-emoji">${animal.emoji}</div>
            <div class="raid-enemy-label">${animal.name.toUpperCase()}</div>
          </div>
        </div>
        <div class="raid-bars">
          <div class="raid-bar-row">
            <div class="raid-bar-label" style="color:var(--col-green)">🛡 DEFENCE</div>
            <div class="raid-bar-wrap">
              <div class="raid-bar-fill defence-fill" id="raid-defence-bar" style="width:100%"></div>
            </div>
            <div class="raid-bar-val" id="raid-defence-val">100</div>
          </div>
          <div class="raid-bar-row">
            <div class="raid-bar-label" style="color:var(--col-red)">💀 ENEMY HP</div>
            <div class="raid-bar-wrap">
              <div class="raid-bar-fill enemy-fill" id="raid-enemy-bar" style="width:100%"></div>
            </div>
            <div class="raid-bar-val" id="raid-enemy-val">${this._enemyHealth}</div>
          </div>
        </div>
        <div style="text-align:center;padding:6px;position:relative;z-index:5">
          <span style="font-family:var(--font-mono);font-size:1rem;color:var(--col-text-dim)">
            ⏱ <span id="raid-timer">${this._raidDuration}s</span> remaining
          </span>
          <span style="margin-left:12px;font-family:var(--font-mono);font-size:1rem;color:var(--col-text-dim)">
            Base Defence: <span style="color:var(--col-green)">${defence}</span>
          </span>
        </div>
        <div class="raid-cadence-zone">
          <div class="raid-cadence-label">PEDAL HARDER = MORE DAMAGE — REACH THE TARGET LINE!</div>
          <div class="raid-cadence-bar-wrap">
            <div class="raid-cadence-fill" id="raid-cadence-bar" style="width:0%"></div>
            <div class="raid-target-line"></div>
          </div>
          <div class="raid-cpm-display">
            <span>CPM: <span id="raid-cpm">0</span></span>
            <span>Target: <span id="raid-target-cpm">${target}</span>+ CPM to win</span>
          </div>
        </div>
        <button class="btn-raid-pedal" id="btn-raid-pedal">⚔️ PEDAL TO FIGHT!</button>
      </div>
    `;

    // Stop any existing Cadence session before starting fresh
    Cadence.stop();

    // Wire pedal button — touchstart for mobile responsiveness, click as fallback
    const btn = document.getElementById('btn-raid-pedal');
    if (btn) {
      let lastTouch = 0;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouch = Date.now();
        this._onRaidClick();
      }, { passive: false });
      btn.addEventListener('click', () => {
        // Avoid double-firing on mobile where touchstart already handled it
        if (Date.now() - lastTouch > 300) this._onRaidClick();
      });
    }

    if (State.data.world.isNight) this._generateStars('raid-stars');
    Cadence.start();
  },

  // ── Player clicks to fight ─────────────────
  _onRaidClick() {
    Cadence.registerClick();
    Audio.sfxPedal();
    const ratio   = Cadence.getRatio();
    const defence = State.data.base.defenceRating;
    const dmg     = Utils.randFloat(0.5, 1.5) * ratio * (1 + defence / 100);
    this._enemyHealth = Math.max(0, this._enemyHealth - dmg);
    this._updateBars();
    this._updatePedalBtn();
    if (this._enemyHealth <= 0) this._endRaid(true);
  },

  // ── Raid tick ─────────────────────────────
  _raidTick() {
    if (this._checkPaused) return;

    // Use real elapsed time so mobile timer throttling can't freeze the countdown
    if (!this._raidStartTime) this._raidStartTime = Date.now();
    const elapsed  = Math.floor((Date.now() - this._raidStartTime) / 1000);
    this._raidSeconds = Math.max(0, this._raidDuration - elapsed);

    const timerEl = document.getElementById('raid-timer');
    if (timerEl) timerEl.textContent = `${this._raidSeconds}s`;

    const ratio    = Cadence.getRatio();
    const strength = this._currentAnimal?.strength || 10;
    const enemyDmg = strength * 0.15 * (1 - ratio * 0.7);
    this._playerHealth = Math.max(0, this._playerHealth - enemyDmg);

    this._updateCadenceBar();
    this._updateBars();

    if (this._raidSeconds <= 0) {
      this._endRaid(this._playerHealth > this._enemyHealth * 0.5);
    }
  },

  // ── Update health bars ─────────────────────
  _updateBars() {
    const defPct = Utils.clamp(this._playerHealth, 0, 100);
    const enePct = Utils.clamp((this._enemyHealth / this._enemyHealthMax) * 100, 0, 100);
    const defBar = document.getElementById('raid-defence-bar');
    const eneBar = document.getElementById('raid-enemy-bar');
    const defVal = document.getElementById('raid-defence-val');
    const eneVal = document.getElementById('raid-enemy-val');
    if (defBar) defBar.style.width = `${defPct}%`;
    if (eneBar) eneBar.style.width = `${enePct}%`;
    if (defVal) defVal.textContent = Math.round(this._playerHealth);
    if (eneVal) eneVal.textContent = Math.round(this._enemyHealth);
  },

  _updateCadenceBar() {
    const ratio = Cadence.getRatio();
    const bar   = document.getElementById('raid-cadence-bar');
    const cpm   = document.getElementById('raid-cpm');
    if (bar) {
      bar.style.width = `${Utils.clamp(ratio * 100, 0, 100)}%`;
      bar.classList.toggle('winning', ratio >= 0.75);
    }
    if (cpm) cpm.textContent = Cadence.getCPM();
  },

  _updatePedalBtn() {
    const btn = document.getElementById('btn-raid-pedal');
    if (!btn) return;
    const winning = Cadence.getRatio() >= 0.75;
    btn.classList.toggle('winning', winning);
    btn.textContent = winning ? '⚔️ FIGHTING BACK!' : '⚔️ PEDAL TO FIGHT!';
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
      HUD.update();
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
